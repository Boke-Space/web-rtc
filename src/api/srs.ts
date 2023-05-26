import type { Data } from '@/service/type';

export const fetchRTCPlayApi = (data: {
    api: string;
    clientip: string | null;
    sdp: string;
    streamurl: string;
    tid: string;
}) => service.post<Data>({
    url: '/srs/rtc/v1/play/',
    data,
})