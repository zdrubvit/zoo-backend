const http = require("http");
const cheerio = require("cheerio");
const striptags = require("striptags");
const colors = require("colors");
const S = require("string");
const config = require("../config").config;

Importer = function(endpoint, collectionDriver, logger) {
	this.endpoint = endpoint;
	this.collectionDriver = collectionDriver;
	this.logger = logger;
};

// Request the data and parse them
Importer.prototype.getOpenData = function(url, resource, fields) {
	return new Promise((resolve, reject) => {
		// hack around the Opendata server's default limit
		url += "&limit=10000";

		if(fields) {
			let fieldsQuery = "&fields=" + fields.join();

			url += fieldsQuery;
		}

		this.logger.log("info", "Getting the data from a URL: " + url);

		http.get(url, (res) => {
			var chunks = 0;
			var buffer = "";

			res.setEncoding("utf8");

			res.on("data", (chunk) => {
				buffer += chunk;
				chunks++;
			});

			res.on("end", () => {
				this.logger.log("info", "Total number of received data chunks: " + chunks + " with a cumulative size of: " + buffer.length + " bytes.");

				try {
					var data = JSON.parse(buffer);

					// Pair the resulting data with its rightful resource name, so that they can be matched afterwards
					data.resource = resource;
				} catch(error) {
					this.logger.log("error", "An error during JSON parsing occured: " + error + " in the string: " + buffer);
				}

				resolve(data);
			});
		}).on("error", (error) => {
			reject(error);
		});
	});
};

Importer.prototype.importClassifications = function() {
	return new Promise((resolve, reject) => {
		var url = this.endpoint + config.opendata.resources.classifications;
		var collectionName = config.mongodb.collectionNames.classifications;

		// Make the received data available for the nested functions through a closure
		this.getOpenData(url, collectionName, config.filterColumns.classifications).then((data) => {
			this.logger.log("info", data.result.records.length + " records received from the " + collectionName.cyan + " table.");
			
			this.collectionDriver.truncateCollection(collectionName).then((result) => {
				this.logger.log("info", result);
			
				return this.transformClassificationDocuments(data.result.records);
			})
			.then((documents) => {
				return this.collectionDriver.insertDocuments(collectionName, documents);
			})
			.then((result) => {
				this.logger.log("info", result);

				// Rename the necessary fields, all at once
				return this.collectionDriver.renameFields(collectionName, config.fieldMapping.classifications);
			})
			.then((result) => {
				this.logger.log("info", result);
				resolve("The " + collectionName.cyan + " finished successfully.");
			})
			.catch(reject);
		}, reject);
	});
};

Importer.prototype.importLexicon = function() {
	return new Promise((resolve, reject) => {
		var url = this.endpoint + config.opendata.resources.lexicon;
		var collectionName = config.mongodb.collectionNames.lexicon;

		this.getOpenData(url, collectionName, config.filterColumns.lexicon).then((data) => {
			this.logger.log("info", data.result.records.length + " records received from the " + collectionName.cyan + " table.");
				
			this.collectionDriver.truncateCollection(collectionName).then((result) => {
				this.logger.log("info", result);
			
				return this.transformLexiconDocuments(data.result.records);
			})
			.then((documents) => {
				return this.collectionDriver.insertDocuments(collectionName, documents);
			})
			.then((result) => {
				this.logger.log("info", result);

				return this.collectionDriver.renameFields(collectionName, config.fieldMapping.lexicon);
			})
			.then((result) => {
				this.logger.log("info", result);
				resolve("The " + collectionName.cyan + " finished successfully.");
			})
			.catch(reject);
		}, reject);
	});
};

Importer.prototype.importEvents = function() {
	return new Promise((resolve, reject) => {
		var url = this.endpoint + config.opendata.resources.events;
		var collectionName = config.mongodb.collectionNames.events;

		this.getOpenData(url, collectionName, config.filterColumns.events).then((data) => {
			this.logger.log("info", data.result.records.length + " records received from the " + collectionName.cyan + " table.");
			
			this.collectionDriver.truncateCollection(collectionName).then((result) => {
				this.logger.log("info", result);
			
				return this.collectionDriver.insertDocuments(collectionName, data.result.records);
			})
			.then((result) => {
				this.logger.log("info", result);

				return this.collectionDriver.renameFields(collectionName, config.fieldMapping.events);
			})
			.then((result) => {
				this.logger.log("info", result);
				resolve("The " + collectionName.cyan + " finished successfully.");
			})
			.catch(reject);
		}, reject);
	});
};

