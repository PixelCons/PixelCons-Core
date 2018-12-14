// Core
var express = require('express');
var serverPort = 8080;

// Serve everything in the current directory
var app = express();
app.use(express.static(__dirname + '\\src')); 
app.use(express.static(__dirname + '\\build')); 
app.use(function (err, req, res, next) {
	if (req.xhr) {
		res.status(500).send('Oops, Something went wrong!');
	} else {
		next(err);
	}
});
app.get('*', function(req, res) {
  res.sendFile(__dirname + '\\src\\index.html')
})

// Start Express App Server
app.listen(serverPort);
console.log('Hosting on port ' + serverPort);
