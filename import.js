const MongoClient = require('mongodb').MongoClient;
const CollectionDriver = require('./collection-driver').CollectionDriver;
const Importer = require('./importer').Importer;
const config = require('./config').config;

MongoClient.connect('mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.database).then(function(db) {
	var collectionDriver = new CollectionDriver(db);

	// Create the core endpoint string for Opendata
	var endpoint = config.opendata.host + '/' + config.opendata.pathSearch + '?resource_id=';

	// Instantiate the importer and start filling the database
	var importer = new Importer(endpoint, collectionDriver);

	importer.importRelations().then((result) => {
		console.log(result);
		for(var i in importer.lexiconRelations) {
			console.log(importer.lexiconRelations[i].length);
		}
	}, (error) => {
		console.error('The lexicon relations import failed with a following error: ' + error);

	});
	// Start dealing with the lexicon first, there's a lot to do there
	// importer.importLexicon();

	// Now for the classifications data
	// importer.importClasses();
}, console.error);
