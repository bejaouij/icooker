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
        routing(page, req.method, params, body, function(response) {
			res.writeHead(response.httpCode, {'Content-Type': response.contentType});
			res.end(response.content);
		});
    });
});

server.listen(8000);