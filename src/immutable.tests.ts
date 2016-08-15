/// <reference path="../typings/index.d.ts" />

import "mocha";
import { expect } from "chai";

import { Immutable, ImmutableArray, IA, IB, IC, IImmutableProperty, Immutable2 } from "./immutable";

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
        let a: IA = {
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

        var i = new Immutable2(a);
        let a1 = i.get();
        let a11 = i.get();        
        expect(a1).to.be.eq(a11);

        i.set()(x => x.b)(x => x.c).val(x => x.name = "12");
        let a2 = i.get();

        expect(a1).to.be.not.eq(a2, "Root is cloned for change");
        expect(a1.b).to.be.not.eq(a2.b, "Path is cloned for change");  
        expect(a1.b.c).to.be.not.eq(a2.b.c, "Path is cloned for change");
        expect(a2.b.c.name).to.be.equal("12");
        expect(a2.b2).to.be.deep.equal(a1.b2, "Only changed paths are cloned");
        
        i.set()(x => x.b2).val(x => x.ar = [3,4]);
        i.set(x => x.foo = "bar2");
        let a3 = i.get();

        expect(a3.foo).to.be.equal("bar2");
        expect(a3.b2.ar).to.be.not.equal(a2.b2.ar);
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