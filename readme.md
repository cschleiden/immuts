## Work in Progress!

Title
=====

Initial attempt at providing a type-safe, generic immutable datastructure for Typescript.  

## Motivation

## Usage 

### Simple

```TypeScript
interface IA {
    id: number;
    name: string;
}

let i = new Immutable<IA>({  
    id: 42,
    name: "foo"
});

let a = i.get();
let a2 = i.set(x => x.id = 23);

// a !== a2 => true
```

### Nested  

```TypeScript
interface IA {
    id: number;
    name: string;
}

interface IB {
    a1: IA;
    a2: IA;
}

interface IC {
    b: IB;
}

let i = new Immutable<IC>({
        b: {
            a1: {  
                id: 42,
                name: "foo"
            }, 
            a2: {
                id: 23,
                name: "bar"
            }
        }
    });

let c = i.get();
let c2 = i.select(x => x.b)(x => x.a1).set(x => x.id = 12);
let c3 = i.get();

// c !== c2 => true
// c2 === c3 => true

// c.b.a2 === c2.b.a2 => true
// c.b.a1 !== c2.b.a1 => true
```

### Complex Types

Plain JS objects can be easily cloned. When you have more complex objects, a custom `CloneStrategy` can be used:

```TypeScript
class X {
    constructor(public foo: number) { }
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

let a = new Immutable(new X(23), new CustomCloneStrategy());
let a2 = a.set(x => x.bar = 42);

// a !== a2 => true
```

for more complex, and richer object hierarchies something like this can also be done: 

```TypeScript
interface ICloneable<T> {
    clone(): T;
}

class Y implements ICloneable<Y> {
    constructor(public bar: string) { }

    public clone(): Y {
        return new Y(this.bar);
    }
}

class CustomCloneStrategy implements IImmutableCloneStrategy {
    public clone<T>(source: ICloneable<T>): T {
        if (source.clone) {
            return source.clone();
        }

        throw new Error("Type not supported");
    }
}

let a = new Immutable(new Y("23"), new CustomCloneStrategy());
let a2 = a.set(x => x.bar = "42");

// a !== a2 => true
// a.bar === "23" => true
// a2.bar === "42" => true
```

## Limitations

Object values in nested scenario have to be unique, due to the lack of a reliable way of identifying property names in Typescript. Something like 

```TypeScript
let a = {
    id: 12
};

let b = {
    a1: a,
    a2: a
}
```

will fail. For a call like `i.set(x => a1)` the `"a1"` name cannot be reliably identified, because `a1` and `a2` point to the same value. A feature like `nameof` in C# would solve a lot of these problems.

## Outlook



## TODO

- Maybe use `immutable-js` for internal storage, only extract the property names and defer actual update to something like `updateIn(['a', 'b', 'c'], x => "12")`
- Provide example(s) and tests for arrays
- lots more :)  