const routes = require("express").Router();
const ObjectID = require("mongodb").ObjectID;
const Joi = require("joi");

const config = require("../config").config;
const Middleware = require("./middleware").Middleware;

const collectionName = config.mongodb.collectionNames.classifications;
const fieldNames = config.api.classifications;
var collectionDriver;
var lexiconSerializer;
var middleware;

// Bring out the middleware and gain access to the shared methods
routes.use(function(req, res, next) {
	middleware = new Middleware(fieldNames);

	return next();
});

// Validate the incoming query parameters
routes.use(function(req, res, next) {
	var schemaKeys = {};

	// The parameters have to be boolean values
	schemaKeys.class = Joi.boolean();
	schemaKeys.order = Joi.boolean();
	schemaKeys.family = Joi.boolean();

	var validation = middleware.validateRequestQuery(schemaKeys, req.query);

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

// Init the necessary variables
routes.use(function(req, res, next) {
	// Retrieve the driver instances for later use
	collectionDriver = req.app.get("collectionDriver");

	// Create a serializer instance with perfected config options
	lexiconSerializer = middleware.getSerializer(collectionName);

	return next();
});

// Get the whole taxonomy structure (excluding the animal "family" so far)
routes.get("/", function(req, res, next) {
	collectionDriver.findAllDocuments(collectionName, {type: "class"}).then((classDocuments) => {
		classDocumentsLength = classDocuments.length;
		classDocumentsCount = 0;

		classDocuments.forEach((classDocument) => {
			// Simulate the SQL nested query using another collection request
			collectionDriver.findAllDocuments(collectionName, {type: "order", parent_id: classDocument.opendata_id}).then((orderDocuments) => {
				// Append the child documents to their parent
				classDocument.orders = orderDocuments;

				classDocumentsCount++;

				if (classDocumentsCount == classDocumentsLength) {
					// All the documents are finally linked together - send them back
					var payload = lexiconSerializer.serialize(classDocuments);

					res.json(payload);
				}
			}, (error) => {
				// Propagate the error up to the catcher
				throw error;
			});
		});
	})
	.catch((error) => {
		// In case of an error, forward the details to the main error handler (the JS Error object has to be stringified explicitly)
		return next(error);
	});
});

module.exports = routes;