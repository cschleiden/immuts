## Work in Progress! ##

Title
=====

Initial attempt at providing a type-safe, generic immutable datastructure for Typescript.  


## Usage ## 

### Simple ###

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

### Nested ###  

    interface IA {
        id: number;
        name: string;
    }

    interface IB {
        a1: IA;
        a2: IA;
    }
    
    let i = new Immutable<IB>({
            a1: {  
                id: 42,
                name: "foo"
            }, 
            a2: {
                id: 23,
                name: "bar"
            }
        });

    let b = i.get();
    let b2 = i.set()(x => x.a1).val(x => x.id = 12);
    
    // b !== b2 => true
    // b.a2 === b2.a2 => true
    // b.a1 !== b2.a1 => true

### Complex Types ###

## Limitations ##

Object values in nested scenario have to be unique, due to the lack of a reliable way of identifying property names in Typescript. Something like 

    let a = {
        id: 12
    };

    let b = {
        a1: a,
        a2: a
    }

will fail. For a call like `i.set()(x => a1)` the `"a1"` name cannot be reliably identified, because `a1` and `a2` point to the same value.

## Outlook ##



## TODO ##

- Use something like `immutable-js` for internal storage
- Provide example for arrays  