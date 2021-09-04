"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlDataSource = exports.default = void 0;
var rest_datasource_1 = require("./datasource/rest.datasource");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return __importDefault(rest_datasource_1).default; } });
var sql_datasource_1 = require("./datasource/sql.datasource");
Object.defineProperty(exports, "SqlDataSource", { enumerable: true, get: function () { return sql_datasource_1.SqlDataSource; } });
__exportStar(require("./types/datasource.types"), exports);
//# sourceMappingURL=index.js.map