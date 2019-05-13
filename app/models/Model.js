let postgresDataAccess = require('../interfaces/database/dataAccess').postgresql;
let databaseConfig = require('../config/config').database;

module.exports = function Model() {
	this.table = 'model';
	this.primaryKey = 'id';
	this.primaryKeyType = 'integer';
	this.hidden = [
		'password'
	]
};