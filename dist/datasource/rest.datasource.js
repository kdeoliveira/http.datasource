"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const requestError_excpetion_1 = require("../exceptions/requestError.excpetion");
const http_1 = require("http");
const undici_1 = require("undici");
const secure_json_parse_1 = __importDefault(require("secure-json-parse"));
//Note that due to changes on ESM rules for this package, use version below 5.0.0
const p_timeout_1 = __importDefault(require("p-timeout"));
const base_datasource_1 = __importDefault(require("./base.datasource"));
const InMemoryLRUCache_1 = require("../cache/InMemoryLRUCache");
class RestDataSource extends base_datasource_1.default {
    constructor(baseUrl, options, cache) {
        var _a;
        super(baseUrl, options);
        this.cache = cache ? cache : new InMemoryLRUCache_1.InMemoryLRUCache();
        this.pool = (_a = options === null || options === void 0 ? void 0 : options.pool) !== null && _a !== void 0 ? _a : new undici_1.Pool(this.baseUrl, options === null || options === void 0 ? void 0 : options.clientOptions);
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
    isResponseOk(statusCode) {
        return (statusCode >= 200 && statusCode <= 399) || statusCode === 304;
    }
    isResponseCacheable(request, response) {
        return this._statusCodeCacheableByDefault.has(response.statusCode) && request.method === 'GET';
    }
    //The cache is set with [key: complete_url] => value
    //request.origin + request.path provides the key for each cacheable item
    onCacheKeyCalculation(request) {
        return request.origin + request.path;
    }
    request(request) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Object.keys(request === null || request === void 0 ? void 0 : request.query).length > 0) {
                request.path = request.path + '?' + this.buildQueryString(request.query);
            }
            const cacheKey = this.onCacheKeyCalculation(request);
            // check if we have any GET call in the cache to respond immediatly
            if (request.method === 'GET') {
                // Memoize GET calls for the same data source instance
                // a single instance of the data sources is scoped to one graphql request
                if (this.memoizedResults.has(cacheKey)) {
                    const response = yield this.memoizedResults.get(cacheKey);
                    response.memoized = true;
                    response.isFromCache = false;
                    return response;
                }
            }
            const options = Object.assign(Object.assign({}, request), this.globalRequestOptions);
            if (options.method === 'GET') {
                // try to fetch from shared cache
                if (request.requestCache) {
                    try {
                        // short circuit in case of the cache does not fail fast enough for any reason
                        const cacheItem = yield p_timeout_1.default(this.cache.get(cacheKey), request.requestCache.maxCacheTimeout);
                        if (cacheItem) {
                            const cachedResponse = secure_json_parse_1.default.parse(cacheItem);
                            cachedResponse.memoized = false;
                            cachedResponse.isFromCache = true;
                            // Note that this cache is used only as a second-layer; Therefore, if a request other than GET is made, this memoizedResults will be cleared for this cacheKey
                            // and only the cache value will be present. However, note that this will be available only the first time after memoizedResults is deleted
                            console.log("this.cache.delete(cacheKey)");
                            this.cache.delete(cacheKey);
                            return cachedResponse;
                        }
                        const response = this.performRequest(options, cacheKey);
                        this.memoizedResults.set(cacheKey, response);
                        return response;
                    }
                    catch (error) {
                        //   this.logger?.error(`Cache item '${cacheKey}' could not be loaded: ${error.message}`)
                    }
                }
                const response = this.performRequest(options, cacheKey);
                this.memoizedResults.set(cacheKey, response);
                return response;
            }
            return this.performRequest(options, cacheKey);
        });
    }
    //Regular Request handler in http
    performRequest(request, cacheKey) {
        var e_1, _a;
        var _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            console.log(cacheKey);
            try {
                if (request.body !== null && typeof request.body === 'object') {
                    if (request.headers['content-type'] === undefined) {
                        request.headers['content-type'] = 'application/json; charset=utf-8';
                    }
                    request.body = JSON.stringify(request.body);
                }
                //Perform actions before request is processed
                yield ((_b = this.onRequest) === null || _b === void 0 ? void 0 : _b.call(this, request));
                const requestOptions = {
                    method: request.method,
                    origin: request.origin,
                    path: request.path,
                    headers: request.headers,
                    signal: request.signal,
                    body: request.body,
                };
                const responseData = yield this.pool.request(requestOptions);
                responseData.body.setEncoding('utf8');
                let data = '';
                try {
                    for (var _g = __asyncValues(responseData.body), _h; _h = yield _g.next(), !_h.done;) {
                        const chunk = _h.value;
                        data += chunk;
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_h && !_h.done && (_a = _g.return)) yield _a.call(_g);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                let json = null;
                if ((_c = responseData.headers['content-type']) === null || _c === void 0 ? void 0 : _c.includes('application/json')) {
                    if (data.length && typeof data === 'string') {
                        json = secure_json_parse_1.default.parse(data);
                    }
                }
                const response = Object.assign(Object.assign({ isFromCache: false, memoized: false }, responseData), { body: json !== null && json !== void 0 ? json : data });
                this.onResponse(request, response);
                //Note that cache corresponds to a Key-Value object that is attached directly on the reponse body for immediate caching
                // let's see if we can fill the shared cache
                if (request.requestCache && this.isResponseCacheable(request, response)) {
                    response.maxTtl = Math.max(request.requestCache.maxTtl, request.requestCache.maxTtlIfError);
                    const cachedResponse = JSON.stringify(response);
                    // respond with the result immedialty without waiting for the cache
                    this.cache
                        .set(cacheKey, cachedResponse, {
                        ttl: (_d = request.requestCache) === null || _d === void 0 ? void 0 : _d.maxTtl,
                    })
                        .catch((err) => { });
                    this.cache
                        .set(`staleIfError:${cacheKey}`, cachedResponse, {
                        ttl: (_e = request.requestCache) === null || _e === void 0 ? void 0 : _e.maxTtlIfError,
                    })
                        .catch((err) => { });
                }
                else if (request.method !== 'GET') {
                    // Following GET request only cache, if other request type is made, force cache to be updated after second get request 
                    // (Note: first get request will still make usage of this.cache value)
                    console.log("this.memoizedResults.delete(cacheKey)");
                    this.memoizedResults.delete(cacheKey);
                    //   this.cache.delete(cacheKey);
                }
                return response;
            }
            catch (error) {
                (_f = this.onError) === null || _f === void 0 ? void 0 : _f.call(this, error, request);
                if (request.requestCache) {
                    // short circuit in case of the cache does not fail fast enough for any reason
                    const cacheItem = yield p_timeout_1.default(this.cache.get(`staleIfError:${cacheKey}`), request.requestCache.maxCacheTimeout);
                    if (cacheItem) {
                        const response = secure_json_parse_1.default.parse(cacheItem);
                        response.isFromCache = true;
                        return response;
                    }
                }
                throw new Error(error);
            }
        });
    }
    /**
     * onResponse is executed when a response has been received.
     * By default the implementation will throw for for unsuccessful responses.
     *
     * @param _request
     * @param response
     */
    onResponse(request, response) {
        if (this.isResponseOk(response.statusCode)) {
            return response;
        }
        throw new requestError_excpetion_1.RequestError(`Response code ${response.statusCode} (${http_1.STATUS_CODES[response.statusCode.toString()]})`, response.statusCode, request, response);
    }
    get(path, requestOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request(Object.assign(Object.assign({ headers: {}, query: {}, body: null, context: {} }, requestOptions), { method: 'GET', path, origin: this.baseUrl }));
        });
    }
    post(path, requestOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request(Object.assign(Object.assign({ headers: {}, query: {}, body: null, context: {} }, requestOptions), { method: 'POST', path, origin: this.baseUrl }));
        });
    }
    delete(path, requestOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request(Object.assign(Object.assign({ headers: {}, query: {}, body: null, context: {} }, requestOptions), { method: 'DELETE', path, origin: this.baseUrl }));
        });
    }
    put(path, requestOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request(Object.assign(Object.assign({ headers: {}, query: {}, body: null, context: {} }, requestOptions), { method: 'PUT', path, origin: this.baseUrl }));
        });
    }
    patch(path, requestOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request(Object.assign(Object.assign({ headers: {}, query: {}, body: null, context: {} }, requestOptions), { method: 'PATCH', path, origin: this.baseUrl }));
        });
    }
}
exports.default = RestDataSource;
//# sourceMappingURL=rest.datasource.js.map