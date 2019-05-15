var ejs = require('ejs');

module.exports = function Controller() {
	this.viewsRootPath = 'public/views';
	
	this.render = function(viewName, callback) {
		viewName = viewName.replace('\.', '/');
		viewName += '.ejs';

		ejs.renderFile((this.viewsRootPath + '/' + viewName), function(error, content) {
			if(error != null) {
				console.log(error);
			}

			callback(content);
		});
	};
};