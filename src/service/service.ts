import axios from 'axios'
import type { AxiosInstance } from 'axios'
import type { Config, Interceptors } from './type'

export class Service {
  instance: AxiosInstance
  interceptors?: Interceptors

  constructor(config: Config) {
    this.instance = axios.create(config)
    this.interceptors = config.interceptors

    this.instance.interceptors.request.use(
      this.interceptors?.requestInterceptor,
      this.interceptors?.requestInterceptorsCatch
    )

    this.instance.interceptors.response.use(
      this.interceptors?.responseInterceptor,
      this.interceptors?.responseInterceptorsCatch
    )

    this.instance.interceptors.request.use((config) => config)

    this.instance.interceptors.response.use((result) => result)
  }

  request<T>(config: Config<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (config.interceptors?.requestInterceptor) {
        config = config.interceptors.requestInterceptor(config)
      }

      // prettier-ignore
      this.instance.request<any, T>(config).then((res) => {
        // 单个请求对数据的处理
        if (config.interceptors?.responseInterceptor) {
          res = config.interceptors.responseInterceptor(res)
        }
        resolve(res)
      })
      .catch((err) => {
        reject(err)
      })
    })
  }

  get<T = any>(config: Config<T>): Promise<T> {
    return this.request<T>({ ...config, method: 'GET' })
  }

  post<T = any>(config: Config<T>): Promise<T> {
    return this.request<T>({ ...config, method: 'POST' })
  }

  delete<T = any>(config: Config<T>): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE' })
  }

  patch<T = any>(config: Config<T>): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH' })
  }
}
