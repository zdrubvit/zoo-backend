const routes = require("express").Router();
const Joi = require("joi");
const ObjectID = require("mongodb").ObjectID;
const JSONAPISerializer = require("jsonapi-serializer").Serializer;
const config = require("../config").config;

const collectionName = config.mongodb.collectionNames.lexicon;
const fieldNames = config.api.lexicon;
var collectionDriver;
var lexiconSerializer;

// Init the necessary variables
routes.use("/", function(req, res, next) {
	// Retrieve the driver instance for later use
	collectionDriver = req.app.get("collectionDriver");

	// Create a serializer instance with perfected config options
	lexiconSerializer = new JSONAPISerializer(collectionName, {
		"id": "_id",
		"attributes": config.api.lexicon,
		"pluralizeType": false,
		"meta": {
			"count": function(documents) {
				return documents.length;
			}
		}
	});

	return next();
});

// Validate the incoming query parameters
routes.use("/", function(req, res, next) {
	var schemaKeys = {};

	// Every parameter has to be an alphanumeric string with certain length restrictions
	for (let i = 0; i < fieldNames.length; i++) {
		schemaKeys[fieldNames[i]] = Joi.string().alphanum().min(1).max(100);
	}

	// Append the pagination options
	schemaKeys.limit = Joi.number().integer().min(1);
	schemaKeys.offset = Joi.number().integer();

	const schema = Joi.object().keys(schemaKeys);
	const validation = Joi.validate(req.query, schema);

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

	// Loop through the query parameters, check if they're proper field names and if they are, add them to the query
	for (property in req.query) {
		if (fieldNames.indexOf(property) != -1) {
			query[property] = new RegExp(req.query[property], 'i');
		}
	}

	collectionDriver.findAllDocuments(collectionName, query).then((documents) => {
		// The argument is either an array of documents or an empty array
		var payload = lexiconSerializer.serialize(documents);

		res.json(payload);
	}, (error) => {
		// In case of an error, forward the details to the main error handler (the JS Error object has to be stringified explicitly)
		return next({
			"status": "500",
			"title": "Internal server error",
			"detail": JSON.stringify(error, ["name", "message", "stack"])
		});
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
		return next({
			"status": "500",
			"title": "Internal server error",
			"detail": JSON.stringify(error, ["name", "message", "stack"])
		});
	});
});

module.exports = routes;