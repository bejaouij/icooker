let sjcl = require('sjcl');
let APIController = require('./APIController');
let error = require('../../interfaces/error/error');
let cookieHelper = require('../../interfaces/cookie/cookie');

let User = require('../../models/User');
let ConnectionAttempt = require('../../models/ConnectionAttempt');
let Banishment = require('../../models/Banishment');

module.exports = function ErrorHTTPController() {
	APIController.call(this);

	/*
	 * Try to log the client and create a session cookie on success to keep it open.
	 *
	 * @http-response: - 404 if the client is already connected or unable to connect.
	 *                 - 200 if the client has been logged.
	 */
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
						'humanReadableFeedback': 'Your account has been suspended until ' + res.data.banishment_end_date + ' for the following reason: ' + res.data.banishment_reason
					})
				});
			}
			else {
				/* Check the credentials and then record the connection attemp and then */
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

						user.where('user_email', '=', data.body.user_email.toLowerCase(), function(res) {
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
								user = res[0];
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
										/* Store the user connection session token */
										user.data.user_session_token = cookieHelper.generateToken(32);

										user.save(function(res) {
											callback({
												httpCode: 200,
												contentType: 'application/json',
												content: JSON.stringify({
													'data': {
														'user': {
															'user_nickname': user.data['user_nickname']
														}
													},
													'actions': {
														'logout': '/api/user/logout',
														'profile': '/profile'
													}
												}),
												cookieData: { 'icooker-token': user.data.user_session_token }
											});
										});
										////////////////////
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

	/*
	 * Register the client and open its session.
	 *
	 * @http-response: - 404 if the data are invalid.
	 *                 - 403 if the address email is already taken.
	 *                 - 200 if the client has been properly registered.
	 */
	this.signin = function(data, callback) {
		data.body = JSON.parse(data.body);

		var responseContent = {
			erroredFieldsId: []
		};

		let expectedFields = [
			'signin_user_email',
			'signin_user_password',
			'signin_user_password_confirmation',
			'signin_user_nickname'
		];

		/* Check the data */
		var isDataValid = true;

		expectedFields.forEach(function(element) {
			if(typeof data.body[element] == undefined || data.body[element] == '') {
				isDataValid = false;
				responseContent.erroredFieldsId.push(field);
			}
		});

		if(responseContent.erroredFieldsId.indexOf('signin_user_password') == -1 && data.body.signin_user_password.length < 6) {
			isDataValid = false;
			responseContent.erroredFieldsId.push('signin_user_password');
		}
		
		if(responseContent.erroredFieldsId.indexOf('signin_user_password_confirmation') == -1 && data.body.signin_user_password_confirmation != data['signin_user_password']) {
			isDataValid = false;
			responseContent.erroredFieldsId.push('signin_user_password_confirmation');
		}
		/********************/

		/* Check if a user with the same email address already exists */
		var user = new User();

		user.where('user_email', '=', data.body.signin_user_email, function(res) {
			if(res.length > 0) {
				responseContent.erroredFieldsId.push('signin_user_email');

				callback({
					httpCode: 403,
					contentType: 'application/json',
					content: JSON.stringify(erroredFieldsId)
				});
			}
			else {
				user.data.user_email = data.body.signin_user_email;

				let output = sjcl.hash.sha256.hash(data.body.signin_user_password);
				user.data.user_password = sjcl.codec.hex.fromBits(output).toUpperCase();
				user.data.user_nickname = data.body.signin_nickname;
				user.data.user_session_token = cookieHelper.generateToken(32);

				user.save(function(res) {
					callback({
						httpCode: 200,
						contentType: 'application/json',
						content: JSON.stringify({
							'data': {
								'user': {
									'user_nickname': user.data.user_nickname
								}
							}
						}),
						cookieData: { 'icooker-token': user.data.user_session_token }
					});
				});
			}
		});
		/********************/
	}

	/*
	 * Logout the client by removing its cookie 
	 *
	 * @http-response: - 404 if the client is already disconnected or if the cookie is not valid.
	 *                 - 200 if the client has been successfully logged out.
	 */
	this.logout = function(data, callback) {
		if(typeof data.cookieData == 'undefined' || data.cookieData == null) {
			callback({
				httpCode: 404,
				contentType: 'application/json',
				content: JSON.stringify({
					'humanReadableFeedback': 'You are already logged out.'
				})
			});
		} else {
			var user = new User();
			user.where('user_session_token', '=', data.cookieData, function(res) {
				if(res.length == 0) {
					callback( {
						httpCode: 200,
						contentType: 'application/json',
						content: JSON.stringify({
							'humanReadableFeedback': 'You are already logged out.'
						})
					});
				}
				else {
					res[0].data.user_session_token = null;

					res[0].save(function(res) {
						callback({
							httpCode: 200,
							contentType: 'application/json',
							content: JSON.stringify({
								'session_status': true,
								'actions': {
									'login': '/api/user/login',
									'signin': '/api/user/signin'
								}
							})
						});
					});
				}
			});
		}
	}

	/*
	 * Inform client session status by its cookie.
	 * 
	 * @http-response: 200 in all cases.
	 */
	this.sessionStatus = function(data, callback) {
		if(typeof data.cookieData == 'undefined' || data.cookieData == null) {
			callback({
				httpCode: 200,
				contentType: 'application/json',
				content: JSON.stringify({
					'session_status': false,
					'actions': {
						'login': '/api/user/login',
						'signin': '/api/user/signin'
					}
				})
			});
		} else {
			var user = new User();
			user.where('user_session_token', '=', data.cookieData, function(res) {
				if(res.length == 0) {
					callback( {
						httpCode: 200,
						contentType: 'application/json',
						content: JSON.stringify({
							'session_status': false,
							'actions': {
								'login': '/api/user/login',
								'signin': '/api/user/signin'
							}
						})
					});
				}
				else {
					callback({
						httpCode: 200,
						contentType: 'application/json',
						content: JSON.stringify({
							'session_status': true,
							'data': {
								'user': {
									'user_nickname': user.data['user_nickname']
								}
							},
							'actions': {
								'logout': '/api/user/logout',
								'profile': '/profile'
							}
						})
					});
				}
			});
		}
	}
};