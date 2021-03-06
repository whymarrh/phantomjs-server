var Casper = require("casper");
var system = require("system");
var routes = require("./routes/index.js").routes;

var PORT = system.env.port || 12345;

var casper = Casper.create({
	"exitOnError": true,
	"logLevel": "error",
	"pageSettings": {
		"loadImages": false,
		"loadPlugins": false
	},
	"onRunComplete": undefined,
	"safeLogs": true,
	"silentErrors": false,
	"stepTimeout": undefined,
	"timeout": undefined,
	"verbose": true,
	"viewportSize": {
		"width": 1024,
		"height": 768
	}
});

var parseQueryString = function parseQueryString(url) {
	var idx = url.indexOf("?");
	if (!~idx) {
		return undefined;
	}
	var fragmentIdx = url.indexOf("#");
	var queryString = url.substring(idx + 1, ~fragmentIdx ? fragmentIdx : undefined);
	var data = {};

	 decodeURIComponent(queryString)
	.split("&")
	.forEach(function (e, i, a) {
		var parts = e.split("=");
		data[parts[0]] = parts[1];
	});

	return data;
};

var dispatch = function dispatch(routes, request) {
	var match;
	routes.some(function _someRoute(route) {
		if (request.url.lastIndexOf(route.p) != 0) {
			return false;
		}
		match = route.m[request.method];
		return true;
	});
	return match;
};

var handleRequest = function handleRequest(request, response) {
	var route = dispatch(routes, request);
	var data  = request.method == "GET" ? parseQueryString(request.url) : request.post;
	if (route) {
		route.call(casper, data, function _route(err, data) {
			if (err) {
				response.statusCode = err.statusCode;
				response.setHeader(
					"Content-Type",
					"application/json; charset=utf-8"
				);
				response.write(JSON.stringify(err));
				response.write("\n");
				response.closeGracefully();
				return;
			}

			response.statusCode = 200;
			response.setHeader(
				"Content-Type",
				"application/json; charset=utf-8"
			);
			response.write(JSON.stringify(data));
			response.write("\n");
			response.closeGracefully();
		});
	}
	else {
		response.statusCode = 404;
		response.closeGracefully();
	}
};

if (
	 require("webserver")
	.create()
	.listen(PORT, handleRequest)
) {
	console.log("Server running on port " + PORT);
}
else {
	console.log("Oops! Something went wrong.");
	phantom.exit();
}
