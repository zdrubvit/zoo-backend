# zoo-backend
A backend part of the master thesis project

It consists of two main parts - importing the necessary open data (via the import.js script) and presenting an API for others to consume those data through a permanently running server (implemented in server.js script).

The backend stands on the shoulders of MongoDB and its native Node.js driver that is being wrapped around by a convenience class (found in ./modules/collection-driver.js), which is used extensively throughout the application.

The logging tasks are handled by the Winston module, configured to log to the DB as well as to the console (the wrapper is located in ./modules/logger.js).
