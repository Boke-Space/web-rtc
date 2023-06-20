import { VideoStreamMerger } from "video-stream-merger";

export async function useMerger() {

    const { sharedScreen, startCamera } = useWebRTC()
    let camera
    let screen
    const merger = new VideoStreamMerger({
        width: 680,
        height: 380,
        fps: 25,
        clearRect: true,
        audioContext: null
    })

    camera = await startCamera({
        video: true,
        audio: true
    }) as MediaStream
    screen = await sharedScreen() as MediaStream
    merger.addStream(screen, {
        x: 0,
        y: 0,
        width: merger.width,
        height: merger.height,
        mute: true,
        index: 0,
        draw: null,
        audioEffect: null,
    })
    merger.addStream(camera, {
        x: merger.width - 100,
        y: merger.height - 100,
        width: 100,
        height: 100,
        mute: true,
        index: 0,
        draw: null,
        audioEffect: null,
    })
    merger.start()
    return merger.result
}