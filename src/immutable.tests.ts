/// <reference path="../typings/index.d.ts" />

import "mocha";
import { expect } from "chai";

import { makeImmutable } from "./immutable";
import { IImmutableCloneStrategy } from "./strategies/clone";

import * as ImmutableJS from "immutable";
import { makeImmutableJs } from "./immutablejs.adapter";

export interface IA {
    b: IB;
    readonly b2: IB;
    readonly foo: string;
}

export interface IB {
    readonly c: IC;
    readonly ar: ReadonlyArray<number>;
}

export interface IC {
    name: string;
    id: number;
}

const a: IA = {
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

describe("Immutable", () => {
    it("ts", () => {
        var i1 = makeImmutable(a);
        let a1 = i1.data;
        expect(a).to.be.eq(i1.data);

        expect(() => i1.data.b = null).to.throws();
        expect(i1.data.b).to.be.not.eq(null);

        let i2 = i1.set(x => x.b.c.name, "12");
        let a2 = i2.data;

        expect(a1).to.be.not.eq(a2, "Root is cloned for change");
        expect(a1.b).to.be.not.eq(a2.b, "Path is cloned for change");
        expect(a1.b.c).to.be.not.eq(a2.b.c, "Path is cloned for change");
        expect(a2.b.c.name).to.be.equal("12");
        expect(a2.b2).to.be.deep.equal(a1.b2, "Only changed paths are cloned");

        let i3 = i2.set(x => x.b2.ar, [3, 4]);
        expect(i3.data.b2.ar).to.be.not.equal(i2.data.b2.ar);
        
        let i4 = i3.set(x => x.foo, "bar2");
        expect(i4.data.foo).to.be.equal("bar2");
    });

    it("modify root", () => {
        var i = makeImmutable(a);

        let i2 = i.set(x => x.foo, "12");
        expect(i2.data.foo).to.be.equal("12");
    });

    it("set value in array", () => {
        var i = makeImmutable(a);

        let i2 = i.set(x => x.b2.ar[1], 42);

        expect(i2).to.be.not.equal(i);
        expect(i2.data.b2.ar[1]).to.be.equal(42);
    });

    it("set multiple properties at once", () => {
        var i = makeImmutable(a);

        let a1 = i.data;
        let i2 = i.update(x => x.b2.c, x => ({
            "id": 11,
            "name": "12"
        }));

        expect(a1).to.be.not.eq(i2);
        expect(a1.b2.c.id).to.be.eq(23);
        expect(a1.b2.c.name).to.be.eq("c2");

        expect(i2.data.b2.c.id).to.be.eq(11);
        expect(i2.data.b2.c.name).to.be.eq("12");
    });

    it("set complex value", () => {
        var i = makeImmutable({
            foo: [1, 2]
        });
        let i1 = i.data;
        let i2 = i.set(x => x.foo, i1.foo.concat([3]));
        expect(i1).to.be.not.equal(i2);
        expect(i1.foo).to.be.not.equal(i2.data.foo);
        expect(i2.data.foo).to.be.deep.equal([1, 2, 3]);
    });

    it("update native array", () => {
        var i = makeImmutable({
            foo: [1, 2]
        });

        let i1 = i.data;
        let i2 = i.update(x => x.foo, x => x.concat([3]));
        expect(i1).to.be.not.equal(i2);
        expect(i1.foo).to.be.not.equal(i2.data.foo);
        expect(i2.data.foo).to.be.deep.equal([1, 2, 3]);
        expect(i.data.foo).to.be.deep.equal([1, 2]);
    })
});

interface IX {
    name: string,
    ar: ImmutableJS.List<number>
}

describe("ImmutableJS Adapter", () => {
    it("works", () => {
        let i = makeImmutableJs<IX>(<any>{
            name: "foo",
            ar: [1, 2, 3]
        });

        let i2 = i.set(x => x.name, "bar");
        expect(i2).is.not.equal(i);

        let i3 = i2.update(x => x.ar, a => a.push(4));
        expect(i3).is.not.equal(i2);

        expect(i3.data.ar).to.be.deep.equal([1, 2, 3, 4]);
    });
});

// Test CloneStrategy

interface ICloneable<T> {
    clone(): T;
}

class X {
    constructor(public foo: number) { }
}

class Y implements ICloneable<Y> {
    constructor(public bar: string) { }

    public clone(): Y {
        return new Y(this.bar);
    }
}

class CustomCloneStrategy implements IImmutableCloneStrategy {
    public clone<T>(source: X | ICloneable<T>): X | T {
        if (source instanceof X) {
            return new X(source.foo);
        } else if (source.clone) {
            return source.clone();
        }

        throw new Error("Type not supported");
    }
}


describe("CustomCloneStrategy", () => {
    it("is used", () => {
        let i = makeImmutable<X>(new X(23), new CustomCloneStrategy());

        let i2 = i.set(x => x.foo, 42);
        expect(i.data).to.be.not.equal(i2.data);

        expect(i.data.foo).to.be.equal(23);
        expect(i2.data.foo).to.be.equal(42);
    });

    it("is used for multiple types", () => {
        let i = makeImmutable(new Y("23"), new CustomCloneStrategy());

        let i2 = i.set(x => x.bar, "42");
        expect(a).to.be.not.equal(i2.data);
        expect(i2.data.bar).to.be.equal("42");
    });
});