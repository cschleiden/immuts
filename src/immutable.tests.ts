/// <reference path="../typings/index.d.ts" />

import "mocha";
import { expect } from "chai";

import { Immutable, ImmutableArray } from "./immutable";

interface IFolder {
    id: string;

    foo(): string;
}

class Folder extends Immutable<IFolder, Folder> implements IFolder {
    constructor(id: string) {
        super({
            id: id,
            foo: undefined
        });
    }

    public id: string;

    public foo(): string {
        return this.id + "12";
    }
}

interface IRepository {
    id: string;
    folders: ImmutableArray<IFolder>;
}

class Repository extends Immutable<IRepository, Repository> implements IRepository {
    constructor(id: string, folders: IFolder[]) {
        super({
            id: id,
            folders: new ImmutableArray<IFolder>([])
        });
    }

    public id: string;
    public folders: ImmutableArray<IFolder>;
}

describe("lib", () => {
    it("ts", () => {
        var r = new Repository("42", []);
        expect(r.id).to.be.equal("42");
        expect(() => r.id = "23").throw;

        let r2 = r.set(x => x.id = "23");
        expect(r2).to.be.not.eq(r);
        
        expect(r2.id).to.be.equal("23");
        expect(r.id).to.be.equal("42");
    
        let r3 = r2.set(x => x.folders = x.folders.push(new Folder("f1")));
        expect(r3).to.be.not.eq(r2);
        expect(r3.folders.length).to.be.eq(1);
        expect(r2.folders.length).to.be.eq(0);
        
        let r4 = r3.set(x => x.folders = x.folders.push(new Folder("f2")));
        expect(r4).to.be.not.eq(r3);
        expect(r4.folders.length).to.be.eq(2);
        expect(r3.folders.length).to.be.eq(1);

        expect(r4.folders.get(0).foo()).to.be.eq("2312");
    });
});

describe("array", () => {
    it("should copy for push", () => {
        let a = new ImmutableArray<number>();

        let a2 = a.push(1, 2);
        expect(a).to.be.not.equal(a2);
        expect(a.length).to.be.eq(0);
        expect(a2.length).to.be.eq(2);
    });
});