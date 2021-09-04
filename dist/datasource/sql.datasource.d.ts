import { DataSourceOptions, Query, Request, Response } from "../types/datasource.types";
import BaseDataSource from "./base.datasource";
import { Repository, EntityTarget } from "typeorm";
import { Connection } from "typeorm";
export declare abstract class SqlDataSource<T> extends BaseDataSource<T> {
    protected database: Connection;
    protected repository: Repository<T>;
    constructor(baseUrl: string, connection: Connection, entity: EntityTarget<T>, options?: DataSourceOptions);
    protected isResponseOk(statusCode: number): boolean;
    protected isResponseCacheable<TResult = unknown>(request: Request, response: Response<TResult>): boolean;
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
    protected onResponse<TResult = unknown>(request: Request, response: Response<TResult>): Response<TResult>;
    protected onError?(_error: Error, requestOptions: Request): void;
    get({ options, cacheOptions }: Partial<Query<T>>): Promise<T[]>;
}
//# sourceMappingURL=sql.datasource.d.ts.map