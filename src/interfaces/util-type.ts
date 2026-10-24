export interface IResponseData<T> {
  httpStatusCode: number;
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IErrorSource {
  path: string;
  message: string;
}

export interface IErrorResponse {
  success: boolean;
  message: string;
  errorSources: IErrorSource[];
  statusCode: number;
  stack?: string | undefined;
  error?: unknown;
}
