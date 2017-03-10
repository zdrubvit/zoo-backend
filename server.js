var MongoClient = require('mongodb').MongoClient;
var CollectionDriver = require('./collection-driver').CollectionDriver;
var config = require('./config').config;
var http = require('http');

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

http.get(config.opendata.host + '/' + config.opendata.pathSearch + '?resource_id=' + config.opendata.resources.lexicon + '&limit=1000', function(res){
	var buffer = '';

	res.setEncoding('utf8');

	res.on('data', function(chunk){
		buffer += chunk;
		console.log('got a chunk of data: ' + chunk);
		console.log('size of the chunk: ' + chunk.length);
		console.log('..');
	});

	res.on('end', function(){
		console.log('buffer size: ' + buffer.length);
		var data = JSON.parse(buffer);
	});
}).on('error', function(error){
	console.log(error.message);
});