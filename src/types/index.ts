// 这里放项目里面的类型

export interface IPaging<T> {
    nowPage: number;
    pageSize: number;
    hasMore: boolean;
    total: number;
    rows: T[];
}

export enum liveTypeEnum {
    webrtcPull = 'webrtcPull',
    srsWebrtcPull = 'srsWebrtcPull',
    srsFlvPull = 'srsFlvPull',
    srsPush = 'srsPush',
    webrtcPush = 'webrtcPush',
}

export interface BilldHtmlWebpackPluginLog {
    pkgName: string;
    pkgVersion: string;
    pkgRepository: string;
    commitSubject: string;
    commitBranch: string;
    committerDate: string;
    commitHash: string;
    committerName: string;
    committerEmail: string;
    lastBuildDate: string;
}

export enum PlatformEnum {
    qqLogin = 'qq_login',
}

export interface IAuth {
    id?: number;
    auth_name?: string;
    auth_value?: string;
    type?: number;
    priority?: number | string;
    p_id?: number | null;
    created_at?: string;
    updated_at?: string;
    deleted_at?: null;
    c_auths?: number[];
}

export interface IRole {
    id?: number;
    role_name?: string;
    role_value?: string;
    type?: number;
    priority?: number | string;
    p_id?: number | null;
    created_at?: string;
    updated_at?: string;
    deleted_at?: null;
    role_auths?: number[];
    c_roles?: number[];
}
export interface IUser {
    id?: number;
    username?: string;
    password?: string;
    status?: number;
    avatar?: string;
    desc?: string;
    token?: string;
    user_roles?: number[];
    created_at?: string;
    updated_at?: string;
    deleted_at?: string;
    qq_users?: IQqUser[];
}

export interface IQqUser {
    id?: number;
    client_id?: number;
    openid?: string;
    unionid?: string;
    username?: string;
    figureurl?: string;
    figureurl_1?: string;
    figureurl_2?: string;
    figureurl_qq_1?: string;
    figureurl_qq_2?: string;
    constellation?: string;
    gender?: string;
    city?: string;
    province?: string;
    year?: string;
    created_at?: string;
    updated_at?: string;
    deleted_at?: any;
}

export interface ILive {
    id?: number;
    system?: number;
    socketId?: string;
    roomId?: string;
    roomName?: string;
    track_video?: boolean;
    track_audio?: boolean;
    coverImg?: string;
    streamurl?: string;
    flvurl?: string;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string;
}

export enum MediaTypeEnum {
    camera,
    screen,
}

export enum ChatEnum {
    chat,
    otherJoin,
    userLeaved,
}

export interface ILiveUser {
    socketId: string;
    userInfo?: IUser;
}

export interface Chat {
    msgType: ChatEnum;
    msg: string;
    socketId: string;
    userInfo?: IUser;
    color?: string
}

export interface IAdminIn {
    roomId: string;
    socketId: string;
    isAdmin: boolean;
    data: any;
}

export interface IOffer {
    socketId: string;
    roomId: string;
    data: {
        sdp: any;
        target: string;
        sender: string;
        receiver: string;
    };
    isAdmin: boolean;
}

export interface ICandidate {
    socketId: string;
    roomId: string;
    data: {
        candidate: string;
        sdpMid: string | null;
        sdpMLineIndex: number | null;
    };
}
