var http = require("http");
var url = require("url");

function start(route) {
  function onRequest(request, response) {
    var pathname = url.parse(request.url).pathname;
    console.log("Request for " + pathname);
    
    route (pathname);

    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write("Hello world");
    response.end();
  }

  http.createServer(onRequest).listen(3000);
  console.log("Server started");
}

exports.start = start;
