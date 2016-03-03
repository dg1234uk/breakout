/*global scaleCanvasForHiDPI*/
var breakout = {
  init: function () {
    var canvas = document.getElementById('gameCanvas');
    var ctx = canvas.getContext('2d');
    scaleCanvasForHiDPI(ctx);

  },

  start: function () {
    this.rAF = requestAnimationFrame(this.gameLoop);
  },

  gameLoop: function () {
    // Input
    this.update();
    this.render();
  },

  update: function () {

  },

  render: function () {

  }
};

breakout.init();
