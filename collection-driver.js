const colors = require('colors');

/*
* Basic constructor.
*/
CollectionDriver = function(db) {
	this.db = db;
};

/*
* Returns a collection.
*/
CollectionDriver.prototype.getCollection = function(collectionName) {
	return new Promise((resolve, reject) => {
		this.db.collection(collectionName, function(error, collection) {
			if(error) reject(error);
			resolve(collection);
		});
	});
};

/*
* Inserts documents, supplied via the second argument, in the specified collection.
*/
CollectionDriver.prototype.insertDocuments = function(collectionName, documents) {
	return new Promise((resolve, reject) => {
		this.getCollection(collectionName).then(function(collection) {
			return collection.insertMany(documents);
		}).then(function(result) {
			resolve(result.insertedCount + ' new documents inserted into the "' + collectionName.cyan + '" collection.');
		}).catch(function(error) {
			reject(error);
		});
	});
};

/*
* Removes the whole collection with all its documents.
*/
CollectionDriver.prototype.truncateCollection = function(collectionName) {
	return new Promise((resolve, reject) => {
		this.getCollection(collectionName).then(function(collection) {
			return collection.remove();
		}).then(function(result) {
			resolve('Collection "' + collectionName.cyan + '" has been truncated.');
		}).catch(function(error) {
			reject(error);
		});
	});
};

/*
* Renames the collection's fields.
* The second argument is expected to be an object in the form of {'oldFiedd': 'newField', 'anotherOldField': 'anotherNewField', ...}
*/
CollectionDriver.prototype.renameFields = function(collectionName, fields) {
	return new Promise((resolve, reject) => {
		this.getCollection(collectionName).then(function(collection) {
			// Update multiple docs - without a selector or optional parameters
			return collection.updateMany({}, { $rename: fields }, null);
		}).then(function(result) {
	    	resolve('The following fields in the "' + collectionName.cyan + '" collection were renamed: ' + JSON.stringify(fields) + '.');
	    }).catch(function(error) {
	    	reject(error);
	    });
	});
};

/*
* Force-closes the underlying db connection
*/
CollectionDriver.prototype.closeDB = function() {
	this.db.close(true, function(error, result) {
		if(error) console.error(error);
		else console.log(result);
	});
};

// Export the class.
exports.CollectionDriver = CollectionDriver;
