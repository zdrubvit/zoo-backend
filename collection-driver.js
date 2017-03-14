/*
* Basic constructor.
*/
CollectionDriver = function(db){
	this.db = db;
};

/*
* Returns a collection.
*/
CollectionDriver.prototype.getCollection = function(collectionName){
	return new Promise((resolve, reject) => {
		this.db.collection(collectionName, function(error, collection){
			if(error) reject(error);
			resolve(collection);
		});
	});
};

/*
* Inserts documents, supplied via the second argument, in the specified collection.
*/
CollectionDriver.prototype.insertDocuments = function(collectionName, documents){
	return new Promise((resolve, reject) => {
		this.getCollection(collectionName).then(function(collection){
			return collection.insertMany(documents);
		}).then(function(result){
			resolve(result.insertedCount + ' new documents inserted into the "' + collectionName + '" collection.');
		}).catch(function(error){
			reject(error);
		});
	});
};

/*
* Removes the whole collection with all its documents.
*/
CollectionDriver.prototype.truncateCollection = function(collectionName){
	return new Promise((resolve, reject) => {
		this.getCollection(collectionName).then(function(collection){
			return collection.remove();
		}).then(function(result){
			resolve('Collection "' + collectionName + '" has been truncated.');
		}).catch(function(error){
			reject(error);
		});
	});
};

/*
* Renames the collection fields.
* The second argument is expected to be an object in the form of {'oldFiedd': 'newField', 'anotherOldFiedd': 'anotherNewField', ...}
*/
CollectionDriver.prototype.renameFields = function(collectionName, fields){
	return new Promise((resolve, reject) => {
		this.getCollection(collectionName).then(function(collection){
			// Update multiple docs - without a selector or optional parameters
			return collection.updateMany({}, { $rename: fields }, null);
		}).then(function(result){
	    	resolve('The following fields in the "' + collectionName + '" collection were renamed: ' + JSON.stringify(fields) + '.');
	    }).catch(function(error){
	    	reject(error);
	    });
	});
};

// Export the class.
exports.CollectionDriver = CollectionDriver;