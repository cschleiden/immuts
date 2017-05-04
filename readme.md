immuts
=====

Type-safe, generic immutable datastructure for Typescript. Does not require manually setting JS paths `["a", "b", "c"]` and allows TS autocompleted drilldown.

## Changelog
 
 * **0.4.5** - Added some methods for dealing with native arrays
 * **0.4.0** - Removed incomplete immutablejs adapter for now
 * **0.3.0** - Improved support for working with arrays and maps

## Usage 

### Simple

```TypeScript
interface IA {
    id: number;
    name: string;
}

let a1 = makeImmutable<IA>({  
    id: 42,
    name: "foo"
});

let a2 = a1.set(x => x.id, 23);

// a1 !== a2 => true

let a3 = a2.set(x => x.id, "23"); // Results in compiler error, string cannot be assigned to number

// Back to JS
let plainJs = a3.data;

// or
let plainJs2 = a3.toJS(); 
```

### Updating multiple properties

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

let c = makeImmutable<IC>({
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

let c2 = c.merge(x => x.b.a1, {
    id: 23
});

// c2.data.b.a1.id === 23 => true
// c2.data.b.a1.name === "foo" => true
```

### Nested  

The integration is most valuable when used with a nested object: 

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

let c = makeImmutable<IC>({
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

let c2 = c.set(x => x.b.a1.id, 12);

// c !== c2 => true

// c.data.b.a2 === c2.data.b.a2 => true
// c.data.b.a1 !== c2.data.b.a1 => true
```

when you execute this:

```TypeScript
let c2 = c.set(x => x.b.a1.id, 12);
```

the root, `b`, and `a1` will be automatically cloned, before the new `id` is assigned to a1. And again, everything is type-safe, something like
```TypeScript
let c4 = c.set(x => x.b.a1.id, "12");
``` 
would result in a compiler error, because the types of `id` and `"12"` do not match. 

### Maps

#### Add element

```TypeScript
const c = makeImmutable({
    foo: {
        "a": 42,
        "b": 23
    }
});

const c2 = c.merge(x => x.foo, {
    "c": 11
});

// c1.data.foo !== c2.data.foo => true
// c2.data.foo deep equals { "a": 42, "b": 23, "c": 11 }
```

#### Remove element

```TypeScript
const c = makeImmutable({
    foo: {
        "a": 42,
        "b": 23
    }
});

const c2 = c.remove(x => x.foo["b"]);

// c1.data.foo !== c2.data.foo => true
// c2.data.foo deep equals { "a": 42 }
```

### Arrays 

#### Add element

```TypeScript
const c = makeImmutable({
    foo: [1, 2]
});

const c2 = c.array.insert(x => x.foo, 3);

// c1.data.foo !== c2.data.foo => true
// c2.data.foo deep equals [1, 2, 3] => true
```

#### Remove element

```TypeScript
const c = makeImmutable({
    foo: [1, 2, 3]
});

const c2 = c.array.remove(x => x.foo, 0);

// c2.data.foo deep equals [2, 3] => true
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

let a = makeImmutable(new X(23), new DefaultImmutableBackend<X>(new CustomCloneStrategy());
let a2 = a.set(x => x.bar, 42);

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

let a = makeImmutable(new Y("23"), new DefaultImmutableBackend<Y>(new CustomCloneStrategy()));
let a2 = a.set(x => x.bar, "42");
let a3 = a.update(x => x.bar, x => x + "3");

// a !== a2 => true
// a.data.bar === "23" => true
// a2.data.bar === "42" => true
// a3.data.bar === "423" => true
```

## Limitations

### Internet Explorer and `undefined`

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

i.set(x => x.foo, "test2");
```

would fail because `foo` did not exist at the time of creation. If you don't target Internet Explorer this will not be an issue and everything should work just fine.

## Outlook


## TODO

- provide example(s) and tests for arrays
- benchmarks
- lots more :)  