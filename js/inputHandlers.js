var breakout = (function (breakout){
  breakout.keydownHandler = function (e) {
    console.log('keydown: ' + e.keyCode);
  };

  breakout.keyupHandler = function (e) {
    console.log('keyup: ' + e.keyCode);
  };

  return breakout;
})(breakout || {});
