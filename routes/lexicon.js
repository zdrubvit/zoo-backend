const routes = require("express").Router();
const ObjectID = require("mongodb").ObjectID;
const config = require("../config").config;
const Middleware = require("./middleware").Middleware;

const collectionName = config.mongodb.collectionNames.lexicon;
const fieldNames = config.api.lexicon;
var collectionDriver;
var lexiconSerializer;
var middleware;

// Init the necessary variables
routes.use(function(req, res, next) {
	// Retrieve the driver instances for later use
	collectionDriver = req.app.get("collectionDriver");

	// Gain access to the shared methods
	middleware = new Middleware();

	// Create a serializer instance with perfected config options
	lexiconSerializer = middleware.getSerializer(collectionName, fieldNames);

	return next();
});

// Validate the incoming query parameters
routes.use(function(req, res, next) {
	var validation = middleware.validateQuery(req.query, fieldNames)

	// Send the "422 - Unprocessable Entity" error code (the standard JS Error object has to be traversed to get the message)
	if (validation.error) {
		return next({
			"status": "422",
			"title": "Invalid query parameter",
			"detail": validation.error.details[0].message
		});
	}

	return next();
});

routes.get("/", function(req, res, next) {
	var query = {};
	var limit = 0;
	var offset = 0;

	// Loop through the query parameters
	for (property in req.query) {
		// ...check if they're proper field names and if they are, add them to the query
		if (fieldNames.indexOf(property) != -1) {
			query[property] = new RegExp(req.query[property], 'i');
		}

		// ...now look for the limiting options
		if (property == "limit") {
			limit = parseInt(req.query[property]);
		}

		if (property == "offset") {
			offset = parseInt(req.query[property]);
		}
	}

	collectionDriver.findAllDocuments(collectionName, query, limit, offset).then((documents) => {
		// The argument is either an array of documents or an empty array
		var payload = lexiconSerializer.serialize(documents);

		res.json(payload);
	}, (error) => {
		// In case of an error, forward the details to the main error handler (the JS Error object has to be stringified explicitly)
		return next(error);
	});
});

routes.get("/:id", function(req, res, next) {
	collectionDriver.findDocument(collectionName, {"_id": ObjectID(req.params.id)}).then((document) => {
		// The serializer has to acquire the data as an array
		var data = [];
		if (document) data.push(document);

		var payload = lexiconSerializer.serialize(data);

		res.json(payload);
	}, (error) => {
		return next(error);
	});
});

module.exports = routes;