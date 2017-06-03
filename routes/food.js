const routes = require("express").Router();
const ObjectID = require("mongodb").ObjectID;

const config = require("../config").config;
const Middleware = require("./middleware").Middleware;

const collectionName = config.mongodb.collectionNames.lexicon;
const fieldNames = config.serialization.food;
var collectionDriver;
var lexiconSerializer;
var middleware;

// Init the necessary variables
routes.use(function(req, res, next) {
	// Retrieve the driver instances for later use
	collectionDriver = req.app.get("collectionDriver");

	// Gain access to the shared methods
	middleware = new Middleware(collectionDriver);

	// Create a serializer instance with perfected config options
	lexiconSerializer = middleware.getSerializer("food", fieldNames);

	return next();
});

routes.get("/", function(req, res, next) {
	// Filter the documents so that the field value is valid and believable
	var query = { $where: "this.food.length > 0 && this.food.length < 30" };

	middleware.handleDistinctValues(collectionName, "food", query).then((documents) => {
		var payload = lexiconSerializer.serialize(documents);

		res.json(payload);
	}, (error) => {
		return next(error);
	});
});

module.exports = routes;