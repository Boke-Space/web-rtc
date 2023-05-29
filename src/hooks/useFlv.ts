import flvJs from 'flv.js'

let flvPlayer: any

export function useFlvPlay(flvUrl: string, videoEl: HTMLVideoElement) {

    if (flvPlayer) {
        flvPlayer.detachMediaElement()
        flvPlayer.destroy()
    }

    flvPlayer = flvJs.createPlayer({
        type: 'flv',
        url: flvUrl
    })

    flvPlayer.attachMediaElement(videoEl)
    flvPlayer.load()

    return {
        play() {
            flvPlayer?.play()
        },
        pause() {
            flvPlayer?.pause()
            flvPlayer?.unload()
            flvPlayer?.detachMediaElement()
        }
    }
}
