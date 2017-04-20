const app = require('express')();
const MongoClient = require('mongodb').MongoClient;
const CollectionDriver = require('./modules/collection-driver').CollectionDriver;
const config = require('./config').config;

// Connect to the DB and then reuse the instance across all the requests thanks to its own connection pool
MongoClient.connect('mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.database).then((db) => {
	console.log('A connection to the database ' + db.databaseName + ' has been set.');

	var collectionDriver = new CollectionDriver(db);

	app.set('collectionDriver', collectionDriver);

	app.use('/lexicon', require('./routes/lexicon'));

	app.listen(3000, function() {
		console.log('listening...');
	});
}, console.error);
// what happens when an error hits?
// there is no check if the db exists, the connection happily goes on -> check the db list
