type Proxy = any;
declare var Proxy: any;

// Detect ES6 proxy support
let proxySupported: boolean = false;
try {
    if (window["Proxy"]) {
        let p = new Proxy({}, {
            get: () => {
                return true;
            }
        });

        if (p.x) {
            proxySupported = true;
        }
    }
} catch (e) {
}

class LegacyProxy<T> {
    private _proxyCache = {};

    constructor(source: T, private _get: (name: string) => void, private _done: (name: string, value: any) => void) {
        this._makeProxy(this, source);
    }

    private _makeProxy<U, W>(target: U, source: W, key: string = null) {
        if (key) {
            if (this._proxyCache[key]) {
                return this._proxyCache[key];
            }
        }

        for (let propertyName of Object.getOwnPropertyNames(source)) {
            Object.defineProperty(target, propertyName, {
                get: () => {
                    this._get(propertyName);

                    return this._makeProxy({}, source[propertyName], `${ key || "" }-${ propertyName }`);
                },
                set: (value) => {
                    this._done(propertyName, value);
                    return value;
                }
            });
        }

        if (key) {
            this._proxyCache[key] = target;
        }

        return target;
    }
}

export class ImmutableProxy<T> {
    private _p: Proxy | LegacyProxy<T>;

    public propertiesAccessed: string[] = [];


    constructor(private _t: T, private _done: (name: string, value: any) => void) {
        if (proxySupported) {
            this._p = new Proxy(
                {},
                {
                    get: (target: any, key: string) => {
                        this.propertiesAccessed.push(key);

                        // Recursively return proxy
                        return this._p;
                    },
                    set: (target: any, key: string, value: any) => {
                        this._done(key, value);
                        return value;
                    }
                });
        } else {
            this._p = new LegacyProxy<T>(this._t, (name: string) => {
                this.propertiesAccessed.push(name);
            }, this._done);
        }
    }

    public get(): T {
        return <any>this._p;
    }
}