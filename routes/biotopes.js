const routes = require("express").Router();
const ObjectID = require("mongodb").ObjectID;

const config = require("../config").config;
const Middleware = require("./middleware").Middleware;

const collectionName = config.mongodb.collectionNames.lexicon;
const fieldNames = config.serialization.biotopes;
var collectionDriver;
var lexiconSerializer;
var middleware;

// Init the necessary variables
routes.use(function(req, res, next) {
	// Retrieve the driver instances for later use
	collectionDriver = req.app.get("collectionDriver");

	// Gain access to the shared methods
	middleware = new Middleware();

	// Create a serializer instance with perfected config options
	lexiconSerializer = middleware.getSerializer("biotopes", fieldNames);

	return next();
});

routes.get("/", function(req, res, next) {
	// Filter the documents so that the field value is valid and believable
	var query = { $where: "this.biotope.length > 0 && this.biotope.length < 40" };

	collectionDriver.findDistinctValues(collectionName, "biotope", query).then((values) => {
		// The serialization argument must either be an array of documents or an empty array, but the values are simple array elements
		var documents = values.map(function(value, index) {
			return {"_id": index, "name": value};
		});

		documentsLength = documents.length;
		documentsCount = 0;

		documents.forEach((document) => {
			collectionDriver.countDocuments(collectionName, {"biotope": document.name}).then((count) => {
				document.count = count;

				documentsCount++;

				if (documentsCount == documentsLength) {
					// All the documents are finally complete - send them back
					var payload = lexiconSerializer.serialize(documents);

					res.json(payload);
				}
			})
		}, (error) => {
			// Propagate the error up to the catcher
			throw error;
		});
	})
	.catch((error) => {
		// In case of an error, forward the details to the main error handler (the JS Error object has to be stringified explicitly)
		return next(error);
	});
});

module.exports = routes;