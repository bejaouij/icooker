var http = require('http');
var url = require('url');
var querystring = require('querystring');
var cookie = require('cookie');
var fs = require('fs');
let routing = require('./app/routes/web');

var server = http.createServer(function(req, res) {
	let page = url.parse(req.url).pathname;
	let params = querystring.parse(url.parse(req.url).query);
	let body = '';
    let cookieData = cookie.parse(req.headers.cookie || '');
    
    /* Static resources requests */
    if(page.indexOf('.css') != -1 || page.indexOf('.js') != -1) {
        fs.readFile(__dirname + page, function(error, content) {
            if(error) {
                console.log(error);
            }
            else {
                res.writeHead(200, {'Content-Type': 'text/css'});
                res.end(content);
            }
        })
    }
    ////////////////////
    /* Page or API requests */
    else {
        req.on('data', function(chunk) {
            body += chunk.toString();
        });

        req.on('end', function() {
            let remoteIpAddress = (req.connection.remoteAddress.substring(req.connection.remoteAddress.lastIndexOf(':') + 1, req.connection.remoteAddress.length - 1));

            data = {
                params: params,
                body: body,
                ipAddress: remoteIpAddress,
                cookieData: (typeof cookieData != 'undefined') ? cookieData['icooker-token'] : undefined
            }

            routing(page, req.method, data, function(response) {
                if(typeof response.cookieData != 'undefined') {
                    res.setHeader('Set-Cookie', cookie.serialize('icooker-token', response.cookieData['icooker-token'], {
                        'sameSite': true,
                        'httpOnly': true
                    }));
                }

                res.writeHead(response.httpCode, {'Content-Type': response.contentType});
                res.end(response.content);
            });
        });
    }
    ////////////////////
});

server.listen(8000);