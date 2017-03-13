const http = require('http');
const MongoClient = require('mongodb').MongoClient;
const CollectionDriver = require('./collection-driver').CollectionDriver;
const config = require('./config').config;

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
					console.log(data.result.records.length + ' records received from the "classes" table.');

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

									// Rename the necessary fields, all at once
									collectionDriver.renameFields(
										'classifications', 
										[{'a': 'opendata_id'}, {'b': 'type'}, {'c': 'parent_id'}, {'d': 'name'}, {'e': 'slug'}],
										function(error, result){
											if(error){
												console.log(error);
											}
											else{
												console.log(result);
											}
										}
									);

									// Force close the db
									db.close(true);
								}
							});
						}
					});
				}
			}
		);
	}
});