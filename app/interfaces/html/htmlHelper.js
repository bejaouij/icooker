function HtmlHelper() {
	this.specialChars = {
		'&': '&amp',
		'"': '&quot',
		'\'': '&#39',
		'<': '&lt',
		'>': '&gt',
	};

	this.castHTMLSpecialChars = function castHTMLSpecialChars(value) {
		for(var char in this.specialChars) {
			value = value.replace(char, this.specialChars[char]);
		}

		return value;
	};
}

module.exports = new HtmlHelper();