import flvJs from 'flv.js'

export function useFlvPlay(flvUrl: string, videoEl: HTMLVideoElement) {
    if (flvJs.isSupported()) {
        const flvPlayer = flvJs.createPlayer({
            type: 'flv',
            url: flvUrl
        })
        flvPlayer.attachMediaElement(videoEl)
        flvPlayer.load()
        try {
            flvPlayer.play()
        } catch (error) {
            console.log(error)
        }
    } else {
        console.error('不支持flv')
    }
}
