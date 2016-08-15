/// <reference path="../typings/index.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "chai", "./immutable", "mocha"], function (require, exports, chai_1, immutable_1) {
    "use strict";
    var Folder = (function (_super) {
        __extends(Folder, _super);
        function Folder(id) {
            var _this = this;
            _super.call(this, function () {
                _this.id = id;
            });
        }
        Folder.prototype.foo = function () {
            return this.id + "foo";
        };
        Folder.prototype._clone = function () {
            return new Folder(this.id);
        };
        return Folder;
    }(immutable_1.Immutable));
    var Repository = (function (_super) {
        __extends(Repository, _super);
        function Repository(id, specialFolder, folders) {
            var _this = this;
            _super.call(this, function () {
                _this.id = id;
                _this.specialFolder = specialFolder;
                _this.folders = folders;
            });
        }
        Repository.prototype._clone = function () {
            return new Repository(this.id, this.specialFolder, this.folders);
        };
        return Repository;
    }(immutable_1.Immutable));
    describe("lib", function () {
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
            var i = new immutable_1.Immutable2(a);
            var a1 = i.get();
            var a11 = i.get();
            chai_1.expect(a1).to.be.eq(a11);
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
    describe("array", function () {
        it("should copy for push", function () {
            var a = new immutable_1.ImmutableArray();
            var a2 = a.push(1, 2);
            chai_1.expect(a).to.be.not.equal(a2);
            chai_1.expect(a.length).to.be.eq(0);
            chai_1.expect(a2.length).to.be.eq(2);
        });
    });
});
