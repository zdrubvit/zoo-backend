const app = require("express")();
const bodyParser = require("body-parser");
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
		logger.log("info", "A new request to " + url.cyan + " received from the IP " + req.ip + " at " + new Date());

		return next();
	});

	// Parse the request body as a JSON
	app.use(bodyParser.json());

	// Check the request headers
	app.use(function(req, res, next) {
		// Catch the case where the client does not accept JSON-API
		if ( ! req.accepts("application/vnd.api+json")) {
			return next({
				"status": "406",
				"title": "Not Acceptable",
				"detail": "The client has to accept the JSON-API formatted response"
			});
		}

		// Catch the case where the client has not send a valid content type
		if (req.body.length && ! req.is("application/vnd.api+json")) {
			return next({
				"status": "415",
				"title": "Unsupported Media Type",
				"detail": "The received content has to be JSON-API formatted and have the proper http header"
			});
		}

		return next();
	});

	// Set the response headers
	app.use(function(req, res, next) {
		res.set("Content-type", "application/vnd.api+json;charset=utf-8");

		return next();
	});

	// Set the routes to their correct paths
	app.use("/adoptions", require("./routes/adoptions"));
	app.use("/biotopes", require("./routes/biotopes"));
	app.use("/classifications", require("./routes/classifications"));
	app.use("/continents", require("./routes/continents"));
	app.use("/events", require("./routes/events"));
	app.use("/food", require("./routes/food"));
	app.use("/lexicon", require("./routes/lexicon"));
	app.use("/locations", require("./routes/locations"));
	app.use("/questions", require("./routes/questions"));

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
