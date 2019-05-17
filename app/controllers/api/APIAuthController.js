let sjcl = require('sjcl');
let APIController = require('./APIController');
let error = require('../../interfaces/error/error');

let User = require('../../models/User');

module.exports = function ErrorHTTPController() {
	APIController.call(this);

	this.authentication = function(data, callback) {
		if(typeof data.body == 'undefined') {
			let errorCode = 203;

			callback({
				httpCode: 404,
				contentType: 'application/json',
				content: JSON.stringify({'errorCode': errorCode, 'errorMessage': error[errorCode]})
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
					if(res.length == 0) {
						let errorCode = 201;

						callback({
							httpCode: 404,
							contentType: 'application/json',
							content: JSON.stringify({'errorCode': errorCode, 'errorMessage': error[errorCode]})
						});
					}
					else {
						/* Password hashing */
						let output = sjcl.hash.sha256.hash(data.body.user_password);
						data.body.user_password = sjcl.codec.hex.fromBits(output).toUpperCase();
						////////////////////

						if(res[0].data.user_password != data.body.user_password) {
							let errorCode = 202;

							callback({
								httpCode: 404,
								contentType: 'application/json',
								content: JSON.stringify({'errorCode': errorCode, 'errorMessage': error[errorCode]})
							});
						}
						else {
							callback({
								httpCode: 200,
								contentType: 'application/json',
								content: JSON.stringify({'test': 'testAuth'})
							});
						}
					}
				});
			}
		}
	};
};