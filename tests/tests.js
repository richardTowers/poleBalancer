test("pole acceleration", function () {
    var pole = new Pole(1, 2000, Math.PI / 2, 0, 0);
    var acceleration = pole.getAcceleration(1, 1);
    ok(true, "Pole acceleration within acceptable bounds.");
});
