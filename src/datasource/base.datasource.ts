import QuickLRU from "@alloc/quick-lru";
import { DataSourceOptions, Dictionary, RequestOptions, Response } from "../types/datasource.types"
import { DataSource, KeyValueCache, URLSearchParams } from "kdeoliveira.types";
import { InMemoryLRUCache } from "../cache/InMemoryLRUCache";



//Note that for REST APIs, only GET requests can be cahced, since for any other request.method, the response will vary according to body provided
export default abstract class BaseDataSource<T = any> extends DataSource{
    public context!: T;
    protected globalRequestOptions?: RequestOptions;
    //First-layer cache implementation for GET requests only
    protected readonly memoizedResults: QuickLRU<string, Promise<Response<any>>>;
    //Second-layer Cache implementation for GET requests only, in case first-layer is empty
    protected cache!: KeyValueCache<string>;

    protected readonly _statusCodeCacheableByDefault = new Set([200, 203]);

    constructor(public readonly baseUrl: string, protected readonly options?: DataSourceOptions){
        super();
        this.memoizedResults = new QuickLRU({
            maxSize: this.options?.lru?.maxSize ? this.options?.lru?.maxSize : 100
        });

        this.globalRequestOptions = options?.requestOptions;
    }

    protected buildQueryString(query: Dictionary<string | number>): string {
        const params = new URLSearchParams()
        for (const key in query) {
            if (Object.prototype.hasOwnProperty.call(query, key)) {
                const value = query[key]
                if (value !== undefined) {
                    params.append(key, value.toString())
                }
            }
        }
        return params.toString()
    }

    
}