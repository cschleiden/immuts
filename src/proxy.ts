type Proxy = any;
declare var Proxy: any;

// Detect ES6 proxy support
let proxySupported: boolean = false;
try {
    if ((window as any)["Proxy"]) {
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

    constructor(source: T, private _get: (name: string) => void) {
        /// #if DEBUG
        if (!source) {
            throw new Error("Source cannot be null");
        }
        /// #endif

        this._makeProxy(this, source, "root");
    }

    private _makeProxy<U, W>(target: U, source: W, key: string) {
        /// #if DEBUG
        if (!source) {
            throw new Error("Source cannot be null");
        }
        /// #endif


        if (key) {
            if (this._proxyCache[key]) {
                return this._proxyCache[key];
            }
        }

        for (let propertyName of Object.getOwnPropertyNames(source)) {
            Object.defineProperty(target, propertyName, {
                get: () => {
                    this._get(propertyName);

                    let next = source[propertyName];
                    if (typeof next !== "object") {
                        // Might be end of the chain, to not progress further
                        return null;
                    }

                    return this._makeProxy({}, next, `${key || ""}-${propertyName}`);
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

    public path: string[] = [];

    /**
     * @param _source Source object, will be used then creating legacy proxy to enumerate propertiesAccessed
     * @param _done Callback when a 'set' operation is called on proxy
     */
    constructor(private _source: T) {
        if (proxySupported) {
            this._p = new Proxy(
                {},
                {
                    get: (target: any, key: string) => {
                        this.path.push(key);

                        // Recursively return proxy
                        return this._p;
                    }
                });
        } else {
            this._p = new LegacyProxy<T>(this._source, (name: string) => {
                this.path.push(name);
            });
        }
    }

    public get(): T {
        // Reset path
        this.path = [];

        return <any>this._p;
    }
}