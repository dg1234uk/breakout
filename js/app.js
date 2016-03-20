/*global scaleCanvasForHiDPI*/
// TODO: Add audio
// TODO: Add options, ball start on paddle, speed, FPS, and other dev options
// TODO: Improve Ball collision, so that if it hits a side of a rectangle it doesnt bounce up.
// TODO: Add start ball on paddle with a click or button press, selected via options
// TODO: Once level complete progress to next level until all levels complete.
// TODO: Complete JSDoc comments

/**
 * breakout - IIFE
 */
var breakout = (function() {
  var game = {
    options: {
      timeStep: 1000 / 60, // constant dt step of 1 frame every 60 seconds
    },
    init: function() {
      // Get references to HTML Elements
      game.gameScoreElement = document.getElementById('gameScoreText');
      game.gameLivesElement = document.getElementById('gameLivesText');
      game.gameOverLayer = document.getElementById('gameOverLayer');
      game.gameWinLayer = document.getElementById('gameWinLayer');
      game.gameFPSText = document.getElementById('gameFpsText');
      game.gamePauseLayer = document.getElementById('gamePauseLayer');
      game.gameLevelText = document.getElementById('gameLevelText');

      // Set up Canvas
      game.canvas = document.getElementById('gameCanvas');
      game.ctx = game.canvas.getContext('2d');
      scaleCanvasForHiDPI(game.ctx);

      // Setup time based animation
      game.timeStep = game.options.timeStep;
      game.accumulator = 0;

      game.gameState = 'init';
      game.playing = false;

      // GAME EVENT LISTENERS
      // Don't run the game when the tab isn't visible
      window.addEventListener('blur', game.stop);

      // Set up the start, pause, reset and level button event listeners
      document.getElementById('pauseBtn').addEventListener('click', game.stop);
      document.getElementById('startBtn').addEventListener('click', game.start);
      document.getElementById('resetBtn').addEventListener('click', game.reset);
      document.getElementById('nextLevelBtn').addEventListener('click', game.nextLevel);
      document.getElementById('prevLevelBtn').addEventListener('click', game.prevLevel);

      // Setup input event Listeners
      game.leftArrowKeyPressed = false;
      game.rightArrowKeyPressed = false;
      document.addEventListener('keydown', game.keydownHandler);
      document.addEventListener('keyup', game.keyupHandler);

      // Load Audio
      //ballPaddleBeep = new Audio();
      // ballPaddleBeep.src = 'resources/bleep.wav';
      //ballBrickBeep = new Audio();
      // ballBrickBeep.src = 'resources/bleep.mp3';

      game.gameLevel = 0;
      game.reset();
    },

    // EVENT HANDLERS
    /**
     * keydownHandler - Detects if left or right arrow key is pressed and sets
     * the appropiate boolean
     * @param  {event} e The Event object passed
     */
    keydownHandler: function(e) {
      // keyCode 37 = Left Arrow Key
      // keyCode 39 = Right Arrow Key
      if (e.keyCode === 37) {
        game.leftArrowKeyPressed = true;
      } else if (e.keyCode === 39) {
        game.rightArrowKeyPressed = true;
      }
    },

    /**
     * keyupHandler - Detects if left or right arrow key is released and sets
     * the appropiate boolean
     * @param  {event} e The Event object passed
     */
    keyupHandler: function(e) {
      // keyCode 37 = Left Arrow Key
      // keyCode 39 = Right Arrow Key
      if (e.keyCode === 37) {
        game.leftArrowKeyPressed = false;
      } else if (e.keyCode === 39) {
        game.rightArrowKeyPressed = false;
      }
    },

    // Pause and unpause
    stop: function() {
      if (game.gameState === 'play') {
        game.gameState = 'paused';
        game.playing = false;
        cancelAnimationFrame(game.rAF);
        game.gamePauseLayer.style.display = 'block';
      }
    },

    start: function() {
      if (!game.playing && game.gameState !== 'won' && game.gameState !== 'gameOver') { // don't request multiple frames
        game.playing = true;
        game.gamePauseLayer.style.display = 'none';
        // Dummy frame to get our timestamps and initial drawing right.
        // Track the frame ID so we can cancel it if we stop quickly.
        game.rAF = requestAnimationFrame(function(timestamp) {
          game.render(); // initial draw
          game.gameState = 'play';
          // reset some time tracking variables
          game.lastFrameTime = timestamp;
          // actually start the main loop
          game.rAF = requestAnimationFrame(game.main);
        });
      }
    },

    reset: function() {
      game.stop();
      // Keep score if player has completed last level
      if (game.gameState !== 'nextLevel') {
        game.gameScore = 0;
      }
      game.gameState = 'reset';
      // Set up the level
      game.bricks = [];
      var levels = new Levels();
      levels.setupLevel(game.gameLevel);
      // Setup entities
      game.paddle = new Paddle();
      game.ball = new Ball();

      game.gameLives = 3;
      game.gameScoreElement.textContent = game.gameScore;
      game.gameLivesElement.textContent = game.gameLives;
      game.gameLevelText.textContent = game.gameLevel + 1;
      game.gameWinLayer.style.display = 'none';
      game.gameOverLayer.style.display = 'none';
      game.canvas.style.display = 'block';

      game.start();
    },

    nextLevel: function() {

      var levels = new Levels();
      if (levels.levelData.length > game.gameLevel + 1) {
        game.gameLevel++;
        game.reset();
      } else if (game.gameState === 'nextLevel' && levels.levelData.length <= game.gameLevel + 1) {
        debugger;
        game.gameState = 'won';
      }
    },

    prevLevel: function() {
      if (game.gameLevel - 1 >= 0) {
        game.gameLevel--;
        game.reset();
      }
    },

    // GAME LOGIC
    main: function(currentTime) {
      // Allows us to throttle the games performance
      // var maxFPS = 30;
      // if (throttleFPS(maxFPS, currentTime)) {return;}

      game.rAF = requestAnimationFrame(game.main);
      if (!game.lastFrameTime) {
        game.lastFrameTime = currentTime;
      }

      // console.log('main lastFrameTime: ' + lastFrameTime);
      game.timeSinceLastUpdate = currentTime - game.lastFrameTime;
      game.lastFrameTime = currentTime;
      game.accumulator += game.timeSinceLastUpdate;

      // Keep the update fixed to 1/60 sec to ensure there aren't collision issues etc
      // Count steps to stop panic state, could also control FPS to stop panic states
      // TODO: Better document it
      var numUpdateSteps = 0;
      while (game.accumulator >= game.timeStep) {
        game.displayFPS(game.timeSinceLastUpdate / 1000);
        game.update(game.timeStep / 1000);
        game.accumulator -= game.timeStep;
        if (++numUpdateSteps >= 240) {
          game.panic();
          break;
        }
      }
      game.render();
    },

    panic: function() {
      game.accumulator = 0;
    },

    displayFPS: function(dt) {
      // if (!game.fps) {
      //   game.fps = 0;
      // }
      // game.fps = 1 / dt;
      var fps = 1 / dt;
      game.gameFPSText.textContent = Math.round(fps);
    },

    /**
     * throttleFPS - Runs the update loop no quicker than maxFPS.
     * @param  {number} maxFPS      The maximum FPS you wish the app to run at.
     * @param  {DOMHighResTimeStamp} currentTime the currentTime in ms.
     * @return {boolean}             true if update loop should return prior.
     */
    throttleFPS: function(maxFPS, currentTime) { // jshint ignore:line
      if (currentTime < game.lastFrameTime + (1000 / maxFPS)) {
        requestAnimationFrame(game.main);
        return true;
      }
      return false;
    },

    update: function(dt) {
      //TODO: Switch instead of if?
      if (game.gameState === 'play') {
        game.paddle.update(dt);
        game.ball.update(dt);
        game.checkForBallBrickCollision();
        game.checkForBallPaddleCollision();
        game.checkForWinLose();
      } else if (game.gameState === 'won') {
        cancelAnimationFrame(game.rAF);
        game.canvas.style.display = 'none';
        game.gameWinLayer.style.display = 'block';
      } else if (game.gameState === 'gameOver') {
        cancelAnimationFrame(game.rAF);
        game.canvas.style.display = 'none';
        game.gameOverLayer.style.display = 'block';
      } else {
        cancelAnimationFrame(game.rAF);
      }
    },

    render: function() {
      game.ctx.clearRect(0, 0, game.canvas.scaledWidth, game.canvas.scaledHeight);
      game.paddle.draw();
      game.ball.draw();
      for (var i = 0; i < game.bricks.length; i++) {
        game.bricks[i].draw();
      }
      game.gameScoreElement.textContent = game.gameScore;
      game.gameLivesElement.textContent = game.gameLives;
    },

    checkForWinLose: function() {
      // Check for losing condition (ball dropped)
      if (game.ball.y - game.ball.radius > game.canvas.scaledHeight) {
        if (game.gameLives > 1) {
          game.gameLives--;
          // TODO: turn game into a ballReset method on Ball
          game.ball.x = game.canvas.scaledWidth / 2;
          game.ball.y = game.canvas.scaledHeight - 200;
          var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
          game.ball.velocityX = plusOrMinus * (2 + Math.random() * 8);
          game.ball.velocityY = 200;
        } else {
          game.gameLives = 0;
          game.gameState = 'gameOver';
          game.playing = false;
        }
      }
      // Check for winning condiiton (no more bricks)
      if (game.bricks.length === 0) {
        game.gameState = 'nextLevel';
        game.playing = false;
        game.nextLevel();
      }
    },

    // Collision Detection
    checkForBallBrickCollision: function() {
      for (var i = 0; i < game.bricks.length; i++) {
        var collision = game.AABBIntersection(game.ball.boundingBox, game.bricks[i]);
        if (collision) {
          // ballBrickBeep.play();
          game.bricks.splice(i, 1);
          game.gameScore += 25;
          game.ball.velocityY *= -1;
        }
      }
    },

    checkForBallPaddleCollision: function() {
      if (game.AABBIntersection(game.ball.boundingBox, game.paddle)) {
        // Always return a +ve value to hack fix the 'sticky paddle' bug.
        // ballPaddleBeep.play();
        game.ball.velocityY = -1 * Math.abs(game.ball.velocityY);

        var diff = 0;
        var paddleCenter = game.paddle.x + (game.paddle.width / 2);
        var ballCenterX = game.ball.x + (game.ball.radius / 2);

        // ball.velocityX varies based on where the ball hits the paddle.
        if (ballCenterX < paddleCenter) {
          //  Ball is on the left-hand side of the paddle
          diff = paddleCenter - ballCenterX;
          game.ball.velocityX = -1 * (10 * diff);
        } else if (ballCenterX > paddleCenter) {
          //  Ball is on the right-hand side of the paddle
          diff = ballCenterX - paddleCenter;
          game.ball.velocityX = 10 * diff;
        } else {
          //  Ball is perfectly in the middle
          //  Add a little random X to stop it bouncing straight up!
          game.ball.velocityX = Math.abs(game.ball.velocityX) + 2 + Math.random() * 8;
        }
      }
    },

    AABBIntersection: function(rect1, rect2) {
      // TODO: Check arguments are correct.
      if (rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.height + rect1.y > rect2.y) {
        return true;
      }
      return false;
    }
  };

  // GAME ENTITIES
  var Paddle = function() {
    this.width = 100;
    this.height = 20;
    this.x = game.canvas.scaledWidth / 2 - this.width / 2;
    this.y = game.canvas.scaledHeight - this.height - 25;
    this.velocityX = 400;
    this.fillColor = '#ffffff';
  };

  Paddle.prototype.update = function(dt) {
    var prevX = this.x;
    // Handle Input & Move
    if (game.leftArrowKeyPressed) {
      this.x -= this.velocityX * dt;
    } else if (game.rightArrowKeyPressed) {
      this.x += this.velocityX * dt;
    }
    // Clamp to canvas
    if (this.x + this.width > game.canvas.scaledWidth || this.x < 0) {
      // Ensures that the paddle goes all the way to the end of the canvas.
      if (this.x + this.width > game.canvas.scaledWidth) {
        this.x = game.canvas.scaledWidth - this.width;
      } else if (this.x < 0) {
        this.x = 0;
      } else {
        this.x = prevX;
      }

    }
  };

  Paddle.prototype.draw = function() {
    drawRect(this.x, this.y, this.width, this.height, this.fillColor);
  };

  var Ball = function() {
    this.radius = 10;
    this.x = game.canvas.scaledWidth / 2;
    this.y = game.canvas.scaledHeight - 200;
    var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
    this.velocityX = plusOrMinus * (2 + Math.random() * 8);
    this.velocityY = 200;
    this.fillColor = '#ffffff';

    Object.defineProperty(this, 'boundingBox', {
      get: function() {
        return {
          x: this.x - this.radius,
          y: this.y - this.radius,
          width: this.radius * 2,
          height: this.radius * 2
        };
      },
    });
  };

  Ball.prototype.update = function(dt) {
    var prevX = this.x;
    var prevY = this.y;

    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    if (this.x + this.radius / 2 > game.canvas.scaledWidth || this.x - this.radius / 2 < 0) {
      this.x = prevX;
      this.velocityX = -this.velocityX;
    }
    if (this.y - this.radius < 0) {
      this.y = prevY;
      this.velocityY = -this.velocityY;
    }
  };

  Ball.prototype.draw = function() {
    game.ctx.save();
    game.ctx.beginPath();
    game.ctx.fillStyle = this.fillColor;
    game.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    game.ctx.fill();
    game.ctx.closePath();
    game.ctx.restore();
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
    game.ctx.save();
    if (fillColor) {
      game.ctx.fillStyle = fillColor;
    }
    game.ctx.fillRect(x, y, width, height);
    game.ctx.restore();
  };

  var Levels = function() {
    // TODO: Use the Rectangle tool to create a 38x18px rectangle and apply the next gradient: #CC0000, #8E0000, #FF5656.
    this.colors = {
      // Standard Colours
      // 1: green
      // 2: yellow
      // 3: orange
      // 4: red
      // 5: purple
      // 6: blue
      apple: {1: '#7ECD63', 2: '#FCCC34', 3: '#F8A02E', 4: '#E95959', 5: '#AF58AF', 6: '#05B4E7'}
    };
    this.levelData = [{
        brickWidth: 50,
        brickHeight: 20,
        brickPadding: 10,
        brickColors: this.colors.apple,
        data: [
          [0, 0, 0, 0, 0, 0, 0, 0],
          [1, 1, 1, 1, 1, 1, 1, 1],
          [2, 2, 2, 2, 2, 2, 2, 2],
          [3, 3, 3, 3, 3, 3, 3, 3]
        ]
      }, {
        brickWidth: 50,
        brickHeight: 20,
        brickPadding: 10,
        brickColors: this.colors.apple,
        data: [
          [0, 0, 0, 0, 0, 0],
          [1, 1, 1, 1, 1, 1],
          [2, 2, 0, 0, 2, 2],
          [3, 3, 0, 0, 3, 3]
        ]
      }, {
        brickWidth: 24,
        brickHeight: 12,
        brickPadding: 4,
        brickColors: this.colors.apple,
        data: [
          [0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 1, 0, 0, 0],
          [0, 0, 0, 0, 1, 1, 0, 0, 0],
          [0, 0, 0, 0, 1, 1, 0, 0, 0],
          [0, 0, 0, 0, 1, 0, 0, 0, 0],
          [0, 0, 1, 1, 0, 1, 1, 0, 0],
          [0, 1, 1, 1, 1, 1, 1, 1, 0],
          [1, 1, 1, 1, 1, 1, 1, 1, 1],
          [2, 2, 2, 2, 2, 2, 2, 2, 0],
          [2, 2, 2, 2, 2, 2, 2, 0, 0],
          [3, 3, 3, 3, 3, 3, 3, 0, 0],
          [3, 3, 3, 3, 3, 3, 3, 0, 0],
          [4, 4, 4, 4, 4, 4, 4, 4, 0],
          [4, 4, 4, 4, 4, 4, 4, 4, 4],
          [5, 5, 5, 5, 5, 5, 5, 5, 5],
          [0, 5, 5, 5, 5, 5, 5, 5, 0],
          [0, 6, 6, 6, 6, 6, 6, 6, 0],
          [0, 0, 6, 6, 0, 6, 6, 0, 0]
        ]
      }

    ];
  };

  Levels.prototype.setupLevel = function(level) {
    var rows = this.levelData[level].data.length;
    var columns = this.levelData[level].data[0].length;
    var startingX = (game.canvas.scaledWidth / 2) - (((columns * this.levelData[level].brickWidth) + this.levelData[level].brickPadding * (columns - 1)) / 2);
    var startingY = 0; // Distance from top of canvas now set by blank rows in level data.
    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < columns; col++) {
        if (this.levelData[level].data[row][col] > 0) {
          var width = this.levelData[level].brickWidth;
          var height = this.levelData[level].brickHeight;
          var padding = this.levelData[level].brickPadding;
          var x = startingX + (width + padding) * col + 1;
          var y = startingY + (height + padding) * row;

          var brickColor = this.levelData[level].brickColors[this.levelData[level].data[row][col]];

          var brick = new Brick(x, y, width, height, brickColor);
          game.bricks.push(brick);
        }
      }
    }
  };

  return {
    init: game.init
  };
})();

breakout.init();
