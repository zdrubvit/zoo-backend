const Joi = require("joi");
const JSONAPISerializer = require("jsonapi-serializer").Serializer;

// Helper middleware class used across multiple app routes
Middleware = function() {};

// Joi validation of query parameters
Middleware.prototype.validateQuery = function(requestQuery, fieldNames) {
	var schemaKeys = {};

	// Every parameter has to be a string with certain length restrictions
	for (let i = 0; i < fieldNames.length; i++) {
		schemaKeys[fieldNames[i]] = Joi.string().min(1).max(100);
	}

	// Append the pagination options
	schemaKeys.limit = Joi.number().integer().min(1);
	schemaKeys.offset = Joi.number().integer();

	const schema = Joi.object().keys(schemaKeys);
	const validation = Joi.validate(requestQuery, schema, {allowUnknown: true});

	return validation;
};

// Returns the JSONSerializer instance
Middleware.prototype.getSerializer = function(collectionName, attributes) {
	return new JSONAPISerializer(collectionName, {
		"id": "_id",
		"attributes": attributes,
		"pluralizeType": false,
		"meta": {
			"count": function(documents) {
				return documents.length;
			}
		}
	});
};

exports.Middleware = Middleware;