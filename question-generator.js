const MongoClient = require("mongodb").MongoClient;

const CollectionDriver = require("./modules/collection-driver").CollectionDriver;
const Logger = require("./modules/logger").Logger;
const config = require("./config").config;

var logger;
var collectionDriver;
var collectionName = config.mongodb.collectionNames.lexicon;
var questions = [];


MongoClient.connect("mongodb://" + config.mongodb.host + ":" + config.mongodb.port + "/" + config.mongodb.database).then((db) => {
	logger = new Logger(db);
	collectionDriver = new CollectionDriver(db, logger);

	var newQuestionsCount = process.argv[2];

	generateQuestion();
}, console.error);

var generateQuestion = function() {
	var primaryDocument;

	collectionDriver.getRandomDocuments(collectionName, 1, { class_name: { $exists: true, $ne: '' } }).then((documents) => {
		// This is the core document, serving as a basis for the question as well as the correct answer
		primaryDocument = documents[0];
		console.log(primaryDocument);

		// co kdyz nevrati vsechny tri? co duplicita?
		return collectionDriver.getRandomDocuments(collectionName, 3, { class_name: { $exists: true, $ne: primaryDocument.class_name } });
	}).then((documents) => {
		console.log(documents);
		var incorrectAnswers = [];

		for (let i = 0; i < 3; i++) {
			incorrectAnswers.push(documents[i].name);
		}

		questions.push({
			question: "Které z těchto zvířat patří do třídy \"" + primaryDocument.class_name + "\"?",
			correctAnswer: primaryDocument.name,
			incorrectAnswers: incorrectAnswers,
			difficulty: 0,
			type: "guess_animal",
			answerObjectId: primaryDocument._id,
			pickedCount: 0,
			answeredCorrectlyCount: 0
		});

		console.log(questions);
	}).catch(console.error);
};
