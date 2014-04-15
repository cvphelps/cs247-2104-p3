// Initial code by Borui Wang, updated by Graham Roth
// For CS247, Spring 2014

(function() {

  var cur_video_blob = null;
  var fb_instance;

  $(document).ready(function(){
    connect_to_chat_firebase();
    connect_webcam();
  });

  var overlay = jQuery('<div id="overlay"> </div>');
  overlay.appendTo(document.body);

  function connect_to_chat_firebase(){
    /* Include your Firebase link here!*/
    fb_instance = new Firebase("https://zebra-p3.firebaseio.com");

    // generate new chatroom id or use existing id
    var url_segments = document.location.href.split("/#");
    if(url_segments[1]){
      fb_chat_room_id = url_segments[1];
    }else{
      fb_chat_room_id = Math.random().toString(36).substring(7);
    }
    display_msg({m:"Share this chat's url: "+ document.location.origin+"/#"+fb_chat_room_id,c:"red"})

    // set up variables to access firebase data structure
    var fb_new_chat_room = fb_instance.child('chatrooms').child(fb_chat_room_id);
    var fb_instance_users = fb_new_chat_room.child('users');
    var fb_instance_stream = fb_new_chat_room.child('stream');
    var my_color = "#"+((1<<24)*Math.random()|0).toString(16);

    // listen to events
    fb_instance_users.on("child_added",function(snapshot){
      display_msg({m:snapshot.val().name+" joined the room",c: snapshot.val().c});
    });
    fb_instance_stream.on("child_added",function(snapshot){
      display_msg(snapshot.val());
    });

    // block until username is answered
    var username = window.prompt("May I ask your name?");
    if(!username){
      username = "friend"+Math.floor(Math.random()*1111);
    }
    fb_instance_users.push({ name: username,c: my_color});
    $("#waiting").remove();

    // bind submission box
    $("#submission input").keydown(function( event ) {
      if (event.which == 13) {
        var input = $(this).val();
        if(has_emotions(input)){
          fb_instance_stream.push({m:username+": " +$(this).val(), v:cur_video_blob, c: my_color});
        }else{
          fb_instance_stream.push({m:username+": " +$(this).val(), c: my_color});
        }
        var placeholder_array = [
            "Tell me more...",
            "How does that make you feel?",
            "Talk to me...",
            "Keep it up...",
            "Talk it out...",
            "Ok, go on...",
            "More feelings...",
            "I'm all about the feelings..."
          ]
          var randomNumber = Math.floor(Math.random()*placeholder_array.length);
        if(has_loneliness(input)){
          $('#overlay').css({"background-color":"#66a2c4"});
          $('#conversation video').css({"background-color":"#66a2c4"});
        }
        if(has_happiness(input)){
          $('#overlay').css({"background-color":"#e0ff9e"});
          $('#conversation video').css({"background-color":"#e0ff9e"});
          var inputbox = document.getElementById('inputbox');
          inputbox.placeholder = placeholder_array[randomNumber];
        }
        if(has_excitement(input)){
          $('#overlay').css({"background-color":"#f5c400"});
          $('#conversation video').css({"background-color":"#f5c400"});
        }
        if(has_fear(input)){
          $('#overlay').css({"background-color":"#cf2900"});
          $('#conversation video').css({"background-color":"#cf2900"});
        }
        if(has_calm(input)){
          $('#overlay').css({"background-color":"#0debff"});
          $('#conversation video').css({"background-color":"#0debff"});
        }
        if(has_sadness(input)){
          $('#overlay').css({"background-color":"#141f99"});
          $('#conversation video').css({"background-color":"#141f99"});
        }
        if(has_anxiety(input)){
          $('#overlay').css({"background-color":"#9cd900"});
          $('#conversation video').css({"background-color":"#9cd900"});
        }
        if(has_idiot(input)){
          $('#overlay').css({"background-color":"#804d00"});
          $('#conversation video').css({"background-color":"#804d00"});
        }
        if(has_anger(input)){
          $('#overlay').css({"background-color":"#ff003c"});
          $('#conversation video').css({"background-color":"#ff003c"});
        }
        $(this).val("");
        scroll_to_bottom(0);
      }
    });

    // scroll to bottom in case there is already content
    scroll_to_bottom(1300);
  }

  // creates a message node and appends it to the conversation
  function display_msg(data){
    $("#conversation").append("<div class='msg' style='color:"+data.c+"'>"+data.m+"</div>");
    if(data.v){
      // for video element
      var video = document.createElement("video");
      video.autoplay = true;
      //video.controls = false; // optional
      video.loop = true;
      video.width = 500;
      //video.color = #ea64d8; 

      var source = document.createElement("source");
      source.src =  URL.createObjectURL(base64_to_blob(data.v));
      source.type =  "video/webm";

      video.appendChild(source);

      // for gif instead, use this code below and change mediaRecorder.mimeType in onMediaSuccess below
      // var video = document.createElement("img");
      // video.src = URL.createObjectURL(base64_to_blob(data.v));

      //$("#conversation").append("<div class='overlay' style='background-color:#3ac43a'></div>");
      //document.getElementById("background-video").appendChild(video);


      document.getElementById("conversation").appendChild(video);
    }
  }

  function scroll_to_bottom(wait_time){
    // scroll to bottom of div
    setTimeout(function(){
      $("html, body").animate({ scrollTop: $(document).height() }, 200);
    },wait_time);
  }

  function connect_webcam(){
    // we're only recording video, not audio
    var mediaConstraints = {
      video: true,
      audio: false
    };

    // callback for when we get video stream from user.
    var onMediaSuccess = function(stream) {
      // create video element, attach webcam stream to video element
      var video_width= 160;
      var video_height= 120;
      var webcam_stream = document.getElementById('webcam_stream');
      var video = document.createElement('video');
      webcam_stream.innerHTML = "";
      // adds these properties to the video
      video = mergeProps(video, {
          controls: false,
          width: video_width,
          height: video_height,
          src: URL.createObjectURL(stream)
      });
      video.play();
      webcam_stream.appendChild(video);

      // counter
      var time = 0;
      var second_counter = document.getElementById('second_counter');
      var second_counter_update = setInterval(function(){
        second_counter.innerHTML = time++;
      },1000);

      // now record stream in 5 seconds interval
      var video_container = document.getElementById('video_container');
      var mediaRecorder = new MediaStreamRecorder(stream);
      var index = 1;

      mediaRecorder.mimeType = 'video/webm';
      // mediaRecorder.mimeType = 'image/gif';
      // make recorded media smaller to save some traffic (80 * 60 pixels, 3*24 frames)
      mediaRecorder.video_width = video_width/2;
      mediaRecorder.video_height = video_height/2;

      mediaRecorder.ondataavailable = function (blob) {
          //console.log("new data available!");
          video_container.innerHTML = "";

          // convert data into base 64 blocks
          blob_to_base64(blob,function(b64_data){
            cur_video_blob = b64_data;
          });
      };
      setInterval( function() {
        mediaRecorder.stop();
        mediaRecorder.start(2000);
      }, 2000 );
      console.log("connect to media stream!");
    }

    // callback if there is an error when we try and get the video stream
    var onMediaError = function(e) {
      console.error('media error', e);
    }

    // get video stream from user. see https://github.com/streamproc/MediaStreamRecorder
    navigator.getUserMedia(mediaConstraints, onMediaSuccess, onMediaError);
  }

  // check to see if a message qualifies to be replaced with video.
  var has_emotions = function(msg){
    if(has_loneliness(msg) || has_happiness(msg) || has_excitement(msg) || has_fear(msg) || has_calm(msg) || has_sadness(msg) || has_anxiety(msg) || has_idiot(msg) || has_anger(msg)){
      return true;
    }
    /*var options = ["lol",":)",":("];
    for(var i=0;i<options.length;i++){
      if(msg.indexOf(options[i])!= -1){
        return true;
      }
    }*/
    return false;
  }

  var has_loneliness = function(msg){
    var options = ["lonely","loneliness","alone","awkward","isolated","distant","strange","weird","uncool"];
    for(var i=0;i<options.length;i++){
      if(msg.indexOf(options[i])!= -1){
        return true;
      }
    }
    return false;
  }

  var has_happiness = function(msg){
    var options = ["lol",":)",":-)","yay","happy","good","smile","wonderful","lively","love","joy","pleasure","fortunate","grand","warm","sunny","enjoy","haha","omg","ermagerd","yuss","yiss","yes","better","recovering"];
    for(var i=0;i<options.length;i++){
      if(msg.indexOf(options[i])!= -1){
        return true;
      }
    }
    return false;
  }

  var has_excitement = function(msg){
    var options = ["excite","cray","crazy","passionate","thrilled","amazed"];
    for(var i=0;i<options.length;i++){
      if(msg.indexOf(options[i])!= -1){
        return true;
      }
    }
    return false;
  }

  var has_fear = function(msg){
    var options = ["afraid","terrified","frightened"];
    for(var i=0;i<options.length;i++){
      if(msg.indexOf(options[i])!= -1){
        return true;
      }
    }
    return false;
  }

  var has_calm = function(msg){
    var options = [":|","fine","ok","alright","calm","satisfied","meh","sure"];
    for(var i=0;i<options.length;i++){
      if(msg.indexOf(options[i])!= -1){
        return true;
      }
    }
    return false;
  }

  var has_sadness = function(msg){
    var options = [":(",":/",":-(","sad","unhappy","upset","disappointed"];
    for(var i=0;i<options.length;i++){
      if(msg.indexOf(options[i])!= -1){
        return true;
      }
    }
    return false;
  }

  var has_anxiety = function(msg){
    var options = [":{","*~*","^_^","nervous","unsure","anxious","anxiety","worried"];
    for(var i=0;i<options.length;i++){
      if(msg.indexOf(options[i])!= -1){
        return true;
      }
    }
    return false;
  }

  var has_anger = function(msg){
    var options = ["angry","grumpy","furious","mad"];
    for(var i=0;i<options.length;i++){
      if(msg.indexOf(options[i])!= -1){
        return true;
      }
    }
    return false;
  }

  var has_idiot = function(msg){
    var options = ["8===>","boobz","4chan","/b"];
    for(var i=0;i<options.length;i++){
      if(msg.indexOf(options[i])!= -1){
        return true;
      }
    }
    return false;
  }




  // some handy methods for converting blob to base 64 and vice versa
  // for performance bench mark, please refer to http://jsperf.com/blob-base64-conversion/5
  // note useing String.fromCharCode.apply can cause callstack error
  var blob_to_base64 = function(blob, callback) {
    var reader = new FileReader();
    reader.onload = function() {
      var dataUrl = reader.result;
      var base64 = dataUrl.split(',')[1];
      callback(base64);
    };
    reader.readAsDataURL(blob);
  };

  var base64_to_blob = function(base64) {
    var binary = atob(base64);
    var len = binary.length;
    var buffer = new ArrayBuffer(len);
    var view = new Uint8Array(buffer);
    for (var i = 0; i < len; i++) {
      view[i] = binary.charCodeAt(i);
    }
    var blob = new Blob([view]);
    return blob;
  };

//})();


// SKETCHY THING I'M TRYING TO DO WITH THE VIDEO STREAM
//(function() {
  var video;
  var copy;
  var copycanvas;
  var draw;

  var TILE_WIDTH = 32;
  var TILE_HEIGHT = 24;
  var TILE_CENTER_WIDTH = 16;
  var TILE_CENTER_HEIGHT = 12;
  var SOURCERECT = {x:0, y:0, width:0, height:0};
  var PAINTRECT = {x:0, y:0, width:1000, height:600};

  function init(){
    video = document.getElementById('sourcevid');
    copycanvas = document.getElementById('sourcecopy');
    copy = copycanvas.getContext('2d');
    var outputcanvas = document.getElementById('output');
    draw = outputcanvas.getContext('2d');
    setInterval("processFrame()", 33);
  }
  function createTiles(){
    var offsetX = TILE_CENTER_WIDTH+(PAINTRECT.width-SOURCERECT.width)/2;
    var offsetY = TILE_CENTER_HEIGHT+(PAINTRECT.height-SOURCERECT.height)/2;
    var y=0;
    while(y < SOURCERECT.height){
      var x=0;
      while(x < SOURCERECT.width){
        var tile = new Tile();
        tile.videoX = x;
        tile.videoY = y;
        tile.originX = offsetX+x;
        tile.originY = offsetY+y;
        tile.currentX = tile.originX;
        tile.currentY = tile.originY;
        tiles.push(tile);
        x+=TILE_WIDTH;
      }
      y+=TILE_HEIGHT;
    }
  }

  var RAD = Math.PI/180;
  var randomJump = false;
  var tiles = [];
  var debug = false;
  function processFrame(){
    if(!isNaN(video.duration)){
      if(SOURCERECT.width == 0){
        SOURCERECT = {x:0,y:0,width:video.videoWidth,height:video.videoHeight};
        createTiles();
      }
      //this is to keep my sanity while developing
      if(randomJump){
        randomJump = false;
        video.currentTime = Math.random()*video.duration;
      }
      //loop
      if(video.currentTime == video.duration){
        video.currentTime = 0;
      }
    }
    var debugStr = "";
    //copy tiles
    copy.drawImage(video, 0, 0);
    draw.clearRect(PAINTRECT.x, PAINTRECT.y,PAINTRECT.width,PAINTRECT.height);
    
    for(var i=0; i<tiles.length; i++){
      var tile = tiles[i];
      if(tile.force > 0.0001){
        //expand
        tile.moveX *= tile.force;
        tile.moveY *= tile.force;
        tile.moveRotation *= tile.force;
        tile.currentX += tile.moveX;
        tile.currentY += tile.moveY;
        tile.rotation += tile.moveRotation;
        tile.rotation %= 360;
        tile.force *= 0.9;
        if(tile.currentX <= 0 || tile.currentX >= PAINTRECT.width){
          tile.moveX *= -1;
        }
        if(tile.currentY <= 0 || tile.currentY >= PAINTRECT.height){
          tile.moveY *= -1;
        }
      }else if(tile.rotation != 0 || tile.currentX != tile.originX || tile.currentY != tile.originY){
        //contract
        var diffx = (tile.originX-tile.currentX)*0.2;
        var diffy = (tile.originY-tile.currentY)*0.2;
        var diffRot = (0-tile.rotation)*0.2;
        
        if(Math.abs(diffx) < 0.5){
          tile.currentX = tile.originX;
        }else{
          tile.currentX += diffx;
        }
        if(Math.abs(diffy) < 0.5){
          tile.currentY = tile.originY;
        }else{
          tile.currentY += diffy;
        }
        if(Math.abs(diffRot) < 0.5){
          tile.rotation = 0;
        }else{
          tile.rotation += diffRot;
        }
      }else{
        tile.force = 0;
      }
      draw.save();
      draw.translate(tile.currentX, tile.currentY);
      draw.rotate(tile.rotation*RAD);
      draw.drawImage(copycanvas, tile.videoX, tile.videoY, TILE_WIDTH, TILE_HEIGHT, -TILE_CENTER_WIDTH, -TILE_CENTER_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
      draw.restore();
    }
  }

  function explode(x, y){
    for(var i=0; i<tiles.length; i++){
      var tile = tiles[i];
      
      var xdiff = tile.currentX-x;
      var ydiff = tile.currentY-y;
      var dist = Math.sqrt(xdiff*xdiff + ydiff*ydiff);
      
      var randRange = 220+(Math.random()*30);
      var range = randRange-dist;
      var force = 3*(range/randRange);
      if(force > tile.force){
        tile.force = force;
        var radians = Math.atan2(ydiff, xdiff);
        tile.moveX = Math.cos(radians);
        tile.moveY = Math.sin(radians);
        tile.moveRotation = 0.5-Math.random();
      }
    }
    tiles.sort(zindexSort);
    processFrame();
  }
  function zindexSort(a, b){
    return (a.force-b.force);
  }

  function dropBomb(evt, obj){
    var posx = 0;
    var posy = 0;
    var e = evt || window.event;
    if (e.pageX || e.pageY){
      posx = e.pageX;
      posy = e.pageY;
    }else if (e.clientX || e.clientY) {
      posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    var canvasX = posx-obj.offsetLeft;
    var canvasY = posy-obj.offsetTop;
    explode(canvasX, canvasY);
  }

  function Tile(){
    this.originX = 0;
    this.originY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.rotation = 0;
    this.force = 0;
    this.z = 0;
    this.moveX= 0;
    this.moveY= 0;
    this.moveRotation = 0;
    
    this.videoX = 0;
    this.videoY = 0;
  }

  /*
    getPixel
    return pixel object {r,g,b,a}
  */
  function getPixel(imageData, x, y){
    var data = imageData.data;
    var pos = (x + y * imageData.width) * 4;
    return {r:data[pos], g:data[pos+1], b:data[pos+2], a:data[pos+3]}
  }
  /*
    setPixel
    set pixel object {r,g,b,a}
  */
  function setPixel(imageData, x, y, pixel){
    var data = imageData.data;
    var pos = (x + y * imageData.width) * 4;
    data[pos] = pixel.r;
    data[pos+1] = pixel.g;
    data[pos+2] = pixel.b;
    data[pos+3] = pixel.a;
  }
  /*
    copyPixel
    faster then using getPixel/setPixel combo
  */
  function copyPixel(sImageData, sx, sy, dImageData, dx, dy){
    var spos = (sx + sy * sImageData.width) * 4;
    var dpos = (dx + dy * dImageData.width) * 4;
    dImageData.data[dpos] = sImageData.data[spos];     //R
    dImageData.data[dpos+1] = sImageData.data[spos+1]; //G
    dImageData.data[dpos+2] = sImageData.data[spos+2]; //B
    dImageData.data[dpos+3] = sImageData.data[spos+3]; //A
  }

})();
