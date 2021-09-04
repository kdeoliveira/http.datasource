import QuickLRU from "@alloc/quick-lru";
import { RequestError } from "../exceptions/requestError.excpetion";
import { STATUS_CODES } from "http";
import { DataSource, DataSourceConfig, KeyValueCache, URLSearchParams } from "kdeoliveira.types";
import { DataSourceOptions, Dictionary, Request, RequestOptions, Response } from "../types/datasource.types";
import { Dispatcher, Pool } from "undici";
import sjson from "secure-json-parse";
//Note that due to changes on ESM rules for this package, use version below 5.0.0
import pTimeout from "p-timeout";
import BaseDataSource from "./base.datasource";
import { InMemoryLRUCache } from "../cache/InMemoryLRUCache";



export default abstract class RestDataSource extends BaseDataSource {
    private pool: Pool;
    constructor(baseUrl: string, options?: DataSourceOptions, cache?:KeyValueCache<string>) {
        super(baseUrl, options);
        this.cache = cache ? cache : new InMemoryLRUCache();
        this.pool = options?.pool ?? new Pool(this.baseUrl, options?.clientOptions);
    }

    // override initialize(config: DataSourceConfig<T>): void {
    //     this.context = config.context;
    //     this.cache = config.cache;
    // }

    // private buildQueryString(query: Dictionary<string | number>): string {
    //     const params = new URLSearchParams()
    //     for (const key in query) {
    //         if (Object.prototype.hasOwnProperty.call(query, key)) {
    //             const value = query[key]
    //             if (value !== undefined) {
    //                 params.append(key, value.toString())
    //             }
    //         }
    //     }
    //     return params.toString()
    // }

    protected isResponseOk(statusCode: number): boolean {
        return (statusCode >= 200 && statusCode <= 399) || statusCode === 304
    }

    protected isResponseCacheable<TResult = unknown>(
        request: Request,
        response: Response<TResult>,
    ): boolean {
        return this._statusCodeCacheableByDefault.has(response.statusCode) && request.method === 'GET'
    }

    //The cache is set with [key: complete_url] => value
    //request.origin + request.path provides the key for each cacheable item
    protected onCacheKeyCalculation(request: Request): string {
        return request.origin + request.path
    }

    private async request<TResult = unknown>(request: Request): Promise<Response<TResult>> {
        if (Object.keys(request?.query).length > 0) {
          request.path = request.path + '?' + this.buildQueryString(request.query)
        }
    
        const cacheKey = this.onCacheKeyCalculation(request)
   
        // check if we have any GET call in the cache to respond immediatly
        if (request.method === 'GET') {
          // Memoize GET calls for the same data source instance
          // a single instance of the data sources is scoped to one graphql request
          if (this.memoizedResults.has(cacheKey)) {
            
            const response = await this.memoizedResults.get(cacheKey)!
            response.memoized = true
            response.isFromCache = false
            return response
          }
        }
    
        const options = {
          ...request,
          ...this.globalRequestOptions,
        }

        

    
        if (options.method === 'GET') {
          // try to fetch from shared cache
          if (request.requestCache) {
            try {
              // short circuit in case of the cache does not fail fast enough for any reason
              const cacheItem = await pTimeout(
                this.cache.get(cacheKey),
                request.requestCache.maxCacheTimeout,
              )

              if (cacheItem) {
                const cachedResponse: Response<TResult> = sjson.parse(cacheItem)
                cachedResponse.memoized = false
                cachedResponse.isFromCache = true
                // Note that this cache is used only as a second-layer; Therefore, if a request other than GET is made, this memoizedResults will be cleared for this cacheKey
                // and only the cache value will be present. However, note that this will be available only the first time after memoizedResults is deleted
                console.log("this.cache.delete(cacheKey)")
                this.cache.delete(cacheKey)
                return cachedResponse
              }
              const response = this.performRequest<TResult>(options, cacheKey)
              this.memoizedResults.set(cacheKey, response)
              return response
            } catch (error : any) {
              console.error(error)
            //   this.logger?.error(`Cache item '${cacheKey}' could not be loaded: ${error.message}`)
            }
          }
    
          const response = this.performRequest<TResult>(options, cacheKey)
          this.memoizedResults.set(cacheKey, response)
    
          return response
        }
    
        return this.performRequest<TResult>(options, cacheKey)
      }

