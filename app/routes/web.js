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
	}
}

module.exports = function(page, method, params, body, callback) {
	var Controller;
	var controllerName;
	var action;
	var data = {
		params: params,
		body: body
	}

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
			content: res.content
		});
	});
};