function Cookie() {
	this.generateToken = function(length) {
		let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		var result = '';
		var i;
		
		for(i = 0; i < length; i++ ) {
			result += characters.charAt(Math.floor(Math.random() * characters.length));
		}
		
		return result;
	};
};

module.exports = new Cookie();