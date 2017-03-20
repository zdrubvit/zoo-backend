const MongoClient = require('mongodb').MongoClient;
const CollectionDriver = require('./modules/collection-driver').CollectionDriver;
const Importer = require('./modules/importer').Importer;
const config = require('./config').config;

MongoClient.connect('mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.database).then((db) => {
	var collectionDriver = new CollectionDriver(db);

	// Create the core endpoint string for Opendata
	var endpoint = config.opendata.host + '/' + config.opendata.pathSearch + '?resource_id=';

	// Instantiate the importer and start filling up the database
	var importer = new Importer(endpoint, collectionDriver);

	// The lexicon's relations are the first on the line
	// importer.importRelations().then(() => {
	// 	console.log('All the lexicon relations have been imported successfully.');

	// 	// Now we can start taking care of the lexicon itself
		importer.importLexicon();
	// }, (error) => {
	// 	console.error('The lexicon relations import failed with the following error: ' + error);
	// });

	// Now for the classifications data
	importer.importClassifications();
}, console.error);