      //Regular Request handler in http
      private async performRequest<TResult>(
        request: Request,
        cacheKey: string,
      ): Promise<Response<TResult>> {
        
        try {
          if (request.body !== null && typeof request.body === 'object') {
            if (request.headers['content-type'] === undefined) {
              request.headers['content-type'] = 'application/json; charset=utf-8'
            }
            request.body = JSON.stringify(request.body)
          }
    
          //Perform actions before request is processed
          await this.onRequest?.(request)

          const requestOptions: Dispatcher.RequestOptions = {
            method: request.method,
            origin: request.origin,
            path: request.path,
            headers: request.headers,
            signal: request.signal,
            body: request.body as string,
          }
    
          const responseData = await this.pool.request(requestOptions)
          responseData.body.setEncoding('utf8')
    
          let data = ''
          for await (const chunk of responseData.body) {
            data += chunk
          }
    
          let json = null
          if (responseData.headers['content-type']?.includes('application/json')) {
            if (data.length && typeof data === 'string') {
              json = sjson.parse(data)
            }
          }
    
          const response: Response<TResult> = {
            isFromCache: false,
            memoized: false,
            ...responseData,
            body: json ?? data,
          }
          
          this.onResponse<TResult>(request, response)
    
          

          //Note that cache corresponds to a Key-Value object that is attached directly on the reponse body for immediate caching
          // let's see if we can fill the shared cache
          if (request.requestCache && this.isResponseCacheable<TResult>(request, response)) {
            
            response.maxTtl = Math.max(request.requestCache.maxTtl, request.requestCache.maxTtlIfError)
            const cachedResponse = JSON.stringify(response)
    
            // respond with the result immedialty without waiting for the cache
            this.cache
              .set(cacheKey, cachedResponse, {
                ttl: request.requestCache?.maxTtl,
              })
              .catch((err) => {})
            this.cache
              .set(`staleIfError:${cacheKey}`, cachedResponse, {
                ttl: request.requestCache?.maxTtlIfError,
              })
              .catch((err) => {})
          }

          
          else if(request.method !== 'GET'){
            // Following GET request only cache, if other request type is made, force cache to be updated after second get request 
            // (Note: first get request will still make usage of this.cache value)
            console.log("this.memoizedResults.delete(cacheKey)");
            this.memoizedResults.delete(cacheKey);
          //   this.cache.delete(cacheKey);
          }
    
          return response
        } catch (error : any) {
          this.onError?.(error, request)
    
          if (request.requestCache) {
            // short circuit in case of the cache does not fail fast enough for any reason
            const cacheItem = await pTimeout(
              this.cache.get(`staleIfError:${cacheKey}`),
              request.requestCache.maxCacheTimeout,
            )
    
            if (cacheItem) {
              const response: Response<TResult> = sjson.parse(cacheItem)
              response.isFromCache = true
              return response
            }
          }
    
          throw new Error(error)
        }
      }

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

    public async get<TResult = unknown>(
        path: string,
        requestOptions?: RequestOptions,
      ): Promise<Response<TResult>> {
        return this.request<TResult>({
          headers: {},
          query: {},
          body: null,
          context: {},
          ...requestOptions,
          method: 'GET',
          path,
          origin: this.baseUrl,
        })
      }
    
      public async post<TResult = unknown>(
        path: string,
        requestOptions?: RequestOptions,
      ): Promise<Response<TResult>> {
        return this.request<TResult>({
          headers: {},
          query: {},
          body: null,
          context: {},
          ...requestOptions,
          method: 'POST',
          path,
          origin: this.baseUrl,
        })
      }
    
      public async delete<TResult = unknown>(
        path: string,
        requestOptions?: RequestOptions,
      ): Promise<Response<TResult>> {
        return this.request<TResult>({
          headers: {},
          query: {},
          body: null,
          context: {},
          ...requestOptions,
          method: 'DELETE',
          path,
          origin: this.baseUrl,
        })
      }
    
      public async put<TResult = unknown>(
        path: string,
        requestOptions?: RequestOptions,
      ): Promise<Response<TResult>> {
        return this.request<TResult>({
          headers: {},
          query: {},
          body: null,
          context: {},
          ...requestOptions,
          method: 'PUT',
          path,
          origin: this.baseUrl,
        })
      }
    
      public async patch<TResult = unknown>(
        path: string,
        requestOptions?: RequestOptions,
      ): Promise<Response<TResult>> {
        return this.request<TResult>({
          headers: {},
          query: {},
          body: null,
          context: {},
          ...requestOptions,
          method: 'PATCH',
          path,
          origin: this.baseUrl,
        })
      }



}