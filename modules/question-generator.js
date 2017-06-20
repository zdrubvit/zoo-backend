const config = require("../config").config;

// Quiz questions are generated and inserted via this class
QuestionGenerator = function(logger, collectionDriver, sourceCollectionName, answerCount = 4) {
	this.logger = logger;
	this.collectionDriver = collectionDriver;
	this.sourceCollectionName = sourceCollectionName;
	this.answerCount = answerCount;

	this.targetCollectionName = config.mongodb.collectionNames.questions;
	this.questionTypes = config.questionTypes;
}

/* 
* Generate a question based on a concept of "which animal satisfies this condition / has this attribute"
* Returns a Promise which is always resolved - either the question was created successfully or not
* There's an intermediate check whether the question's similar variation already exists
* The specific field that serves as a base for the question is chosen randomly from the config array
*/
QuestionGenerator.prototype.generateQuestionGuessAnimalName = function() {
	return new Promise((resolve, reject) => {
		// Randomly choose one variation of the question type
		var questionVariation = this.questionTypes.guessAnimalName[Math.floor(Math.random() * this.questionTypes.guessAnimalName.length)];

		// Set the scope for this document such that it's visible from all the Promises
		var primaryDocument = {};
		var primaryQuery = {};

		primaryQuery[questionVariation.fieldName] = { $exists: true, $ne: "" };

		// Choose a random document with a non-empty field
		this.collectionDriver.getRandomDocuments(this.sourceCollectionName, 1, primaryQuery).then((documents) => {
			var secondaryQuery = {};

			// This is the core document, serving as a basis for the question as well as the correct answer
			primaryDocument = documents[0];

			secondaryQuery.$and = [
				{ text: questionVariation.text.replace(":value", primaryDocument[questionVariation.fieldName]) },
				{ answer_object_id: primaryDocument._id }
			];

			// Check if the question exists already (based on its wording and answer)
			return this.collectionDriver.findDocument(this.targetCollectionName, secondaryQuery);
		}).then((document) => {
			var tertiaryQuery = {};

			// If the question's been already generated, stop the process at once
			if (document) return Promise.reject("The generated question already exists.");

			// Now choose the remaining wrong answers via documents whose field values differ from the primary one
			tertiaryQuery[questionVariation.fieldName] = { $exists: true, $ne: primaryDocument[questionVariation.fieldName] };
			return this.collectionDriver.getRandomDocuments(this.sourceCollectionName, this.answerCount - 1, tertiaryQuery);
		}).then((documents) => {
			var incorrectAnswers = [];

			for (let i = 0; i < documents.length; i++) {
				incorrectAnswers.push(documents[i].name);
			}

			// Create the question and save it immediately so it can be findable for duplicity check by subsequent question generations
			var newQuestion = [{
				text: questionVariation.text.replace(":value", primaryDocument[questionVariation.fieldName]),
				correct_answer: primaryDocument.name,
				incorrect_answers: incorrectAnswers,
				difficulty: 0,
				type: "guess_animal_text",
				answer_object_id: primaryDocument._id,
				picked_count: 0,
				answered_correctly_count: 0,
				flags: 0,
				enabled: true
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

/* 
* Generate a question based on a concept of "which attribute best suits this animal"
* Returns a Promise which is always resolved - either the question was created successfully or not
* There's an intermediate check whether the question's similar variation already exists
* The specific field that serves as a base for the question is chosen randomly from the config array
*/
QuestionGenerator.prototype.generateQuestionGuessAnimalAttribute = function() {
	return new Promise((resolve, reject) => {
		// Randomly choose one variation of the question type
		var questionVariation = this.questionTypes.guessAnimalAttribute[Math.floor(Math.random() * this.questionTypes.guessAnimalAttribute.length)];

		// Set the scope for this document such that it's visible from all the Promises
		var primaryDocument = {};
		var primaryQuery = {};

		primaryQuery[questionVariation.fieldName] = { $exists: true, $ne: "" };

		// Choose a random document with a non-empty field
		this.collectionDriver.getRandomDocuments(this.sourceCollectionName, 1, primaryQuery).then((documents) => {
			var secondaryQuery = {};

			// This is the core document, serving as a basis for the question as well as the correct answer
			primaryDocument = documents[0];

			secondaryQuery.$and = [
				{ text: questionVariation.text.replace(":value", primaryDocument.name) },
				{ answer_object_id: primaryDocument._id }
			];

			// Check if the question exists already (based on its wording and answer)
			return this.collectionDriver.findDocument(this.targetCollectionName, secondaryQuery);
		}).then((document) => {
			var tertiaryQuery = {};

			// If the question's been already generated, stop the process at once
			if (document) return Promise.reject("The generated question already exists.");

			// Now choose the remaining wrong answers via documents whose field values differ from the primary one
			tertiaryQuery[questionVariation.fieldName] = { $exists: true, $ne: primaryDocument[questionVariation.fieldName] };
			return this.collectionDriver.getRandomDocuments(this.sourceCollectionName, this.answerCount - 1, tertiaryQuery);
		}).then((documents) => {
			var incorrectAnswers = [];

			for (let i = 0; i < documents.length; i++) {
				incorrectAnswers.push(documents[i][questionVariation.fieldName]);
			}

			// Create the question and save it immediately so it can be findable for duplicity check by subsequent question generations
			var newQuestion = [{
				text: questionVariation.text.replace(":value", primaryDocument.name),
				correct_answer: primaryDocument[questionVariation.fieldName],
				incorrect_answers: incorrectAnswers,
				difficulty: 0,
				type: "guess_animal_attribute",
				answer_object_id: primaryDocument._id,
				picked_count: 0,
				answered_correctly_count: 0,
				flags: 0,
				enabled: true
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

/* 
* Generate a question based on a concept of "which animal is in the picture"
* Returns a Promise which is always resolved - either the question was created successfully or not
* There's an intermediate check whether the question's similar variation already exists
*/
QuestionGenerator.prototype.generateQuestionGuessAnimalImage = function() {
	return new Promise((resolve, reject) => {
		var questionType = config.questionTypes.guessAnimalImage;

		// Set the scope for this document such that it's visible from all the Promises
		var primaryDocument = {};
		var primaryQuery = {};

		// The incorrect answers are also here to be at disposal
		var incorrectAnswers = [];

		primaryQuery[questionType.fieldName] = { $exists: true, $ne: "" };

		// Choose a number of random documents with a non-empty image fields
		this.collectionDriver.getRandomDocuments(this.sourceCollectionName, this.answerCount, primaryQuery).then((documents) => {
			var secondaryQuery = {};

			// This is the core document, serving as a basis for the question as well as the correct answer
			primaryDocument = documents[0];

			// Set all the other documents as incorrect answers
			for (let i = 1; i < documents.length; i++) {
				incorrectAnswers.push(documents[i].name);
			}

			secondaryQuery.$and = [
				{ text: questionType.text },
				{ image: primaryDocument[questionType.fieldName] },
				{ answer_object_id: primaryDocument._id }
			];

			// Check if the question exists already (based on its text, image and answer)
			return this.collectionDriver.findDocument(this.targetCollectionName, secondaryQuery);
		}).then((document) => {
			// If the question's been already generated, stop the process at once
			if (document) return Promise.reject("The generated question already exists.");

			// Create the question and save it immediately so it can be findable for duplicity check by subsequent question generations
			var newQuestion = [{
				text: questionType.text,
				image: primaryDocument[questionType.fieldName],
				correct_answer: primaryDocument.name,
				incorrect_answers: incorrectAnswers,
				difficulty: 0,
				type: "guess_animal_image",
				answer_object_id: primaryDocument._id,
				picked_count: 0,
				answered_correctly_count: 0,
				flags: 0,
				enabled: true
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
