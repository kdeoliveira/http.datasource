import QuickLRU from "@alloc/quick-lru";
import { DataSourceOptions, Dictionary, RequestOptions, Response } from "../types/datasource.types";
import { DataSource, KeyValueCache } from "kdeoliveira.types";
export default abstract class BaseDataSource<T = any> extends DataSource {
    readonly baseUrl: string;
    protected readonly options?: DataSourceOptions | undefined;
    context: T;
    protected globalRequestOptions?: RequestOptions;
    protected readonly memoizedResults: QuickLRU<string, Promise<Response<any>>>;
    protected cache: KeyValueCache<string>;
    protected readonly _statusCodeCacheableByDefault: Set<number>;
    constructor(baseUrl: string, options?: DataSourceOptions | undefined);
    protected buildQueryString(query: Dictionary<string | number>): string;
}
//# sourceMappingURL=base.datasource.d.ts.map