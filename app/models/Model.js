let postgresDataAccess = require('../interfaces/database/dataAccess').postgresql;
let htmlHelper = require('../interfaces/html/htmlHelper');
let databaseConfig = require('../config/config').database;

function dataAccessExecClosure(model) {
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
	]

	this.dataChecking = function(value, XSSSensitive) {
		switch(this.primaryKeyType) {
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
		}
	};
};