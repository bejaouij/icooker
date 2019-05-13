let databaseConfig = require('../../config/config').database;
var Database = require('database-js2').Connection;

function PostgresDataAccess() {
	this.operators = [
		'<',
		'<=',
		'=',
		'!=',
		'>',
		'>=',
		'LIKE'
	];

	this.logicSatements = [
		'OR',
		'AND'
	];

	this.query = 'SELECT \'Hello World!\' \"dump\"';
	this.queryBindings = [];
	this.modulePerDriver = {
		'psql': 'database-js-postgres'
	};

	this.exec = function(callback) {
		(async () => {
		    let connection = new Database(
		    	this.modulePerDriver[databaseConfig.driver] + '://'
		    	+ databaseConfig.username + ':'
		    	+ databaseConfig.password + '@'
		    	+ databaseConfig.host + ':'
		    	+ databaseConfig.port + '/'
		    	+ databaseConfig.database
		    );
		    
		    try {
		        let statement = await connection.prepareStatement(this.query);
		        let res = await ((this.queryBindings.length > 0) ? statement.query( ...this.queryBindings) : statement.query());
		        callback(res);
		    } catch (error) {
		        callback(error);
		    } finally {
		        await connection.close();
		    }
		})();
	};
};

module.exports = {
	postgresql: new PostgresDataAccess()
};