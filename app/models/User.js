let Model = require('./Model');

module.exports = function User() {
	Model.call(this);

	this.table = 'user';
	this.primaryKey = 'user_id';
};