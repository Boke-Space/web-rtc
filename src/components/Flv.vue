<template>
    <video ref="videoRef" style="width:80vw" controls autoplay @click="click"></video>
</template>

<script setup lang="ts">
import { useFlvPlay } from '../hooks/useFlv';

const player = ref()
const playing = ref(false)
const videoRef = ref()
const flvUrl = 'https://live.hsslive.cn/srsflv/live/livestream/fddm_2.flv'

onMounted(() => nextTick(() => useFlvPlay(flvUrl, videoRef.value)))

function click() {
    if (playing.value) {
        player.value.pause()
        playing.value = false;
    }
    else {
        player.value.play()
        playing.value = true;
    }

}
</script>

<style scoped></style>