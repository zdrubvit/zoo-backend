const Joi = require("joi");
const JSONAPISerializer = require("jsonapi-serializer").Serializer;

// Helper middleware class used across multiple app routes
Middleware = function(collectionDriver = null) {
	this.collectionDriver = collectionDriver;
};

// Joi validation of query parameters using the given schema
Middleware.prototype.validateRequestQuery = function(schemaKeys, requestQuery) {
	const schema = Joi.object().keys(schemaKeys);
	const validation = Joi.validate(requestQuery, schema);

	return validation;
};

// Returns the JSONSerializer instance
Middleware.prototype.getSerializer = function(collectionName, attributes) {
	return new JSONAPISerializer(collectionName, {
		"id": "_id",
		"attributes": attributes,
		"pluralizeType": false,
		"keyForAttribute": "snake_case",
		"nullIfMissing": true,
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

// Search for the distinct values in a certain field, then make valid documents from them, then append the number of documents they appear in
Middleware.prototype.handleDistinctValues = function(collectionName, fieldName, query) {
	return new Promise((resolve, reject) => {
		this.collectionDriver.findDistinctValues(collectionName, fieldName, query).then((values) => {
			// The serialization argument must either be an array of documents or an empty array, but the values are simple array elements
			var documents = values.map(function(value, index) {
				return {"_id": index, "name": value};
			});

			documentsLength = documents.length;
			documentsCount = 0;

			documents.forEach((document) => {
				var innerQuery = {};
				innerQuery[fieldName] = document.name;

				this.collectionDriver.countDocuments(collectionName, innerQuery).then((count) => {
					document.count = count;

					documentsCount++;

					if (documentsCount == documentsLength) {
						// All the documents are finally complete - send them back
						resolve(documents);
					}
				})
			}, (error) => {
				// Propagate the error up to the catcher
				throw error;
			});
		})
		.catch((error) => {
			// In case of an error, forward the details to the main error handler (the JS Error object has to be stringified explicitly)
			reject(error);
		});
	});
};

exports.Middleware = Middleware;