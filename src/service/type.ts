import { AxiosRequestConfig, AxiosResponse } from 'axios'

export interface Interceptors<T = AxiosResponse> {
  requestInterceptor?: (config: AxiosRequestConfig) => AxiosRequestConfig
  requestInterceptorsCatch?: (error: unknown) => unknown
  responseInterceptor?: (res: T) => T
  responseInterceptorsCatch?: (error: unknown) => unknown
}

export interface Config<T = AxiosResponse> extends AxiosRequestConfig {
  interceptors?: Interceptors<T>
}