Importer.prototype.importAdoptions = function() {
	return new Promise((resolve, reject) => {
		var url = this.endpoint + config.opendata.resources.adoptions;
		var collectionName = config.mongodb.collectionNames.adoptions;

		this.getOpenData(url, collectionName, config.filterColumns.adoptions).then((data) => {
			this.logger.log("info", data.result.records.length + " records received from the " + collectionName.cyan + " table.");
			
			this.collectionDriver.truncateCollection(collectionName).then((result) => {
				this.logger.log("info", result);

				return this.linkAdoptionsToLexicon(config.mongodb.collectionNames.lexicon, data.result.records);
			})
			.then((documents) => {
				return this.collectionDriver.insertDocuments(collectionName, documents);
			})
			.then((result) => {
				this.logger.log("info", result);

				return this.collectionDriver.renameFields(collectionName, config.fieldMapping.adoptions);
			})
			.then((result) => {
				this.logger.log("info", result);
				resolve("The " + collectionName.cyan + " finished successfully.");
			})
			.catch(reject);
		}, reject);
	});
};

Importer.prototype.importLocations = function() {
	return new Promise((resolve, reject) => {
		var url = this.endpoint + config.opendata.resources.locations;
		var collectionName = config.mongodb.collectionNames.locations;

		this.getOpenData(url, collectionName, config.filterColumns.locations).then((data) => {
			this.logger.log("info", data.result.records.length + " records received from the " + collectionName.cyan + " table.");
			
			this.collectionDriver.truncateCollection(collectionName).then((result) => {
				this.logger.log("info", result);
			
				return this.transformLocationDocuments(data.result.records);
			})
			.then((documents) => {
				return this.collectionDriver.insertDocuments(collectionName, documents);
			})
			.then((result) => {
				this.logger.log("info", result);

				return this.collectionDriver.renameFields(collectionName, config.fieldMapping.locations);
			})
			.then((result) => {
				this.logger.log("info", result);
				resolve("The " + collectionName.cyan + " finished successfully.");
			})
			.catch(reject);
		}, reject);
	});
};

// This method wraps the two connected resources into a single promise so that it can be handled as such
Importer.prototype.importLexiconAndAdoptions = function() {
	return new Promise((resolve, reject) => {
		// The animal lexicon is the first on the line
		this.importLexicon().then((result) => {
			this.logger.log("info", result);

			// Now we can start taking care of the animal adoptions that rely partially on the lexicon
			return this.importAdoptions();
		})
		.then((result) => {
			this.logger.log("info", result);
			resolve("The lexicon / adoptions resources have been handled successfully.");
		})
		.catch((error) => {
			reject("The lexicon / adoptions import failed with the following error: " + error);
		});
	});
}

// Split the incoming string and make it into an object
Importer.prototype.splitClassificationString = function(classification) {
	return {
		"name": S(classification).between("", "(").trim().s,
		"latin_name": S(classification).between("(", ")").s
	};
}

// Modify the lexicon animal records
Importer.prototype.transformLexiconDocuments = function(documents) {
	return new Promise((resolve, reject) => {
		var documentsLength = documents.length;
		var documentsDone = 0;

		documents.forEach((document) => {
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
				document.classes = this.splitClassificationString(document.classes);
			}

			if (document.order) {
				document.order = this.splitClassificationString(document.order);
			}

			// All the documents have been transformed -> resolve the promise
			if(++documentsDone === documentsLength) resolve(documents);
		});
	});
};

// Modify the classification records
Importer.prototype.transformClassificationDocuments = function(documents) {
	return new Promise((resolve, reject) => {
		var documentsLength = documents.length;
		var documentsDone = 0;

		documents.forEach((document) => {
			// Split the czech and latin names in the classification
			if (document.d) {
				document.d = this.splitClassificationString(document.d);
			}

			// All the documents have been transformed -> resolve the promise
			if(++documentsDone === documentsLength) resolve(documents);
		});
	});
};

// Modify the location records
Importer.prototype.transformLocationDocuments = function(documents) {
	return new Promise((resolve, reject) => {
		var documentsLength = documents.length;
		var documentsDone = 0;

		documents.forEach((document) => {
			// Split the czech and latin names in the classification
			document.gps = {
				"x": document.gps_x,
				"y": document.gps_y
			};

			delete document.gps_x;
			delete document.gps_y;

			// All the documents have been transformed -> resolve the promise
			if(++documentsDone === documentsLength) resolve(documents);
		});
	});
};

// For each animal that can be adopted look for its matching record in the lexicon
Importer.prototype.linkAdoptionsToLexicon = function(lexiconCollectionName, documents) {
	return new Promise((resolve, reject) => {
		var documentsLength = documents.length;
		var documentsDone = 0;

		documents.forEach((document) => {
			this.collectionDriver.findDocument(lexiconCollectionName, {"name": document.nazev_cz}).then((lexiconDocument) => {
				if (lexiconDocument != null) document.lexicon_id = lexiconDocument._id;
				else this.logger.log("warn", "The adoptee animal " + document.nazev_cz.yellow + " was not found in the lexicon.");
			})
			.catch((error) => {
				this.logger.log("error", error);
			})
			.then(() => {
				// Equivalent of a "finally" structure
				if(++documentsDone === documentsLength) resolve(documents);
			});
			
		});
	});
};

exports.Importer = Importer;
