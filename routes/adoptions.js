const routes = require("express").Router();
const ObjectID = require("mongodb").ObjectID;

const config = require("../config").config;
const Middleware = require("./middleware").Middleware;

const collectionName = config.mongodb.collectionNames.adoptions;
const fieldNames = config.api.adoptions;
var collectionDriver;
var lexiconSerializer;
var middleware;

// Init the necessary variables
routes.use(function(req, res, next) {
	// Retrieve the driver instances for later use
	collectionDriver = req.app.get("collectionDriver");

	// Gain access to the shared methods
	middleware = new Middleware(fieldNames);

	// Create a serializer instance with perfected config options
	lexiconSerializer = middleware.getSerializer(collectionName);

	return next();
});

routes.get("/", function(req, res, next) {
	collectionDriver.findAllDocuments(collectionName, {}, 0, 0, {name: 1}).then((documents) => {
		// The argument is either an array of documents or an empty array
		var payload = lexiconSerializer.serialize(documents);

		res.json(payload);
	}, (error) => {
		// In case of an error, forward the details to the main error handler (the JS Error object has to be stringified explicitly)
		return next(error);
	});
});

module.exports = routes;