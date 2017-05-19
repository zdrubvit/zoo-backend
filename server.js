const app = require("express")();
const colors = require("colors");
const MongoClient = require("mongodb").MongoClient;
const JSONAPIError = require("jsonapi-serializer").Error;
const CollectionDriver = require("./modules/collection-driver").CollectionDriver;
const Logger = require("./modules/logger").Logger;
const config = require("./config").config;

// Connect to the DB and then reuse the instance across all the requests thanks to its own connection pool
MongoClient.connect("mongodb://" + config.mongodb.host + ":" + config.mongodb.port + "/" + config.mongodb.database).then((db) => {
	// Instantiate the logger
	var logger = new Logger(db);

	logger.log("info", "A connection to the database " + db.databaseName + " has been opened.");

	// Let the driver instance be accessible throughout the app
	var collectionDriver = new CollectionDriver(db, logger);
	app.set("collectionDriver", collectionDriver);

	// Log the request
	app.use(function(req, res, next) {
		var url = req.protocol + "://" + req.get("host") + req.originalUrl;
		logger.log("info", "A new request to " + url.cyan + " received from the IP " + req.ip);

		return next();
	});

	// Set the routes to their correct paths
	app.use("/lexicon", require("./routes/lexicon"));

	// Universal error handler middleware
	app.use(function(err, req, res, next) {
		// Convert the standard JS Error so that it can be serialized
		if (err instanceof Error) {
			err = {
				"status": "500",
				"title": "Internal server error",
				"detail": JSON.stringify(err, ["name", "message", "stack"])
			}
		}

		logger.log("error", "Error " + err.status + " occurred with the following message: " + err.detail);
		
		// Serialize the error and send it away
		var error = new JSONAPIError(err);

		res.status(err.status).json(error);
	});

	// No match up to this point - return 404
	app.use(function(req, res, next) {
		var error = new JSONAPIError({
			"status": "404",
			"title": "Not found",
			"detail": "There's no resource matching the requested URL"
		});
		var url = req.protocol + "://" + req.get("host") + req.originalUrl;

		logger.log("error", "Error 404 occurred with the following request: " + url);

  		res.status(404).json(error);
	});

	app.listen(3000, function() {
		logger.log("info", "The server is listening on port " + "3000...".red);
	});
}, console.error);
