/// <reference path="../typings/index.d.ts" />
define(["require", "exports", "chai", "./immutable", "mocha"], function (require, exports, chai_1, immutable_1) {
    "use strict";
    describe("Immutable", function () {
        it("ts", function () {
            var a = {
                b: {
                    c: {
                        id: 12,
                        name: "c"
                    },
                    ar: [1, 2]
                },
                b2: {
                    c: {
                        id: 23,
                        name: "c2"
                    },
                    ar: [2, 3]
                },
                foo: "bar"
            };
            var i = new immutable_1.Immutable(a);
            var a1 = i.get();
            var a11 = i.get();
            chai_1.expect(a1).to.be.eq(a11);
            chai_1.expect(function () { return a1.b = null; }).to.throws();
            chai_1.expect(a1.b).to.be.not.eq(null);
            i.set()(function (x) { return x.b; })(function (x) { return x.c; }).val(function (x) { return x.name = "12"; });
            var a2 = i.get();
            chai_1.expect(a1).to.be.not.eq(a2, "Root is cloned for change");
            chai_1.expect(a1.b).to.be.not.eq(a2.b, "Path is cloned for change");
            chai_1.expect(a1.b.c).to.be.not.eq(a2.b.c, "Path is cloned for change");
            chai_1.expect(a2.b.c.name).to.be.equal("12");
            chai_1.expect(a2.b2).to.be.deep.equal(a1.b2, "Only changed paths are cloned");
            i.set()(function (x) { return x.b2; }).val(function (x) { return x.ar = [3, 4]; });
            i.set(function (x) { return x.foo = "bar2"; });
            var a3 = i.get();
            chai_1.expect(a3.foo).to.be.equal("bar2");
            chai_1.expect(a3.b2.ar).to.be.not.equal(a2.b2.ar);
        });
    });
    var X = (function () {
        function X(foo) {
            this.foo = foo;
        }
        return X;
    }());
    var Y = (function () {
        function Y(bar) {
            this.bar = bar;
        }
        Y.prototype.clone = function () {
            return new Y(this.bar);
        };
        return Y;
    }());
    var CustomCloneStrategy = (function () {
        function CustomCloneStrategy() {
        }
        CustomCloneStrategy.prototype.clone = function (source) {
            if (source instanceof X) {
                return new X(source.foo);
            }
            else if (source.clone) {
                return source.clone();
            }
            throw new Error("Type not supported");
        };
        return CustomCloneStrategy;
    }());
    describe("CustomCloneStrategy", function () {
        it("is used", function () {
            var a = new immutable_1.Immutable(new X(23), new CustomCloneStrategy());
            a.set(function (x) { return x.foo = 42; });
            var a2 = a.get();
            chai_1.expect(a).to.be.not.equal(a2);
            chai_1.expect(a2.foo).to.be.equal(42);
        });
        it("is used for multiple types", function () {
            var a = new immutable_1.Immutable(new Y("23"), new CustomCloneStrategy());
            a.set(function (x) { return x.bar = "42"; });
            var a2 = a.get();
            chai_1.expect(a).to.be.not.equal(a2);
            chai_1.expect(a2.bar).to.be.equal("42");
        });
    });
});
