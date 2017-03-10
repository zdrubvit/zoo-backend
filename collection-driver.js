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

};

exports.CollectionDriver = CollectionDriver;