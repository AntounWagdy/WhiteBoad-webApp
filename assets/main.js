paper.install(window);
var CanvasID = "myCanvas";
var normalDrawing = new Tool();
var curlyBrush = new Tool();
var normalBrush = new Tool();
var Circle = new Tool();
var Rect = new Tool();
var RRect = new Tool();
var eraser = new Tool();
var polygon = new Tool();

var path;  //local
var tempPath;
var tempPoint;
var currentColor = 'red';
var socket = io();
var ReceivedPaths = {}; //map of received paths from socket
var mySession = undefined;
var myName = "";
var myImage = "";
var unreadMsgs = 0;
var month = {};

month[0] = "Jan";
month[1] = "Feb";
month[2] = "Mar";
month[3] = "Apr";
month[4] = "May";
month[5] = "June";
month[6] = "July";
month[7] = "Aug";
month[8] = "Sep";
month[9] = "Oct";
month[10] = "Nov";
month[11] = "Dec";

function randomName(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}
function randomImage(){
    listOfImages = [
        "dist/img/avatar.png",
        "dist/img/avatar2.png",
        "dist/img/avatar3.png",
        "dist/img/avatar04.png",
        "dist/img/avatar5.png"
    ];
    return listOfImages[Math.floor(Math.random() * listOfImages.length)];
}
function readAllMsgs() {
    unreadMsgs = 0;
    $("#msgsNum").html("");
}
function appendMsgs(msg, msgDate, senderName, senderImage) {
    var div = "<div style='word-wrap:break-word' class='direct-chat-msg";
    if (senderName == myName)
        div += " right";
    div += "'><div class='direct-chat-info clearfix'><span class='direct-chat-name pull-left'>"+ senderName +"</span>";
    date = new Date(msgDate);
    var pm = false;
    if (date.getHours() > 11){
        if(date.getHours() != 12)
            date.setHours(date.getHours() - 12);
        pm = true;
    }
    div += "<span class='direct-chat-timestamp pull-right'>";
    if(date.getDate() < 10)
        div += "0";
    div += date.getDate() + " " + month[date.getMonth()] + "  ";
    if(date.getHours() < 10)
        div += "0";
    div += date.getHours() + ":";
    if(date.getMinutes() < 10)
        div += "0";
    div += date.getMinutes();
    if(pm)
        div += " pm";
    else
        div += " am";
    div += "</span></div><!-- /.direct-chat-info --><img class='direct-chat-img' src='"+ senderImage +"' alt='Message User Image'><!-- /.direct-chat-img --><div style='padding:0 5px' class='direct-chat-text'>"+ msg +"</div><!-- /.direct-chat-text --></div>";
    $('.direct-chat-messages').append(div);
    var msgsDiv = document.getElementById("msgs");
    msgsDiv.scrollTop = msgsDiv.scrollHeight;
}
//generate random name and image for the user
function sendDrawingStruct(drawingStruct) {
    socket.emit("Draw",drawingStruct);
}
function clickColor(hex, seltop, selleft) {
    document.getElementById("divpreview").style.backgroundColor = hex;
    currentColor = hex;
}
function mouseOverColor(hex) {
    document.getElementById("divpreview").style.backgroundColor = hex;
    document.body.style.cursor = "pointer";
}
function mouseOutMap(){
    document.body.style.cursor = "";
    document.getElementById("divpreview").style.backgroundColor = currentColor;
}
//////////////////////////// Save Snapshot ///////////////////////// 
function downloadCanvas(link) {
    canvasId = 'myCanvas';
    filename = 'savedImage.jpg';
    link.href = document.getElementById(canvasId).toDataURL();
    link.download = filename;
}
function addDraw(){
    var drawName = $("#draw_name").val();
    if(typeof drawName !== "undefined" && drawName.length > 0){
        var form = document.createElement('form');
        form.setAttribute('method', 'post');
        form.setAttribute('action', '/addDraw');
        form.style.display = 'hidden';
        document.body.appendChild(form);

        var input = document.createElement("input");
        input.type = "text";
        input.name = "NewHistory";
        input.value = paper.project.activeLayer.exportJSON();
        form.appendChild(input);

        input = document.createElement("input");
        input.type = "text";
        input.name = "HistoryName";
        input.value = drawName;
        form.appendChild(input);
        form.submit();
    }else{
        $("#msg").addClass("box-danger");
        $("#msgBody").html("Draw name is required.");
        $("#msg").slideDown();
    }
    setTimeout(function () {
        $("#msg").slideUp();
    },5000);
}
function getHistoryByName(name) {
    socket.emit('recover',name);
}
function Redirect(type){
    if(paper && paper.project) {
        var input = document.createElement("input");
        input.type = "text";
        input.name = "draw";
        input.value = paper.project.activeLayer.exportJSON();
        input.style.display = 'none';
    }
    var form = undefined;
    //alert(type);
    if(type === 1)
        form = $('#loginForm form');
    else if(type === 2)
        form = $("#RegisterForm form");
    else
        form = $("#logOutForm");

    if(input)
        form.append(input);
    form.submit();
}

