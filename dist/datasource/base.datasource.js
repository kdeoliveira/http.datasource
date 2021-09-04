"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const quick_lru_1 = __importDefault(require("@alloc/quick-lru"));
const kdeoliveira_types_1 = require("kdeoliveira.types");
//Note that for REST APIs, only GET requests can be cahced, since for any other request.method, the response will vary according to body provided
class BaseDataSource extends kdeoliveira_types_1.DataSource {
    constructor(baseUrl, options) {
        var _a, _b, _c, _d;
        super();
        this.baseUrl = baseUrl;
        this.options = options;
        this._statusCodeCacheableByDefault = new Set([200, 203]);
        this.memoizedResults = new quick_lru_1.default({
            maxSize: ((_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.lru) === null || _b === void 0 ? void 0 : _b.maxSize) ? (_d = (_c = this.options) === null || _c === void 0 ? void 0 : _c.lru) === null || _d === void 0 ? void 0 : _d.maxSize : 100
        });
        this.globalRequestOptions = options === null || options === void 0 ? void 0 : options.requestOptions;
    }
    buildQueryString(query) {
        const params = new kdeoliveira_types_1.URLSearchParams();
        for (const key in query) {
            if (Object.prototype.hasOwnProperty.call(query, key)) {
                const value = query[key];
                if (value !== undefined) {
                    params.append(key, value.toString());
                }
            }
        }
        return params.toString();
    }
}
exports.default = BaseDataSource;
//# sourceMappingURL=base.datasource.js.map