const app = require('express')();
const MongoClient = require('mongodb').MongoClient;
const CollectionDriver = require('./modules/collection-driver').CollectionDriver;
const config = require('./config').config;

// Connect to the DB and then reuse the instance across all the requests thanks to its own connection pool
MongoClient.connect('mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.database).then((db) => {
	console.log('A connection to the database ' + db.databaseName + ' has been set.');

	// Let the driver instance be accessible throughout the app
	var collectionDriver = new CollectionDriver(db);
	app.set('collectionDriver', collectionDriver);

	// Set the routes to their correct paths
	app.use('/lexicon', require('./routes/lexicon'));

	// TODO serialize error
	// Universal error handler
	app.use(function(err, req, res, next) {
		res.status(err.code).end(err.message);
	});

	// TODO No match up to this point - return 404

	app.listen(3000, function() {
		console.log('listening...');
	});
}, console.error);
// what happens when an error hits?
// there is no check if the db exists, the connection happily goes on -> check the db list
