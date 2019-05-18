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
	this.XSSSensitive = []; // Fields to protect against XSS attacks.

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

	/*
	 * void checkData(callback: function)
	 *
	 * Inform whether the current object data are valid and formate them.
	 *
	 * @params: callback: function to call at the end of the process with the checked object.
	 * @pre: callback method must accept at least one parameter.
	 * @post: - lead to a false value is data are not valid.
	 *        - lead to formatted object if these data are valid.
	 */
	this.checkData = function(callback) {
		let initialData = this.data; // Useful to keep the first "version" of the data. Checking methods can alter them.
		var dataValid = true;

		var i = 0;

		while(dataValid && i < this.data.length) {
			let isXSSSensitive = this.XSSSensitive.indexOf(this.data[i]) != -1

			if((this.data[i] = postgresDataAccess.dataChecking(this.data[i], isXSSSensitive)) == false) {
				dataValid = false;
			}

			i++;
		}

		callback((!dataValid) ? false : this);
	}

	/*
	 * void insert([callback: function])
	 *
	 * Insert the current object data in the database.
	 *
	 * @params: callback: function to call at the end of the process with the inserted object
	 * @pre: callback method must accept at least one parameter.
	 * @post: - create a new record.
	 *        - lead to a 103 error code if data are not valid.
	 */
	this.insert = function(callback = undefined) {
		let currentModel = this; // Useful to call the current object inside a closure.
		let initialData = this.data;

		this.checkData(function(res) {
			if(!res) {
				if(typeof callback != 'undefined') {
					let code = 103;

					callback({
						ERROR_CODE: code,
						ERROR_MESSAGE: errorCode[code],
						RELATED_OBJECT: initialData
					});
				}
			}
			else {
				var query = 'INSERT INTO ' + databaseConfig.schema + '.' + res.table;
				var sqlColumns = '(';
				var sqlValues = 'VALUES(';

				for(var column in res.data) {
					if(typeof(res.data[column]) != 'undefined' && res.data[column] != null) {
						sqlColumns += column + ',';
						sqlValues += '\'' + res.data[column] + '\',';
					}
					else {
						query += column + ' = NULL,';
					}
				}

				sqlColumns = sqlColumns.substring(0, sqlColumns.length - 1) + ')';
				sqlValues = sqlValues.substring(0, sqlValues.length - 1) + ')';

				query += sqlColumns + ' ' + sqlValues;
				query += ' RETURNING ' + res.primaryKey;

				postgresDataAccess.query = query;
				postgresDataAccess.queryBindings = [];
				postgresDataAccess.exec(function(res) {
					if(res.length > 0) {
						if(typeof res[0][currentModel.primaryKey] != 'undefined') {
							currentModel.data[currentModel.primaryKey] = res[0][currentModel.primaryKey];
						}
					}

					callback(currentModel);
				});
			}
		});
	};

	/*
	 * void update([callback: function])
	 *
	 * Update the current object data in the database.
	 *
	 * @params: callback: function to call at the end of the process with the updated object
	 * @pre: callback method must accept at least one parameter.
	 * @post: - update related record.
	 *        - lead to a 103 error code if data are not valid.
	 */
	this.update = function(callback = undefined) {
		let currentModel = this; // Useful to call the current object inside a closure.

		let initialData = this.data;

		this.checkData(function(res) {
			if(!res) {
				if(typeof callback != 'undefined') {
					let code = 103;

					callback({
						ERROR_CODE: code,
						ERROR_MESSAGE: errorCode[code],
						RELATED_OBJECT: initialData
					});
				}
			}
			else {
				var query = 'UPDATE ' + databaseConfig.schema + '.' + res.table + ' SET ';
				var queryBindings = [];

				for(var column in res.data) {
					if(typeof(res.data[column]) != 'undefined' && res.data[column] != null) {
						query += column + ' = ?,';
						queryBindings.push(res.data[column]);
					}
					else {
						query += column + ' = NULL,';
					}
				}

				query = query.substring(0, query.length - 1);

				query += ' ';
				query += ' WHERE ' + res.primaryKey + ' = ?';
				queryBindings.push(res.data[res.primaryKey]);

				postgresDataAccess.query = query;
				postgresDataAccess.queryBindings = queryBindings;
				postgresDataAccess.exec(function(res) {
					callback(currentModel);
				});
			}
		});
	};

	/*
	 * void save([callback: function])
	 *
	 * Save the current object data in the database.
	 *
	 * @params: callback: function to call at the end of the process with the saved object
	 * @pre: - callback method must accept at least one parameter.
	 *       - model data must be valid.
	 * @post: - if the identifier is not defined or does not exist in the database, create a new record.
	 *        - if the identifer exists, update its record.
	 *        - lead to a 103 error code if data are not valid.
	 *        - throw error if the table does not exist in the database.
	 */
	this.save = function(callback = undefined) {
		let currentModel = this; // Useful to call the current object inside a closure.

		/* Case where object record does not exist in the database */
		if(typeof this.data[this.primaryKey] == 'undefined') {
			this.insert(function(res) {
				if(typeof res.data == 'undefined') {
					callback(res);
				}
				else {
					callback(currentModel);
				}
			});
		}
		////////////////////
		else {
			storedModel = new this.constructor;
			storedModel.find(this.data[this.primaryKey], function(res) {
				/* Case where object record does not exist in the database */
				if(typeof res.data[res.primaryKey] == 'undefined') {
					currentModel.insert(function(res) {
						if(typeof res.data == 'undefined') {
							callback(res);
						}
						else {
							callback(currentModel);
						}
					});
				}
				////////////////////
				else {
					currentModel.update(function(res) {
						if(typeof res.data == 'undefined') {
							callback(res);
						}
						else {
							callback(currentModel);
						}
					});
				}
			});
		}
	};

	/*
	 * void delete([callback: function])
	 *
	 * Delete the current object data from the database.
	 *
	 * @params: callback: function to call at the end of the process with the saved object
	 * @pre: - callback method must accept at least one parameter.
	 *       - model identifier must be informed.
	 * @post: - if the identifier is not defined lead to a 104 error code.
	 *        - if the identifier is defined and exist in the database, delete the corresponding record and lead to a true value.
	 *        - if the identifier is defined but does not exist in the database, lead to a false value.
	 */
	this.delete = function(callback = 'undefined') {
		if(typeof this.data[this.primaryKey] == 'undefined') {
			let code = 104;

			callback({
				ERROR_CODE: code,
				ERROR_MESSAGE: errorCode[code],
				RELATED_OBJECT: this.primaryKey + ': ' + this.primaryKeyType + ' -> ' + this.data[this.primaryKey]
			});
		}
		else {
			postgresDataAccess.query = 'DELETE FROM ' + databaseConfig.schema + ' . ' + this.table
				+ ' WHERE ' + this.primaryKey + ' = ? RETURNING ' + this.primaryKey;
			postgresDataAccess.queryBindings = [this.data[this.primaryKey]];

			postgresDataAccess.exec(function(res) {
				callback(res.length > 0);
			});
		}
	}

	/*
	 * void query(query: string, queryBindings: Array, callback: function)
	 *
	 * Execute a query in te database.
	 *
	 * @params: - query: query to execute.
	 *          - queryBindings: query bindings.
	 *          - callback: function to call at the end of the process with the saved object.
	 * @pre: - callback method must accept at least one parameter.
	 * @post: - if no record is found, return an empty array.
	 *        - if one record is found, return the parsed object.
	 *        - if more than one record are found, return a parsed objects array.
	 */
	this.query = function(query, queryBindings, callback) {
		let currentModel = this; // Useful to call the current object inside a closure.
		postgresDataAccess.query = query;
		postgresDataAccess.queryBindings = queryBindings;

		postgresDataAccess.exec(function(res) {
			currentModel.dataToObject(res, function(res) {
				callback(res);
			});
		});
	};

	/*
	 * void dataToObject(data: (Array | Object), callback: function)
	 *
	 * Parsed the data into an an object or an object collection.
	 *
	 * @params: - data: data to parse.
	 *          - callback: function to call at the end of the process with the saved object.
	 * @pre: - callback method must accept at least one parameter.
	 * @post: - if the data are an object, return a parsed object model.
	 *        - if the data are an array, return a parsed object model array.
	 */
	this.dataToObject = function(data, callback) {
		if(typeof data == 'Object') {
			for(var column in data) {
				if(this.hidden.indexOf(column) != -1) {
					this.data[column] = data[column];
				}
			}

			callback(this);
		}
		else {
			let models = [];
			let currentModel = this; // Useful to call the current object inside a closure.
			var i = 0;

			for(i = 0; i < data.length; i++) {
				models.push(new currentModel.constructor);

				for(var column in data[i]) {
					/* If the current column is not declared as hidden */
					if(currentModel.hidden.indexOf(column) == -1) {
						models[i].data[column] = data[i][column];
					}
					////////////////////
				}
			}

			callback(models);
		}
	};
};