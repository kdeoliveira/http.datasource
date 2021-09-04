/// <reference types="node" />
import { Pool } from "undici";
import { EventEmitter, ResponseData } from "undici/types/dispatcher";
import { FindManyOptions } from "typeorm";
export interface Dictionary<T> {
    [Key: string]: T | undefined;
}
export interface LRUOptions {
    readonly maxAge?: number;
    readonly maxSize?: number;
}
export declare type RequestOptions = Omit<Partial<Request>, 'origin' | 'path' | 'method'>;
export declare type Response<TResult> = {
    body: TResult;
    memoized: boolean;
    isFromCache: boolean;
    maxTtl?: number;
} & Omit<ResponseData, 'body'>;
export interface DataSourceOptions {
    dbConnection?: string;
    pool?: Pool;
    requestOptions?: RequestOptions;
    clientOptions?: Pool.Options;
    lru?: Partial<LRUOptions>;
}
export declare type CacheTTLOptions = {
    requestCache?: {
        maxCacheTimeout: number;
        maxTtl: number;
        maxTtlIfError: number;
    };
};
export declare type Request<T = unknown> = {
    context: Dictionary<string>;
    query: Dictionary<string | number>;
    body: T;
    signal?: AbortSignal | EventEmitter | null;
    json?: boolean;
    origin: string;
    path: string;
    method: string;
    headers: Dictionary<string>;
} & CacheTTLOptions;
export declare type CacheOptions = {
    id: string;
    milliseconds: number;
};
export declare type Query<T = unknown> = {
    context: Dictionary<string>;
    query?: string | object;
    options?: FindManyOptions<T>;
    cacheOptions?: CacheOptions;
};
export declare type QueryResult<T> = {
    data: T;
    context: Dictionary<string>;
};
//# sourceMappingURL=datasource.types.d.ts.map