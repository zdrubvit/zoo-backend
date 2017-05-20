const Joi = require("joi");
const JSONAPISerializer = require("jsonapi-serializer").Serializer;

// Helper middleware class used across multiple app routes
Middleware = function(fieldNames) {
	// The field names (reflecting the collection's "schema") are used extensively throughout the middleware methods
	this.fieldNames = fieldNames;
};

// Joi validation of query parameters using the given schema
Middleware.prototype.validateRequestQuery = function(schemaKeys, requestQuery) {
	const schema = Joi.object().keys(schemaKeys);
	const validation = Joi.validate(requestQuery, schema, {allowUnknown: true});

	return validation;
};

// Returns the JSONSerializer instance
Middleware.prototype.getSerializer = function(collectionName) {
	return new JSONAPISerializer(collectionName, {
		"id": "_id",
		"attributes": this.fieldNames,
		"pluralizeType": false,
		"keyForAttribute": "snake_case",
		"meta": {
			"count": function(documents) {
				return documents.length;
			}
		}
	});
};

// Returns the filtering options for database querying
Middleware.prototype.createDbQuery = function(requestQuery) {
	var query = {};
	var limit = 0;
	var offset = 0;

	// Loop through the query parameters
	for (property in requestQuery) {
		// ...check if they're proper field names and if they are, add them to the query
		if (this.fieldNames.indexOf(property) != -1) {
			query[property] = new RegExp(requestQuery[property], 'i');
		}

		// ...now look for the limiting options
		if (property == "limit") {
			limit = parseInt(requestQuery[property]);
		}

		if (property == "offset") {
			offset = parseInt(requestQuery[property]);
		}
	}

	return {
		"query": query,
		"limit": limit,
		"offset": offset
	};
};

exports.Middleware = Middleware;