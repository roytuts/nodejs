var path = require('path');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 4000;

server.listen(port, function(){
    console.log('Listening on:' + port);
});

app.use(express.static(path.join(__dirname, 'static')));

var numberOfUsers = 0;

io.on('connection', (socket) => {
	var userJoined = false;
	
	socket.on('new_message', (msg) => {
		socket.broadcast.emit('new_message', {
			username: socket.username,
			message: msg
		});
	});
	
	socket.on('user_added', (username) => {
		if (userJoined) return;

		socket.username = username;

		userJoined = true;
		
		numberOfUsers++;
		
		socket.emit('login', {
			numberOfUsers: numberOfUsers
		});
		
		socket.broadcast.emit('user_joined', {
			username: socket.username,
			numberOfUsers: numberOfUsers
		});
	});

	socket.on('typing', () => {
		socket.broadcast.emit('typing', {
			username: socket.username
		});
	});
	
	socket.on('typing_stop', () => {
		socket.broadcast.emit('typing_stop', {
			username: socket.username
		});
	});

	socket.on('disconnect', () => {
		if (userJoined) {
			--numberOfUsers;
			
			socket.broadcast.emit('user_left', {
				username: socket.username,
				numberOfUsers: numberOfUsers
			});
		}
	});
});