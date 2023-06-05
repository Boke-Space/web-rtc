<template>
    <!-- <div class="wplayer">
        <video class="player" ref="videoRef" @click="click" controls autoplay muted></video>
        <Barrage ref="danmakuRef" :overlapping="overlapping" :paused="videoRef?.paused" />
    </div> -->
    <Barrage class="mp4" :options="options" />
    <!-- <w-player class="mp4" :options="options"></w-player> -->
</template>

<script setup lang="ts">
import Barrage from './Barrage.vue';

import { useFlvPlay } from '../hooks/useFlv';
import type { DanmakuType } from '@/types/barrage';

const overlapping = ref(false);//弹幕是否可重叠
const data = [
    {
        time: 1,
        color: '#FFB6C1',
        type: 1,
        text: '1',
    },
    {
        time: 1,
        color: '#FFB6C1',
        type: 1,
        text: '2',
    },
    {
        time: 5,
        color: '#00FFFF',
        type: 2,
        text: '222',
    }
]

const danmakuList = ref<DanmakuType[]>(data || [])
const danmakuRef = ref(null)

const options = {
    resource: 'http://192.168.192.131:3000/Audio/SupperMoment.mp4',
    danmaku: {
        open: true,
        placeholder: '在这里输入弹幕哦~',
        data: data,
        send: null
    },
    mobile: false
}

const player = ref()
const playing = ref(false)
const videoRef = ref()
const flvUrl = 'http://192.168.192.131:5001/live/SupperMoment.flv'

// onMounted(() => )

onMounted(() => {
    nextTick(() => useFlvPlay(flvUrl, videoRef.value))
    // 更新弹幕容器内容
    danmakuRef.value?.updateDanmaku(danmakuList.value);
})

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

<style scoped lang="scss">
.mp4 {
    width: 720px;
    height: 396px;
}

.wplayer {
    width: 100%;
    height: 100%;
    /* position: relative; */

    .player {
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        position: absolute;
        background-color: black;
    }

    .control {
        z-index: 6;
        position: absolute;
        width: 100%;
        height: 50px;
        background: linear-gradient(rgba(0, 0, 0, 0), #000);
        bottom: 0;
        transition: opacity 1s;
        -moz-transition: opacity 1s;
        -webkit-transition: opacity 1s;
        -o-transition: opacity 1s;
    }
}
</style>