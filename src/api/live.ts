import type { Data } from '@/service/type';
import { service } from '../service/index';
import type { List } from './type';

export const fetchLiveListApi = () => service.get<Data<List>>({
    url: '/live/list',
    params: {
        orderName: 'created_at',
        orderBy: 'desc'
    }
})
