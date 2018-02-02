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
        const a1 = makeImmutable(a);

        expect(a1.b).to.be.not.eq(null);

        const a2 = a1.__set(x => x.b.c.name, "12");

        expect(a1).to.be.not.eq(a2, "Root is cloned for change");
        expect(a1.b).to.be.not.eq(a2.b, "Path is cloned for change");
        expect(a1.b.c).to.be.not.eq(a2.b.c, "Path is cloned for change");
        expect(a2.b.c.name).to.be.equal("12");
        expect(a2.b2).to.be.deep.equal(a1.b2, "Only changed paths are cloned");

        const i3 = a2.__set(x => x.b2.ar, [3, 4]);
        expect(i3.b2.ar).to.be.not.equal(a2.b2.ar);

        const i4 = i3.__set(x => x.foo, "bar2");
        expect(i4.foo).to.be.equal("bar2");
    });

    it("modify root", () => {
        const i = makeImmutable(a);

        const i2 = i.__set(x => x.foo, "12");
        expect(i2.foo).to.be.equal("12");
    });

    it("set value in array", () => {
        const i = makeImmutable(a);

        const i2 = i.__set(x => x.b2.ar[1], 42);

        expect(i2).to.be.not.equal(i);
        expect(i2.b2.ar[1]).to.be.equal(42);
    });

    it("set multiple properties at once", () => {
        const a1 = makeImmutable(a);

        const i2 = a1.__set(x => x.b2.c, x => ({
            "id": 11,
            "name": "12"
        }));

        expect(a1).to.be.not.eq(i2);
        expect(a1.b2.c.id).to.be.eq(23);
        expect(a1.b2.c.name).to.be.eq("c2");

        expect(i2.b2.c.id).to.be.eq(11);
        expect(i2.b2.c.name).to.be.eq("12");
    });

    it("set complex value", () => {
        const i = makeImmutable({
            foo: [1, 2]
        });

        const i2 = i.__set(x => x.foo, i.foo.concat([3]));
        expect(i).to.be.not.equal(i2);
        expect(i.foo).to.be.not.equal(i2.foo);
        expect(i2.foo).to.be.deep.equal([1, 2, 3]);
    });

    describe("map", () => {
        it("add element to map", () => {
            const d1 = makeImmutable({
                foo: {
                    "a": 42,
                    "b": 23
                } as { [key: string]: number }
            });

            const d2 = d1.__set(x => x.foo, x => ({
                ...x,
                ["c"]: 11
            }));

            expect(d1).to.be.not.equal(d2);
            expect(d2.foo).to.be.deep.equal({
                "a": 42,
                "b": 23,
                "c": 11
            });
        });

        it("remove element from map", () => {
            const d1 = makeImmutable({
                foo: {
                    "a": 42,
                    "b": 23
                } as { [key: string]: number }
            });

            const propToRemove = "a";
            const d2 = d1.__set(x => x.foo, ({ [propToRemove]: _, ...r }) => r);
            expect(d1).to.be.not.equal(d2);
            expect(d2.foo).to.be.deep.equal({
                b: 23
            });
        });
    });
});