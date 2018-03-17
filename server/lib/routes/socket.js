var cv = require('opencv'),
  async = require('async');

module.exports = function (socket) {
  socket.on('img', function (base64) {
    var output = base64.replace(/^data:image\/(png|jpeg);base64,/, "");
    var buffer = new Buffer(output, 'base64');

    async.auto({
      readFromSocket: readFromSocket(buffer),
      //face: ['readFromSocket', detect(cv.FACE_CASCADE)],
      //eyes: ['readFromSocket', detect('./node_modules/opencv/data/haarcascade_mcs_eyepair_small.xml')]
      face: ['readFromSocket', detect('./node_modules/opencv/data/haarcascade_frontalface_alt_tree.xml')]
    }, emitFrame(socket));
  })
}

var readFromSocket = function (buffer) {
  return function (callback) {
    cv.readImage(buffer, function (err, mat) {
      callback(err, mat);
    });
  }
}

//face properties
var rectColor = [0, 255, 0];
var rectThickness = 2;

var camWidth = 320;
var camHeight = 240;

var detect = function (haarfile) {
  return function (callback, results) {
    var im = results['readFromSocket'];
    im.detectObject(haarfile, {}, function (err, faces) {
      if (err) callback(err);

      // for (var i = 0; i < faces.length; i++) {
      //   face = faces[i];
      //   //im.ellipse(face.x + face.width / 2, face.y + face.height / 2, face.width / 2, face.height / 2);
      //   im.rectangle([face.x, face.y], [face.width, face.height], rectColor, rectThickness);
      // }
      if (faces.length == 0) {
        im.gaussianBlur([23, 23]);
      } else if (faces.length > 1) {
        for(var i = 0; i < faces.length; i++) {
          face = faces[i];
          im.rectangle([face.x, face.y], [face.width, face.height], rectColor, rectThickness);
        }
      } else {
      faces.forEach( function(face) {
        if (face.y <= 20) {
          var top = im.roi(0, 0, camWidth, face.y);
		  if (face.y == 0) {
			top = im.roi(0, 0, camWidth, 1);
		  }
          var left = im.roi(0, face.y, face.x, face.height+30);
		  if (face.x == 0) {
			left = im.roi(0, face.y, 1, face.height+30);
		  }
          var bottom = im.roi(0, face.y + face.height+30, camWidth, camHeight - face.y - face.height-30);
          var right = im.roi(face.x + face.width, face.y, camWidth - face.x - face.width, face.height+30);
          console.log("face.y 1 : "  + face.y);
        } else if ((camHeight-face.y-face.height) <= 30){
          console.log("bottom: " + (camHeight-face.y-face.height));
          var top = im.roi(0, 0, camWidth, face.y-20);
		  if (face.y == 0) {
			  top = im.roi(0, 0, camWidth, 1);
		  }
          var left = im.roi(0, face.y-20, face.x, face.height+20);
		  if (face.x == 0) {
			  left = im.roi(0, face.y-20, 1, face.height+20);
		  }
          var bottom = im.roi(0, face.y + face.height, camWidth, camHeight - face.y - face.height);
          var right = im.roi(face.x + face.width, face.y-20, camWidth - face.x - face.width, face.height+20);
        } else {
          var top = im.roi(0, 0, camWidth, face.y-20);
		  if (face.y == 0) {
			  top = im.roi(0, 0, camWidth, 1);
		  }
          var left = im.roi(0, face.y-20, face.x, face.height+50);
		  if (face.x == 0) {
			  left = im.roi(0, face.y-20, 1, face.height+50);
		  }
          var bottom = im.roi(0, face.y + face.height+30, camWidth, camHeight - face.y - face.height-30);
          var right = im.roi(face.x + face.width, face.y-20, camWidth - face.x - face.width, face.height+50);
          console.log("face.y 2: "  + face.y);
          console.log("bottom: " + (camHeight-face.y-face.height));
        }

        right.gaussianBlur([23, 23]);
        top.gaussianBlur([23, 23]);
        bottom.gaussianBlur([23, 23]);
        left.gaussianBlur([23, 23]);
      });}
      callback(null, im);
    });
  }
}

var emitFrame = function (socket) {
  return function (err, results) {
    if (err) {

    } else {
      //var im = results['eyes'];
      var im = results['face'];
      socket.emit('frame', {
        buffer: im.toBuffer()
      });
    }
  }
}