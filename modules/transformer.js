const cheerio = require("cheerio");
const striptags = require("striptags");
const S = require("string");

// A transformer class, taking care of of modifying the imported documents
Transformer = function() {}

Transformer.prototype.transformLexiconDocument = function(document) {
	// If the image is absent, try to pull it out of the description in case there's still some HTML present
	if (document.image_src == "") {
		// Load the description as a JQuery-like object and traverse it
		var $ = cheerio.load(document.description);

		var image = $("img").first().attr("src");
		if(image) {
			// Fix the case when there's no domain specified
			if(image.indexOf("images") === 0) image = config.zoo.host + image;

			document.image_src = image;
		}
	}

	// Get rid of the HTML tags and trim the resulting string
	document.description = striptags(document.description).trim();

	// Split the czech and latin names in the classification
	if (document.classes) {
		document.classes = {
			"name": S(document.classes).between("", "(").trim().s,
			"latin_name": S(document.classes).between("(", ")").s
		};
	}

	if (document.order) {
		document.order = {
			"name": S(document.order).between("", "(").trim().s,
			"latin_name": S(document.order).between("(", ")").s
		};
	}
}

Transformer.prototype.transformClassificationDocument = function(document) {
	// Split the czech and latin names in the classification
	if (document.d) {
		document.d = {
			"name": S(document.d).between("", "(").trim().s,
			"latin_name": S(document.d).between("(", ")").s
		};
	}
}

Transformer.prototype.transformLocationDocument = function(document) {
	// Split the GPS into coordinates
	document.gps = {
		"x": document.gps_x,
		"y": document.gps_y
	};

	delete document.gps_x;
	delete document.gps_y;
}

exports.Transformer = Transformer;