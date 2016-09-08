var express = require('express');
var mongoose = require('mongoose');

var port = 8080 || process.env.PORT; 

var app = express();

app.use('/public', express.static(process.cwd() + "/public")); 
app.use('/build', express.static(process.cwd() + "/build"));
app.set('view engine', 'jade');


app.get('/', function(req,res) {
	res.render('index');
});



app.listen(port, function() {
	console.log("Application is now listening on port " + port);
});