<template>
    <div :class="$style.layout">
        <div :class="$style.head">
            <div style="padding: 10px;">
                <el-button type="primary" round @click="navigateHome">Home</el-button>
                <el-button type="primary" round @click="navigateRTC">WebRTC</el-button>
                <el-button type="primary" round @click="navigateSRS">SRS</el-button>
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

function navigateRTC() {
    router.push({
        path: `/push`,
        query: {
            liveType: liveTypeEnum.webrtcPush,
        },
    });
}

function navigateSRS() {
    router.push({
        path: `/push`,
        query: {
            liveType: liveTypeEnum.srsPush,
        },
    });
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