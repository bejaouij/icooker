let postgresDataAccess = require('../interfaces/database/dataAccess').postgresql;
let htmlHelper = require('../interfaces/html/htmlHelper');
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

	this.dataChecking = function(value, XSSSensitive, dataType) {
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
			return (postgresDataAccess.operators.indexOf(value) == -1) ? false : value;
			break;

			case 'logicStatment':
			return (postgresDataAccess.logicStatments.indexOf(value) == -1) ? false : value;
			break;
		}
	};

	this.find = function(id) {
		if((id = this.dataChecking(id, this.primaryKeyType)) != false) {
			postgresDataAccess.query = 'SELECT * FROM ' + databaseConfig.schema + '.' + this.table + ' WHERE ' + this.primaryKey + ' = ?';
			postgresDataAccess.queryBindings = [id];

			postgresDataAccess.exec(dataAccessFindClosure(this));
		}
	};

	this.where = function(column, operator, value, callback) {
		var isDataValid = true;

		if((column = this.dataChecking(column, true, 'string')) == false) {
			isDataValid = false;
		}

		if(isDataValid && (operator = this.dataChecking(operator, false, 'operator')) == false) {
			isDataValid = false;
		}

		if(isNaN(value)) {
			if((value = this.dataChecking(value, true, 'string')) == false) {
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