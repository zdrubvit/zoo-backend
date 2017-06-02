# zoo-backend
A backend of the master thesis project

It consists of two main parts - importing the necessary open data (via the "import.js" script) and presenting an API for others to consume those data through a permanently running server (implemented in "server.js" script).

The backend stands on the shoulders of MongoDB and its native Node.js driver that is being wrapped around by a convenience class (found in "./modules/collection-driver.js"), which is used extensively throughout the application.

The logging tasks are handled by the Winston module, configured to log to the DB as well as to the console (the wrapper is located in "./modules/logger.js").

All the critical configuration options can be found in the "config.js" file which exports the root objects with all its properties, that represent various information about the Opendata domain, local database or resources (in different steps of their lifetime).

The "import.js" script utilizes an Importer class from "./modules/importer.js" that takes care of the individual steps during the whole process - downloading resources, transforming and linking them, inserting them to the DB. This class uses another one in turn, "./modules/transformer.js", which exposes some methods to modify the incoming documents.

The API server, living mainly in "server.js", provides the common tasks connected to every request/response lifecycle (parsing, error catching) and includes all of the other routes. The routes are located in "./routes" subfolder and there's one for every resource. Their specific functions, which can't be reused, are placed in each one of them, while the mutual parts have been placed inside the "./routes/middleware.js" file (things like request validation or JSON-API serialization / deseriaization).

One of the crucial pieces living in this repository is the "./modules/question-generator.js" class. It's able to generate quiz questions based on the animal data hidden in the lexicon collection. The basic structure of the questions is, again, saved in the config file - the three core types are easily extendable, using just the universal wording of a question, plus a field name with which it is connected. This generator is than utilized from within the "generate-questions.js" script, which handles the concurrent creation of quiz documents in a batch operation.

For the external modules and dependencies that appear in many of those scripts, please refer to the "package.json" file.
