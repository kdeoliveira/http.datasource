import QuickLRU from "@alloc/quick-lru";
import { RequestError } from "../exceptions/requestError.excpetion";
import { STATUS_CODES } from "http";
import { DataSource, DataSourceConfig, KeyValueCache, URLSearchParams } from "kdeoliveira.types";
import { CacheOptions, DataSourceOptions, Dictionary, Query, QueryResult, Request, RequestOptions, Response } from "../types/datasource.types";
import { Dispatcher, Pool } from "undici";
import sjson from "secure-json-parse";
//Note that due to changes on ESM rules for this package, use version below 5.0.0
import pTimeout from "p-timeout";
import BaseDataSource from "./base.datasource";
import { Repository, EntityTarget } from "typeorm";
import { Connection } from "typeorm";

export abstract class SqlDataSource<T> extends BaseDataSource<T> {
    protected database: Connection;
    protected repository: Repository<T>;
    constructor(baseUrl: string, connection: Connection, entity: EntityTarget<T>, options?: DataSourceOptions) {
        super(baseUrl, options);
        try {
            this.database = connection;
            this.repository = connection.getRepository<T>(entity);
        }
        catch (err: any) {
            console.error(err);
            throw new Error(err);
        }
    }

    protected isResponseOk(statusCode: number): boolean {
        return (statusCode >= 200 && statusCode <= 399) || statusCode === 304
    }

    protected isResponseCacheable<TResult = unknown>(
        request: Request,
        response: Response<TResult>,
    ): boolean {
        return this._statusCodeCacheableByDefault.has(response.statusCode) && request.method === 'GET'
    }

    // private async request<T>(request: Query<T>, fn : any) {
    //     const {
    //         context,
    //         query,
    //         options,
    //         cacheOptions
    //     } = request;

    //     let result : T[];
    //     let method = Object.getOwnPropertyDescriptor(this.repository, fn);
    //     try {
    //         console.log(method);
    //         if (query) {
    //             result = await method?.value(
    //                 [query,
    //                 {
    //                     ...options, 
    //                     ...cacheOptions
    //                 }])
    //         } else {
    //             result = await method?.value(
    //                 [{
    //                 ...options, 
    //                 ...cacheOptions
    //                 }]
    //             )
    //         }
    //     }
    //     catch (err: any) {
    //         throw new Error(err)
    //     }
        
    //     return {
    //         data: result,
    //         context
    //     }
    // }

    //Regular Request handler in http
    // private async performRequest<TResult>(
    //     request: Request,
    //     cacheKey: string,
    // ): Promise<Response<TResult>> {
    //     try {
    //         if (request.body !== null && typeof request.body === 'object') {
    //             if (request.headers['content-type'] === undefined) {
    //                 request.headers['content-type'] = 'application/json; charset=utf-8'
    //             }
    //             request.body = JSON.stringify(request.body)
    //         }

    //         //Perform actions before request is processed
    //         await this.onRequest?.(request)

    //         const requestOptions: Dispatcher.RequestOptions = {
    //             method: request.method,
    //             origin: request.origin,
    //             path: request.path,
    //             headers: request.headers,
    //             signal: request.signal,
    //             body: request.body as string,
    //         }

    //         const responseData = await this.pool.request(requestOptions)
    //         responseData.body.setEncoding('utf8')

    //         let data = ''
    //         for await (const chunk of responseData.body) {
    //             data += chunk
    //         }

    //         let json = null
    //         if (responseData.headers['content-type']?.includes('application/json')) {
    //             if (data.length && typeof data === 'string') {
    //                 json = sjson.parse(data)
    //             }
    //         }

    //         const response: Response<TResult> = {
    //             isFromCache: false,
    //             memoized: false,
    //             ...responseData,
    //             body: json ?? data,
    //         }

    //         this.onResponse<TResult>(request, response)

    //         // let's see if we can fill the shared cache
    //         if (request.requestCache && this.isResponseCacheable<TResult>(request, response)) {
    //             response.maxTtl = Math.max(request.requestCache.maxTtl, request.requestCache.maxTtlIfError)
    //             const cachedResponse = JSON.stringify(response)

    //             // respond with the result immedialty without waiting for the cache
    //             this.cache
    //                 .set(cacheKey, cachedResponse, {
    //                     ttl: request.requestCache?.maxTtl,
    //                 })
    //                 .catch((err) => { })
    //             this.cache
    //                 .set(`staleIfError:${cacheKey}`, cachedResponse, {
    //                     ttl: request.requestCache?.maxTtlIfError,
    //                 })
    //                 .catch((err) => { })
    //         }

    //         return response
    //     } catch (error: any) {
    //         this.onError?.(error, request)

    //         if (request.requestCache) {
    //             // short circuit in case of the cache does not fail fast enough for any reason
    //             const cacheItem = await pTimeout(
    //                 this.cache.get(`staleIfError:${cacheKey}`),
    //                 request.requestCache.maxCacheTimeout,
    //             )

    //             if (cacheItem) {
    //                 const response: Response<TResult> = sjson.parse(cacheItem)
    //                 response.isFromCache = true
    //                 return response
    //             }
    //         }

    //         throw new Error(error)
    //     }
    // }

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
    protected onResponse<TResult = unknown>(
        request: Request,
        response: Response<TResult>,
    ): Response<TResult> {
        if (this.isResponseOk(response.statusCode)) {
            return response
        }

        throw new RequestError(
            `Response code ${response.statusCode} (${STATUS_CODES[response.statusCode.toString()]})`,
            response.statusCode,
            request,
            response,
        )
    }

    protected onError?(_error: Error, requestOptions: Request): void

    public async get(
        { options, cacheOptions}: Partial<Query<T>>
    ): Promise<T[]> {
        return await this.repository.find({
            ...options,
            ...cacheOptions
        });

        
        // return this.request<T>({
        //     context: {
        //         "test": "1"
        //     },
        //     cacheOptions: cacheOptions ?? {
        //         id: "getter",
        //         milliseconds: 5000
        //     },
        //     options
        // }, "find")
    }

}
