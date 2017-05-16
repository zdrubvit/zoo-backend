const routes = require('express').Router();
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const Joi = require('joi');
const ObjectID = require('mongodb').ObjectID;
const config = require('../config').config;

const collectionName = config.mongodb.collectionNames.lexicon;
const fieldNames = config.api.lexicon;
var collectionDriver;
var lexiconSerializer;

// Init the necessary variables
routes.use('/', function(req, res, next) {
	// Retrieve the driver instance for later use
	collectionDriver = req.app.get('collectionDriver');

	// Create a serializer instance with perfected config options
	lexiconSerializer = new JSONAPISerializer(collectionName, {
		'id': '_id',
		'attributes': config.api.lexicon,
		'pluralizeType': false,
		'meta': {
			'count': function(documents) {
				return documents.length;
			}
		}
	});

	return next();
});

// Validate the incoming query parameters
routes.use('/', function(req, res, next) {
	var schemaKeys = {};

	// Every parameter has to be an alphanumeric string with certain length restrictions
	for (let i = 0; i < fieldNames.length; i++) {
		schemaKeys[fieldNames[i]] = Joi.string().alphanum().min(1).max(100);
	}

	const schema = Joi.object().keys(schemaKeys);
	const validation = Joi.validate(req.query, schema);

	// Send the "422 - Unprocessable Entity" error code
	if (validation.error) {
		return next({
			'code': 422,
			'message': validation.error.details[0].message
		});
	}

	return next();
});

routes.get('/', function(req, res) {
	var query = {};

	// Loop through the query parameters, check if they're proper field names and if they are, add them to the query
	for (property in req.query) {
		if (fieldNames.indexOf(property) != -1) {
			query[property] = req.query[property];
		}
	}

	collectionDriver.findAllDocuments(collectionName, query).then((documents) => {
		var payload = lexiconSerializer.serialize(documents);

		res.json(payload);
	}, (error) => {
		console.log(error);
		res.end('Something went ballistic!');
	});
});

routes.get('/:id', function(req, res) {
	collectionDriver.findDocument(collectionName, {'_id': ObjectID(req.params.id)}).then((document) => {
		var payload = lexiconSerializer.serialize(document);

		res.json(payload);
	}, (error) => {
		console.log(error);
		res.end('Something went ballistic!');
	});
});

module.exports = routes;