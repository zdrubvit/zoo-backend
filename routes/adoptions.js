const routes = require("express").Router();
const ObjectID = require("mongodb").ObjectID;
const Joi = require("joi");

const config = require("../config").config;
const Middleware = require("./middleware").Middleware;

const collectionName = config.mongodb.collectionNames.adoptions;
const fieldNames = config.serialization.adoptions;
const allowedQueryParams = config.allowedApiQuery.adoptions;
var collectionDriver;
var lexiconSerializer;
var middleware;

// Bring out the middleware and gain access to the shared methods
routes.use(function(req, res, next) {
	middleware = new Middleware();

	return next();
});

// Validate the incoming query parameters
routes.use(function(req, res, next) {
	var schemaKeys = {};

	// Every parameter has to be a string with certain length restrictions
	for (let i = 0; i < allowedQueryParams.length; i++) {
		schemaKeys[allowedQueryParams[i]] = Joi.string().min(1).max(100);
	}

	// Append the pagination options
	schemaKeys.limit = Joi.number().integer().min(1);
	schemaKeys.offset = Joi.number().integer();

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

	var links = req.app.get("links");

	// Conform to the HATEOAS principle when serving a limited number of records, i.e. paginating
	if (req.query.offset || req.query.limit) {
		middleware.createPaginationLinks(links, req.query.offset, req.query.limit);
	}

	// Create a serializer instance with perfected config options
	lexiconSerializer = middleware.getSerializer(collectionName, fieldNames, links);

	return next();
});

routes.get("/", function(req, res, next) {
	var dbQuery = middleware.createDbQuery(req.query);
	
	collectionDriver.findAllDocuments(collectionName, dbQuery.query, dbQuery.limit, dbQuery.offset, {name: 1}).then((documents) => {
		// The argument is either an array of documents or an empty array
		var payload = lexiconSerializer.serialize(documents);

		res.json(payload);
	}, (error) => {
		// In case of an error, forward the details to the main error handler (the JS Error object has to be stringified explicitly)
		return next(error);
	});
});

module.exports = routes;