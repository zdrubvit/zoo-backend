var config = {};

// Connection parameters for the MongoDB database
config.mongodb = {};
config.mongodb.host = "localhost";
config.mongodb.port = "27017";
config.mongodb.database = "zoo";
config.mongodb.collectionNames = {
	"adoptions": "adoptions",
	"classifications": "classifications",
	"events": "events",
	"lexicon": "lexicon",
	"locations": "locations",
	"questions": "questions"
}

// Opendata specifications, endpoints and resource identificators
config.opendata = {};
config.opendata.host = "http://opendata.praha.eu";
config.opendata.pathSearch = "api/action/datastore_search";
config.opendata.pathSearchSQL = "api/action/datastore_search_sql";
config.opendata.resources = {
	"lexicon": "75c57c6d-05fa-4a28-b340-81f7270a1ba1",
	"biotopes": "fdeb7466-3c2b-4cd7-8e7a-02bb4314b481",
	"biotopesRelations": "0101948d-bacc-42ac-97d2-803b08252057",
	"classifications": "90e66377-9d31-4852-8cfb-1981319ccb20",
	"food": "c650683e-a529-4ef2-9284-110521aa4bf9",
	"foodRelations": "e3cd5857-d62e-44f0-8414-17721808c62e",
	"locations": "05702365-3670-4e52-9b57-fae2ef3f6275",
	"locationsTypes": "898c46ec-952b-4584-aafa-cd6276274085",
	"continents": "fead1025-57df-44e9-a9f7-e2d856cdabb1",
	"continentsRelations": "6316e78d-d8d2-404a-8741-91cc1395c6fd",
	"events": "dec3e4fb-b624-4f55-80a0-4713d5800481",
	"adoptions": "968026b1-0f7c-4471-aa7c-a244574f2030"
};

// Info regarding the ZOO's own domain
config.zoo = {};
config.zoo.host = "https://zoopraha.cz/";

// Different types of quiz questions, always consisting of a document's field (the question's base) and a text (with a bindable placeholder)
config.questionTypes = {};
config.questionTypes.guessAnimalName = [
	{
		"fieldName": "class_name",
		"text": "Které z těchto zvířat patří do třídy \":value\"?"
	},
	{
		"fieldName": "order_name",
		"text": "Které z těchto zvířat patří do řádu \":value\"?"
	},
	{
		"fieldName": "food_detail",
		"text": "Víš, jaké zvíře se živí tímto druhem potravy: :value?"
	},
	{
		"fieldName": "biotopes_detail",
		"text": "Jedno z následujících zvířat se v přírodě vyskytuje v těchto oblastech: :value. Poznáš, které to je?"
	},
	{
		"fieldName": "latin_name",
		"text": "Latinský název \":value\" přísluší tomuto zvířeti:"
	}
];
config.questionTypes.guessAnimalAttribute = [
	{
		"fieldName": "class_name",
		"text": "Do které z těchto tříd patří \":value\"?"
	},
	{
		"fieldName": "order_name",
		"text": "Do kterého z těchto řádů patří \":value\"?"
	},
	{
		"fieldName": "food_detail",
		"text": "Víš, čím se živí :value?"
	},
	{
		"fieldName": "biotopes_detail",
		"text": ":value je doma v jakých životních prostředích?"
	},
	{
		"fieldName": "latin_name",
		"text": ":value se honosí tímto latinských názvem:"
	}
];
config.questionTypes.guessAnimalImage = {
	"fieldName": "image",
	"text": "Poznáš, jaké zvíře je na obrázku?"
}

// The arrays of mandatory columns that should be brought from Opendata tables
config.filterColumns = {};
config.filterColumns.adoptions = ["id", "nazev_cz", "cena", "k_prohlidce"];
config.filterColumns.classifications = ["a", "b", "c", "d", "e"];
config.filterColumns.events = ["start", "end", "summary", "description"];
config.filterColumns.lexicon = ["id", "title", "latin_title", "classes", "order", "description", "image_src", "continents", "spread_note", 
	"biotop", "biotopes_note", "food", "food_note", "proportions", "reproduction", "attractions", "projects_note", "breeding", "localities_title", "localities_url"];
config.filterColumns.locations = ["id", "title", "alias", "ordering", "gps_x", "gps_y", "description", "url"];

// The names of transformation methods that are applied to respective resources after they'd been imported
config.transformMethod = {};
config.transformMethod.classifications = "transformClassificationDocument";
config.transformMethod.events = "transformEventDocument";
config.transformMethod.lexicon = "transformLexiconDocument";
config.transformMethod.locations = "transformLocationDocument";

// Objects representing the renaming of mongodb fields in the form of {"oldField": "newField", "anotherOldField": "anotherNewField", ...}
config.fieldMapping = {};
config.fieldMapping.adoptions = {
	"id": "opendata_id",
	"nazev_cz": "name",
	"cena": "price",
	"k_prohlidce": "visit"
};
config.fieldMapping.classifications = {
	"a": "opendata_id",
	"b": "type",
	"c": "parent_id",
	"e": "slug"
};
config.fieldMapping.events = {
	"summary": "name"
};
config.fieldMapping.lexicon = {
	"id": "opendata_id",
	"title": "name",
	"latin_title": "latin_name",
	"image_src": "image",
	"food_note": "food_detail",
	"spread_note": "distribution",
	"biotop": "biotope",
	"biotopes_note": "biotopes_detail",
	"projects_note": "projects",
	"localities_title": "location",
	"localities_url": "location_url"
};
config.fieldMapping.locations = {
	"id": "opendata_id",
	"title": "name",
	"alias": "slug"
};

// The DB indexes, defined later using the official index specification
config.fieldIndexes = {};
config.fieldIndexes.adoptions = [{ "name": "text" }];
config.fieldIndexes.classifications = [{ "type": 1 }];
config.fieldIndexes.events = [
	{ "start": 1 },
	{ "end": 1 }
];
config.fieldIndexes.lexicon = [
	{ "name": "text" },
	{ "class_name": 1 },
	{ "order_name": 1 },
	{ "description": 1 },
	{ "continents": 1 },
	{ "distribution": 1 },
	{ "biotope": 1 },
	{ "food": 1 },
	{ "location":  1 }
];
config.fieldIndexes.locations = [];

// The attributes of a JSON serialization used in our API communication (coinciding with the collection field names)
config.serialization = {};
config.serialization.adoptions = ["opendata_id", "lexicon_id", "name", "price", "visit"];
config.serialization.biotopes = ["name", "count"];
config.serialization.classifications = ["opendata_id", "type", "parent_id", "name", "latin_name", "slug", "orders"];
config.serialization.continents = ["name", "count"];
config.serialization.events = ["start", "end", "duration", "description", "name"];
config.serialization.food = ["name", "count"];
config.serialization.lexicon = ["opendata_id", "name", "latin_name", "class_name", "class_latin_name", "order_name", "order_latin_name", "description", "image", "continents", "distribution", 
	"biotope", "biotopes_detail", "food", "food_detail", "proportions", "reproduction", "attractions", "projects", "breeding", "location", "location_url"];
config.serialization.locations = ["opendata_id", "description", "ordering", "url", "gps", "name", "slug"];
config.serialization.questions = ["text", "image", "correct_answer", "incorrect_answers", "difficulty", "type", "answer_object_id"];

// The allowed query parameters of certain API methods
config.allowedApiQuery = {};
config.allowedApiQuery.adoptions = ["name"];
config.allowedApiQuery.lexicon = ["name", "class_name", "order_name", "description", "continents", "distribution", "biotope", "food", "location"];

exports.config = config;
