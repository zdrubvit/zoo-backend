const http = require('http');
const cheerio = require('cheerio');
const striptags = require('striptags');
const colors = require('colors');
const S = require('string');
const config = require('../config').config;

Importer = function(endpoint, collectionDriver) {
	this.endpoint = endpoint;
	this.collectionDriver = collectionDriver;
};

Importer.prototype.getOpenData = function(url, resource, fields, debug = true) {
	return new Promise((resolve, reject) => {
		// hack around the Opendata server's default limit
		url += '&limit=10000';

		if(fields) {
			let fieldsQuery = '&fields=' + fields.join();

			url += fieldsQuery;
		}

		if(debug) console.log('Getting the data from a URL: ' + url);

		http.get(url, function(res) {
			var chunks = 0;
			var buffer = '';

			res.setEncoding('utf8');

			res.on('data', function(chunk) {
				buffer += chunk;
				chunks++;
			});

			res.on('end', function() {
				if(debug) console.log('Total number of received data chunks: ' + chunks + ' with a cumulative size of: ' + buffer.length + ' bytes.');

				try {
					var data = JSON.parse(buffer);

					// Pair the resulting data with its rightful resource name, so that they can be matched afterwards
					data.resource = resource;
				} catch(error) {
					console.error(error);
					console.error(buffer);
				}

				resolve(data);
			});
		}).on('error', function(error) {
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
			console.log(data.result.records.length + ' records received from the "' + collectionName.cyan + '" table.');
			
			this.collectionDriver.truncateCollection(collectionName).then((result) => {
				console.log(result);
			
				return this.collectionDriver.insertDocuments(collectionName, data.result.records);
			})
			.then((result) => {
				console.log(result);

				// Rename the necessary fields, all at once
				return this.collectionDriver.renameFields(collectionName, config.fieldMapping.classifications);
			})
			.then((result) => {
				console.log(result);

				resolve('All the animal classifications have been imported successfully.');
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
			console.log(data.result.records.length + ' records received from the "' + collectionName.cyan + '" table.');
				
			this.collectionDriver.truncateCollection(collectionName).then((result) => {
				console.log(result);
			
				return this.transformLexiconDocuments(data.result.records);
			})
			.then((documents) => {
				return this.collectionDriver.insertDocuments(collectionName, documents);
			})
			.then((result) => {
				console.log(result);

				return this.collectionDriver.renameFields(collectionName, config.fieldMapping.lexicon);
			})
			.then(resolve)
			.catch(reject);
		}, reject);
	});
};

Importer.prototype.importEvents = function() {
	var url = this.endpoint + config.opendata.resources.events;
	var collectionName = config.mongodb.collectionNames.events;

	this.getOpenData(url, collectionName, config.filterColumns.events).then((data) => {
		console.log(data.result.records.length + ' records received from the "' + collectionName.cyan + '" table.');
		
		this.collectionDriver.truncateCollection(collectionName).then((result) => {
			console.log(result);
		
			return this.collectionDriver.insertDocuments(collectionName, data.result.records);
		})
		.then((result) => {
			console.log(result);

			return this.collectionDriver.renameFields(collectionName, config.fieldMapping.events);
		})
		.then(console.log)
		.catch(console.error);
	}, console.error);
};

Importer.prototype.importAdoptions = function() {
	var url = this.endpoint + config.opendata.resources.adoptions;
	var collectionName = config.mongodb.collectionNames.adoptions;

	this.getOpenData(url, collectionName, config.filterColumns.adoptions).then((data) => {
		console.log(data.result.records.length + ' records received from the "' + collectionName.cyan + '" table.');
		
		this.collectionDriver.truncateCollection(collectionName).then((result) => {
			console.log(result);

			return this.linkAdoptionsToLexicon(config.mongodb.collectionNames.lexicon, data.result.records);
		})
		.then((documents) => {
			return this.collectionDriver.insertDocuments(collectionName, documents);
		})
		.then((result) => {
			console.log(result);

			return this.collectionDriver.renameFields(collectionName, config.fieldMapping.adoptions);
		})
		.then(console.log)
		.catch(console.error);
	}, console.error);
};

Importer.prototype.splitClassificationString = function(classification) {
	return {
		'name': S(classification).between('', '(').trim().s,
		'latin_name': S(classification).between('(', ')').s
	};
}

Importer.prototype.transformLexiconDocuments = function(documents) {
	return new Promise((resolve, reject) => {
		var documentsLength = documents.length;
		var documentsDone = 0;

		documents.forEach((document) => {
			// If the image is absent, try to pull it out of the description in case there's still some HTML present
			if (document.image_src == '') {
				// Load the description as a JQuery-like object and traverse it
				var $ = cheerio.load(document.description);

				var image = $('img').first().attr('src');
				if(image) {
					// Fix the case when there's no domain specified
					if(image.indexOf('images') === 0) image = config.zoo.host + image;

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

Importer.prototype.linkAdoptionsToLexicon = function(lexiconCollectionName, documents) {
	return new Promise((resolve, reject) => {
		var documentsLength = documents.length;
		var documentsDone = 0;

		documents.forEach((document) => {
			this.collectionDriver.findDocument(lexiconCollectionName, {'name': document.nazev_cz}).then((lexiconDocument) => {
				if (lexiconDocument != null) document.lexicon_id = lexiconDocument._id;
				else console.log("The adoptee animal " + document.nazev_cz.yellow + " was not found in the lexicon.");
			})
			.catch(console.error)
			.then(() => {
				// Equivalent of a "finally" structure
				if(++documentsDone === documentsLength) resolve(documents);
			});
			
		});
	});
};

exports.Importer = Importer;
