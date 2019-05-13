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

	this.data = []; // Store the retrieved visible data.

	/*
	 * void find(id: mixed [, callback: function])
	 *
	 * Retrieve a specific record in the database from its id and store its data in the current model object.
	 *
	 * @params: - id: identifier of the record.
	 *          - callback: function to call at the end of the process with the retrieved object.
	 * @pre: - id must be consistent with the model primary key type.
	 *       - callback method must accept at least one parameter.
	 * @post: - lead an mpty array if the record does not exist.
	 *        - lead a 102 error code if the id has a wrong type.
	 *        - lead the parsed record if it exists;
	 */
	this.find = function(id, callback = undefined) {
		initialId = id; // Useful to keep the first "version" of the identifier. Checking methods can alter it.

		if((id = postgresDataAccess.dataChecking(id, this.primaryKeyType, this.primaryKeyType)) != false) {
			postgresDataAccess.query = 'SELECT * FROM ' + databaseConfig.schema + '.' + this.table + ' WHERE ' + this.primaryKey + ' = ?';
			postgresDataAccess.queryBindings = [id];

			// Compulsory to pass the current model object inside the query execution callback function
			function closureCallback(model) {
				return function(res) {
					for(var column in res[0]) {
						if(model.hidden.indexOf(column) == -1) {
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
		} else {
			if(typeof callback != 'undefined') {
				let code = 102;

				callback({
					ERROR_CODE: code,
					ERROR_MESSAGE: errorCode[code],
					RELATED_OBJECT: initialId
				});
			}
		}
	};

	/*
	 * void find(column: string, operator: string, value: mixed, callback: function)
	 *
	 * Retrieve all records of the related table in the database which have the specified condition.
	 *
	 * @params: - column: condition related column.
	 *          - operator: conditional operator.
	 *          - value: condition related value.
	 *          - callback: function to call at the end of the process with the retrieved objects
	 * @pre: - column must be a valid string.
	 *       - operator must be allowed by DataAccess prototype.
	 *       - value: must be valid.
	 *       - callback method must accept at least one parameter.
	 * @post: - lead an mpty array if no records exist with the specified condition.
	 *        - lead a 101 error code if the query is not valid.
	 *        - lead the parsed records if they exist.
	 */
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

			let model = this;

			postgresDataAccess.exec(function(res) {
				var models = [];

				res.forEach(function(row) {
					models.push(new model.constructor);

					for(var column in row) {
						if(model.hidden.indexOf(column) == -1) {
							models[models.length - 1].data[column] = row[column];
						}
					}
				});

				callback(models);
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

	/*
	 * void all(callback: function)
	 *
	 * Retrieve all records of the related table in the database.
	 *
	 * @params: callback: function to call at the end of the process with the retrieved objects
	 * @pre: - model related table must exist in the database.
	 *       - callback method must accept at least one parameter.
	 * @post: - lead an mpty array if no records exist for the related table.
	 *        - throw error if the table does not exist in the database.
	 *        - lead the parsed records if they exist.
	 */
	this.all = function(callback) {
		postgresDataAccess.query = 'SELECT * FROM ' + databaseConfig.schema + '.' + this.table;

		let model = this;

		postgresDataAccess.exec(function(res) {
			var models = [];

			res.forEach(function(row) {
				models.push(new model.constructor);

				for(var column in row) {
					if(model.hidden.indexOf(column) == -1) {
						models[models.length - 1].data[column] = row[column];
					}
				}
			});

			callback(models);
		});
	}
};