///////////////////////////////////////////////////////////////////

socket.on("room inform",function (session) {
    mySession = session;

    if (typeof mySession == "undefined" || !mySession.userName) {
        $("#loginForm").css("display", "block");
        $("#RegisterForm").css("display", "block");
        $("#history").css("display", "none");
        $("#logOut").css("display", "none");
    } else {
        $("#loginForm").css("display", "none");
        $("#RegisterForm").css("display", "none");
        $("#history").css("display", "block");
        $("#logOut").css("display", "block");
    }
});


window.onload = function() {
    //Globals
    paper.setup(CanvasID);

    var rect = new Path.Rectangle({
        point: [0, 0],
        size: [view.size.width, view.size.height],
        strokeColor: '#ecf0f5',
        selected: false
    });
    rect.fillColor = '#ecf0f5';
	
    if(mySession.Draw){
		console.log("Da5alt");
        paper.project.activeLayer.importJSON(JSON.parse(mySession.Draw));
	}


    socket.on("history you needed",function (json) {
        project.clear();
        paper.project.activeLayer.importJSON(JSON.parse(json));
    });
    var history = {};
    socket.emit("recoverNames");
    socket.on("Names you needed",function (list) {
        $("#historyList > #historyElement").remove();
        for(var i=0; i<list.length; i++) {
            $("#historyList").append('<a id="historyElement" onclick="getHistoryByName(\''+ list[i]+'\')" href="#"><div class="row text-center">' + list[i] + '</div></a>');
        }
    });

//////////////////////////////////////////////////////////////
    /*initiate the screen with the initial color*/
    ////////////////////////////////////////////////

    if(mySession && mySession.userName)
        myName = mySession.userName;
    else
        myName = randomName();
    myImage = randomImage();
    $('#submit_btn').click(function() {
        socket.emit('chat message',{msg: $('#m').val(), senderName: myName, senderImage: myImage, msgDate: Date()});
        appendMsgs($('#m').val(), Date(), myName, myImage);
        $('#m').val('');
        return false;
    });

    setTimeout(function(){
        if(typeof mySession == "undefined")
			return;

		var status = mySession.status;
        socket.emit("status recieved");
        if(status === "3"){
            $("#msg").addClass("box-info");
            $("#msgBody").html("You are already logged in.");
            $("#msg").slideDown();
        }else if(status === "2"){
            $("#msg").addClass("box-danger");
            $("#msgBody").html("Wrong Username <br> or Password.");
            $("#msg").slideDown();
        }else if(status === "4"){
            $("#msg").addClass("box-warning");
            $("#msgBody").html("You have not logged in yet.");
            $("#msg").slideDown();
        }else if(status === "5"){
            $("#msg").addClass("box-warning");
            $("#msgBody").html("This username is <br> already token. <br> Choose another one, please.");
            $("#msg").slideDown();
        }else if(status === "6"){
            $("#msg").addClass("box-danger");
            $("#msgBody").html("Error happened please try again.");
            $("#msg").slideDown();
        }else if(status === "7"){
            $("#msg").addClass("box-success");
            $("#msgBody").html("Your Drawing is added.");
            $("#msg").slideDown();
        }
    },1000);


    setTimeout(function () {
        $("#msg").slideUp();
    },5000);
    //////////////////////////////////////////////////////////////////////////////

    socket.on('chat message',function(data){
        appendMsgs(data.msg, data.msgDate, data.senderName, data.senderImage);
        if(!$("#chatSide").hasClass('control-sidebar-open')){
            unreadMsgs++;
            $("#msgsNum").html(unreadMsgs.toString());
        }
    });

    socket.on('get project',function (id) {
        socket.emit("get project",{id:id,pro:paper.project.activeLayer.exportJSON()})
    });

    socket.on("catching project",function (obj) {
        project.clear();
        paper.project.activeLayer.importJSON(obj);
    });

    /*Server Side Drawing*/
    socket.on("Draw",function (drawingStruct) {
        var Rpath;
        switch (drawingStruct.type){
            case 1:
                switch (drawingStruct.pType)
                {
                    case 0:
                        ReceivedPaths[drawingStruct.clientID] = new Path();
                        ReceivedPaths[drawingStruct.clientID].add(new Point(drawingStruct.pX * view.size.width ,
                            drawingStruct.pY * view.size.height));
                        ReceivedPaths[drawingStruct.clientID].strokeColor = drawingStruct.color;
                        break;
                    case 1:
                        if(drawingStruct.shift){
                            ReceivedPaths[drawingStruct.clientID].LastSegment.point = new Point(new Point(drawingStruct.pX * view.size.width ,
                                drawingStruct.pY * view.size.height));
                        }
                        else{
                            ReceivedPaths[drawingStruct.clientID].add(new Point(drawingStruct.pX * view.size.width ,
                                drawingStruct.pY * view.size.height));
                        }
                        break;
                    case 2:
                        ReceivedPaths[drawingStruct.clientID].simplify(5);
                        break;
                }
                view.draw();
                break;
            case 2:
                switch (drawingStruct.pType)
                {
                    case 0:
                        ReceivedPaths[drawingStruct.clientID] = new Path();
                        ReceivedPaths[drawingStruct.clientID].fillColor = drawingStruct.color;
                        ReceivedPaths[drawingStruct.clientID].add(new Point(drawingStruct.pX * view.size.width ,
                            drawingStruct.pY * view.size.height));
                        break;
                    case 1:
                        ReceivedPaths[drawingStruct.clientID].add(new Point(drawingStruct.tX * view.size.width,drawingStruct.tY * view.size.height));
                        ReceivedPaths[drawingStruct.clientID].insert(0, new Point(drawingStruct.bX * view.size.width,drawingStruct.bY *view.size.height));
                        ReceivedPaths[drawingStruct.clientID].smooth();
                        break;
                    case 2:
                        ReceivedPaths[drawingStruct.clientID].add(new Point(drawingStruct.pX * view.size.width , drawingStruct.pY * view.size.height));
                        ReceivedPaths[drawingStruct.clientID].closed = true;
                        ReceivedPaths[drawingStruct.clientID].smooth();
                        break;
                }
                view.draw();
                break;
            case 3:
                switch (drawingStruct.pType) {
                    case 0:
                        ReceivedPaths[drawingStruct.clientID] = new Path();
                        ReceivedPaths[drawingStruct.clientID].fillColor = drawingStruct.color;
                        break;
                    case 1:
                        ReceivedPaths[drawingStruct.clientID].add(new Point(drawingStruct.tX * view.size.width,drawingStruct.tY * view.size.height));
                        ReceivedPaths[drawingStruct.clientID].insert(0, new Point(drawingStruct.bX * view.size.width,drawingStruct.bY *view.size.height));
                        ReceivedPaths[drawingStruct.clientID].smooth();
                        break;
                    case 2:
                        ReceivedPaths[drawingStruct.clientID].closed = true;
                        ReceivedPaths[drawingStruct.clientID].smooth();
                        break;
                }
                view.draw();
                break;

            case 4:
                switch (drawingStruct.pType) {
                    case 0:
                        ReceivedPaths[drawingStruct.clientID] = new Path();
                        ReceivedPaths[drawingStruct.clientID].fillColor = 'white';
                        break;
                    case 1:
                        ReceivedPaths[drawingStruct.clientID].add(new Point(drawingStruct.tX * view.size.width,drawingStruct.tY * view.size.height));
                        ReceivedPaths[drawingStruct.clientID].insert(0, new Point(drawingStruct.bX * view.size.width,drawingStruct.bY *view.size.height));
                        ReceivedPaths[drawingStruct.clientID].smooth();
                        break;
                    case 2:
                        ReceivedPaths[drawingStruct.clientID].closed = true;
                        ReceivedPaths[drawingStruct.clientID].smooth();
                        break;
                }
                view.draw();
                break;
            case 15:
                Rpath = new Path.Circle(new Point(drawingStruct.sPointX*view.size.width , drawingStruct.sPointY * view.size.height)
                    ,drawingStruct.dist);
                Rpath.fillColor = drawingStruct.color;
                break;
            case 16:
                var R = new Rectangle(new Point(drawingStruct.sPointX * view.size.width,drawingStruct.sPointY*view.size.height)
                    ,new Point(drawingStruct.ePointX * view.size.width,drawingStruct.ePointY*view.size.height));
                Rpath = new Path.Rectangle(R);
                Rpath.fillColor = drawingStruct.color;
                view.draw();
                break;
            case 17:
                var rectangle = new Rectangle(new Point(drawingStruct.sPointX * view.size.width,drawingStruct.sPointY*view.size.height),
                    new Point(drawingStruct.ePointX*view.size.width,drawingStruct.ePointY*view.size.height));
                var cornerSize;
                if(rectangle.area < 2000)
                    cornerSize = new Size(2,2);
                else
                    cornerSize = new Size(20,20);
                Rpath = new Path.RoundRectangle(rectangle,cornerSize);
                Rpath.fillColor = drawingStruct.color;
                view.draw();
                break;
            case 18:
                Rpath = new Path.RegularPolygon(new Point(drawingStruct.pointX*view.size.width,drawingStruct.pointY*view.size.height)
                    ,drawingStruct.edges, drawingStruct.radius);
                Rpath.fillColor = drawingStruct.color;
                view.draw();
                break;
            case 19:
                var rect = new Path.Rectangle({
                    point: [0, 0],
                    size: [view.size.width, view.size.height],
                    strokeColor: 'white',
                    selected: false
                });
                rect.fillColor = drawingStruct.color;
                break;
            case 20:
                project.clear();
                break;
        }
    });


    /*Client side Drawing*/



    //Normal Drawing
	
	//Launching a mousedown Event
    normalDrawing.onMouseDown = function(event) {
        path = new Path();
        path.strokeColor = currentColor;
        path.add(event.point);

        /*sending data to the server in every event*/
        sendDrawingStruct({type:1,
            clientID:0,
            pType:0,
            pX: event.point.x / view.size.width,
            pY: event.point.y / view.size.height,
            color : currentColor});
    };

    normalDrawing.onMouseDrag = function(event) {
        if(event.modifiers.shift) {
            path.lastSegment.point = event.point;
        } else {
            path.add(event.point);
        }

        sendDrawingStruct({type:1,
            clientID:0,
            pType:1,
            pX: event.point.x / view.size.width,
            pY: event.point.y / view.size.height,
            shift:event.modifiers.shift});
    };

    normalDrawing.onMouseUp = function (event) {
        path.simplify(5);
        sendDrawingStruct({type:1,
            clientID:0,
            pType:2});
    };

//////////////////END of Normal Drawing//////////////

    curlyBrush.minDistance = 10;
    curlyBrush.maxDistance = 45;

    curlyBrush.onMouseDown = function(event) {
        path = new Path();
        path.fillColor = currentColor;
        path.add(event.point);

        sendDrawingStruct({type:2,
            clientID:0,
            pType:0,
            pX: event.point.x / view.size.width,
            pY: event.point.y / view.size.height,
            color : currentColor});
    };

    curlyBrush.onMouseDrag = function(event) {
        var step = new Point(event.delta.x / 2 , event.delta.y / 2);
        step.angle += 90;

        var top = new Point(event.middlePoint.x + step.x,event.middlePoint.y + step.y); // top = middlePoint + step
        var bottom = new Point(event.middlePoint.x - step.x,event.middlePoint.y - step.y); // top = middlePoint - step

        path.add(top);
        path.insert(0, bottom);
        path.smooth();


        sendDrawingStruct({type:2,
            clientID:0,
            pType:1,
            tX: top.x / view.size.width,
            tY: top.y / view.size.height,
            bX: bottom.x / view.size.width,
            bY: bottom.y / view.size.height
        });
    };

    curlyBrush.onMouseUp = function(event) {
        path.add(event.point);
        path.closed = true;
        path.smooth();

        sendDrawingStruct({type:2,
            clientID:0,
            pType:2,
            pX: event.point.x / view.size.width,
            pY: event.point.y / view.size.height
        });
    };

//////////////////END of curly Brush//////////////

    normalBrush.fixedDistance = 15;

    normalBrush.onMouseMove = function (event) {
        if(typeof tempPath !== "undefined")
            tempPath.remove();
        tempPath = new Path.Circle(event.point,normalBrush.fixedDistance / 2);
        tempPath.fillColor = null;
        tempPath.strokeColor = 'black';
        tempPath.opacity = 0.5;
        tempPoint = event.point;
    };

    normalBrush.onMouseDown = function(event) {
        path = new Path();
        path.fillColor = currentColor;

        sendDrawingStruct({type:3,
            clientID:0,
            pType:0,
            color : currentColor});
    };

    normalBrush.onMouseDrag = function(event) {
        if(typeof tempPath !== "undefined")
            tempPath.remove();

        var step = new Point(event.delta.x / 2 , event.delta.y / 2);
        step.angle += 90;
        var top = new Point(event.middlePoint.x + step.x,event.middlePoint.y + step.y); // top = middlePoint + step
        var bottom = new Point(event.middlePoint.x - step.x,event.middlePoint.y - step.y); // top = middlePoint - step

        path.add(top);
        path.insert(0, bottom);
        path.smooth();
        tempPoint = event.point;

        sendDrawingStruct({type:3,
            clientID:0,
            pType:1,
            tX: top.x / view.size.width,
            tY: top.y / view.size.height,
            bX: bottom.x / view.size.width,
            bY: bottom.y / view.size.height
        });
    };

    normalBrush.onMouseUp = function(event) {
        path.closed = true;
        path.smooth();
        sendDrawingStruct({type:3,
            clientID:0,
            pType:2
        });
    };

    normalBrush.onKeyDown = function (event) {
        if(event.key == '[' && normalBrush.fixedDistance>5)
            normalBrush.fixedDistance-=5;
        if(event.key == ']' && normalBrush.fixedDistance<60)
            normalBrush.fixedDistance+=5;

        if(typeof tempPath !== "undefined")
            tempPath.remove();
        tempPath = new Path.Circle(tempPoint,normalBrush.fixedDistance/2);
        tempPath.fillColor = null;
        tempPath.strokeColor = 'black';
        tempPath.opacity = 0.5;
    };

    //////////////////END of normal Brush//////////////
    eraser.fixedDistance = 15;

    eraser.onMouseMove = function (event) {
        if(typeof tempPath !== "undefined")
            tempPath.remove();
        tempPath = new Path.Circle(event.point,eraser.fixedDistance/2);
        tempPath.fillColor = null;
        tempPath.strokeColor = 'black';
        tempPath.opacity = 0.5;
        tempPoint = event.point;
    };

    eraser.onMouseDown = function(event) {
        path = new Path();
        path.fillColor = '#ecf0f5';
        sendDrawingStruct({type:4,
            clientID:0,
            pType:0});
    };

    eraser.onMouseDrag = function(event) {
        if(typeof tempPath !== "undefined")
            tempPath.remove();

        var step = new Point(event.delta.x / 2 , event.delta.y / 2);
        step.angle += 90;

        var top = new Point(event.middlePoint.x + step.x,event.middlePoint.y + step.y); // top = middlePoint + step
        var bottom = new Point(event.middlePoint.x - step.x,event.middlePoint.y - step.y); // top = middlePoint - step

        path.add(top);
        path.insert(0, bottom);
        path.smooth();


        sendDrawingStruct({type:4,
            clientID:0,
            pType:1,
            tX: top.x / view.size.width,
            tY: top.y / view.size.height,
            bX: bottom.x / view.size.width,
            bY: bottom.y / view.size.height
        });
    };

    eraser.onMouseUp = function(event) {
        path.closed = true;
        path.smooth();

        sendDrawingStruct({type:4,
            clientID:0,
            pType:2
        });
    };

    eraser.onKeyDown = function (event) {
        if(event.key == '[' && eraser.fixedDistance>5) {
            eraser.fixedDistance -= 5;
        }
        if(event.key == ']' && eraser.fixedDistance<60) {
            eraser.fixedDistance += 5;
        }
        if(typeof tempPath !== "undefined")
            tempPath.remove();
        tempPath = new Path.Circle(tempPoint,eraser.fixedDistance/2);
        tempPath.fillColor = null;
        tempPath.strokeColor = 'black';
        tempPath.opacity = 0.5;
    };
///////////////////end of eraser/////////////////////////////////////
    var startPoint;
    Circle.onMouseDown=function (event) {
        startPoint = event.point;
    };

    Circle.onMouseDrag=function (event) {
        if(typeof tempPath !== "undefined")
            tempPath.remove();
        tempPath = new Path.Circle(startPoint, event.point.getDistance(startPoint));
        tempPath.fillColor = currentColor;
        tempPath.opacity = 0.3;
    };
    Circle.onMouseUp=function (event) {
        tempPath.remove();
        path = new Path.Circle(startPoint,event.point.getDistance(startPoint));
        path.fillColor = currentColor;

        /*here*/
        sendDrawingStruct({type : 15,
            sPointX : startPoint.x / view.size.width,
            sPointY : startPoint.y / view.size.height,
            dist: event.point.getDistance(startPoint),
            color:currentColor
        });
    };

    ////////////////////End of Circle///////////////////

    Rect.onMouseDown=function (event) {
        startPoint = event.point;
    };

    Rect.onMouseDrag=function (event) {
        if(typeof tempPath !== "undefined")
            tempPath.remove();
        var rectangle = new Rectangle(startPoint,event.point);
        tempPath = new Path.Rectangle(rectangle);
        tempPath.fillColor = currentColor;
        tempPath.opacity = 0.3;
    };

    Rect.onMouseUp = function (event) {
        tempPath.remove();
        var rectangle = new Rectangle(startPoint,event.point);
        path = new Path.Rectangle(rectangle);
        path.fillColor = currentColor;

        sendDrawingStruct({type : 16,
            sPointX : startPoint.x / view.size.width,
            sPointY : startPoint.y / view.size.height,
            ePointX : event.point.x / view.size.width,
            ePointY : event.point.y / view.size.height,
            color:currentColor
        });


    };
    ////////////////////End of normal Rectangle///////////////////


    var cornerSize;

    RRect.onMouseDown=function (event) {
        startPoint = event.point;
    };

    RRect.onMouseDrag=function (event) {
        if(typeof tempPath !== "undefined")
            tempPath.remove();
        var rectangle = new Rectangle(startPoint,event.point);
        if(rectangle.area < 2000) {
            cornerSize = new Size(2,2);
        }
        else
            cornerSize = new Size(20,20);
        tempPath = new Path.RoundRectangle(rectangle,cornerSize);
        tempPath.fillColor = currentColor;
        tempPath.opacity = 0.3;
    };

    RRect.onMouseUp = function (event) {
        tempPath.remove();
        var rectangle = new Rectangle(startPoint,event.point);
        if(rectangle.area < 2000)
            cornerSize = new Size(2,2);
        else
            cornerSize = new Size(20,20);
        path = new Path.RoundRectangle(rectangle,cornerSize);
        path.fillColor = currentColor;

        sendDrawingStruct({type : 17,
            sPointX : startPoint.x / view.size.width,
            sPointY : startPoint.y / view.size.height,
            ePointX : event.point.x / view.size.width,
            ePointY : event.point.y / view.size.height,
            color:currentColor
        });

    };
    ////////////////////End of Rounded Rectangle///////////////////
    var edges = 3;
    var radius = 50;

    polygon.onMouseMove = function(event){
        if(typeof tempPath !== "undefined")
            tempPath.remove();

        tempPath = new Path.RegularPolygon(event.point, edges, radius);
        tempPath.fillColor = currentColor;
        tempPath.opacity = 0.3;
        tempPoint = event.point;
    };

    polygon.onMouseDown = function(event){
        path = new Path.RegularPolygon(event.point, edges, radius);
        path.fillColor = currentColor;
        tempPoint = event.point;
        sendDrawingStruct({type : 18,
            pointX : event.point.x / view.size.width,
            pointY : event.point.y / view.size.height,
            edges: edges,
            radius: radius,
            color:currentColor
        });
    };
    polygon.onKeyDown = function(event){
        if(event.key == '+' && edges < 12)
            edges++;
        if(event.key == '-' && edges > 3)
            edges--;

        if(event.key == '[' && radius >15)
            radius -= 3;
        if(event.key == ']' && radius < 200)
            radius += 3;

        if(typeof tempPath !== "undefined")
            tempPath.remove();

        tempPath = new Path.RegularPolygon(tempPoint, edges, radius);
        tempPath.fillColor = currentColor;
        tempPath.opacity = 0.3;
    };

};

function fillBG () {
    var rect = new Path.Rectangle({
        point: [0, 0],
        size: [view.size.width, view.size.height],
        strokeColor: currentColor,
        selected: false
    });
    rect.fillColor = currentColor;
    sendDrawingStruct({type:19,color : currentColor});
}

function clearScreen() {
    sendDrawingStruct({type:20});
    project.clear();
}