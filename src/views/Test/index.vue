<template>
    <div style="display: flex;justify-content: center;">
        <video ref="localVideoRef" style="object-fit: fill;width:600px;height:350px" autoplay muted controls></video>
    </div>
    <div style="text-align: center;margin-top: 16px;">
        <el-button type="primary" @click="handlePush">屏幕与摄像头合并推流</el-button>
    </div>
</template>

<script setup lang="ts">
import { VideoStreamMerger } from "video-stream-merger";

const { localStream, sharedScreen, startCamera } = useWebRTC()
const camera = ref()
const screen = ref()
const merger = ref(new VideoStreamMerger({
    width: 680,
    height: 380,
    fps: 25,
    clearRect: true,
    audioContext: null
}))
const localVideoRef = ref<HTMLVideoElement>()

// onMounted(async () => {
    
// })

async function handlePush() {
    camera.value = await startCamera()
    screen.value = await sharedScreen()
    merger.value.addStream(screen.value, {
        x: 0,
        y: 0,
        width: merger.value.width,
        height: merger.value.height,
        mute: true,
        index: 0,
        draw: null,
        audioEffect: null,
    })
    merger.value.addStream(camera.value, {
        x: merger.value.width - 100,
        y: merger.value.height - 100,
        width: 100,
        height: 100,
        mute: true,
        index: 0,
        draw: null,
        audioEffect: null,
    })
    merger.value.start()
    localVideoRef.value!.srcObject = merger.value.result
}
</script>

<style scoped></style>