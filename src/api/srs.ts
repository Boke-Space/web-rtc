import type { Data } from '@/service/type';

export const fetchRTCPlayApi = (data: {
    api: string;
    clientip?: string | null;
    sdp: string;
    streamurl: string;
    tid?: string;
}) => service.post<Data>({
    baseURL: '/srs',
    url: '/rtc/v1/play/',
    data,
})

export const fetchRtcPublish = (data: {
    api: string;
    clientip?: string | null;
    sdp: string;
    streamurl: string;
    tid?: string;
}) => service.post<Data>({
    baseURL: '/srs',
    url: '/rtc/v1/publish/',
    data,
})

export const getStreamsApi = () => service.get({
    baseURL: 'http://192.168.192.131:1985',
    url: `/api/v1/streams/`,
})

export const fetchRtcClientsApi = () => service.get({
    baseURL: 'http://192.168.192.131:1985',
    url: `/api/v1/clients/`,
})

export const deleteStreamsApi = (id: string) => service.delete<Data>({
    baseURL: '/srs',
    url: `/api/v1/clients/${id}`,
})