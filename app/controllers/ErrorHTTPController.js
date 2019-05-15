let Controller = require('./Controller');

module.exports = function ErrorHTTPController() {
	Controller.call(this);

	this.e_404 = function(data, callback) {
		this.render('errors.404', function(content) {
			callback({
				httpCode: 404,
				contentType: 'text/html',
				content: content
			});
		});
	};
};