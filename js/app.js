/*global scaleCanvasForHiDPI*/
var breakout = (function() {
  var canvas, ctx, rAF, entities, paddle, ball, bricks, leftArrowKeyPressed, rightArrowKeyPressed, gameLevel;

  var init = function() {
    // Set up Canvas
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    scaleCanvasForHiDPI(ctx);

    // Setup input
    leftArrowKeyPressed = false;
    rightArrowKeyPressed = false;
    document.addEventListener('keydown', keydownHandler);
    document.addEventListener('keyup', keyupHandler);

    // Set up the level
    gameLevel = 0;
    bricks = [];
    entities = [];
    var levels = new Levels();
    levels.setupLevel(gameLevel);
    // Setup entities

    paddle = new Paddle();
    ball = new Ball();
    // Arrays for bigger games?
    // entities.push(paddle);
    // entities.push(bricks);

    start();

  };

  var keydownHandler = function(e) {
    if (e.keyCode === 37) {
      leftArrowKeyPressed = true;
    } else if (e.keyCode === 39) {
      rightArrowKeyPressed = true;
    }
  };

  var keyupHandler = function(e) {
    if (e.keyCode === 37) {
      leftArrowKeyPressed = false;
    } else if (e.keyCode === 39) {
      rightArrowKeyPressed = false;
    }
  };

  var start = function() {
    rAF = requestAnimationFrame(gameLoop);
  };

  var gameLoop = function(timeStep) {
    // debugger
    rAF = requestAnimationFrame(gameLoop);
    // Time handling
    update();
    render();
  };

  var update = function() {
    paddle.update();
    ball.update();
  };

  var render = function() {
    ctx.clearRect(0, 0, canvas.scaledWidth, canvas.scaledHeight);
    paddle.draw();
    ball.draw();
    for (var i = 0; i < bricks.length; i++) {
      bricks[i].draw();
    }
  };

  var Paddle = function() {
    this.width = 100;
    this.height = 20;
    this.x = canvas.scaledWidth / 2 - this.width / 2;
    this.y = canvas.scaledHeight - this.height;
    this.velocityX = 4;
    this.fillColor = 'red';
  };

  Paddle.prototype.update = function() {
    var prevX = this.x;
    // Handle Input & Move
    if (leftArrowKeyPressed) {
      this.x -= this.velocityX;
    } else if (rightArrowKeyPressed) {
      this.x += this.velocityX;
    }
    // Clamp to canvas
    if (this.x + this.width > canvas.scaledWidth || this.x < 0) {
      this.x = prevX;
    }
  };

  Paddle.prototype.draw = function() {
    drawRect(this.x, this.y, this.width, this.height, this.fillColor);
  };

  var Ball = function () {
    this.radius = 10;
    this.x = canvas.scaledWidth / 2;
    this.y = canvas.scaledHeight - 100;
    this.velocityX = 3;
    this.velocityY = 3;
    this.fillColor = 'green';
  };

  Ball.prototype.update = function () {
    var prevX = this.x;
    var prevY = this.y;

    this.x += this.velocityX;
    this.y += this.velocityY;

    if (this.x + this.radius / 2 > canvas.scaledWidth || this.x - this.radius / 2 < 0) {
      this.x = prevX;
      this.velocityX = -this.velocityX;
    }
    if (this.y + this.radius > canvas.scaledHeight || this.y - this.radius < 0) {
      this.y = prevY;
      this.velocityY = -this.velocityY;
    }
  };

  Ball.prototype.draw = function () {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = this.fillColor;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  };

  var Brick = function(x, y, width, height, fillColor) {
    this.width = width || 50;
    this.height = height || 20;
    this.x = x || 0;
    this.y = y || 0;
    this.fillColor = fillColor || '#000000';
  };

  Brick.prototype.draw = function() {
    drawRect(this.x, this.y, this.width, this.height, this.fillColor);
  };

  var drawRect = function(x, y, width, height, fillColor) {
    ctx.save();
    if (fillColor) {
      ctx.fillStyle = fillColor;
    }
    ctx.fillRect(x, y, width, height);
    ctx.restore();
  };

  var Levels = function() {
    this.levelData = [{
      startingX: 15,
      startingY: 10,
      rows: 3,
      columns: 8,
      padding: 10
    }];
  };

  Levels.prototype.setupLevel = function (level) {
    var rows = this.levelData[level].rows;
    var columns = this.levelData[level].columns;
    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < columns; col++) {
        var brick = new Brick();
        brick.x = this.levelData[level].startingX + (brick.width + this.levelData[level].padding) * col+1;
        var rowOffset = (brick.height + this.levelData[level].padding) * row;
        brick.y = this.levelData[level].startingY + rowOffset;
        bricks.push(brick);
      }
    }
  };

  return {
    init: init
  };
})();

breakout.init();
