let Model = require('./Model');
let databaseConfig = require('../config/config').database;

module.exports = function Banishment() {
	Model.call(this);

	this.table = 'Banishment';
	this.primaryKey = 'banishment_id';

	this.highestBanishment = function(ipAddress, callback) {
		let query = 'SELECT banishment_reason, banishment_end_date FROM ' + databaseConfig.schema + '.' + this.table +
			' WHERE banishment_ip_address = ? ORDER BY banishment_end_date DESC LIMIT 1';

		this.query(query, [ipAddress], function(res) {
			callback((res.length > 0) ? res[0] : undefined);
		});
	};
};