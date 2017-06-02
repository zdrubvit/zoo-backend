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
	var iterationCount;
	if (typeof process.argv[2] !== "undefined") {
		iterationCount = process.argv[2];
	} else {
		iterationCount = 5;
	}

	// For every iteration there should be one new question of a certain type, so the final number has to be multiplied
	var questionsToGenerate = iterationCount * 1;

	// The total nuber of generated questions in this run
	var questionsGenerated = 0;

	for (let i = 0; i < iterationCount; i++) {
		questionGenerator.generateQuestionGuessAnimalText("class_name", "Které z těchto zvířat patří do třídy \":value\"?").then((result) => {
			// If all the questions have been generated, finish the script
			if (result) {
				if (++questionsGenerated === questionsToGenerate) {
					collectionDriver.closeDB();
				}
			// In case of an error, try to generate another question right away by decrementing the counter
			} else {
				i--;
			}
		});
	}
}, console.error);
