const http = require('http');
const cheerio = require('cheerio');
const striptags = require('striptags');
const config = require('./config').config;

Importer = function(endpoint, collectionDriver) {
	this.endpoint = endpoint;
	this.collectionDriver = collectionDriver;
};

Importer.prototype.getOpenData = function(url, fields) {
	return new Promise(function(resolve, reject) {
		// hack around the Opendata server's default limit
		url += '&limit=10000';

		if(fields) {
			var fieldsQuery = '&fields=' + fields.join();

			url += fieldsQuery;
		}

		console.log('Getting the data from a URL: ' + url);

		http.get(url, function(res) {
			var chunks = 0;
			var buffer = '';

			res.setEncoding('utf8');

			res.on('data', function(chunk) {
				buffer += chunk;
				chunks++;
			});

			res.on('end', function() {
				console.log('Total number of received data chunks: ' + chunks + ' with a cumulative size of: ' + buffer.length + ' bytes.');
				var data = JSON.parse(buffer);

				resolve(data);
			});
		}).on('error', function(error) {
			reject(error);
		});
	});
};

Importer.prototype.transformLexiconDocuments = function(documents) {
	return new Promise(function(resolve, reject) {
		var documentsLength = documents.length;

		documents.forEach(function(document, index) {
			// Load the description as a JQuery-like object
			var $ = cheerio.load(document.description);

			// Try to pull out the image and put it to its own field
			var image = $('img').first().attr('src');
			if(image) {
				// Fix the case when there's no domain specified
				if(image.indexOf('images') === 0) image = config.zoo.host + image;

				document.image = image;
			}

			// Get rid of the HTML tags and trim the resulting string
			document.description = striptags(document.description).trim();

			// All the documents have been transformed -> resolve the promise
			if(index === documentsLength - 1) resolve(documents);
		});
	});
};

Importer.prototype.importClasses = function() {
	var url =  this.endpoint + config.opendata.resources.classes;
	var collectionName = 'classifications';

	// Make the received data available for the collection driver using a closure
	this.getOpenData(url, config.filterColumns.classes).then((data) => {
		console.log(data.result.records.length + ' records received from the "classes" table.');
		
		this.collectionDriver.truncateCollection(collectionName).then((result) => {
			console.log(result);
		
			return this.collectionDriver.insertDocuments(collectionName, data.result.records);
		})
		.then((result) => {
			console.log(result);

			// Rename the necessary fields, all at once
			return this.collectionDriver.renameFields(collectionName, config.fieldMapping.classes);
		})
		.then(console.log)
		.catch(console.error);
	}, console.error);
};

Importer.prototype.importLexicon = function() {
	var url =  this.endpoint + config.opendata.resources.lexicon;
	var collectionName = 'lexicon';

	this.getOpenData(url, config.filterColumns.lexicon).then((data) => {
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

exports.Importer = Importer;