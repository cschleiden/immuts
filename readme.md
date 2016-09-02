immuts
=====

Type-safe, generic immutable datastructure for Typescript. Can be used as thin wrapper over `immutablejs` (or similar libraries) or on its own. 

## Motivation

tbd

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
let c2 = i.set(x => x.b.a1.id = 12);
let c3 = i.get();

// c !== c2 => true
// c2 === c3 => true

// c.b.a2 === c2.b.a2 => true
// c.b.a1 !== c2.b.a1 => true
```

### Complex Types

Plain JS objects can be easily cloned. When you have more complex objects, you can use a custom `CloneStrategy`:

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

let a = new Immutable(new X(23), new DefaultImmutableBackend<X>(new CustomCloneStrategy());
let a2 = a.set(x => x.bar = 42);

// a !== a2 => true
```

Another example for more complex, richer object hierarchies: 

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

let a = new Immutable(new Y("23"), new DefaultImmutableBackend<Y>(new CustomCloneStrategy()));
let a2 = a.set(x => x.bar = "42");

// a !== a2 => true
// a.bar === "23" => true
// a2.bar === "42" => true
```

## Other backends

You can build your own backend/adapter or use the provided one for `immutable-js`: 

Usage: 

```TypeScript
let a = new Immutable<IC>({ ... }, new ImmutableJsAdapterBackend<IC>());
```

Code:
```TypeScript
export class ImmutableJsBackendAdapter<T> implements IImmutableBackend<T> {
    private data: Immutable.Map<string, any>;

    public init(data: T) {
        this.data = Immutable.fromJS(data);
    }

    public set<U>(path: string[], key: string, value: U) {
        this.data.setIn(path.concat([key]), value);
    }

    public update<U>(path: string[], update: (target: U) => void) {
        this.data.updateIn(path, update);
    }

    public get(): T {
        return this.data.toJS() as T;
    }
}
```

## Limitations

To build up the property path (`i.set(x => x.a.b.c)` needs to be captured into `["a", "b", "c"]`) the library relies on the ES6 [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) object. In browsers where this is not suppored (mainly all versions of Internet Explorer) a fallback is used using `Object.defineProperty`. 

This method does not deal correctly with optional properties, so something like this:

```TypeScript
interface IA {    
    foo?: string;
    bar: number;
}

let i = new Immutable<IA>({
    // foo: "test", - leave undefined! 
    bar: 42
});

i.set(x => x.foo = "test2");
```

would fail because `foo` did not exist at the time of creation. If you don't target Internet Explorer this will not be an issue and everything should work just fine.

## Outlook


## TODO

- Provide example(s) and tests for arrays
- lots more :)  