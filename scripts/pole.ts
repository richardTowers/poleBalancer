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
	constructor(
		public width: number,
		public height: number,
		public mass: number,
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
declare var CodeMirror: any;
interface Window { state: any; }

$(() => {
	'use strict';

	var elapsed = 0;
	var canvasWidth = $('.container').width();
	var canvasHeight = 200;

	// Embiggen the canvas:
	$('#cart').attr('width', canvasWidth + 'px');
	$('#cart').attr('height', canvasHeight + 'px');

	var time = 0;
	var cartMass = 0.5;
	var cart = new Cart(50, 50, cartMass, canvasWidth / 2 - 25, 0, 0, new Pole(0.1, 5, 0, 0, 0, cartMass));

	var canvas = <HTMLCanvasElement> document.getElementById('cart');
	if(!canvas) { return; }

	var context = canvas.getContext('2d');
	context.fillStyle = 'rgb(0,0,0)';
	context.lineWidth = 3;

	var nudge = 0;

	$(document).keydown((e) => { if (e.keyCode == 37) { nudge = -100; }	});
	$(document).keydown((e) => { if (e.keyCode == 39) { nudge = 100; } });
	$(document).keyup(() => { nudge = 0; });

	$('#left').bind('touchstart mousedown', () => { nudge = -100; });
	$('#right').bind('touchstart mousedown', () => { nudge = 100; });
	$('#left,#right').bind('touchend mouseup', () => { nudge = 0; });

	var timeout;
	function animate (cart: Cart, controller: any) {
		drawFrame(cart);
		// Running user defined code here, so we can't be sure it won't error:
		try {
			var force = controller(cart.pole.angle, cart.pole.velocity, cart.position - canvasWidth/2, cart.velocity);
			if(typeof force !== 'number') {
				throw 'User calculated force "' + force +'" should have been of type "number" not "' + typeof force + '".';
			}
			if(!isFinite(force)) {
				throw 'User calculated force "' + force + '" was not a finite number.';
			}
			force += nudge;
		}
		catch(ex) {
			if(typeof timeout !== 'undefined') { clearTimeout(timeout); }
			$('.failTime').text(Math.round(elapsed));
			$('#errorInfo').text(ex);
			$('#errorModal').modal();
			return;
		}
		cart.tick(force);
		elapsed += timestep;
		if( cart.position < 0 ||
			cart.position + cart.width > canvasWidth ||
			cart.pole.angle > Math.PI/2 ||
			cart.pole.angle < -Math.PI/2 ) {
			$('.failTime').text(Math.round(elapsed));
			$('#failModal').modal();
		}
		else {
			timeout = setTimeout(() => { animate(cart, controller); }, Math.round(1000*timestep));
		}
	}

	function drawFrame (cart: Cart) {
		drawBackground();
		context.fillRect(cart.position, canvas.height - 80, cart.width, cart.height);

		var x = 100 * Math.cos(cart.pole.angle - Math.PI / 2);
		var	y = 100 * Math.sin(cart.pole.angle - Math.PI / 2);

		context.beginPath();
		context.moveTo(cart.position + cart.width / 2, canvas.height - 80);
		context.lineTo(cart.position + cart.width / 2 + x, canvas.height - 80 + y);
		context.stroke();
	}

	function drawBackground () {
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.beginPath();
		context.moveTo(context.lineWidth / 2, 0);
		context.lineTo(context.lineWidth / 2, canvas.height - 20);
		context.lineTo(canvas.width - context.lineWidth / 2, canvas.height - 20);
		context.lineTo(canvas.width - context.lineWidth / 2, 0);
		context.stroke();
	}

	var target = document.getElementById('code');
	var editor = CodeMirror.fromTextArea(target, { lineNumbers: true });

	drawFrame(cart);
	$('#start').click(() => {
		// Get the code from the editor:
		var code = editor.getValue();
		// Create a global state object for the user to attach things to:
		window.state = window.state || {};
		// Use the code to create a new function which will get our force:
		var controller = new Function('angle', 'angleRate', 'cartPosition', 'cartVelocity', code);

		// Update the UI
		$('#left,#right').removeAttr('disabled');

		// Clear the variables ready for the next stage:
		clearTimeout(timeout);
		elapsed = 0;
		nudge = 0;
		cart.position = canvasWidth / 2 - cart.width / 2;
		cart.velocity = 0;
		cart.acceleration = 0;
		cart.pole.angle = 0.1 * (Math.random() - 0.5);
		cart.pole.velocity = 0;
		cart.pole.acceleration = 0;

		// Kick off the animation
		animate(cart, controller);
	});

});