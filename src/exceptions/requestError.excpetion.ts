import { Request, Response } from "../types/datasource.types"


export class RequestError<T = unknown> extends Error {
    constructor(
      public message: string,
      public code: number,
      public request: Request,
      public response: Response<T>,
    ) {
      super(message)
      this.name = 'RequestError'
    }
  }