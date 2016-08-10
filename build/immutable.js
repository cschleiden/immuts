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
        ImmutableArray.prototype.get = function (idx) {
            return this._t[idx];
        };
        return ImmutableArray;
    }());
    exports.ImmutableArray = ImmutableArray;
    var Immutable = (function () {
        function Immutable(values) {
            var _this = this;
            this._locked = true;
            this._modified = false;
            this._values = {};
            var _loop_1 = function(key) {
                this_1._values[key] = values[key];
                Object.defineProperty(this_1, key, {
                    enumerable: true,
                    get: function () {
                        return _this._values[key];
                    },
                    set: function (val) {
                        if (_this._locked) {
                            throw new Error("Cannot mutate");
                        }
                        if (_this._values[key] !== val) {
                            _this._values[key] = val;
                            _this._modified = true;
                        }
                    }
                });
            };
            var this_1 = this;
            for (var key in values) {
                _loop_1(key);
            }
        }
        Immutable.prototype.set = function (x) {
            var clone = new Immutable(this._values);
            clone._locked = false;
            var r = x(clone);
            clone._locked = true;
            if (clone._modified || Boolean(r)) {
                clone._modified = false;
                return clone;
            }
            return this;
        };
        return Immutable;
    }());
    exports.Immutable = Immutable;
});
