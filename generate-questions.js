const MongoClient = require("mongodb").MongoClient;

const CollectionDriver = require("./modules/collection-driver").CollectionDriver;
const Logger = require("./modules/logger").Logger;
const QuestionGenerator = require("./modules/question-generator").QuestionGenerator;
const config = require("./config").config;

MongoClient.connect("mongodb://" + config.mongodb.host + ":" + config.mongodb.port + "/" + config.mongodb.database).then((db) => {
	var logger = new Logger(db);
	var collectionDriver = new CollectionDriver(db, logger);
	var questionGenerator = new QuestionGenerator(
		logger,
		collectionDriver,
		config.mongodb.collectionNames.lexicon
	);

	// Set the number of questions from each bucket to be generated
	var questionCount;
	if (typeof process.argv[2] !== "undefined") {
		questionCount = process.argv[2];
	} else {
		questionCount = 5;
	}

	for (let i = 0; i < questionCount; i++) {
		questionGenerator.generateQuestionGuessAnimalText("class_name", "Které z těchto zvířat patří do třídy ");
	}
}, console.error);
