var express = require('express');
var mongoose = require('mongoose');
var http = require('http');

var port = 8080 || process.env.PORT; 

var app = express();
var server = http.createServer(app);

app.use('/public', express.static(process.cwd() + "/public")); 
app.use('/build', express.static(process.cwd() + "/build"));
app.set('view engine', 'jade');

var Stock = require('./models/Stock.js'); //stock model

var url = 'mongodb://localhost/MyDataBase' || process.env.MONGOLAB_URI;

mongoose.connect(url);

var io = require('socket.io').listen(server);

io.on('connection', function(socket) {
		socket.on('addingStock', function(data) { //when a client adds stock via addingStock event, update other clients
			Stock.findOne({ code: data.code}, function(err,doc) { //make sure stock isn't already in db 
				if (doc) {
					
				}
				else {
					var temp = new Stock({ code: data.code });
					temp.save(); //save the stock to db
				}
			});
			socket.emit('stockAdded', { code: data.code }); 
			
		});
		
		socket.on('removingStock', function(data) { //when client removes stock, update other clients
			Stock.remove({ code: data.code }, function(err) {
				if (err) {
					console.log(err);
				}
			});
			socket.emit('stockRemoved', { code: data.code });
			
		});
});

app.get('/', function(req,res) {
	Stock.find().exec(function(err, docs) {
		if (docs == null) {
			res.render('index');
		}
		else {
			res.render('index', { stocks: docs });
		}
	});
	
});


server.listen(port, function() {
	console.log("Application is now listening on port " + port);
});