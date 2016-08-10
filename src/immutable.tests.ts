/// <reference path="../typings/index.d.ts" />

import "mocha";
import { expect } from "chai";

import { Immutable, ImmutableArray } from "./immutable";

interface IFolder {
    id: string;

    foo(): string;
}

class Folder extends Immutable<Folder> implements IFolder {
    constructor(id: string) {
        super(() => {
            this.id = id;
        });
    }

    public id: string;

    public foo(): string {
        return this.id + "foo";
    }

    protected _clone(): Folder {
        return new Folder(this.id);
    }
}

interface IRepository {
    id: string;
    specialFolder: IFolder;

    folders: ImmutableArray<IFolder>;
}

class Repository extends Immutable<Repository> implements IRepository {
    constructor(id: string, specialFolder: Folder, folders: ImmutableArray<Folder>) {
        super(() => {
            this.id = id;
            this.specialFolder = specialFolder;
            this.folders = folders;
        });
    }

    public id: string;
    public specialFolder: Folder;
    public folders: ImmutableArray<Folder>;

    protected _clone(): Repository {
        return new Repository(this.id, this.specialFolder, this.folders);
    }
}

describe("lib", () => {
    it("ts", () => {
        // Create new immutable object, ensure it cannot be modified
        var r = new Repository("42", new Folder("f1"), new ImmutableArray([new Folder("ff1"), new Folder("ff2")]));
        expect(() => r.id = "23").to.throw();
        expect(() => r2.set(r => r["specialFolder"].id = "f2")).to.throw();
        expect(r.id).to.be.equal("42");

        // Set property on object
        let r2 = r.set(x => x.id = "23");
        expect(r2).to.be.not.eq(r);

        // Ensure un-modified properties are still the same
        expect(r.folders).to.be.eq(r2.folders);

        // Modify nested object
        let r3 = r2
            .set(r => r.specialFolder = r.specialFolder
                .set(f => f.id = "f2"));
        expect(r3).to.be.not.eq(r2);
        expect(r3.specialFolder).to.be.not.eq(r2.specialFolder);
        expect(r3.specialFolder.id).to.be.eq("f2");
        expect(r2.specialFolder.id).to.be.eq("f1");

        // Call methods on new immutable instances
        expect(r2.specialFolder.foo()).to.be.eq("f1foo");
        expect(r3.specialFolder.foo()).to.be.eq("f2foo");

        // Add element to array
        let r4 = r3.set(r => r.folders = r.folders.push(new Folder("ff3")));
        expect(r4.folders.length).to.be.eq(3);
        expect(r3.folders.length).to.be.eq(2);        
        expect(r4.folders).to.be.not.eq(r3.folders);

        // Change element in array
        let r5 = r4.set(r => r.folders = r.folders.set(0, r.folders.get(0).set(f => f.id = "ff12")));
        expect(r5.folders.toArray().map(f => f.id)).to.deep.equal(["ff12", "ff2", "ff3"]);
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