import { service } from '../service/index';

export function fetchUserInfo() {
    return service.get({
        url: '/user/get_user_info',
    });
}

export function fetchUserList() {
    return service.get({ url: '/user/list' });
}
