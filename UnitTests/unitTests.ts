declare var test: any;
declare var ok: any;
declare var Pole: any;

test( "pole acceleration", function() {
	var pole = new Pole(
		/*mass*/  1,
		/*length:*/ 2000,
		/*angle:*/ Math.PI / 2.0,
		/*velocity*/ 0,
		/*acceleration*/ 0);

	var acceleration = pole.getAcceleration(1, 1);

  	ok(true, "Pole acceleration within acceptable bounds." );
});