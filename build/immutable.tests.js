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
            _super.call(this, {
                id: id,
                foo: undefined
            });
        }
        Folder.prototype.foo = function () {
            return this.id + "12";
        };
        return Folder;
    }(immutable_1.Immutable));
    var Repository = (function (_super) {
        __extends(Repository, _super);
        function Repository(id, folders) {
            _super.call(this, {
                id: id,
                folders: new immutable_1.ImmutableArray([])
            });
        }
        return Repository;
    }(immutable_1.Immutable));
    describe("lib", function () {
        it("ts", function () {
            var r = new Repository("42", []);
            chai_1.expect(r.id).to.be.equal("42");
            chai_1.expect(function () { return r.id = "23"; }).throw;
            var r2 = r.set(function (x) { return x.id = "23"; });
            chai_1.expect(r2).to.be.not.eq(r);
            chai_1.expect(r2.id).to.be.equal("23");
            chai_1.expect(r.id).to.be.equal("42");
            var r3 = r2.set(function (x) { return x.folders = x.folders.push(new Folder("f1")); });
            chai_1.expect(r3).to.be.not.eq(r2);
            chai_1.expect(r3.folders.length).to.be.eq(1);
            chai_1.expect(r2.folders.length).to.be.eq(0);
            var r4 = r3.set(function (x) { return x.folders = x.folders.push(new Folder("f2")); });
            chai_1.expect(r4).to.be.not.eq(r3);
            chai_1.expect(r4.folders.length).to.be.eq(2);
            chai_1.expect(r3.folders.length).to.be.eq(1);
            chai_1.expect(r4.folders.get(0).foo()).to.be.eq("2312");
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
