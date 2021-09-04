import { Request, Response } from "../types/datasource.types";
export declare class RequestError<T = unknown> extends Error {
    message: string;
    code: number;
    request: Request;
    response: Response<T>;
    constructor(message: string, code: number, request: Request, response: Response<T>);
}
//# sourceMappingURL=requestError.excpetion.d.ts.map