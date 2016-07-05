
var INTERVAL = 1000 / 60;
var WIDTH = 800
var HEIGHT = 500;

var KEYS = {
    38: 'up',
    40: 'down',
    37: 'left',
    39: 'right',

    8: 'backspace',
    9: 'tab',
    13: 'enter',
    16: 'shift',
    17: 'ctrl',
    18: 'alt',
    27: 'esc',
    32: 'space'
};

function getKeyName(code) {
    if (KEYS[code]) {
        return KEYS[code];
    } else if (String.fromCharCode(code)) {
        return String.fromCharCode(code).toLowerCase();
    }
}

function randomChoice(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function randomNumber (min, max) {
    return Math.random() * (max - min) + min;
}


function Game(options) {
    this.options = options || {};
    this.callbacks = [];
    this.activeKeys = {};
    this.keyPressCallbacks = {};
}

Game.prototype.createCanvas = function() {

    document.body.style.backgroundColor = '#333';

    var canvas = document.createElement('canvas');
    canvas.id = 'game';
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    canvas.style.position = 'fixed';
    canvas.style.top = '50%';
    canvas.style.left = '50%';
    canvas.style.marginLeft = '-' + WIDTH / 2 + 'px';
    canvas.style.marginTop = '-' + HEIGHT / 2 + 'px';
    canvas.style.backgroundColor = '#fff';
    canvas.style.backgroundSize = WIDTH + 'px ' + HEIGHT + 'px';
    canvas.style.height = HEIGHT + 'px';
    canvas.style.width = WIDTH + 'px';

    if (this.background) {
        canvas.style.background = 'url(' + this.background + ')';
    }

    document.body.appendChild(canvas);

    return canvas;
};

Game.prototype.detectKeyPresses = function() {

    document.onkeydown = function(event) {

        var keyName = getKeyName(event.keyCode);

        if (this.keyPressCallbacks[keyName] && !this.activeKeys[keyName]) {
            this.keyPressCallbacks[keyName].call();
        }

        this.activeKeys[keyName] = true;
    }.bind(this);

    document.onkeyup = function(event) {
        var keyName = getKeyName(event.keyCode);
        this.activeKeys[keyName] = false;
    }.bind(this);
};

Game.prototype.isKeyPressed = function(keyName) {
    return this.activeKeys[keyName];
}

Game.prototype.onKeyPress = function(name, callback) {
    this.keyPressCallbacks[name.toLowerCase()] = callback;
};

Game.prototype.start = function() {

    this.canvas = this.createCanvas();
    this.context = this.canvas.getContext('2d');

    this.detectKeyPresses();

    this.interval = setInterval(function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (var i=0; i<this.callbacks.length; i++) {
            this.callbacks[i].call(this);
        }
    }.bind(this), INTERVAL);
};

Game.prototype.stop = function() {
    clearInterval(this.interval);
};

Game.prototype.eachFrame = function(callback) {
    this.callbacks.push(callback);
    return {
        cancel: function() {
            this.callbacks.splice(this.callbacks.indexOf(callback), 1);
        }.bind(this)
    };
};

Game.prototype.eachInterval = function(interval, callback) {
    var t = 0;
    this.eachFrame(function() {
        t += INTERVAL;
        if (t >= interval) {
            t -= INTERVAL;
            callback();
        }
    }.bind(this));
};

Game.prototype.add = function(renderable) {
    this.eachFrame(function() {
        renderable.render(this.context);
    });
};

Game.prototype.setBackground = function(url) {
    this.background = url;
    if (this.canvas) {
        this.canvas.style.background = 'url(' + this.background + ')';
    }
};


function Character(options) {
    options = options || {};

    this.image = document.createElement('img');
    this.image.src = options.src;
    this.height = options.height;
    this.width = options.width;
    this.x = options.x;
    this.y = options.y;

    this.display = true;
}

Character.prototype.hide = function() {
    this.display = false;
};

Character.prototype.show = function() {
    this.display = true;
};

Character.prototype.setImage = function(url) {
    this.image.src = url;
};

Character.prototype.move = function(direction, amount) {

    amount = amount || 1;

    if (direction === 'up') {
        this.y -= amount;
    } else if (direction === 'down') {
        this.y += amount;
    } else if (direction === 'right') {
        this.x += amount;
    } else if (direction === 'left') {
        this.x -= amount;
    }
};

Character.prototype.moveUp = function(amount) {
    this.move('up', amount);
};

Character.prototype.moveDown = function(amount) {
    this.move('down', amount);
};

Character.prototype.moveRight = function(amount) {
    this.move('right', amount);
};

Character.prototype.moveLeft = function(amount) {
    this.move('left', amount);
};

Character.prototype.isMoving = function() {
    return this.moving;
};

Character.prototype.isTouching = function(char) {

    // Yeah I'm lazy and googled this, sue me.

    if (!this.show || !char.show) {
        return false;
    }

    var rect1 = {x: this.x, y: this.y, width: this.width, height: this.height}
    var rect2 = {x: char.x, y: char.y, width: char.width, height: char.height}

    if (rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.height + rect1.y > rect2.y) {
        return true;
    }

    return false;
};

Character.prototype.setDestination = function(direction, amount, speed) {
    this.destination = {
        direction: direction,
        amount: amount,
        speed: speed
    };
};

Character.prototype.hasDestination = function() {
    return Boolean(this.destination);
};

Character.prototype.render = function(context) {

    if (this.destination) {
        this.move(this.destination.direction, this.destination.speed);
        this.destination.amount -= this.destination.speed;
        if (this.destination.amount <= 0) {
            delete this.destination;
        }
    }

    if (this.x < 0) {
        this.x = 0;
    } else if ((this.x + this.width) > WIDTH) {
        this.x = WIDTH - this.width;
    }

    if (this.y < 0) {
        this.y = 0;
    } else if ((this.y + this.height) > HEIGHT) {
        this.y = HEIGHT - this.height;
    }

    if (this.oldx !== this.x || this.oldy !== this.y) {
        this.moving = true;
    } else {
        this.moving = false;
    }

    this.oldx = this.x;
    this.oldy = this.y;

    if (!this.display) {
        return;
    }

    context.drawImage(this.image, this.x, this.y, this.width, this.height);
};
