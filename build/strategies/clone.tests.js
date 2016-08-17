/// <reference path="../../typings/index.d.ts" />
define(["require", "exports", "chai", "./clone", "mocha"], function (require, exports, chai_1, clone_1) {
    "use strict";
    var Complex = (function () {
        function Complex() {
        }
        return Complex;
    }());
    describe("default clone strategy", function () {
        it("fails for complex objects", function () {
            var strategy = new clone_1.DefaultCloneStrategy();
            chai_1.expect(function () { return strategy.clone(new Complex()); }).to.throw();
        });
        it("succeeds for simple objects", function () {
            var strategy = new clone_1.DefaultCloneStrategy();
            var a = { foo: 42 };
            var b = strategy.clone(a);
            chai_1.expect(a).to.be.not.equal(b);
        });
    });
});
