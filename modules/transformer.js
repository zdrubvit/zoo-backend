const cheerio = require("cheerio");
const striptags = require("striptags");
const S = require("string");
const moment = require("moment");

const config = require("../config").config;

// A transformer class, taking care of modifying the imported documents - every method belongs to one specific type
Transformer = function() {};

Transformer.prototype.transformAdoptionDocument = function(document) {
	// Replace the visited status with a boolean value
	if (document.k_prohlidce == "1") {
		document.k_prohlidce = true;
	} else {
		document.k_prohlidce = false;
	}
};

Transformer.prototype.transformClassificationDocument = function(document) {
	// Split the czech and latin names in the classification
	if (document.d) {
		document.name = S(document.d).between("", "(").trim().s;
		document.latin_name = S(document.d).between("(", ")").s;

		delete document.d;
	}
};

Transformer.prototype.transformEventDocument = function(document) {
	// Calculate the event's duration in minutes
	document.duration = moment(document.end).diff(moment(document.start), "minutes").toString();

	// Get rid of the HTML tags and trim the resulting string
	document.description = striptags(document.description).trim();
};

Transformer.prototype.transformLexiconDocument = function(document) {
	// If the image is absent, try to pull it out of the description in case there's still some HTML present
	if (document.image_src == "") {
		// Load the description as a JQuery-like object and traverse it
		var $ = cheerio.load(document.description);

		var image = $("img").first().attr("src");
		if(image) {
			document.image_src = image;
		}
	}

	// Fix the case when there's no image domain specified
	if(document.image_src.indexOf("/images") === 0) document.image_src = config.zoo.host + document.image_src;

	// Get rid of the HTML tags and trim the resulting string
	document.description = striptags(document.description).trim();

	// Split the czech and latin names in the classification
	if (document.classes) {
		document.class_name = S(document.classes).between("", "(").trim().s;
		document.class_latin_name = S(document.classes).between("(", ")").s;

		delete document.classes;
	}

	if (document.order) {
		document.order_name = S(document.order).between("", "(").trim().s;
		document.order_latin_name = S(document.order).between("(", ")").s;

		delete document.order;
	}
};

Transformer.prototype.transformLocationDocument = function(document) {
	// Maybe split the GPS into single coordinates
};

exports.Transformer = Transformer;