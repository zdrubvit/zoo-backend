const http = require('http');
const MongoClient = require('mongodb').MongoClient;
const CollectionDriver = require('./collection-driver').CollectionDriver;
const config = require('./config').config;

var collectionDriver;

getOpenData = function(url, fields){
	return new Promise(function(resolve, reject){
		// hack
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

	// Make the data available for the collection driver using a closure
	getOpenData(url, ['a', 'b', 'c', 'd', 'e']).then(function(data){
		console.log(data.result.records.length + ' records received from the "classes" table.');
		
		collectionDriver.truncateCollection('classifications').then(function(result){
			console.log(result);
		
			return collectionDriver.insertDocuments('classifications', data.result.records);
		}).then(function(result){
			console.log(result);

			// Rename the necessary fields, all at once
			return collectionDriver.renameFields('classifications', {'a': 'opendata_id', 'b': 'type', 'c': 'parent_id', 'd': 'name', 'e': 'slug'})
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
