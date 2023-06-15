<template>
    <div :class="$style.layout">
        <div :class="$style.head">
            <div style="padding: 10px;display:flex;justify-content: center;">
                <el-button type="success" round @click="navigateHome">Home</el-button>
                <!-- <el-button type="primary" round @click="navigateRTC">WebRTC</el-button> -->
                <el-button type="primary" round @click="navigateLive">直播</el-button>
                <el-button type="warning" round @click="navigateConference">发起会议</el-button>
                <el-button type="warning" round @click="navigateAttend">参与会议</el-button>
                <el-button type="danger" round>远程控制</el-button>
                <el-button type="success" round @click="navigateTest">Test</el-button>
            </div>
        </div>
        <router-view v-slot="{ Component }" :class="$style.middle">
            <component :is="Component"></component>
        </router-view>
        <!-- <div :class="$style.footer">Footer</div> -->
    </div>
</template>

<script setup lang="ts">
import { liveTypeEnum } from '@/types';

const $style = useCssModule()
const router = useRouter()

function navigateHome() {
    router.push('/home')
}

function navigateLive() {
    router.push({
        path: `/push`,
        query: {
            liveType: liveTypeEnum.srsPush,
        },
    });
}

function navigateConference() {
    router.push('/conference')
}

function navigateAttend() {
    router.push('/attend')
}

function navigateTest() {
    router.push('/test')
}
</script>

<style module lang="scss">
.main {
    text-align: center;
    display: flex;
    flex-direction: column;
    height: 100vh;

    .head {
        background-color: greenyellow;
        height: 100px;
    }

    .middle {
        flex: 1;
    }

    .footer {
        background-color: skyblue;
        height: 100px;
    }
}
</style>