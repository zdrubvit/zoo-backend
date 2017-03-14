/*
* Basic constructor.
*/
CollectionDriver = function(db){
	this.db = db;
};

/*
* Returns a collection.
*/
CollectionDriver.prototype.getCollection = function(collectionName, callback){
	this.db.collection(collectionName, function(error, collection){
		if(error){
			callback(error.message);
		}
		else{
			callback(null, collection);
		}
	});
};

/*
* Inserts documents, supplied via the second argument, in the specified collection.
*/
CollectionDriver.prototype.insertDocuments = function(collectionName, documents, callback){
	this.getCollection(collectionName, function(error, collection){
		if(error){
			callback(error);
		}
		else{
			collection.insertMany(documents, function(error, result){
				if(error){
					callback(error.message);
				}
				else{
					callback(null, result.insertedCount + ' new documents inserted into the ' + collectionName + ' collection.');
				}
			});
		}
	});
};

/*
* Removes the whole collection with all its documents.
*/
CollectionDriver.prototype.removeCollection = function(collectionName, callback){
	this.db.dropCollection(collectionName, function(error, result){
		if(error){
			callback(error.message);
		}
		else{
			callback(null, 'Collection "' + collectionName + '" removed.');
		}
	});
};

/*
* Renames the collection fields.
* The second argument is expected to be an object in the form of {'oldFiedd': 'newField', 'anotherOldFiedd': 'anotherNewField', ...}
*/
CollectionDriver.prototype.renameFields = function(collectionName, fields, callback){
	this.getCollection(collectionName, function(error, collection){
		if(error){
			callback(error);
		}
		else{
			// Update multiple docs - without a selector or optional parameters
			collection.updateMany(
				{}, 
			    { $rename: fields },
			    null,
			    function(error, result){
			    	if(error){
			    		callback(error.message);
			    	}
			    	else{
			    		callback(null, 'The following fields were renamed: ' + JSON.stringify(fields) + '.');
			    	}
			    }
    		);
		}
	});
};

// Export the class.
exports.CollectionDriver = CollectionDriver;