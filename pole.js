var timestep = 0.01;
var gravity = 9.81;
var Pole = (function () {
    function Pole(mass, length, angle, velocity, acceleration, cartMass) {
        this.mass = mass;
        this.length = length;
        this.angle = angle;
        this.velocity = velocity;
        this.acceleration = acceleration;
        this.cartMass = cartMass;
    }
    Pole.prototype.tick = function (force) {
        this.acceleration = this.getAcceleration(force);
        this.angle += timestep * this.velocity;
        this.velocity += timestep * this.acceleration;
    };
    Pole.prototype.getAcceleration = function (force) {
        var top = gravity * Math.sin(this.angle) + Math.cos(this.angle) * (-force - this.mass * this.length * this.velocity * this.velocity * Math.sin(this.angle)) / (this.cartMass + this.mass);
        var bottom = this.length * (1.33333333 - (this.mass * Math.cos(Math.cos(this.angle))) / (this.cartMass + this.mass));
        return top / bottom;
    };
    return Pole;
})();
var Cart = (function () {
    function Cart(mass, position, velocity, acceleration, pole) {
        this.mass = mass;
        this.position = position;
        this.velocity = velocity;
        this.acceleration = acceleration;
        this.pole = pole;
    }
    Cart.prototype.tick = function (force) {
        this.pole.tick(force);
        this.acceleration = this.getAcceleration(force);
        this.position += timestep * this.velocity;
        this.velocity += timestep * this.acceleration;
    };
    Cart.prototype.getAcceleration = function (force) {
        var top = force + this.pole.mass + this.pole.length * (this.pole.velocity * this.pole.velocity * Math.sin(this.pole.angle) - this.pole.acceleration * Math.cos(this.pole.angle));
        var bottom = this.mass + this.pole.mass;
        return top / bottom;
    };
    return Cart;
})();
$(function () {
    'use strict';
    var windowWidth = $(window).width();
    var windowHeight = $(window).height();
    $('#cart').attr('width', (windowWidth - 40) + 'px');
    $('#cart').attr('height', (windowHeight - 40) + 'px');
    var time = 0;
    var cartMass = 0.5;
    var cart = new Cart(cartMass, windowWidth / 2 - 90, 0, 0, new Pole(0.001, 50, 0.001, 0, 0, cartMass));
    var canvas = document.getElementById('cart');
    if(!canvas) {
        return;
    }
    var canvasWidth = canvas.width;
    var canvasHeight = canvas.height;
    var context = canvas.getContext('2d');
    context.fillStyle = 'rgb(0,0,0)';
    var force = 0;
    $(document).keydown(function (e) {
        if(e.keyCode == 37) {
            force = -100;
        }
    });
    $(document).keydown(function (e) {
        if(e.keyCode == 39) {
            force = 100;
        }
    });
    $(document).keyup(function (e) {
        force = 0;
    });
    function animate(cart) {
        drawFrame(cart);
        cart.tick(force);
        setTimeout(function () {
            animate(cart);
        }, Math.round(1000 * timestep));
    }
    function drawFrame(cart) {
        drawBackground();
        context.fillRect(cart.position, canvas.height - 80, 50, 50);
        context.moveTo(cart.position + 30, canvas.height - 80);
        var tip = {
            x: 100 * Math.cos(cart.pole.angle - Math.PI / 2),
            y: 100 * Math.sin(cart.pole.angle - Math.PI / 2)
        };
        context.lineTo(cart.position + 30 + tip.x, canvas.height - 80 + tip.y);
        context.stroke();
    }
    function drawBackground() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillRect(0, canvas.height - 20, canvas.width, 5);
        context.fillRect(0, canvas.height - 200, 5, 180);
        context.fillRect(canvas.width - 5, canvas.height - 200, 5, 180);
    }
    animate(cart);
});
