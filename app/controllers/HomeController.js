let Controller = require('./Controller');

module.exports = function HomeController() {
	Controller.call(this);

	this.index = function(data, callback) {
		this.render('home.index', function(content) {
			callback({
				httpCode: 200,
				contentType: 'text/html',
				content: content
			});
		});
	};
};