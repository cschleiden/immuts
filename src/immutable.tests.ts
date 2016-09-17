/// <reference path="../typings/index.d.ts" />

import "mocha";
import { expect } from "chai";

import { makeImmutable } from "./immutable";
import { DefaultImmutableBackend, IImmutableBackend } from "./backends/backend";
import { IImmutableCloneStrategy } from "./strategies/clone";

import * as ImmutableJS from "immutable";
import { ImmutableJsBackendAdapter } from "./backends/immutablejs";

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
        var i = makeImmutable(a);
        let a1 = i.data;
        expect(a).to.be.eq(a1);

        let a11 = i.data;
        expect(a1).to.be.eq(a11);
        expect(() => a1.b = null).to.throws();
        expect(a1.b).to.be.not.eq(null);

        i.set(x => x.b.c.name, "12");
        let a2 = i.data;

        expect(a1).to.be.not.eq(a2, "Root is cloned for change");
        expect(a1.b).to.be.not.eq(a2.b, "Path is cloned for change");
        expect(a1.b.c).to.be.not.eq(a2.b.c, "Path is cloned for change");
        expect(a2.b.c.name).to.be.equal("12");
        expect(a2.b2).to.be.deep.equal(a1.b2, "Only changed paths are cloned");

        i.set(x => x.b2.ar, [3, 4]);
        i.set(x => x.foo, "bar2");
        let a3 = i.data;

        expect(a3.foo).to.be.equal("bar2");
        expect(a3.b2.ar).to.be.not.equal(a2.b2.ar);

        let t = i.set(x => x.b.c.name, "bar3");
    });

    it("modify root", () => {
        var i = makeImmutable(a);

        let a1 = i.set(x => x.foo, "12");
        expect(a1.data.foo).to.be.equal("12");
    });

    it("set multiple properties at once", () => {
        var i = makeImmutable(a);

        let a1 = i.data;
        let a2 = i.update(x => x.b2.c, x => ({
            "id": 11,
            "name": "12"
        }));

        expect(a1).to.be.not.eq(a2);
        expect(a1.b2.c.id).to.be.eq(23);
        expect(a1.b2.c.name).to.be.eq("c2");

        expect(a2.data.b2.c.id).to.be.eq(11);
        expect(a2.data.b2.c.name).to.be.eq("12");
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
    })
});

interface IX {
    name: string,
    ar: ImmutableJS.List<number>
}

describe("ImmutableJS Backend", () => {
    it("works", () => {
        let i = makeImmutable<IX>(<any>{
            name: "foo",
            ar: [1, 2, 3]
        }, new ImmutableJsBackendAdapter<IX>());

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
        let a = makeImmutable<X>(new X(23), new DefaultImmutableBackend<X>(new CustomCloneStrategy()));

        a.set(x => x.foo, 42);
        let a2 = a.data;
        expect(a).to.be.not.equal(a2);
        expect(a2.foo).to.be.equal(42);
    });

    it("is used for multiple types", () => {
        let a = makeImmutable(new Y("23"), new DefaultImmutableBackend<Y>(new CustomCloneStrategy()));

        a.set(x => x.bar, "42");
        let a2 = a.data;
        expect(a).to.be.not.equal(a2);
        expect(a2.bar).to.be.equal("42");
    });
});