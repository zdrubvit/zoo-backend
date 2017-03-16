const http = require('http');
const cheerio = require('cheerio');
const striptags = require('striptags');
const colors = require('colors');
const config = require('./config').config;

Importer = function(endpoint, collectionDriver) {
	this.endpoint = endpoint;
	this.collectionDriver = collectionDriver;
	this.lexiconRelations = {
		'biotopes': [],
		'biotopesRelations': [],
		'food': [],
		'foodRelations': [],
		'continents': [],
		'continentsRelations': []
	}
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

Importer.prototype.transformLexiconDocuments = function(documents) {
	return new Promise((resolve, reject) => {
		var documentsLength = documents.length;
		var documentsDone = 0;

		documents.forEach((document, index) => {
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

			var url = this.endpoint + config.opendata.resources.biotopesRelations;
			this.getOpenData(url, null, {"id": document.id}, false).then((data) => {
				// All the documents have been transformed -> resolve the promise
				if(++documentsDone === documentsLength) resolve(documents);
			}, console.error);
		});
	});
};

Importer.prototype.importclassifications = function() {
	var url = this.endpoint + config.opendata.resources.classifications;
	var collectionName = 'classifications';

	// Make the received data available for the nested functions through a closure
	this.getOpenData(url, config.filterColumns.classifications).then((data) => {
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
		.then(console.log)
		.catch(console.error);
	}, console.error);
};

Importer.prototype.importRelations = function() {
	return new Promise((resolve, reject) => {
		var urlBiotopes = this.endpoint + config.opendata.resources.biotopes;
		var urlBiotopesRelations = this.endpoint + config.opendata.resources.biotopesRelations;
		var urlFood = this.endpoint + config.opendata.resources.food;
		var urlFoodRelations = this.endpoint + config.opendata.resources.foodRelations;
		var urlContinents = this.endpoint + config.opendata.resources.continents;
		var urlContinentsRelations = this.endpoint + config.opendata.resources.continentsRelations;

		// Wait for all the subtasks to finish correctly
		Promise.all([this.getOpenData(urlBiotopes, 'biotopes'),
			this.getOpenData(urlBiotopesRelations, 'biotopesRelations'),
			this.getOpenData(urlFood, 'food'),
			this.getOpenData(urlFoodRelations, 'foodRelations'),
			this.getOpenData(urlContinents, 'continents'),
			this.getOpenData(urlContinentsRelations, 'continentsRelations')]).then((data) => {
			for(let i = 0; i < data.length; i++) {
				let resource = data[i].resource;

				this.lexiconRelations[resource] = data[i].result.records;
			}

			resolve('All the lexicon relations have been imported successfully.');
		}, (error) => {
			// Empty the arrays
			for(let property in this.lexiconRelations) {
				this.lexiconRelations[property].length = 0;
			}

			reject(error);
		});
	});
};

Importer.prototype.importLexicon = function() {
	var url = this.endpoint + config.opendata.resources.lexicon;
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
