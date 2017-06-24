const routes = require("express").Router();
const ObjectID = require("mongodb").ObjectID;
const Joi = require("joi");

const config = require("../config").config;
const Middleware = require("./middleware").Middleware;

const collectionName = config.mongodb.collectionNames.events;
const fieldNames = config.serialization.events;
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

	// Insist the date to be in a ISO8601 format
	schemaKeys.datetime = Joi.date().iso();

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
	var query = {};

	// The date has to be either lower or equal to the event's start or fall between the event's start and end dates
	if (req.query.datetime) {
		query.$or = [
			{ start : { $gte : req.query.datetime } },
			{ $and : [
				{ start : { $lt : req.query.datetime } },
				{ end : { $gte : req.query.datetime } }
			]}
		];
	}

	collectionDriver.findAllDocuments(collectionName, query, 0, 0, {start: 1}).then((documents) => {
		// The argument is either an array of documents or an empty array
		var payload = lexiconSerializer.serialize(documents);

		res.json(payload);
	}, (error) => {
		// In case of an error, forward the details to the main error handler (the JS Error object has to be stringified explicitly)
		return next(error);
	});
});

module.exports = routes;