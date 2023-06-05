export interface DanmakuType {
    time: number,
    color: string,
    type: number,
    text: string,
}

export interface DrawDanmakuType {
    color: string,
    type: number,
    text: string,
}

export interface FilterDanmakuType {
    disableType: Array<number>,
    disableLeave: number,
}

export interface QualityType {
    [key: number]: {
        name?: string,
        url: string,
        type?: string
    }
}

export interface DanmakuOptionsType {
    open: boolean,
    placeholder?: string,
    data?: Array<DanmakuType>,
    send?: (danmaku: DanmakuType) => void
}

export interface OptionsType {
    resource: string,
    cover?: string,
    type?: string,//视频类型
    mobile?: boolean,//移动端
    blob?: boolean,//mp4视频是否使用blob
    customType?: (player: HTMLVideoElement, src: string) => void,
    customQualityChange?: (quality: number) => void,
    theme?: string,//主题色,
    danmaku?: DanmakuOptionsType,
    playbackSpeed?: Array<number>,// 播放速度
}

interface ShortcutKeyType {
    [key: string]: () => void
}