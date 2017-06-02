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
	var questionsToGenerate = iterationCount * 3;

	// The total nuber of soon to be generated questions in this run
	var questionsGenerated = 0;

	// A function to handle the resolved Promises
	var questionGenerationCallback = function(questionCreated, method) {
		// If all the questions have been generated, finish the script
		if (questionCreated) {
			if (++questionsGenerated === questionsToGenerate) {
				console.log("All " + questionsToGenerate + " questions have been generated, closing the DB connection.");
				collectionDriver.closeDB();
			}
		// In case of an error, try to generate another question right away using the passed method name
		} else {
			questionGenerator[method]().then(function(result) {
				return questionGenerationCallback(result, method);
			});
		}
	}

	// Iterate predefined number of times over the generating methods and use closure in the Promise handlers to pass in a method name in case of an error
	for (let i = 0; i < iterationCount; i++) {
		questionGenerator.generateQuestionGuessAnimalName().then(function(result) {
			return questionGenerationCallback(result, "generateQuestionGuessAnimalName");
		});
		questionGenerator.generateQuestionGuessAnimalAttribute().then(function(result) {
			return questionGenerationCallback(result, "generateQuestionGuessAnimalAttribute");
		});
		questionGenerator.generateQuestionGuessAnimalImage().then(function(result) {
			return questionGenerationCallback(result, "generateQuestionGuessAnimalImage");
		});
	}
}, console.error);
