const MongoClient = require('mongodb').MongoClient;
const CollectionDriver = require('./collection-driver').CollectionDriver;
const Importer = require('./importer').Importer;
const config = require('./config').config;

MongoClient.connect('mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.database).then(function(db){
	var collectionDriver = new CollectionDriver(db);

	// Create the core endpoint string for Opendata
	var endpoint = config.opendata.host + '/' + config.opendata.pathSearch + '?resource_id=';

	// Instantiate the importer and start filling the database
	var importer = new Importer(endpoint, collectionDriver);

	// Start dealing with the classifications data
	importer.importClasses();

	// And now for the lexicon itself
	importer.importLexicon();
}, console.error);
