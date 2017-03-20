const app = require('express')();
const MongoClient = require('mongodb').MongoClient;
const CollectionDriver = require('./modules/collection-driver').CollectionDriver;
const config = require('./config').config;
const routesLexicon = require('./routes/lexicon');

var collectionDriver;

MongoClient.connect('mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.database).then((db) => {
	console.log('A connection to the database ' + db.databaseName + ' has been set.');

	collectionDriver = new CollectionDriver(db);

	app.set('collectionDriver', collectionDriver);

	app.use('/lexicon', routesLexicon);

	app.listen(3000, function() {
		console.log('listening...');
	});
}, console.error);
// what happens when an error hits?
// there is no check if the db exists, the connection happily goes on -> check the db list
