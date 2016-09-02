/// <reference path="../typings/index.d.ts" />

import "mocha";
import { expect } from "chai";

import { Immutable } from "./immutable";
import { DefaultImmutableBackend, IImmutableBackend } from "./backends/backend";
import { IImmutableCloneStrategy } from "./strategies/clone";

export interface IA {
    b: IB;
    b2: IB;
    foo: string;
}

export interface IB {
    c: IC;
    ar: number[];
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
        var i = new Immutable(a);
        let a1 = i.get();
        expect(a).to.be.eq(a1);

        let a11 = i.get();
        expect(a1).to.be.eq(a11);
        expect(() => a1.b = null).to.throws();
        expect(a1.b).to.be.not.eq(null);

        i.set(x => x.b.c.name = "12");
        let a2 = i.get();

        expect(a1).to.be.not.eq(a2, "Root is cloned for change");
        expect(a1.b).to.be.not.eq(a2.b, "Path is cloned for change");
        expect(a1.b.c).to.be.not.eq(a2.b.c, "Path is cloned for change");
        expect(a2.b.c.name).to.be.equal("12");
        expect(a2.b2).to.be.deep.equal(a1.b2, "Only changed paths are cloned");

        i.set(x => x.b2.ar = [3, 4]);
        i.set(x => x.foo = "bar2");
        let a3 = i.get();

        expect(a3.foo).to.be.equal("bar2");
        expect(a3.b2.ar).to.be.not.equal(a2.b2.ar);

        let t = i.set(x => x.b.c.name = "bar3");
    });

    it("modify root", () => {
        var i = new Immutable(a);

        let a1 = i.set(x => x.foo = "12");
        expect(a1.foo).to.be.equal("12");
    });

    it("set multiple properties at once", () => {
        var i = new Immutable(a);

        let a1 = i.get();
        let a2 = i.update(x => x.b2.c, x => {
            x.id = 11;
            x.name = "12";
        });

        expect(a1).to.be.not.eq(a2);
        expect(a1.b2.c.id).to.be.eq(23);
        expect(a1.b2.c.name).to.be.eq("c2");

        expect(a2.b2.c.id).to.be.eq(11);
        expect(a2.b2.c.name).to.be.eq("12");
    });

    it("incomplete set should throw", () => {
        var i = new Immutable(a);
        expect(() => i.set(x => x.b.c)).to.throws();
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
        let a = new Immutable<X>(new X(23), new DefaultImmutableBackend<X>(new CustomCloneStrategy()));

        a.set(x => x.foo = 42);
        let a2 = a.get();
        expect(a).to.be.not.equal(a2);
        expect(a2.foo).to.be.equal(42);
    });

    it("is used for multiple types", () => {
        let a = new Immutable(new Y("23"), new DefaultImmutableBackend<Y>(new CustomCloneStrategy()));

        a.set(x => x.bar = "42");
        let a2 = a.get();
        expect(a).to.be.not.equal(a2);
        expect(a2.bar).to.be.equal("42");
    });
});