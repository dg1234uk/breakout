function scaleCanvasForHiDPI(context) {             // jshint ignore:line
  var canvas = context.canvas;
  // Get the ratio
  var devicePixelRatio = window.devicePixelRatio || 1;

  // Scale the canvas if devicePixelRatio is not equal to 1
  if (devicePixelRatio !== 1) {

    var oldWidth = canvas.width;
    var oldHeight = canvas.height;

    // Scale the canvas by devicePixelRatio
    canvas.width = oldWidth * devicePixelRatio;
    canvas.height = oldHeight * devicePixelRatio;

    // Scale the canvas back down and its content with CSS
    canvas.style.width = oldWidth + 'px';
    canvas.style.height = oldHeight + 'px';

    // Scale context by devicePixelRatio to counter the scaling of the canvas
    context.scale(devicePixelRatio, devicePixelRatio);
    // Save the graphics state with our scale applied
    context.save();

    // Set the scaled dimension properties on the canvas for reference for drawing etc.
    // Or us canvas.getBoundingClientRect().width & height
    canvas.scaledWidth = oldWidth;
    canvas.scaledHeight = oldHeight;
  } else {
    canvas.scaledWidth = canvas.width;
    canvas.scaledHeight = canvas.height;
  }
}
