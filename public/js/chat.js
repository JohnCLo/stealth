// This file is executed in the browser, when people visit /chat/<random id>

$(function(){

	// getting the id of the room from the url
	var id = window.location.pathname.split("/").pop();
	//var id = Number(window.location.pathname.match(/\/chat\/(\d+)$/)[1]);

	// connect to the socket
	var socket = io();
	
	// variables which hold the data for each person
	var name = "",
		email = "",
		img = "",
		friend = "";

	// cache some jQuery objects
	var section = $(".section"),
		footer = $("footer"),
		onConnect = $(".connected"),
		inviteSomebody = $(".invite-textfield"),
		personInside = $(".personinside"),
		chatScreen = $(".chatscreen"),
		left = $(".left"),
		noMessages = $(".nomessages"),
		tooManyPeople = $(".toomanypeople");

	// some more jquery objects
	var chatNickname = $(".nickname-chat"),
		leftNickname = $(".nickname-left"),
		loginForm = $(".loginForm"),
		yourName = $("#yourName"),
		yourEmail = $("#yourEmail"),
		hisName = $("#hisName"),
		hisEmail = $("#hisEmail"),
		chatForm = $("#chatform"),
		textarea = $("#message"),
		messageTimeSent = $(".timesent"),
		chats = $(".chats");

	// these variables hold images
	var ownerImage = $("#ownerImage"),
		leftImage = $("#leftImage"),
		noMessagesImage = $("#noMessagesImage");

	var isTyping = $("#isTyping");

	var profiles = ['Iron Man', 'Spider Man', 'Thor']

	// on connection to server get the id of person's room
	socket.on('connect', function(){

		socket.emit('load', id);
	});

	// save the gravatar url
	socket.on('img', function(data){
		img = data;
	});

	// receive the names and avatars of all people in the chat room
	socket.on('peopleinchat', function(data){

		if(data.number === 0){

			//showMessage("connected");

			//showMessage("inviteSomebody");
			showMessage("initializeChat");
			// randomly select a profile
			name = profiles[Math.floor(Math.random() * profiles.length)]+' '+Math.round((Math.random() * 1000000));
			email = Math.round((Math.random() * 1000000))
			// call the server-side function 'login' and send user's parameters
			socket.emit('login', {user: name, avatar: email, id: id});

		} else if(data.number > 0 && data.number <= data.max) {
			showMessage("initializeChat");
			name = profiles[Math.floor(Math.random() * profiles.length)]+' '+Math.round((Math.random() * 1000000))			// call the server-side function 'login' and send user's parameters
			email = Math.round((Math.random() * 1000000))
			socket.emit('login', {user: name +' '+Math.round((Math.random() * 1000000)), avatar: name, id: id});

		} else {
			showMessage("tooManyPeople");
		}

	});

	// Other useful 

	// socket.on('startChat', function(data){
	// 	console.log(data);
	// 	showMessage("initializeChat");
	// });

	socket.on('leave',function(data){
		// if only one person remaining
		if(data.boolean && id==data.room){
			console.log(data.user+" left")
			//showMessage("somebodyLeft", data);
			//chats.empty();
		}

		if(data.boolean && id==data.room && data.remaining == 1){

			showMessage("everyoneLeft", data);
			chats.empty();
		}

	});

	socket.on('tooMany', function(data){
		if(data.boolean && name.length === 0) {
			showMessage('tooManyPeople');
		}
	});

	socket.on('receive', function(data){

		console.log(data);

		showMessage('chatStarted');

		if(data.msg.trim().length) {
			createChatMessage(data.msg, data.user, data.img, moment());
			scrollToBottom();
		}
	});

	// socket.on('isTyping', function(data){
	// 	showMessage("isTyping")
	// });

	textarea.keypress(function(e){

		// is typing
		//socket.emit('isTyping');

		if(e.which == 13) {
			e.preventDefault();
			chatForm.trigger('submit');
		}

	});

	chatForm.on('submit', function(e){

		// console.log(e)
		// console.log(name)

		e.preventDefault();
		// Create a new chat message and display it directly
		showMessage("chatStarted");

		if(textarea.val().trim().length) {
			createChatMessage(textarea.val(), name, img, moment());
			scrollToBottom();

			// Send the message to the other person in the chat
			socket.emit('msg', {msg: textarea.val(), user: name, img: img});

		}
		// Empty the textarea
		textarea.val("");
	});

	// Update the relative time stamps on the chat messages every minute

	setInterval(function(){

		// (function() {
		//   var hidden = "hidden";

		//   // Standards:
		//   if (hidden in document)
		//     document.addEventListener("visibilitychange", onchange);
		//   else if ((hidden = "mozHidden") in document)
		//     document.addEventListener("mozvisibilitychange", onchange);
		//   else if ((hidden = "webkitHidden") in document)
		//     document.addEventListener("webkitvisibilitychange", onchange);
		//   else if ((hidden = "msHidden") in document)
		//     document.addEventListener("msvisibilitychange", onchange);
		//   // IE 9 and lower:
		//   else if ("onfocusin" in document)
		//     document.onfocusin = document.onfocusout = onchange;
		//   // All others:
		//   else
		//     window.onpageshow = window.onpagehide
		//     = window.onfocus = window.onblur = onchange;

		//   function onchange (evt) {
		//     var v = "visible", h = "hidden",
		//         evtMap = {
		//           focus:v, focusin:v, pageshow:v, blur:h, focusout:h, pagehide:h
		//         };

		//     evt = evt || window.event;
		//     if (evt.type in evtMap)
		//       document.body.className = evtMap[evt.type];
		//     else
		//       document.body.className = this[hidden] ? "hidden" : "visible";
		//   }

		//   // set the initial state (but only if browser supports the Page Visibility API)
		//   if( document[hidden] !== undefined )
		//     onchange({type: document[hidden] ? "blur" : "focus"});
		// })();
		
		//console.log(chats)

		messageTimeSent.each(function(){
			var each = moment($(this).data('time'));
			// Delete comments that are over a minute old
			var timeInMs = Date.now();
			var timeElapsed = timeInMs - each._i
			if(timeElapsed > 60000){ // 1 minute
				$(this).parent().parent().remove()
			}
			//console.log(each.fromNow())
			//console.log(each.fromNow().slice(0,1))
			$(this).text(each.fromNow());
		});

	},60000);

	// Function that creates a new chat message

	function createChatMessage(msg,user,imgg,now){

		console.log(user)
		//console.log(name)

		var who = '';

		if(user===name) {
			who = 'me';
		}
		else {
			who = 'you';
		}

		var li = $(
			// to delete messages that are over a certain time, assign now as id
			'<li class=' + who +' id='+ now+ '>'+
				'<div class="image">' +
					'<img src=' + imgg + ' />' +
					'<b></b>' +
					'<i class="timesent" data-time=' + now + '></i> ' +
				'</div>' +
				'<p></p>' +
			'</li>');

		// use the 'text' method to escape malicious user input
		li.find('p').text(msg);
		li.find('b').text(user);

		chats.append(li);

		messageTimeSent = $(".timesent");
		messageTimeSent.last().text(now.fromNow());

	}

	function scrollToBottom(){
		$("html, body").animate({ scrollTop: $(document).height()-$(window).height() },120);
	}

	function isValid(thatemail) {

		var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(thatemail);
	}

	function showMessage(status,data){

		if(status === "connected"){

			section.children().css('display', 'none');
			onConnect.fadeIn(120);
		}

		else if(status === "inviteSomebody"){

			// Set the invite link content
			$("#link").text(window.location.href);

			onConnect.fadeOut(120, function(){
				inviteSomebody.fadeIn(120);
			});
		}

		else if(status === "personinchat"){

			onConnect.css("display", "none");
			personInside.fadeIn(120);

			chatNickname.text(data.user);
			ownerImage.attr("src",data.avatar);
		}

		else if(status === "initializeChat"){
			isTyping.css("display","none")
			inviteSomebody.fadeOut(120);
			footer.fadeIn(120);
		}

		else if(status === "youStartedChatWithNoMessages") {

			left.fadeOut(120, function() {
				inviteSomebody.fadeOut(120,function(){
					noMessages.fadeIn(120);
					footer.fadeIn(120);
				});
			});

			friend = data.users[1];
			noMessagesImage.attr("src",data.avatars[1]);
		}

		else if(status === "heStartedChatWithNoMessages") {

			personInside.fadeOut(120,function(){
				inviteSomebody.fadeOut(120);
				noMessages.fadeIn(120);
				footer.fadeIn(120);
			});

			friend = data.users[0];
			noMessagesImage.attr("src",data.avatars[0]);
		}

		else if(status === "chatStarted"){

			section.children().css('display','none');
			chatScreen.css('display','block');
		}

		else if(status === "somebodyLeft"){

			leftImage.attr("src",data.avatar);
			leftNickname.text(data.user);

			section.children().css('display','none');
			footer.css('display', 'none');
			left.fadeIn(120);
		}

		else if(status === "everyoneLeft"){

			//leftImage.attr("src",data.avatar);
			leftNickname.text("Everyone");

			section.children().css('display','none');
			footer.css('display', 'none');
			left.fadeIn(120);

			// redirect to homepage
			setTimeout(function() {
			  window.location.href = "/";
			}, 5000);
		}

		else if(status === "tooManyPeople") {

			section.children().css('display', 'none');
			tooManyPeople.fadeIn(120);
		}
		else if(status === "isTyping") {
			isTyping.fadeIn(10);
			isTyping.fadeOut(10);
		}
	}

});