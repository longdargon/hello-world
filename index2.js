var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var room;
var username;
var isroot;
var userid;

var domainChatAPI = "http://localhost:19290/LiveChatAPI/";
app.use(require('express').static('public'));
app.get('/p', function (req, res) {

    //var urlclient = req.header('Referer');
    // npm install url-parse
    //var parse = require('url-parse'), urlparse = parse(urlclient, true);
    //console.log(urlparse.host);

  isroot = req.param("root");
  webid = req.param("webid");
  room = "";
  if(isroot=="yes")
  {
		username = req.param("nid");
		userid = req.param("uid");
		res.sendFile(__dirname + '/chatadmin.html');
  }
  else if (isroot == "no") {
      username = "";
      userid = "";
      res.sendFile(__dirname + '/chatbox2.html');
  }
  else {
      res.sendFile(__dirname + '/chatboxthu2.html');
  }

});

// npm install
var cheerio = require('cheerio');
var request = require("request");


io.sockets.on('connection', function(socket){
	
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
	    var url = domainChatAPI+"postchatmessage?roomid="+socket.room+"&userid="+socket.userid+"&content="+data

		request({
			url: url,
			json: true
		}, function (error, response, body) {

			if (!error && response.statusCode === 200) {
				var fbResponse = JSON.stringify(body);
				
				var url2 = domainChatAPI+"getroomhasnhanvienid?nhanvienid="+body[0].ID;
				request({
					url: url2,
					json: true
				}, function (error, response, body2) {

					if (!error && response.statusCode === 200) {
						var fbResponse2 = JSON.stringify(body2);
						for(var i = 0;i<body2.length;i++)
						{
							if(body2[i].room_ID!=socket.room){
								socket.broadcast.to(body2[i].room_ID).emit('newmessage',socket.room);
							}
						}
					}
				})
			}
		})
		io.sockets.in(socket.room).emit('updatechat', socket.username, data, socket.isroot);
		
		
	});

	socket.on('getconfigui', function () {

	    var url = domainChatAPI + "getconfigui?webid=" + webid;

	    request({
	        url: url,
	        json: true
	    }, function (error, response, body) {

	        if (!error && response.statusCode === 200) {
	            var fbResponse = JSON.stringify(body);
	            
	                //console.log("Got response: ", body[0].title_box);
	                socket.emit('setupgui', body[0].color, body[0].title_box);
	            
	        }
	    })
	});

	socket.on('getlistnhanvienchat', function () {
		// we tell the client to execute 'updatechat' with 2 parameters
	    var url = domainChatAPI+"getlistnhanvienchat?webid="+webid;

		request({
			url: url,
			json: true
		}, function (error, response, body) {

			if (!error && response.statusCode === 200) {
				var fbResponse = JSON.stringify(body);
				for(var i=0;i<body.length;i++)
				{
					//console.log("Got response: ", body[i].username);
					socket.emit('updatenhanvienchat',body[i].ID, body[i].username,body[i].image,body[i].chucvu, webid);
				}
			}
		})
	});
	
	socket.on('getrechatmessage', function (roomid) {

	    if (roomid != socket.room) {
	        socket.leave(socket.room);

	        //socket.username = username;
	        socket.room = roomid;
	        //socket.userid = userid;
	        //socket.isroot = isroot
	        socket.join(roomid);
	    }
	    var url = domainChatAPI+"getchatmessageofmaster?roomid=" + roomid;

		request({
			url: url,
			json: true
		}, function (error, response, body) {

			if (!error && response.statusCode === 200) {
				var fbResponse = JSON.stringify(body);
				socket.emit('updaterechat', body);
			}
		})
		
	});
	
	socket.on('getrechatmessageofclient', function (roomid) {
	    var url = domainChatAPI+"getchatmessageofclient?roomid=" + roomid;

		request({
			url: url,
			json: true
		}, function (error, response, body) {

			if (!error && response.statusCode === 200) {
			
				var fbResponse = JSON.stringify(body);
				socket.emit('updaterechat', body);
			}
		})
		
	});
	
	socket.on('getrenv', function (masid) {
	    var url = domainChatAPI+"getnhanvienWithid?masid=" + masid;

		request({
			url: url,
			json: true
		}, function (error, response, body) {

			if (!error && response.statusCode === 200) {
			
				var fbResponse = JSON.stringify(body);
				socket.emit('updaterenhanvienchat', body);
			}
		})
		
	});
	
	socket.on('getlistkhachchat', function (webid, uid) {
	    var url = domainChatAPI+"getlistkhachchat?webid="+webid+"&uid="+uid;

			request({
				url: url,
				json: true
			}, function (error, response, body) {

				if (!error && response.statusCode === 200) {
					var fbResponse = JSON.stringify(body);
					
					if (body.length >0) {
					    //cho thang admin vao room dau tien
					    socket.username = username;
					    socket.room = body[0].ID;
					    socket.userid = userid;
					    socket.isroot = isroot
					    socket.join(body[0].ID);


					    socket.emit('updatekhachlivechat', body);
					}
				}
			})
		
		
	});
	
	socket.on('postthongtinnguoidung', function (ten,email,nhanvienid) {

	    var url = domainChatAPI+"postkhachlivechat?ten="+ten+"&email="+email+"&webid="+webid+"&idnv="+nhanvienid;

		request({
			url: url,
			json: true
		}, function (error, response, body) {

			if (!error && response.statusCode === 200) {
				var fbResponse = JSON.stringify(body);
				//console.log("Got response: ", body[0].room_ID);
				var getroomname = body[0].room_name;
				room = body[0].room_ID;
				username = body[0].username;
				userid = body[0].ID;
				socket.username = username;
				socket.room = room;
				socket.userid = userid;
				socket.isroot = isroot
				socket.join(room);
				// gui tin nhan luu cookie cho client
				socket.emit('savecookie',body[0].room_ID,body[0].username,body[0].ID,webid);
				
				var url2 = domainChatAPI+"getroomhasnhanvienid?nhanvienid="+nhanvienid;
				request({
					url: url2,
					json: true
				}, function (error, response, body2) {

					if (!error && response.statusCode === 200) {
						var fbResponse2 = JSON.stringify(body2);
						for(var i = 0;i<body2.length;i++)
						{
                            // add room cho server biet
							socket.broadcast.to(body2[i].room_ID).emit('addroom', room ,getroomname);
						}
					}
				})

				var url3 = domainChatAPI+"postinitchatmessage?roomid=" + room + "&masterid=" + nhanvienid;

				request({
				    url: url3,
				    json: true
				}, function (error, response, body3) {
				    var root = "yes";
				    if (!error && response.statusCode === 200) {
				        if (body3 != null) {
				            //server gui tin nhan moi chao cho client
				            socket.emit('updatechat', body3[0].username, body3[0].content, root);
				        }
				    }
				})
			}
		})

		
	});
	
	socket.on('postcookiethongtinnguoidung', function (user,roomid,userid,masid) {
		socket.username = user;
		socket.room = roomid;
		socket.userid = userid;
		socket.isroot = isroot
		socket.join(roomid);
		
		// update tren giao dien web master
		var url = domainChatAPI+"getroomhasnhanvienid?nhanvienid="+masid;

		request({
			url: url,
			json: true
		}, function (error, response, body) {

			if (!error && response.statusCode === 200) {
				var fbResponse = JSON.stringify(body);
				//console.log("Got response: ", body[0].room_ID);
				for(var i = 0;i<body.length;i++)
				{
					socket.broadcast.to(body[i].room_ID).emit('updatestatusroom', roomid,"online");
				}
			}
		})
		
		url = domainChatAPI+"updatestatuskhach?khachid="+socket.userid+"&status=online";

		request({
			url: url,
			json: true
		}, function (error, response, body) {

		})
	});
	
	socket.on('disconnect', function(){
	    
	        var url = domainChatAPI+"updatestatuskhach?khachid="+socket.userid+"&status=offline";

		    request({
			    url: url,
			    json: true
		    }, function (error, response, body) {

		    })
		    socket.broadcast.emit('updatestatusroom', socket.room,"offline");
		    socket.leave(socket.room);
	});
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
