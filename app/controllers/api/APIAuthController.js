let sjcl = require('sjcl');
let APIController = require('./APIController');
let error = require('../../interfaces/error/error');

let User = require('../../models/User');
let ConnectionAttempt = require('../../models/ConnectionAttempt');
let Banishment = require('../../models/Banishment');

module.exports = function ErrorHTTPController() {
	APIController.call(this);

	this.authentication = function(data, callback) {
		/* Check whether the client IP address is banished */
		var banishment = new Banishment();
		banishment.highestBanishment(data.ipAddress, function(res) {
			if(typeof res != 'undefined' && new Date(res.data.banishment_end_date) > new Date()) {
				let errorCode = 204;

				callback({
					httpCode: 404,
					contentType: 'application/json',
					content: JSON.stringify({
						'errorCode': errorCode,
						'errorMessage': error[errorCode],
						'humanReadableFeedback': 'Your account has been suspended until ' + banishment.data.banishment_end_date + ' for the following reason: ' + banishment.data.banishment_reason
					})
				});
			}
			else {
				/* Check the credentials and then record the connection attemp and then  */
				if(typeof data.body == 'undefined') {
					let errorCode = 201;

					connectionAttempt.save(function(res) {
						callback({
							httpCode: 404,
							contentType: 'application/json',
							content: JSON.stringify({'errorCode': errorCode, 'errorMessage': error[errorCode]})
						});
					});
				}
				else {
					if(typeof data.body != 'object') {
						data.body = JSON.parse(data.body);
					}

					if(typeof data.body.user_email == 'undefined' || typeof data.body.user_password == 'undefined') {
						let errorCode = 202;

						callback({
							httpCode: 404,
							contentType: 'application/json',
							content: JSON.stringify({'errorCode': errorCode, 'errorMessage': error[errorCode]})
						});
					}
					else {
						var user = new User();

						user.where('user_email', '=', data.body.user_email, function(res) {
							var connectionAttempt = new ConnectionAttempt();
							connectionAttempt.data.connection_attempt_ip_address = data.ipAddress;

							if(res.length == 0) {
								let errorCode = 201;

								connectionAttempt.save(function(res) {
									callback({
										httpCode: 404,
										contentType: 'application/json',
										content: JSON.stringify({'errorCode': errorCode, 'errorMessage': error[errorCode]})
									});
								});
							}
							else {
								/* Password hashing */
								let output = sjcl.hash.sha256.hash(data.body.user_password);
								data.body.user_password = sjcl.codec.hex.fromBits(output).toUpperCase();
								////////////////////

								if(res[0].data.user_password != data.body.user_password) {
									let errorCode = 202;

									connectionAttempt.save(function(res) {
										callback({
											httpCode: 404,
											contentType: 'application/json',
											content: JSON.stringify({'errorCode': errorCode, 'errorMessage': error[errorCode]})
										});
									});
								}
								else {
									connectionAttempt.data.connection_attempt_success = true;

									connectionAttempt.save(function(res) {
										callback({
											httpCode: 200,
											contentType: 'application/json',
											content: JSON.stringify({'test': 'testAuth'})
										});
									});
								}
							}
						});
					}
				};
			}
			////////////////////
		})
		////////////////////
	};
};