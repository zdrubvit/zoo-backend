const http = require("http");
const colors = require("colors");
const config = require("../config").config;

// This class handles the open data, transforming and linking them, putting them in the database
Importer = function(endpoint, logger, collectionDriver, transformer) {
	this.endpoint = endpoint;
	this.logger = logger;
	this.collectionDriver = collectionDriver;
	this.transformer = transformer;
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

		this.logger.log("info", "Getting the data from a URL: " + url.underline);

		http.get(url, (res) => {
			var chunks = 0;
			var buffer = "";

			res.setEncoding("utf8");

			res.on("data", (chunk) => {
				buffer += chunk;
				chunks++;
			});

			res.on("end", () => {
				this.logger.log("info", "Total number of received " + resource.cyan + " data chunks: " + chunks + " with a cumulative size of: " + buffer.length.toString().white + " bytes.");

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

// Handles all the necessary steps needed to import the whole resource collection
Importer.prototype.importWrapper = function(resource) {
	return new Promise((resolve, reject) => {
		var url = this.endpoint + config.opendata.resources[resource];
		var collectionName = config.mongodb.collectionNames[resource];
		var filterColumns = config.filterColumns[resource];
		var fieldMapping = config.fieldMapping[resource];
		var transformMethod = config.transformMethod[resource];

		// Make the received (downloaded) data available for the later nested functions through a closure
		this.getOpenData(url, collectionName, filterColumns).then((data) => {
			this.logger.log("info", data.result.records.length + " records received from the " + collectionName.cyan + " table.");
			
			// First, clear the collection to make space for new data
			this.collectionDriver.truncateCollection(collectionName).then((result) => {
				this.logger.log("info", result);
			
				// Run the specific transformations
				return this.transformDocuments(data.result.records, this.transformer[transformMethod]);
			})
			.then((documents) => {
				// Insert all the modified documents
				return this.collectionDriver.insertDocuments(collectionName, documents);
			})
			.then((result) => {
				this.logger.log("info", result);

				// Rename the necessary fields, all at once
				return this.collectionDriver.renameFields(collectionName, fieldMapping);
			})
			.then((result) => {
				// All done - log the last result and resolve the promise
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

// This method wraps the two connected resources into a single promise so that it can be handled as such
Importer.prototype.importLexiconAndAdoptions = function() {
	return new Promise((resolve, reject) => {
		// The animal lexicon is the first on the line
		this.importWrapper(config.mongodb.collectionNames.lexicon).then((result) => {
			this.logger.log("info", result);

			// Now we can start taking care of the animal adoptions that rely partially on the lexicon
			return this.importAdoptions();
		})
		.then((result) => {
			this.logger.log("info", result);
			resolve("The " + "lexicon / adoptions".cyan + " resources have been handled successfully.");
		})
		.catch((error) => {
			reject(error + " in lexicon / adoptions import.");
		});
	});
}

// Modify the incoming records using the given transforming function
Importer.prototype.transformDocuments = function(documents, transformFunction) {
	return new Promise((resolve, reject) => {
		// Initialize the counter so that it can keep track of asynchronously called functions
		var documentsLength = documents.length;
		var documentsDone = 0;

		documents.forEach((document) => {
			transformFunction(document);

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
