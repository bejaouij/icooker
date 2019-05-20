var XHR = new XMLHttpRequest();

/*
 * void request(method: string, url: string, data: Object, successCallback: function [, failCallback: function])
 *
 * Make an asynchronous request.
 *
 * @params: - method: HTTP verb to use.
 *          - url: request target.
 *          - data: request JSON data.
 *          - successCallback: function to call on success.
 *          - failCallback: function to call on fail.
 * @pre: callback methods must accept at least one parameter.
 * @post: - lead to the success callback if the resource is found.
 *        - lead to the fail callback if something goes wrong or if the resource if not found.
 */
function request(method, url, data, successCallback = undefined, failCallback = undefined) {
	XHR.onload = function() {
		if(this.status != 404 || this.status != 403) {
			if(typeof successCallback != 'undefined') {
				successCallback(JSON.parse(this.response));
			}
		}
		else if(typeof failCallback != 'undefined') {
			failCallback(JSON.parse(this.response));
		}
	};

	if(typeof data == 'undefined' || data == null) {
		data = {};
	}

	XHR.open(method.toUpperCase(), url);
	XHR.setRequestHeader('Content-Type', 'application/json');
	XHR.send(JSON.stringify(data));
};