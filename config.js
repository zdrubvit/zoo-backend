var config = {};

config.mongodb = {};
config.mongodb.host = 'localhost';
config.mongodb.port = '27017';
config.mongodb.database = 'zoo';

config.opendata = {};
config.opendata.host = 'http://opendata.praha.eu';
config.opendata.pathSearch = 'api/action/datastore_search';
config.opendata.pathSearchSQL = 'api/action/datastore_search_sql';
config.opendata.resources = {
	'lexicon': '4fc2aaff-3e7b-4d24-94d7-713a1f45074c',
	'biotopes': 'fdeb7466-3c2b-4cd7-8e7a-02bb4314b481',
	'biotopesRelations': '0101948d-bacc-42ac-97d2-803b08252057',
	'classes': '90e66377-9d31-4852-8cfb-1981319ccb20',
	'food': 'c650683e-a529-4ef2-9284-110521aa4bf9',
	'foodRelations': 'e3cd5857-d62e-44f0-8414-17721808c62e',
	'locations': '05702365-3670-4e52-9b57-fae2ef3f6275',
	'locationsTypes': '898c46ec-952b-4584-aafa-cd6276274085',
	'continents': 'fead1025-57df-44e9-a9f7-e2d856cdabb1',
	'continentsRelations': '6316e78d-d8d2-404a-8741-91cc1395c6fd'
};

exports.config = config;