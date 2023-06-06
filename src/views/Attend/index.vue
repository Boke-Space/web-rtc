<template>
    <div v-if="isShow" style="margin-top: 32px;">
        <el-form :model="form" label-width="80px" style="width: 300px;margin: 0 auto">
            <el-form-item label="房间号">
                <el-input v-model="form.roomId" />
            </el-form-item>
            <el-form-item label="用户名">
                <el-input v-model="form.username" />
            </el-form-item>
            <el-form-item label="麦克风">
                <el-select v-model="form.audioInId">
                    <el-option v-for="(item, index) of audioIn" :key="index" :label="item.label"
                        :value="item.id"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button style="margin-left: 70px;" type="primary" @click="joinRoom">进入</el-button>
            </el-form-item>
        </el-form>
    </div>
</template>

<script setup lang="ts">
import { getRandomString } from 'billd-utils';

const audioIn = ref<any[]>([])
const audioOut = ref<any[]>([])
const videoIn = ref<any[]>([])
const isShow = ref(true)
// 是否会议创建人
const isCreate = ref(false)

const router = useRouter()

const form = reactive({
    roomId: '',
    username: '',
    videoId: '',
    audioInId: '',
})

async function getAllMediaDevices() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        devices.forEach(function (device) {
            let obj = { id: device.deviceId, kind: device.kind, label: device.label }
            if (device.kind === 'audioinput') {
                if (audioIn.value.filter(e => e.id === device.deviceId).length === 0) {
                    audioIn.value.push(obj)
                }
            } if (device.kind === 'audiooutput') {
                if (audioOut.value.filter(e => e.id === device.deviceId).length === 0) {
                    audioOut.value.push(obj)
                }
            } else if (device.kind === 'videoinput') {
                if (videoIn.value.filter(e => e.id === device.deviceId).length === 0) {
                    videoIn.value.push(obj)
                }
            }
        });
        return devices;
    } catch (err) {
        console.error('媒体设备获取失败: ', err);
        return [];
    }
}

async function joinRoom() {
    isShow.value = false
    const { data } = await fetchLiveByIdApi(form.roomId)
    if (data == null) isCreate.value = true
    const {
        liveUserList,
        chatList,
        webSocketInit,
        sendJoin
    } = useConference(form.roomId, isCreate.value)
    webSocketInit()
}

onMounted(() => {
    getAllMediaDevices()
    form.username = getRandomString(15)
})
</script>

<style scoped></style>