
var existingRooms = new Set();
var roomCodeSize = 10;
function generateRandomString() {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz0123456789";
	for( var i = 0; i < roomCodeSize; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	if(existingRooms.has(text))
		return generateRandomString();

	existingRooms.add(text);
	return text;
}

var express = require("express");
var bodyParser = require("body-parser");
var path = require('path');
var mongoose = require('mongoose');
var session = require('express-session');
var app = express();
var sess; //sessions to save the data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));
//app.use(express.bodyParser({limit: '50mb'}));
app.use(session({secret: 'ourSecret'}));


var http = require("http");
var server = http.createServer(app).listen(3000);
var io = require("socket.io", {'forceNew': false})(server);

//============= mongoDB connection==============
var UserSchema = new mongoose.Schema({
    username : String,
    password : String,
    history  : [String]
});

var myModel = mongoose.model('usersCollection', UserSchema, 'usersCollection');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://127.0.0.1/SharedWhiteBoard');

console.log('db Connected');
//==================End=======================


//============= mongoDB Functions==============
//============== Push Json to DB record to save history (+) ===================

app.post('/addDraw', function (request,res) {
    var myRoom = sess.room;
    sess = request.session;
    sess.room = myRoom;
    var user = sess.userName;
    var history = request.body.NewHistory;
    var history_name = request.body.HistoryName;

    myModel.update({username: user}, {$pushAll: {history: [history_name,history]}},{upsert:true},function(err){
        if(err) {
            sess.status = "6";
        } else {
            sess.status = "7";
        }
        res.redirect("/?room="+sess.room);
    });
});

//========================================================================
var numOfIterations = 0;
app.get("/",function(req,res,next){
    sess = req.session;
    //Handling room from the get request
    var room;
    /*if(sess.userName)
        sess.history = HistoryList(sess.userName);*/
    if(typeof req.query.room !== 'undefined'){
        room = req.query.room.substr(0,roomCodeSize);
        sess.room = room;
        //Invalid room handling
        if (!existingRooms.has(room)){
            room = generateRandomString(); // el ta3del fe el satr da bas
            sess.room = room;
            res.redirect("/?room=" + room.toString());
        }
    }
    else{
        room = generateRandomString();
        sess.room = room;
        res.redirect("/?room=" + room.toString());
    }

    io.on("connection",function (socket) {
        setTimeout(function () {
        var clients = io.sockets.adapter.rooms[socket.room];
        if (typeof clients !== "undefined") {
            var clientId;
            for (clientId in clients.sockets) {
                if (socket.id !== clientId) {
                    socket.broadcast.to(clientId).emit('get project', socket.id);
                    break;
                }
            }
        }},1000);

        if(typeof socket.room !== "undefined" && typeof room !== "undefined"){
            socket.leave(socket.room);
            numOfIterations++;
        }

        /*Added*/
        if(!existingRooms.has(room))
            existingRooms.add(room);

        socket.join(room);
        socket.room = room;
        socket.emit("room inform", sess);
      socket.on("get project",function (obj) {
			socket.broadcast.to(obj.id).emit('catching project', obj.pro);
		});

        socket.on('chat message',function(data) {
            if(data.msg !== ""){
                socket.broadcast.to(socket.room).emit('chat message',data);
                data.msg = "";
            }
        });


		socket.on("Draw",function (drawingStruct) {
            if (drawingStruct.type == 1 ||drawingStruct.type == 2 || drawingStruct.type == 3 || drawingStruct.type == 4)
				drawingStruct.clientID = socket.id;
			socket.broadcast.to(socket.room).emit("Draw",drawingStruct);
		});

		socket.on("disconnect",function () {
			var clients = io.sockets.adapter.rooms[socket.room];
			if (typeof clients === "undefined"){
				existingRooms.delete(room);
			}
		});




    //===================== Retrieve history with certain name ===============
    //when user select certain history via post request it returns the content of this name
        socket.on('recover', function (history_name) {
            var result;
            var user = sess.userName;

            
            myModel.findOne({ username: user }, { history: 1 }).exec(function(err, configs) {
                if (err) {
                    return ;
                }
                for(var count = 1; count <configs.history.length; count+=2) {
                    if(configs.history[count-1]==history_name) {
                        result = configs.history[count];
                        break;
                    }
                }
                socket.emit("history you needed",result);
            });
        });
        //////////////////////////////////////////////////

        socket.on("status recieved",function () {
           sess.status = 0;
        });

    //===================== Retrieve List of History names ==================
    //a function to return all saved histories
        socket.on("recoverNames" ,function () {
            if(typeof sess.userName == "undefined" ){
                return;
            }

            myModel.findOne({ username: sess.userName }, { history: 1 }).exec(function(err, configs) {
                if (err) {
                    return ;
                }
                returned_list = [];
                for(var count = 0; count <configs.history.length; count+=2) {
                    returned_list[count/2] = configs.history[count];
                }
                socket.emit("Names you needed",returned_list);
            });
        });
    //========================================================================111111111111111111
    });

    next();
});

app.post('/', function (req,res) {
   res.redirect('/');
});

app.post('/login',function(req,res){
    var myRoom = sess.room;
    sess = req.session;
    sess.room = myRoom;
    var inUserName = req.body.user_name;
    var inPassword = req.body.user_pass;
    sess.Draw = req.body.draw;
    if(typeof sess.userName !== "undefined")
    {
        sess.status = "3";
        res.redirect("/?room=" + sess.room);
    }

    myModel.findOne({
        username: inUserName, password:inPassword
    }).exec(function(err, result){
        if(result == null) {
            sess.status = "2";
            res.redirect("/?room=" + sess.room);
        }else{
            sess.status = undefined;
            sess.userName = inUserName;
            res.redirect("/?room=" + sess.room);
        }
    });
});

app.post('/logout', function(req,res){
    var myRoom = sess.room;
    sess = req.session;
    sess.room = myRoom;
    sess.Draw = req.body.draw;
    if(typeof sess.userName === "undefined") {
        res.redirect('/?room='+ sess.room + '&status=4');
    }else
    {
        sess.userName = undefined;
        res.redirect('/?room=' + sess.room);
    }
});

app.post('/register_me', function(req, res){
    var myRoom = sess.room;
    sess = req.session;
    sess.room = myRoom;
    sess.Draw = req.body.draw;
    var inUserName = req.body.user_name;
    var inPassword = req.body.Password;

    if(typeof sess.userName !== "undefined")
    {
        res.redirect("/?room=" + sess.room + "&status=3");
    }

    myModel.findOne({
        username: inUserName
    }).exec(function(err, result){
        if(result == null)
        {
            var fluffy = new myModel({ username: inUserName, password: inPassword });
            fluffy.save(function (err, fluffy) {
                sess.userName = inUserName;
                res.redirect("/?room=" + sess.room);
            });
        }else{
            res.redirect("/?room=" + sess.room + "&status=5");
        }
    });
});


app.use(express.static("./"));
console.log("Server is Up and Running on port 3000!");