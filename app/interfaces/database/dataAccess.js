let databaseConfig = require('../../config/config').database;
var Database = require('database-js2').Connection;
let htmlHelper = require('../html/htmlHelper');

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

	this.dataChecking = function(value, XSSSensitive, dataType = 'string') {
		switch(dataType) {
			case 'integer':
			return isNaN(value) ? false : value;
			break;

			case 'string':
			value = value.replace('\'', '\'\'');

			if(XSSSensitive) {
				value = htmlHelper.castHTMLSpecialChars(value);
			}

			return value;
			break;

			case 'operator':
			return (this.operators.indexOf(value) == -1) ? false : value;
			break;

			case 'logicStatment':
			return (this.logicStatments.indexOf(value) == -1) ? false : value;
			break;
		}
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