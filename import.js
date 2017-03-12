const MongoClient = require('mongodb').MongoClient;
const CollectionDriver = require('./collection-driver').CollectionDriver;
const config = require('./config').config;
const http = require('http');

var collectionDriver;

getOpenData = function(url, fields, callback){
	// hack
	url += '&limit=10000';

	if(fields){
		var fieldsQuery = '&fields=' + fields.join();

		url += fieldsQuery;
	}

	console.log('Getting the data from URL: ' + url);

	http.get(url, function(res){
		var buffer = '';

		res.setEncoding('utf8');

		res.on('data', function(chunk){
			buffer += chunk;
			console.log('got a chunk of data');
			console.log('size of the chunk: ' + chunk.length);
		});

		res.on('end', function(){
			console.log('buffer size: ' + buffer.length);
			var data = JSON.parse(buffer);

			callback(null, data);
		});
	}).on('error', function(error){
		callback(error.message);
	});
};

MongoClient.connect('mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.database, function(error, db){
	if(error){
		console.log(error);
	}
	else{
		collectionDriver = new CollectionDriver(db);

		getOpenData(
			config.opendata.host + '/' + config.opendata.pathSearch + '?resource_id=' + config.opendata.resources.classes,
			['a', 'b', 'c', 'd', 'e'],
			function(error, data){
				if(error){
					console.log(error);
				}
				else{
					console.log('Just received the hot data with ' + data.result.records.length + ' records!');
					// console.log(data);

					collectionDriver.removeCollection('classifications', function(error, result){
						if(error){
							console.log(error);
						}
						else{
							console.log(result);

							collectionDriver.insertDocuments('classifications', data.result.records, function(error, result){
								if(error){
									console.log(error);
								}
								else{
									console.log(result);

									// Rename the fields one by one
									collectionDriver.renameField('classifications', 'a', 'opendata_id');
									collectionDriver.renameField('classifications', 'b', 'type');
									collectionDriver.renameField('classifications', 'c', 'parent_id');
									collectionDriver.renameField('classifications', 'd', 'name');
									collectionDriver.renameField('classifications', 'e', 'slug');

									db.close;
								}
							});
						}
					});
				}
			}
		);
	}
});