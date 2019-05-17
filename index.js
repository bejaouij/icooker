var http = require('http');
var url = require('url');
var querystring = require('querystring');
let routing = require('./app/routes/web');

var server = http.createServer(function(req, res) {
	let page = url.parse(req.url).pathname;
	let params = querystring.parse(url.parse(req.url).query);
	let body = '';

    req.on('data', function(chunk) {
        body += chunk.toString();
    });

    req.on('end', function() {
    	let remoteIpAddress = (req.connection.remoteAddress.substring(req.connection.remoteAddress.lastIndexOf(':') + 1, req.connection.remoteAddress.length - 1));

    	data = {
    		params: params,
    		body: body,
    		ipAddress: remoteIpAddress
    	}
        routing(page, req.method, data, function(response) {
			res.writeHead(response.httpCode, {'Content-Type': response.contentType});
			res.end(response.content);
		});
    });
});

server.listen(8000);