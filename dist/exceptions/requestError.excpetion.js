"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestError = void 0;
class RequestError extends Error {
    constructor(message, code, request, response) {
        super(message);
        this.message = message;
        this.code = code;
        this.request = request;
        this.response = response;
        this.name = 'RequestError';
    }
}
exports.RequestError = RequestError;
//# sourceMappingURL=requestError.excpetion.js.map