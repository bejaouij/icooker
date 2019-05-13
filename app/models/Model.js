let postgresDataAccess = require('../interfaces/database/dataAccess').postgresql;
let databaseConfig = require('../config/config').database;
let errorCode = require('../interfaces/error/error');

function dataAccessFindClosure(model) {
	return function(res) {
		for(var columnName in res) {
			if(res[columnName] in model.hidden) {
				res.splice(res.indexOf(columnName), 1);
			}
		}

		model.data = res[0];
	}
}

module.exports = function Model() {
	this.table = 'model';
	this.primaryKey = 'id';
	this.primaryKeyType = 'integer';
	this.hidden = [
		'password'
	];

	this.data = [];

	this.find = function(id, callback = undefined) {
		if((id = postgresDataAccess.dataChecking(id, this.primaryKeyType, this.primaryKeyType)) != false) {
			postgresDataAccess.query = 'SELECT * FROM ' + databaseConfig.schema + '.' + this.table + ' WHERE ' + this.primaryKey + ' = ?';
			postgresDataAccess.queryBindings = [id];

			// Compulsory to pass the current model object inside the query execution callback function
			function closureCallback(model) {
				return function(res) {
					for(var column in res[0]) {
						if(!(column in model.data)) {
							model.data[column] = res[0][column];
						}
					};

					if(typeof callback != 'undefined') {
						callback(model);
					}
				}
			}
			////////////////////

			postgresDataAccess.exec(closureCallback(this));
		}
	};

	this.where = function(column, operator, value, callback) {
		var isDataValid = true;

		if((column = postgresDataAccess.dataChecking(column, true, 'string')) == false) {
			isDataValid = false;
		}

		if(isDataValid && (operator = postgresDataAccess.dataChecking(operator, false, 'operator')) == false) {
			isDataValid = false;
		}

		if(isNaN(value)) {
			if((value = postgresDataAccess.dataChecking(value, true, 'string')) == false) {
				isDataValid = false;
			}
		}

		if(isDataValid) {
			postgresDataAccess.query = 'SELECT * FROM ' + databaseConfig.schema + '.' + this.table + ' WHERE ' + column + ' ' + operator + ' ?';
			postgresDataAccess.queryBindings = [value];

			postgresDataAccess.exec(function(res) {
				callback(res);
			});
		}
		else {
			let code = 101;

			callback({
				ERROR_CODE: code,
				ERROR_MESSAGE: errorCode[code],
				RELATED_OBJECT: 'SELECT * FROM ' + databaseConfig.schema + '.' + this.table + ' WHERE ' + column + ' ' + operator + ' \'' + value + '\''
			});
		}
	}

	this.all = function(callback) {
		postgresDataAccess.query = 'SELECT * FROM ' + databaseConfig.schema + '.' + this.table;

		postgresDataAccess.exec(function(res) {
			callback(res);
		});
	}
};