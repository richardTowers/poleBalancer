var timestep = 0.01;
var gravity = 9.81;

class Pole {
	constructor(public mass: number,
		public length: number,
		public angle: number,
		public velocity: number,
		public acceleration: number,
		// Not thrilled about passing cart mass in here...
		public cartMass: number) {
	}

	tick(force: number) {
		// Calculate new acceleration
		this.acceleration = this.getAcceleration(force);
		
		this.angle += timestep * this.velocity;
		this.velocity += timestep * this.acceleration;
	}

	getAcceleration(force: number) {

		//                       ( -F -m(p) l θ'^2 sin θ )
		//       g sin θ + cos θ |-----------------------|
		//                       (      m(c) + m(p)      )
		// θ'' = --------------------------------------------
		//                  ( 4    m(p) cos^2 θ  )
		//               l  | - - ---------------|
		//                  ( 3     m(c) + m(p)  )

		var top = gravity * Math.sin(this.angle) + Math.cos(this.angle) *
			( -force -this.mass * this.length * this.velocity * this.velocity * Math.sin(this.angle) ) / (this.cartMass + this.mass);

		var bottom = this.length * (1.33333333 - (this.mass * Math.cos(Math.cos(this.angle)))/(this.cartMass + this.mass));

		return top / bottom;
	}
}

class Cart {
	constructor(public mass: number,
		public position: number,
		public velocity: number,
		public acceleration: number,
		public pole: Pole) {
	}

	tick(force: number) {
		// Calculate the pole first, since we're going to use some data from the pole
		// to work out the cart's position.
		this.pole.tick(force);

		// Calculate new acceleration
		this.acceleration = this.getAcceleration(force);

		// Calculate values at next time step (using Euler approximation)
		this.position += timestep * this.velocity;
		this.velocity += timestep * this.acceleration;
	}

	getAcceleration(force: number) {

		//          F + m(p) l (θ'^2 sin θ - θ'' cos θ)
		// x'' = --------------------------------------------
		//                       m(c) + m(p)

		var top = force + this.pole.mass + this.pole.length *
			(this.pole.velocity * this.pole.velocity * Math.sin(this.pole.angle) - this.pole.acceleration * Math.cos(this.pole.angle));

		var bottom = this.mass + this.pole.mass;

		return top / bottom;
	}
}

declare var $: any;
$(() => {
	'use strict';

	var elapsed = 0;
	var windowWidth = $(window).width();
	var windowHeight = $(window).height();

	// Embiggen the canvas:
	$('#cart').attr('width', (windowWidth - 40) + 'px');
	$('#cart').attr('height', (200) + 'px');

	var time = 0;
	var cartMass = 0.5;
	var cart = new Cart(
		/*mass:*/ cartMass,
		/*position:*/ windowWidth/2 - 90,
		/*velocity:*/ 0,
		/*acceleration:*/ 0,
		/*pole:*/ new Pole(
			/*mass*/  0.1,
			/*length:*/ 5,
			/*angle:*/ 0.1 * (Math.random() - 0.5),
			/*velocity*/ 0,
			/*acceleration*/ 0,
			/*cartMass*/ cartMass));

	var canvas = <HTMLCanvasElement> document.getElementById('cart');
	if(!canvas)
	{
		return;
	}
	var canvasWidth = canvas.width;
	var canvasHeight = canvas.height;

	var context = canvas.getContext('2d');
	context.fillStyle = 'rgb(0,0,0)';
	context.lineWidth = 3;

	var force = 0;

	var timeout;
	
	$(document).keydown((e) => { if (e.keyCode == 37) { force = -100; }	});
	$(document).keydown((e) => { if (e.keyCode == 39) { force = 100; } });
	$(document).keyup(() => { force = 0; });

	$('#left').bind('touchstart mousedown', () => { force = -100; });
	$('#right').bind('touchstart mousedown', () => { force = 100; });
	$('#left,#right').bind('touchend mouseup', () => { force = 0; });

	function animate (cart: Cart) {
		drawFrame(cart);
		cart.tick(force);
		elapsed += timestep;
		if(cart.pole.angle > Math.PI/2 || cart.pole.angle < -Math.PI/2 ) {
			window.alert('FAIL! You lasted ' + Math.round(elapsed) + ' seconds');
		}
		else {
			timeout = setTimeout(() => { animate(cart); }, Math.round(1000*timestep));
		}
	}

	function drawFrame (cart: Cart) {
		drawBackground();
		context.fillRect(cart.position, canvas.height - 80, 50, 50);

		var x = 100 * Math.cos(cart.pole.angle - Math.PI / 2);
		var	y = 100 * Math.sin(cart.pole.angle - Math.PI / 2);

		context.beginPath();
		context.moveTo(cart.position + 30, canvas.height - 80);
		context.lineTo(cart.position + 30 + x, canvas.height - 80 + y);
		context.stroke();
	}

	function drawBackground () {
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.fillRect(0, canvas.height - 20, canvas.width, 5);
		context.fillRect(0, canvas.height - 200, 5, 180);
		context.fillRect(canvas.width - 5, canvas.height - 200, 5, 180);
	}

	drawFrame(cart);
	$('#start').click(() => {
		$('#left,#right').removeAttr('disabled');
		elapsed = 0;
		clearTimeout(timeout);
		force = 0;
		cart.position = windowWidth/2 - 90;
		cart.velocity = 0;
		cart.acceleration = 0;
		cart.pole.angle = 0.1 * (Math.random() - 0.5);
		cart.pole.velocity = 0;
		cart.pole.acceleration = 0;
		animate(cart);
	});

});