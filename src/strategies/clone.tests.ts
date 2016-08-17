/// <reference path="../../typings/index.d.ts" />

import "mocha";
import { expect } from "chai";

import { DefaultCloneStrategy } from "./clone";


interface IComplex {
    name: string;
    foo: number;
}

class Complex implements IComplex {
    public name: string;
    public foo: number;
}

describe("default clone strategy", () => {
    it("fails for complex objects", () => {
        let strategy = new DefaultCloneStrategy();
        expect(() => strategy.clone(new Complex())).to.throw();
    });

    it("succeeds for simple objects", () => {
        let strategy = new DefaultCloneStrategy();
        let a = { foo: 42 };
        let b = strategy.clone(a);
        expect(a).to.be.not.equal(b);
    });
})