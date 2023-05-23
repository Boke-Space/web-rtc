export type List = {
    nowPage: number
    pageSize: number
    hasMore: boolean
    total: number
    rows: Row[]
}

export interface Row {
    id: number
    system: number
    socketId: string
    roomId: string
    roomName: string
    track_video: boolean
    track_audio: boolean
    coverImg: string
    streamurl: any
    flvurl: string
    created_at: string
    updated_at: string
    deleted_at: any
}
