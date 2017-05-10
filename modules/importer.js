const http = require('http');
const cheerio = require('cheerio');
const striptags = require('striptags');
const colors = require('colors');
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
		var collectionName = 'classifications';

		// Make the received data available for the nested functions through a closure
		this.getOpenData(url, collectionName, config.filterColumns.classifications).then((data) => {
			console.log(data.result.records.length + ' records received from the "classifications" table.');
			
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
			.catch((error) => {
				reject(error);
			});
		}, console.error);
	});
};

Importer.prototype.importLexicon = function() {
	var url = this.endpoint + config.opendata.resources.lexicon;
	var collectionName = 'lexicon';

	this.getOpenData(url, collectionName, config.filterColumns.lexicon).then((data) => {
		console.log(data.result.records.length + ' records received from the "animals" table.');
			
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
		.then(console.log)
		.catch(console.error);
	}, console.error);
};

Importer.prototype.transformLexiconDocuments = function(documents) {
	return new Promise((resolve, reject) => {
		var documentsLength = documents.length;
		var documentsDone = 0;

		documents.forEach((document, index) => {
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

			// All the documents have been transformed -> resolve the promise
			if(++documentsDone === documentsLength) resolve(documents);
		});
	});
};

exports.Importer = Importer;
