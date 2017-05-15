const routes = require('express').Router();
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const ObjectID = require('mongodb').ObjectID;
const config = require('../config').config;

var collectionDriver;
var lexiconSerializer;
var collectionName = 'lexicon';

routes.use('/', function(req, res, next) {
	// Retrieve the driver instance for later use
	collectionDriver = req.app.get('collectionDriver');

	// Create a serializer instance with perfected config options
	lexiconSerializer = new JSONAPISerializer(collectionName, {
		'id': '_id',
		'attributes': config.jsonserialize.lexicon,
		'pluralizeType': false
	});

	next();
});

routes.get('/', function(req, res) {
	var fieldNames = config.jsonserialize.lexicon;
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