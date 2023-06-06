import type { Data } from '@/service/type';

export const fetchRTCPlayApi = (data: {
    api: string;
    clientip: string | null;
    sdp: string;
    streamurl: string;
    tid: string;
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