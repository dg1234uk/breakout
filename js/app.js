/*global scaleCanvasForHiDPI*/
var breakout = (function() {
  var canvas, ctx, rAF, paddle, ball, bricks, leftArrowKeyPressed, rightArrowKeyPressed, gameLevel, gameState, gameScore, gameLives, gameScoreElement, gameLivesElement, gameOverLayer, gameWinLayer, ballPaddleBeep, ballBrickBeep, lastFrameTime, fps, gameFPSText, timeSinceLastUpdate, accumulator, timeStep, started;
  // TODO: Add MDNs game template stuff
  var init = function() {
    // Get references to HTML Elements
    gameScoreElement = document.getElementById('gameScoreText');
    gameLivesElement = document.getElementById('gameLivesText');
    gameOverLayer = document.getElementById('gameOverLayer');
    gameWinLayer = document.getElementById('gameWinLayer');
    gameFPSText = document.getElementById('gameFpsText');

    // Set up Canvas
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    scaleCanvasForHiDPI(ctx);

    // Setup time based animation
    timeStep = 1000 / 60; // constant dt step of 1 frame every 60 seconds
    accumulator = 0;

    started = false;

    // Don't run the game when the tab isn't visible
    window.addEventListener('focus', start);
    window.addEventListener('blur', stop);

    document.getElementById('pauseBtn').addEventListener('click', stop);
    document.getElementById('startBtn').addEventListener('click', start);

    // Setup input
    leftArrowKeyPressed = false;
    rightArrowKeyPressed = false;
    document.addEventListener('keydown', keydownHandler);
    document.addEventListener('keyup', keyupHandler);

    // Load Audio
    // FIXME: Audio Lag
    ballPaddleBeep = new Audio();
    // ballPaddleBeep.src = 'resources/bleep.wav';
    ballBrickBeep = new Audio();
    // ballBrickBeep.src = 'resources/bleep.mp3';


    // Set up the level
    gameLevel = 0;
    bricks = [];
    var levels = new Levels();
    levels.setupLevel(gameLevel);
    // Setup entities
    paddle = new Paddle();
    ball = new Ball();

    gameScore = 0;
    gameLives = 3;
    gameScoreElement.textContent = gameScore;
    gameLivesElement.textContent = gameLives;

    gameState = 'init';
    start();
  };

  var keydownHandler = function(e) {
    // keyCode 37 = Left Arrow Key
    // keyCode 39 = Right Arrow Key
    if (e.keyCode === 37) {
      leftArrowKeyPressed = true;
    } else if (e.keyCode === 39) {
      rightArrowKeyPressed = true;
    }
  };

  var keyupHandler = function(e) {
    // keyCode 37 = Left Arrow Key
    // keyCode 39 = Right Arrow Key
    if (e.keyCode === 37) {
      leftArrowKeyPressed = false;
    } else if (e.keyCode === 39) {
      rightArrowKeyPressed = false;
    }
  };


  // Pause and unpause
  function stop() {
    gameState = 'paused';
    started = false;
    cancelAnimationFrame(rAF);
  }

  function start() {
    if (!started) { // don't request multiple frames
      started = true;
      // Dummy frame to get our timestamps and initial drawing right.
      // Track the frame ID so we can cancel it if we stop quickly.
      rAF = requestAnimationFrame(function(timestamp) {
        render(); // initial draw
        gameState = 'play';
        // reset some time tracking variables
        lastFrameTime = timestamp;
        // lastFpsUpdate = timestamp;
        // framesThisSecond = 0;
        // actually start the main loop
        rAF = requestAnimationFrame(main);
      });
    }
  }

  var main = function(currentTime) {
    // Allows us to throttle the games performance
    // var maxFPS = 30;
    // if (currentTime < lastFrameTime + (1000 / maxFPS)) {
    //     requestAnimationFrame(main);
    //     return;
    // }

    rAF = requestAnimationFrame(main);
    if (!lastFrameTime) {
      lastFrameTime = currentTime;
    }

    timeSinceLastUpdate = currentTime - lastFrameTime;
    lastFrameTime = currentTime;
    accumulator += timeSinceLastUpdate;

    // Keep the update fixed to 1/60 sec to ensure there aren't collision issues etc
    // Count steps to stop panic state, can also controlm FPS to stop panic states
    var numUpdateSteps = 0;
    while (accumulator >= timeStep) {
      displayFPS(timeSinceLastUpdate / 1000);
      update(timeStep / 1000);
      accumulator -= timeStep;
      if (++numUpdateSteps >= 240) {
        panic();
        break;
      }
    }

    render();
  };

  var panic = function() {
    accumulator = 0;
  };

  var displayFPS = function(dt) {
    if (!fps) {
      fps = 0;
    }
    fps = 1 / dt;
    gameFPSText.textContent = Math.round(fps);
  };

  var update = function(dt) {
    //TODO: Switch instead of if?
    if (gameState === 'play') {
      paddle.update(dt);
      ball.update(dt);
      checkForBallBrickCollision();
      checkForBallPaddleCollision();
      checkForWinLose();
    } else if (gameState === 'won') {
      cancelAnimationFrame(rAF);
      canvas.style.display = 'none';
      gameWinLayer.style.display = 'block';
    } else if (gameState === 'gameOver') {
      cancelAnimationFrame(rAF);
      canvas.style.display = 'none';
      gameOverLayer.style.display = 'block';
    } else {
      cancelAnimationFrame(rAF);
    }
  };

  var checkForBallBrickCollision = function() {
    for (var i = 0; i < bricks.length; i++) {
      var collision = AABBIntersection(ball.boundingBox, bricks[i]);
      if (collision) {
        // ballBrickBeep.play();
        bricks.splice(i, 1);
        gameScore += 25;
        ball.velocityY *= -1;
      }
    }
  };

  var checkForBallPaddleCollision = function() {
    if (AABBIntersection(ball.boundingBox, paddle)) {
      // Always return a +ve value to hack fix the 'sticky paddle' bug.
      // ballPaddleBeep.play();
      ball.velocityY = -1 * Math.abs(ball.velocityY);
    }
  };

  var checkForWinLose = function() {
    // Check for losing condition (ball dropped)
    if (ball.y - ball.radius > canvas.scaledHeight) {
      if (gameLives > 1) {
        gameLives--;
        // TODO: turn this into a ballReset method on Ball
        ball.x = canvas.scaledWidth / 2;
        ball.y = canvas.scaledHeight - 100;
      } else {
        gameLives = 0;
        gameState = 'gameOver';
      }
    }
    // Check for winning condiiton (no more bricks)
    if (bricks.length === 0) {
      gameState = 'won';
    }
  };

  var render = function() {
    ctx.clearRect(0, 0, canvas.scaledWidth, canvas.scaledHeight);
    paddle.draw();
    ball.draw();
    for (var i = 0; i < bricks.length; i++) {
      bricks[i].draw();
    }
    gameScoreElement.textContent = gameScore;
    gameLivesElement.textContent = gameLives;
  };

  var Paddle = function() {
    this.width = 100;
    this.height = 20;
    this.x = canvas.scaledWidth / 2 - this.width / 2;
    this.y = canvas.scaledHeight - this.height;
    this.velocityX = 300;
    this.fillColor = 'red';
  };

  Paddle.prototype.update = function(dt) {
    var prevX = this.x;
    // Handle Input & Move
    if (leftArrowKeyPressed) {
      this.x -= this.velocityX * dt;
    } else if (rightArrowKeyPressed) {
      this.x += this.velocityX * dt;
    }
    // Clamp to canvas
    if (this.x + this.width > canvas.scaledWidth || this.x < 0) {
      this.x = prevX;
    }
  };

  Paddle.prototype.draw = function() {
    drawRect(this.x, this.y, this.width, this.height, this.fillColor);
  };

  var Ball = function() {
    this.radius = 10;
    this.x = canvas.scaledWidth / 2;
    this.y = canvas.scaledHeight - 100;
    this.velocityX = 200;
    this.velocityY = 200;
    this.fillColor = 'green';

    Object.defineProperty(this, 'boundingBox', {
      get: function() {
        return {
          x: ball.x - ball.radius,
          y: ball.y - ball.radius,
          width: ball.radius * 2,
          height: ball.radius * 2
        };
      },
    });
  };

  Ball.prototype.update = function(dt) {
    var prevX = this.x;
    var prevY = this.y;

    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    if (this.x + this.radius / 2 > canvas.scaledWidth || this.x - this.radius / 2 < 0) {
      this.x = prevX;
      this.velocityX = -this.velocityX;
    }
    if (this.y - ball.radius < 0) {
      this.y = prevY;
      this.velocityY = -this.velocityY;
    }
  };

  Ball.prototype.draw = function() {
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
    // TODO: Define colors as properties on here.
    // TODO: Use the Rectangle tool to create a 38x18px rectangle and apply the next gradient: #CC0000, #8E0000, #FF5656.
    this.levelData = [{
      brickWidth: 50,
      brickHeight: 20,
      brickPadding: 10,
      data: [
        [1, 1, 1, 1, 1, 1, 1, 1],
        [2, 2, 2, 2, 2, 2, 2, 2],
        [3, 3, 3, 3, 3, 3, 3, 3]
      ]
    }, {
      brickWidth: 50,
      brickHeight: 20,
      brickPadding: 10,
      data: [
        [1, 1, 1, 1, 1, 1],
        [2, 2, 0, 0, 2, 2],
        [3, 3, 0, 0, 3, 3]
      ]
    }];
  };

  Levels.prototype.setupLevel = function(level) {
    var rows = this.levelData[level].data.length;
    var columns = this.levelData[level].data[0].length;
    var startingX = (canvas.scaledWidth / 2) - (((columns * this.levelData[level].brickWidth) + this.levelData[level].brickPadding * (columns - 1)) / 2);
    var startingY = 10;
    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < columns; col++) {
        if (this.levelData[level].data[row][col] > 0) {
          var width = this.levelData[level].brickWidth;
          var height = this.levelData[level].brickHeight;
          var padding = this.levelData[level].brickPadding;
          var x = startingX + (width + padding) * col + 1;
          var y = startingY + (height + padding) * row;

          var brickColor;
          switch (this.levelData[level].data[row][col]) {
            case 1:
              brickColor = 'red';
              break;
            case 2:
              brickColor = 'green';
              break;
            case 3:
              brickColor = 'blue';
              break;
            default:
              brickColor = '#000000';

          }

          var brick = new Brick(x, y, width, height, brickColor);
          bricks.push(brick);
        }
      }
    }
  };

  var AABBIntersection = function(rect1, rect2) {
    // TODO: Check arguments are correct.
    if (rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.height + rect1.y > rect2.y) {
      return true;
    }
    return false;
  };

  return {
    init: init
  };
})();

breakout.init();
