const http = require('http');
const config = require('./config').config;

Importer = function(endpoint, collectionDriver){
	this.endpoint = endpoint;
	this.collectionDriver = collectionDriver;
};

Importer.prototype.getOpenData = function(url, fields) {
	return new Promise(function(resolve, reject){
		// hack around the Opendata server's default limit
		url += '&limit=10000';

		if(fields){
			var fieldsQuery = '&fields=' + fields.join();

			url += fieldsQuery;
		}

		console.log('Getting the data from a URL: ' + url);

		http.get(url, function(res){
			var chunks = 0;
			var buffer = '';

			res.setEncoding('utf8');

			res.on('data', function(chunk){
				buffer += chunk;
				chunks++;
			});

			res.on('end', function(){
				console.log('Total number of received data chunks: ' + chunks + ' with a cumulative size of: ' + buffer.length + ' bytes.');
				var data = JSON.parse(buffer);

				resolve(data);
			});
		}).on('error', function(error){
			reject(error);
		});
	});
};

Importer.prototype.importClasses = function() {
	var url =  this.endpoint + config.opendata.resources.classes;
	var collectionName = 'classifications';

	// Make the received data available for the collection driver using a closure
	this.getOpenData(url, config.filterColumns.classes).then((data) => {
		console.log(data.result.records.length + ' records received from the "classes" table.');
		
		this.collectionDriver.truncateCollection(collectionName)
		.then((result) => {
			console.log(result);
		
			return this.collectionDriver.insertDocuments(collectionName, data.result.records);
		})
		.then((result) => {
			console.log(result);

			// Rename the necessary fields, all at once
			return this.collectionDriver.renameFields(collectionName, config.fieldMapping.classes)
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
		
		this.collectionDriver.truncateCollection(collectionName)
		.then((result) => {
			console.log(result);
		
			return this.collectionDriver.insertDocuments(collectionName, data.result.records);
		})
		.then((result) => {
			console.log(result);

			return this.collectionDriver.renameFields(collectionName, config.fieldMapping.lexicon)
		})
		.then(console.log)
		.catch(console.error);
	}, console.error);
};

exports.Importer = Importer;
