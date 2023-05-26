import type { Data } from '@/service/type';

export const fetchLiveListApi = () => service.get<Data>({
    url: '/live/list',
    params: {
        orderName: 'created_at',
        orderBy: 'desc'
    }
})
