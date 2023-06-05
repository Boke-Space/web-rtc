<template>
    <vue-danmaku ref="danmaku" class="demo" v-model:danmus="danmus" isSuspend v-bind="config">
        <!-- 容器slot -->
        <video class="music" ref="videoRef" controls autoplay muted>

        </video>
        <!-- 弹幕slot -->
        <template v-slot:dm="{ danmu, index }">
            <div class="danmu-item">
                <img class="img" :src="danmu.avatar" />
                <span>{{ index }}{{ danmu.name }}：</span>
                <span>{{ danmu.text }}</span>
            </div>
        </template>
    </vue-danmaku>
</template>

<script setup lang="ts">
import { getDanmuData } from '@/utils/danmu';
import vueDanmaku from 'vue3-danmaku'

const danmaku = ref<any>(null)
const danmus = ref<any[]>(getDanmuData())
const config = reactive({
    useSlot: true, // 是否开启slot
    loop: false, // 是否开启弹幕循环
    speeds: 200, // 弹幕速度，实际为弹幕滚动完一整屏的秒数，值越小速度越快
    fontSize: 20, // 文本模式下的字号
    top: 10, // 弹幕轨道间的垂直间距
    right: 0, // 同一轨道弹幕的水平间距
    debounce: 100, // 弹幕刷新频率（多少毫秒插入一条弹幕，建议不小于50）
    randomChannel: true, // 随机弹幕轨道
})

const width = ref('50vw')
const height = ref('50vh')
const videoRef = ref()
const flvUrl = 'http://192.168.192.131:5001/live/SupperMoment.flv'

function change() {
    width.value = '100vw'
    height.value = '100vh'
}

function handleFullScreenChange() {
    const isFullScreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    if (isFullScreen) {
        document.exitFullscreen();
    } else {
        console.log('Video is not in full screen mode.');
    }
}

onMounted(() => {
    window.onresize = () => danmaku.value.resize()
    nextTick(() => {
        useFlvPlay(flvUrl, videoRef.value)
        videoRef.value.addEventListener('fullscreenchange', handleFullScreenChange);
        videoRef.value.addEventListener('webkitfullscreenchange', handleFullScreenChange);
        videoRef.value.addEventListener('mozfullscreenchange', handleFullScreenChange);
        videoRef.value.addEventListener('msfullscreenchange', handleFullScreenChange);
    })
})

console.log(window.document.fullscreenElement)

onUnmounted(() => {
    window.onresize = null
})
</script>
<style lang="scss" scoped>
body {
    margin: 0;
    padding: 0;
}

#app {
    position: relative;
    height: 100vh;
    width: 100vw;
    display: flex;
    align-items: center;
    justify-content: center;

    .demo {
        position: fixed;
        top: 0;
        width: v-bind(width);
        height: v-bind(height);

        .danmu-item {
            display: flex;
            align-items: center;
            z-index: 9999;

            .img {
                height: 25px;
                width: 25px;
                border-radius: 50%;
                margin-right: 5px;
            }
        }
    }

}


.main {
    position: absolute;
    z-index: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    .intro {
        display: inline-block;
        color: #fff;
        text-align: center;
        text-shadow: 2px 4px 6px rgba(0, 0, 0, 0.4);

        h1 {
            font-size: 48px;
            line-height: 32px;
        }
    }

    .action {
        margin-top: 20px;
        color: #fff;
        min-width: 360px;
        min-height: 300px;

        .btn {
            color: #000;
            background: #fff;
            border: none;
            padding: 6px 16px;
            margin-right: 8px;
            border-radius: 5px;
            min-height: 31px;
            outline: none;
            cursor: pointer;
            transition: all 0.3s;

            &:hover {
                background-color: #f3f7fa;
            }

            &:active {
                background-color: #fff;
            }
        }

        .ipt {
            width: 130px;
            padding: 8px 16px;
            border-radius: 5px;
            outline: none;
            border: none;
            margin-right: 8px;
        }
    }
}

.github-corner:hover .octo-arm {
    animation: octocat-wave 560ms ease-in-out;
}

@keyframes octocat-wave {

    0%,
    100% {
        transform: rotate(0);
    }

    20%,
    60% {
        transform: rotate(-25deg);
    }

    40%,
    80% {
        transform: rotate(10deg);
    }
}

@media (max-width: 500px) {
    .github-corner:hover .octo-arm {
        animation: none;
    }

    .github-corner .octo-arm {
        animation: octocat-wave 560ms ease-in-out;
    }
}

.music {
    width: v-bind(width);
    height: v-bind(height);
}

.demo:fullscreen {
    background-color: #faa;
}
</style>