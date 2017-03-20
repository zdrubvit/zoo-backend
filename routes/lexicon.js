const routes = require('express').Router();

var collectionDriver;

routes.use('/', function(req, res, next) {
	collectionDriver = req.app.get('collectionDriver');

	next();
});

routes.get('/:id', function(req, res) {
	collectionDriver.findDocument('lexicon', req.params.id).then((document) => {
		res.json(document);
	}, (error) => {
		console.log(error);
		res.end('Something went ballistic!');
	});
});

module.exports = routes;