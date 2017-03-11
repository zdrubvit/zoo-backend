const MongoClient = require('mongodb').MongoClient;
const CollectionDriver = require('./collection-driver').CollectionDriver;
const config = require('./config').config;
const http = require('http');

var collectionDriver;

// MongoClient.connect('mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.database, function(error, db){
// 	if(error){
// 		console.log(error);
// 	}
// 	else{
// 		collectionDriver = new CollectionDriver(db);

// 		collectionDriver.insertDocuments('sex', [{'name' : 'male'}, {'name' : 'female'}], function(error, result){
// 			if(error){
// 				console.log(error);
// 			}
// 			else{
// 				console.log(result);
// 				db.close;
// 			}
// 		});
// 	}
// });

getOpenData = function(url, callback){
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

getOpenData(config.opendata.host + '/' + config.opendata.pathSearch + '?resource_id=' + config.opendata.resources.lexicon + '&limit=10', function(error, data){
	if(error){
		console.log(error);
	}
	else{
		console.log('just received the hot data!');
		console.log(data);
	}
});