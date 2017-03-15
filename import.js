const http = require('http');
const MongoClient = require('mongodb').MongoClient;
const CollectionDriver = require('./collection-driver').CollectionDriver;
const config = require('./config').config;

var collectionDriver;

getOpenData = function(url, fields){
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

MongoClient.connect('mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.database).then(function(db){
	collectionDriver = new CollectionDriver(db);

	// Create the core endpoint string for Opendata
	var endpoint = config.opendata.host + '/' + config.opendata.pathSearch + '?resource_id=';

	// Start dealing with the classifications data
	var url =  endpoint + config.opendata.resources.classes;
	var collectionName = 'classifications';

	// Make the received data available for the collection driver using a closure
	getOpenData(url, config.filterColumns.classes).then(function(data){
		console.log(data.result.records.length + ' records received from the "classes" table.');
		
		collectionDriver.truncateCollection(collectionName).then(function(result){
			console.log(result);
		
			return collectionDriver.insertDocuments(collectionName, data.result.records);
		}).then(function(result){
			console.log(result);

			// Rename the necessary fields, all at once
			return collectionDriver.renameFields(collectionName, config.fieldMapping.classes)
		}).then(function(result){
			console.log(result);

			// Force the db to close
			db.close(true);
		}).catch(function(error){
			console.error(error);

			// Force the db to close
			db.close(true);
		});
	}, console.error);

	// And now for the lexicon itself
	var url =  endpoint + config.opendata.resources.lexicon;
	var collectionName = 'lexicon';

	getOpenData(url, config.filterColumns.lexicon).then(function(data){
		console.log(data.result.records.length + ' records received from the "animals" table.');
		
		collectionDriver.truncateCollection(collectionName).then(function(result){
			console.log(result);
		
			return collectionDriver.insertDocuments(collectionName, data.result.records);
		}).then(function(result){
			console.log(result);

			return collectionDriver.renameFields(collectionName, config.fieldMapping.lexicon)
		}).then(function(result){
			console.log(result);

			// Force the db to close
			db.close(true);
		}).catch(function(error){
			console.error(error);

			// Force the db to close
			db.close(true);
		});
	}, console.error);
}, console.error);
