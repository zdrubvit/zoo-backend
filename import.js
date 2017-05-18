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

	// Start the import
	Promise.all([
		importer.importLexiconAndAdoptions(),
		importer.importClassifications(),
		importer.importEvents()
	])
	.then((results) => {
		// All the resources have been imported
		logger.log("info", results.toString());
	})
	.catch((reason) => {
		logger.log("error", "The import failed with the following reason: " + reason);
	})
	.then(() => {
		// Whether there was an error or not, close the connection
		collectionDriver.closeDB();
	});
}, console.error);
