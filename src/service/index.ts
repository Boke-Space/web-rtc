import { Service } from './service'

export const service = new Service({
  baseURL: 'http://192.168.192.131:3000',
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
