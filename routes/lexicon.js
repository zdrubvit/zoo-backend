const routes = require('express').Router();

var collectionDriver;

routes.use('/', function(req, res, next) {
	collectionDriver = req.app.get('collectionDriver');

	next();
});

routes.get('/', function(req, res) {
	collectionDriver.truncateCollection('classifications').then((result) => {
		console.log(result);
		res.end(result);
	}, console.error);
});

routes.get('/please', function(req, res) {
	res.end('pretty please');
});

module.exports = routes;