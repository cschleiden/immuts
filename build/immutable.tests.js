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
            // Create new immutable object, ensure it cannot be modified
            var r = new Repository("42", new Folder("f1"), new immutable_1.ImmutableArray([new Folder("ff1"), new Folder("ff2")]));
            chai_1.expect(function () { return r.id = "23"; }).to.throw();
            chai_1.expect(function () { return r2.set(function (r) { return r["specialFolder"].id = "f2"; }); }).to.throw();
            chai_1.expect(r.id).to.be.equal("42");
            // Set property on object
            var r2 = r.set(function (x) { return x.id = "23"; });
            chai_1.expect(r2).to.be.not.eq(r);
            // Ensure un-modified properties are still the same
            chai_1.expect(r.folders).to.be.eq(r2.folders);
            // Modify nested object
            var r3 = r2
                .set(function (r) { return r.specialFolder = r.specialFolder
                .set(function (f) { return f.id = "f2"; }); });
            chai_1.expect(r3).to.be.not.eq(r2);
            chai_1.expect(r3.specialFolder).to.be.not.eq(r2.specialFolder);
            chai_1.expect(r3.specialFolder.id).to.be.eq("f2");
            chai_1.expect(r2.specialFolder.id).to.be.eq("f1");
            // Call methods on new immutable instances
            chai_1.expect(r2.specialFolder.foo()).to.be.eq("f1foo");
            chai_1.expect(r3.specialFolder.foo()).to.be.eq("f2foo");
            // Add element to array
            var r4 = r3.set(function (r) { return r.folders = r.folders.push(new Folder("ff3")); });
            chai_1.expect(r4.folders.length).to.be.eq(3);
            chai_1.expect(r3.folders.length).to.be.eq(2);
            chai_1.expect(r4.folders).to.be.not.eq(r3.folders);
            // Change element in array
            var r5 = r4.set(function (r) { return r.folders = r.folders.set(0, r.folders.get(0).set(function (f) { return f.id = "ff12"; })); });
            chai_1.expect(r5.folders.toArray().map(function (f) { return f.id; })).to.deep.equal(["ff12", "ff2", "ff3"]);
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
