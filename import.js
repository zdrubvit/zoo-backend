const MongoClient = require("mongodb").MongoClient;
const CollectionDriver = require("./modules/collection-driver").CollectionDriver;
const Importer = require("./modules/importer").Importer;
const Logger = require("./modules/logger").Logger;
const config = require("./config").config;

MongoClient.connect("mongodb://" + config.mongodb.host + ":" + config.mongodb.port + "/" + config.mongodb.database).then((db) => {
	var logger = new Logger(db);
	var collectionDriver = new CollectionDriver(db, logger);

	// Create the core endpoint string for Opendata
	var endpoint = config.opendata.host + "/" + config.opendata.pathSearch + "?resource_id=";

	// Instantiate the importer and start filling up the database
	var importer = new Importer(endpoint, collectionDriver, logger);

	// The animal lexicon is the first on the line
	importer.importLexicon().then((result) => {
		logger.log("info", result);

		// Now we can start taking care of the animal adoptions that rely partially on the lexicon
		importer.importAdoptions();
	}, (error) => {
		logger.log("error", "The lexicon import failed with the following error: " + error);
	});

	// importer.importClassifications();
	// importer.importEvents();
}, console.error);
