require("winston-mongodb").MongoDB;

// A universal logging class
Logger = function(db) {
	this.winston = require("winston");

	// Add a new transport which logs directly to the DB
	this.winston.add(this.winston.transports.MongoDB, {
		"db": db,
		"decolorize": true,
		"level": "info"
	});

	// Set the console log level above the MongoDB
	this.winston.transports.Console.level = "debug";
};

Logger.prototype.log = function(level, message) {
	this.winston.log(level, message);
};

exports.Logger = Logger;