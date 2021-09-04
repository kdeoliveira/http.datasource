import { KeyValueCache } from "kdeoliveira.types";
import { DataSourceOptions, Request, RequestOptions, Response } from "../types/datasource.types";
import BaseDataSource from "./base.datasource";
export default abstract class RestDataSource<T> extends BaseDataSource {
    private pool;
    constructor(baseUrl: string, options?: DataSourceOptions, cache?: KeyValueCache<string>);
    protected isResponseOk(statusCode: number): boolean;
    protected isResponseCacheable<TResult = unknown>(request: Request, response: Response<TResult>): boolean;
    protected onCacheKeyCalculation(request: Request): string;
    private request;
    private performRequest;
    /**
    * onRequest is executed before a request is made and isn't executed for memoized calls.
    * You can manipulate the request e.g to add/remove headers.
    *
    * @param request
    */
    protected abstract onRequest(request: Request): Promise<void>;
    /**
     * onResponse is executed when a response has been received.
     * By default the implementation will throw for for unsuccessful responses.
     *
     * @param _request
     * @param response
     */
    protected onResponse<TResult = unknown>(request: Request, response: Response<TResult>): Response<TResult>;
    protected onError?(_error: Error, requestOptions: Request): void;
    get<TResult = unknown>(path: string, requestOptions?: RequestOptions): Promise<Response<TResult>>;
    post<TResult = unknown>(path: string, requestOptions?: RequestOptions): Promise<Response<TResult>>;
    delete<TResult = unknown>(path: string, requestOptions?: RequestOptions): Promise<Response<TResult>>;
    put<TResult = unknown>(path: string, requestOptions?: RequestOptions): Promise<Response<TResult>>;
    patch<TResult = unknown>(path: string, requestOptions?: RequestOptions): Promise<Response<TResult>>;
}
//# sourceMappingURL=rest.datasource.d.ts.map