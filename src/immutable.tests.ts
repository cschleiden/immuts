import "mocha";
import { expect } from "chai";

import { makeImmutable } from "./immutable";
import { IImmutableCloneStrategy } from "./strategies/clone";

import * as ImmutableJS from "immutable";

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
        const i1 = makeImmutable(a);
        const a1 = i1.data;
        expect(a).to.be.eq(i1.data);

        expect(() => (i1.data as any).b = null).to.throws();
        expect(i1.data.b).to.be.not.eq(null);

        const i2 = i1.set(x => x.b.c.name, "12");
        const a2 = i2.data;

        expect(a1).to.be.not.eq(a2, "Root is cloned for change");
        expect(a1.b).to.be.not.eq(a2.b, "Path is cloned for change");
        expect(a1.b.c).to.be.not.eq(a2.b.c, "Path is cloned for change");
        expect(a2.b.c.name).to.be.equal("12");
        expect(a2.b2).to.be.deep.equal(a1.b2, "Only changed paths are cloned");

        const i3 = i2.set(x => x.b2.ar, [3, 4]);
        expect(i3.data.b2.ar).to.be.not.equal(i2.data.b2.ar);

        const i4 = i3.set(x => x.foo, "bar2");
        expect(i4.data.foo).to.be.equal("bar2");
    });

    it("merge", () => {
        const i1 = makeImmutable(a);

        const i2 = i1.merge(x => x.b2, <any>{
            ar: [23, 42]
        });

        expect(i2).to.be.not.eq(i1);
        expect(i2.data.b).to.be.eq(i1.data.b);
        expect(i2.data.b2.ar).to.be.deep.equal([23, 42]);

        const i3 = i2.merge(x => x.b2, <any>{
            ar: [0, 1]
        });

        expect(i3).to.be.not.eq(i2);
        expect(i3.data.b).to.be.eq(i1.data.b);
        expect(i3.data.b2.ar).to.be.deep.equal([0, 1]);
    });

    it("modify root", () => {
        const i = makeImmutable(a);

        const i2 = i.set(x => x.foo, "12");
        expect(i2.data.foo).to.be.equal("12");
    });

    it("set value in array", () => {
        const i = makeImmutable(a);

        const i2 = i.set(x => x.b2.ar[1], 42);

        expect(i2).to.be.not.equal(i);
        expect(i2.data.b2.ar[1]).to.be.equal(42);
    });

    it("set multiple properties at once", () => {
        const i = makeImmutable(a);

        const a1 = i.data;
        const i2 = i.update(x => x.b2.c, x => ({
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
        const i = makeImmutable({
            foo: [1, 2]
        });
        const i1 = i.data;
        const i2 = i.set(x => x.foo, i1.foo.concat([3]));
        expect(i1).to.be.not.equal(i2);
        expect(i1.foo).to.be.not.equal(i2.data.foo);
        expect(i2.data.foo).to.be.deep.equal([1, 2, 3]);
    });

    describe("native array", () => {
        it("add element", () => {
            const i = makeImmutable({
                foo: [1, 2]
            });

            const i1 = i.data;
            const i2 = i.array.insert(x => x.foo, 3);
            expect(i1).to.be.not.equal(i2);
            expect(i1.foo).to.be.not.equal(i2.data.foo);
            expect(i2.data.foo).to.be.deep.equal([1, 2, 3]);
            expect(i.data.foo).to.be.deep.equal([1, 2]);

            const i3 = i2.array.insert(x => x.foo, 4, 1);
            expect(i2).to.be.not.equal(i3);
            expect(i3.data.foo).to.be.deep.equal([1, 4, 2, 3]);
        });

        it("remove item", () => {
            const i = makeImmutable({
                foo: [{ name: "1" }, { name: "2" }, { name: "3" }]
            });

            const i1 = i.data;
            const i2 = i.array.remove(x => x.foo, 0);
            expect(i1).to.be.not.equal(i2.data);
            expect(i1.foo).to.be.not.equal(i2.data.foo);
            expect(i2.data.foo).to.be.deep.equal([{ name: "2" }, { name: "3" }]);
            expect(i.data.foo).to.be.deep.equal([{ name: "1" }, { name: "2" }, { name: "3" }]);
        });
    });

    describe("map", () => {
        it("add element to map", () => {
            const i = makeImmutable({
                foo: {
                    "a": 42,
                    "b": 23
                } as { [key: string]: number }
            });

            const d1 = i.data;
            const i2 = i.merge(x => x.foo, {
                "c": 11
            });
            const d2 = i2.data;

            expect(d1).to.be.not.equal(d2);
            expect(d2.foo).to.be.deep.equal({
                "a": 42,
                "b": 23,
                "c": 11
            });
        });
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
        const i = makeImmutable<X>(new X(23), new CustomCloneStrategy());

        const i2 = i.set(x => x.foo, 42);
        expect(i.data).to.be.not.equal(i2.data);

        expect(i.data.foo).to.be.equal(23);
        expect(i2.data.foo).to.be.equal(42);
    });

    it("is used for multiple types", () => {
        const i = makeImmutable(new Y("23"), new CustomCloneStrategy());

        const i2 = i.set(x => x.bar, "42");
        expect(a).to.be.not.equal(i2.data);
        expect(i2.data.bar).to.be.equal("42");
    });
});