CollectionDriver = function(db){
	this.db = db;
};

CollectionDriver.prototype.getCollection = function(collectionName, callback){
	this.db.collection(collectionName, function(error, collection){
		if(error){
			callback(error);
		}
		else{
			callback(null, collection);
		}
	});
};

CollectionDriver.prototype.insertDocuments = function(collectionName, documents, callback){
	this.getCollection(collectionName, function(error, collection){
		if(error){
			callback(error);
		}
		else{
			collection.insertMany(documents, function(error, result){
				if(error){
					callback(error);
				}
				else{
					callback(null, 'heeyyyy inserted');
				}
			});
		}
	});
};

CollectionDriver.prototype.removeCollection = function(collectionName, callback){
	this.db.dropCollection(collectionName, function(error, result){
		if(error){
			callback(error);
		}
		else{
			callback(null, 'Collection "' + collectionName + '" removed.');
		}
	});
};

CollectionDriver.prototype.renameField = function(collectionName, fieldNameOld, fieldNameNew, callback){
	this.getCollection(collectionName, function(error, collection){
		if(error){
			console.log(error);
		}
		else{
			var renameObject = {};
			renameObject[fieldNameOld] = fieldNameNew;
			
			collection.updateMany(
				{}, 
			    { $rename: renameObject },
			    null,
			    function(error, result){
			    	if(error){
			    		console.log(error);
			    	}
			    	else{
			    		console.log('fieldname changed');
			    		console.log(result);
			    	}
			    }
    		);
		}
	});
};

exports.CollectionDriver = CollectionDriver;