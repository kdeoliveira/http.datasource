import { ConnectionOptions } from "typeorm";
import { Pool } from "undici";
import { EventEmitter, ResponseData } from "undici/types/dispatcher";
import {FindManyOptions} from "typeorm";

export interface Dictionary<T> {
    [Key: string]: T | undefined
  }

export interface LRUOptions {
    readonly maxAge?: number;
    readonly maxSize?: number;
}

export type RequestOptions = Omit<Partial<Request>, 'origin' | 'path' | 'method'>;

export type Response<TResult> = {
    body: TResult
    memoized: boolean
    isFromCache: boolean
    // maximum ttl (seconds)
    maxTtl?: number
  } & Omit<ResponseData, 'body'>

export interface DataSourceOptions {
    dbConnection?: string,
    pool? : Pool;
    requestOptions?: RequestOptions;
    clientOptions?: Pool.Options;
    lru?: Partial<LRUOptions>
}

export type CacheTTLOptions = {
    requestCache?: {
      // In case of the cache does not respond for any reason. This defines the max duration (ms) until the operation is aborted.
      maxCacheTimeout: number
      // The maximum time an item is cached in seconds.
      maxTtl: number
      // The maximum time an item fetched from the cache is case of an error in seconds.
      // This value must be greater than `maxTtl`.
      maxTtlIfError: number
    }
  }

  export type Request<T = unknown> = {
    context: Dictionary<string>
    query: Dictionary<string | number>
    body: T
    signal?: AbortSignal | EventEmitter | null
    json?: boolean
    origin: string
    path: string
    method: string
    headers: Dictionary<string>
  } & CacheTTLOptions

  export type CacheOptions = {
    id: string,
    milliseconds: number
  }

  export type Query<T = unknown> = {
    context: Dictionary<string>
    query?: string | object
    options?: FindManyOptions<T>
    cacheOptions?: CacheOptions
  }

  export type QueryResult<T> = {
    data: T,
    context: Dictionary<string>
  }