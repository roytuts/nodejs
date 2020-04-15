$(function() {
	var win = $(window);
	var usernameInput = $('.username_input'); // Input for username
	var messages = $('.messages'); // Messages area
	var inputMessage = $('.input_message'); // Input message input box

	var loginPage = $('.login.page'); // The login page
	var chatPage = $('.chat.page'); // The chatroom page
	
	var username;
	var connected = false;
	var typing = false;
	var currentInput = usernameInput.focus();
	
	var socket = io();
	
	const setParticipantsMessage = (data) => {
		var message = '';
		if (data.numberOfUsers === 1) {
		  message += "There is 1 participant";
		} else {
		  message += "There are " + data.numberOfUsers + " participants";
		}
		
		log(message);
	}
	
	const log = (message, options) => {
		var el = $('<li>').addClass('log').text(message);
		addMessageElement(el, options);
	}
	
	const setUsername = () => {
		username = cleanInput(usernameInput.val().trim());

		if (username) {
		  loginPage.fadeOut();
		  chatPage.show();
		  loginPage.off('click');
		  currentInput = inputMessage.focus();

		  socket.emit('user_added', username);
		}
	}
	
	const sendMessage = () => {
		var message = cleanInput(inputMessage.val());

		if (message && connected) {
			inputMessage.val('');
			addChatMessage({
				username: username,
				message: message
			});
			socket.emit('new_message', message);
		}
	}

	const addChatMessage = (data, options) => {
		var typingMessages = getTypingMessages(data);
		
		options = options || {};
		
		if (typingMessages.length !== 0) {
			options.fade = false;
			typingMessages.remove();
		}

		var usernameDiv = $('<span class="username"/>').text(data.username).css('font-weight', 'bold');
		var messageBodyDiv = $('<span class="messageBody">').text(data.message);

		var typingClass = data.typing ? 'typing' : '';
		
		var messageDiv = $('<li class="message"/>').data('username', data.username).addClass(typingClass).append(usernameDiv, messageBodyDiv);

		addMessageElement(messageDiv, options);
	}
	
	const addChatTyping = (data) => {
		data.typing = true;
		data.message = 'is typing';
		addChatMessage(data);
	}

	const removeChatTyping = (data) => {
		getTypingMessages(data).fadeOut(function () {
			$(this).remove();
		});
	}

	const addMessageElement = (el, options) => {
		var el = $(el);

		// Setup default options
		if (!options) {
			options = {};
		}
		if (typeof options.fade === 'undefined') {
			options.fade = true;
		}
		if (typeof options.prepend === 'undefined') {
			options.prepend = false;
		}

		// Apply options
		if (options.fade) {
			el.hide().fadeIn(150);
		}
		
		if (options.prepend) {
			messages.prepend(el);
		} else {
			messages.append(el);
		}
		
		messages[0].scrollTop = messages[0].scrollHeight;
	}
	
	const cleanInput = (input) => {
		return $('<div/>').text(input).html();
	}
	
	const updateTyping = () => {
		if (connected) {
			if (!typing) {
				typing = true;
				socket.emit('typing');
			}
		}
	}

	const getTypingMessages = (data) => {
		return $('.typing.message').filter(function (i) {
			return $(this).data('username') === data.username;
		});
	}

	win.keydown(event => {
		//console.log('event.which: ' + event.which);
		// Auto-focus the current input when a key is typed
		if (!(event.ctrlKey || event.metaKey || event.altKey)) {
			currentInput.focus();
		}
		
		// When the client hits ENTER on their keyboard
		if (event.which === 13) {
			if (username) {
				sendMessage();
				socket.emit('typing_stop');
				typing = false;
			} else {
				setUsername();
			}
		}
	});

	inputMessage.on('input', () => {
		updateTyping();
	});
	
	loginPage.click(() => {
		currentInput.focus();
	});

	inputMessage.click(() => {
		inputMessage.focus();
	});

	socket.on('login', (data) => {
		connected = true;

		var message = "Welcome to Nodejs Chat Room";
		
		log(message, {
			prepend: true
		});
		
		setParticipantsMessage(data);
	});

	socket.on('new_message', (data) => {
		addChatMessage(data);
	});
	
	socket.on('user_joined', (data) => {
		log(data.username + ' joined');
		setParticipantsMessage(data);
	});

	socket.on('user_left', (data) => {
		log(data.username + ' left');
		setParticipantsMessage(data);
		removeChatTyping(data);
	});

	socket.on('typing', (data) => {
		addChatTyping(data);
	});

	socket.on('typing_stop', (data) => {
		removeChatTyping(data);
	});

	socket.on('disconnect', () => {
		log('You have been disconnected');
	});

	socket.on('reconnect', () => {
		log('You have been reconnected');
		if (username) {
			socket.emit('user_added', username);
		}
	});

	socket.on('reconnect_error', () => {
		log('Attempt to reconnect has failed');
	});
});