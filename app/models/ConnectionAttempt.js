let Model = require('./Model');

module.exports = function ConnectionAttempt() {
	Model.call(this);

	this.table = 'connection_attempt';
	this.primaryKey = 'connection_attempt_id';
};