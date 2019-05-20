var controllerRelativePath = '../controllers';
var apiControllerRelativePath = '../controllers/api';

let route = {
	'/': {
		name: 'home',
		verbs: {
			GET: {
				controller: 'HomeController',
				action: 'index'
			}
		}
	},
	'/api/user/login': {
		name: 'login',
		verbs: {
			PUT: {
				controller: 'APIAuthController',
				action: 'authentication'
			}
		}
	},
	'/api/user/signin': {
		name: 'signin',
		verbs: {
			POST: {
				controller: 'APIAuthController',
				action: 'signin'
			}
		}
	},
	'/api/user/logout': {
		name: 'logout',
		verbs: {
			PUT: {
				controller: 'APIAuthController',
				action: 'logout'
			}
		}
	},
	'/api/user/session_status': {
		name: 'user_session_status',
		verbs: {
			GET: {
				controller: 'APIAuthController',
				action: 'sessionStatus'
			}
		}
	}
}

module.exports = function(page, method, data, callback) {
	var Controller;
	var controllerName;
	var action;

	if(typeof route[page] == 'undefined') {
		controllerName = 'ErrorHTTPController';
		action = 'e_404';
		data = [];
	}
	else if(typeof route[page].verbs[method] == 'undefined') {
		controllerName = 'ErrorHTTPController';
		action = 'e_404';
		data = [];
	}
	else {
		controllerName = route[page].verbs[method].controller;
		action = route[page].verbs[method].action;
	}

	if(controllerName.substr(0, 3) == 'API') {
		Controller = require(apiControllerRelativePath + '/' + controllerName);
	}
	else {
		Controller = require(controllerRelativePath + '/' + controllerName);
	}

	var controller = new Controller();

	controller[action](data, function(res) {
		callback({
			httpCode: res.httpCode,
			contentType: res.contentType,
			content: res.content,
			cookieData: res.cookieData
		});
	});
};