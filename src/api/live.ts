import type { Data } from '@/service/type';

export const fetchLiveListApi = () => service.get<Data>({ url: '/live/list' })

export const fetchLiveByIdApi = (roomId: string) => service.get<Data>({ url: `/live/${roomId}` })

export const deleteLiveListApi = (params = {}) => service.delete<Data>({ url: '/live', params })

