const colors = require("colors");

/*
* The driver takes care of database operations and wraps around MongoDB native methods
*/
CollectionDriver = function(db, logger) {
	this.db = db;
	this.logger = logger;
};

/*
* Returns a collection. It's non-existence is caught thanks to the strict mode.
*/
CollectionDriver.prototype.getCollection = function(collectionName, createNonExisting = true) {
	return new Promise((resolve, reject) => {
		this.db.collection(collectionName, {'strict': true}, (error, collection) => {
			if (error) {
				if (createNonExisting) {
					// Try to create the non-existing collection
					this.db.createCollection(collectionName, (error, collection) => {
						if (error) reject(error);
						else {
							this.logger.log("info", "A new collection " + collectionName.cyan + " has been created.");
							resolve(collection);
						}
					});
				} else reject(error);
			} else resolve(collection);
		});
	});
};

/*
* Searches the collection for a specified document
*/
CollectionDriver.prototype.findDocument = function(collectionName, query = {}) {
	return new Promise((resolve, reject) => {
		this.getCollection(collectionName, false).then((collection) => {
			// findOne method was deemed deprecated for a while but since then re-introduced due to the popular revolt
			return collection.findOne(query);
		}).then((document) => {
			resolve(document);
		}).catch((error) => {
			reject(error);
		});
	});
};

/*
* Searches the collection for documents with certain filters
*/
CollectionDriver.prototype.findAllDocuments = function(collectionName, query = {}, limit = 0, offset = 0) {
	return new Promise((resolve, reject) => {
		this.getCollection(collectionName, false).then((collection) => {
			// find method returns a cursor to iterate over
			return collection.find(query).limit(limit).skip(offset).toArray();
		}).then((documents) => {
			resolve(documents);
		}).catch((error) => {
			reject(error);
		});
	});
};

/*
* Inserts documents, supplied via the second argument, in the specified collection.
*/
CollectionDriver.prototype.insertDocuments = function(collectionName, documents) {
	return new Promise((resolve, reject) => {
		this.getCollection(collectionName).then((collection) => {
			return collection.insertMany(documents);
		}).then((result) => {
			resolve(result.insertedCount + " new documents inserted into the " + collectionName.cyan + " collection.");
		}).catch((error) => {
			reject(error);
		});
	});
};

/*
* Removes the whole collection with all its documents.
*/
CollectionDriver.prototype.truncateCollection = function(collectionName) {
	return new Promise((resolve, reject) => {
		this.getCollection(collectionName).then((collection) => {
			return collection.remove();
		}).then((result) => {
			resolve("Collection " + collectionName.cyan + " has been truncated.");
		}).catch((error) => {
			reject(error);
		});
	});
};

/*
* Renames the collection's fields.
* The second argument is expected to be an object in the form of {'oldField': 'newField', 'anotherOldField': 'anotherNewField', ...}
*/
CollectionDriver.prototype.renameFields = function(collectionName, fields) {
	return new Promise((resolve, reject) => {
		this.getCollection(collectionName, false).then((collection) => {
			// Update multiple docs - without a selector or optional parameters
			return collection.updateMany({}, { $rename: fields }, null);
		}).then((result) => {
	    	resolve("The following fields in the " + collectionName.cyan + " collection were renamed: " + JSON.stringify(fields) + ".");
	    }).catch((error) => {
	    	reject(error);
	    });
	});
};

/*
* Force-closes the underlying db connection
*/
CollectionDriver.prototype.closeDB = function() {
	this.db.close(true, (error, result) => {
		if (error) this.logger.log("error", error);
		else this.logger.log("info", result);
	});
};

// Export the class.
exports.CollectionDriver = CollectionDriver;
