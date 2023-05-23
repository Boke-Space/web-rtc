import { Service } from './service'

export const service = new Service({
  baseURL: 'http://localhost:4300',
  timeout: 5000,
  interceptors: {
    requestInterceptor: (config: any) => {
      return config
    },
    requestInterceptorsCatch: (err) => {
      return err
    },
    responseInterceptor: (result) => {
      return result.data
    },
    responseInterceptorsCatch: (err) => {
      return err
    },
  },
})
