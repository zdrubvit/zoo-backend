const Joi = require("joi");
const JSONAPISerializer = require("jsonapi-serializer").Serializer;

// Helper middleware class used across multiple app routes
Middleware = function(fieldNames) {};

// Joi validation of query parameters using the given schema
Middleware.prototype.validateRequestQuery = function(schemaKeys, requestQuery) {
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
		"keyForAttribute": "snake_case",
		"meta": {
			"count": function(documents) {
				return documents.length;
			}
		}
	});
};

// Returns the filtering options for database querying (the request should be sanitized by now)
Middleware.prototype.createDbQuery = function(requestQuery) {
	var query = {};
	var limit = 0;
	var offset = 0;

	for (property in requestQuery) {
		// Look for the limiting options first, then the name (which is the only field with a text index), after that assign the query parameter as a case insensitive "like" expression
		if (property == "limit") {
			limit = parseInt(requestQuery[property]);
		} else if (property == "offset") {
			offset = parseInt(requestQuery[property]);
		} else if (property == "name") {
			query.$text = {
			  $search: requestQuery[property],
			  $caseSensitive: false,
			  $diacriticSensitive: false
			};
		} else {
			query[property] = { $regex: new RegExp(requestQuery[property], 'i') };
		}
	}

	return {
		"query": query,
		"limit": limit,
		"offset": offset
	};
};

exports.Middleware = Middleware;