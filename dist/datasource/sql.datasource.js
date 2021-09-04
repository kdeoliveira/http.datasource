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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlDataSource = void 0;
const requestError_excpetion_1 = require("../exceptions/requestError.excpetion");
const http_1 = require("http");
const base_datasource_1 = __importDefault(require("./base.datasource"));
class SqlDataSource extends base_datasource_1.default {
    constructor(baseUrl, connection, entity, options) {
        super(baseUrl, options);
        try {
            this.database = connection;
            this.repository = connection.getRepository(entity);
        }
        catch (err) {
            console.error(err);
            throw new Error(err);
        }
    }
    isResponseOk(statusCode) {
        return (statusCode >= 200 && statusCode <= 399) || statusCode === 304;
    }
    isResponseCacheable(request, response) {
        return this._statusCodeCacheableByDefault.has(response.statusCode) && request.method === 'GET';
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
    get({ options, cacheOptions }) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.find(Object.assign(Object.assign({}, options), cacheOptions));
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
        });
    }
}
exports.SqlDataSource = SqlDataSource;
//# sourceMappingURL=sql.datasource.js.map