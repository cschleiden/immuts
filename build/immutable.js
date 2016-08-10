/// <reference path="../typings/index.d.ts" />
define(["require", "exports"], function (require, exports) {
    "use strict";
    var ImmutableArray = (function () {
        function ImmutableArray(_t) {
            if (_t === void 0) { _t = []; }
            this._t = _t;
        }
        ImmutableArray.prototype.push = function () {
            var t = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                t[_i - 0] = arguments[_i];
            }
            return new ImmutableArray((_a = this._t).concat.apply(_a, t));
            var _a;
        };
        Object.defineProperty(ImmutableArray.prototype, "length", {
            get: function () {
                return this._t.length;
            },
            enumerable: true,
            configurable: true
        });
        ImmutableArray.prototype.toArray = function () {
            return this._t.slice(0);
        };
        ImmutableArray.prototype.get = function (idx) {
            return this._t[idx];
        };
        ImmutableArray.prototype.set = function (idx, t) {
            var clone = this._t.slice(0);
            clone.splice(idx, 1, t);
            return new ImmutableArray(clone);
        };
        return ImmutableArray;
    }());
    exports.ImmutableArray = ImmutableArray;
    var Immutable = (function () {
        function Immutable(init) {
            init();
            if (!Immutable._cloning) {
                Object.freeze(this);
            }
        }
        Immutable.build = function () { };
        Immutable.prototype.set = function (cb) {
            Immutable._cloning = true;
            var clone = this._clone();
            Immutable._cloning = false;
            cb(clone);
            Object.freeze(clone);
            return clone;
        };
        Immutable._cloning = false;
        return Immutable;
    }());
    exports.Immutable = Immutable;
});
