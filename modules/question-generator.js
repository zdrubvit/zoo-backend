const config = require("../config").config;

QuestionGenerator = function(logger, collectionDriver, sourceCollectionName, answerCount = 4) {
	this.logger = logger;
	this.collectionDriver = collectionDriver;
	this.sourceCollectionName = sourceCollectionName;
	this.answerCount = answerCount;

	this.questions = [];
	this.targetCollectionName = config.mongodb.collectionNames.questions;
}

QuestionGenerator.prototype.generateQuestionGuessAnimalText = function(fieldName, questionText) {
	return new Promise((resolve, reject) => {
		// Set the scope for this document such that it's visible from all the Promises
		var primaryDocument = {};
		var primaryQuery = {};

		primaryQuery[fieldName] = { $exists: true, $ne: "" };

		// Choose a random document with a non-empty field
		this.collectionDriver.getRandomDocuments(this.sourceCollectionName, 1, primaryQuery).then((documents) => {
			var secondaryQuery = {};

			// This is the core document, serving as a basis for the question as well as the correct answer
			primaryDocument = documents[0];

			secondaryQuery.$and = [
				{ question: questionText.replace(":value", primaryDocument[fieldName]) },
				{ answerObjectId: primaryDocument._id }
			];

			// Check if the question exists already (based on its wording and answer so far)
			return this.collectionDriver.findDocument(this.targetCollectionName, secondaryQuery);
		}).then((document) => {
			var tertiaryQuery = {};

			// If the question's been already generated, stop the process at once
			if (document) return Promise.reject("The generated question already exists.");

			// Now choose the remaining wrong answers via documents whose field values differ from the primary one
			tertiaryQuery[fieldName] = { $exists: true, $ne: primaryDocument[fieldName] };
			return this.collectionDriver.getRandomDocuments(this.sourceCollectionName, this.answerCount - 1, tertiaryQuery);
		}).then((documents) => {
			var incorrectAnswers = [];

			for (let i = 0; i < documents.length; i++) {
				incorrectAnswers.push(documents[i].name);
			}

			// Create the question and save it immediately so it can be findable for duplicity check by subsequent question generations
			var newQuestion = [{
				question: questionText.replace(":value", primaryDocument[fieldName]),
				correctAnswer: primaryDocument.name,
				incorrectAnswers: incorrectAnswers,
				difficulty: 0,
				type: "guess_animal_text",
				answerObjectId: primaryDocument._id,
				pickedCount: 0,
				answeredCorrectlyCount: 0
			}];

			return this.collectionDriver.insertDocuments(this.targetCollectionName, newQuestion);
		}).then((result) => {
			this.logger.log("info", result);

			resolve(true);
		}).catch((reason) => {
			this.logger.log("error", "The question saving failed with the following reason: " + reason);

			resolve(false);
		});
	});
};

exports.QuestionGenerator = QuestionGenerator;
