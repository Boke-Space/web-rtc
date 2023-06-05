<template>
    <div>
        Attend
    </div>
</template>

<script setup lang="ts">

const audioIn = ref<any[]>([])
const audioOut = ref<any[]>([])
const videoIn = ref<any[]>([])

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

onMounted(() => {
    getAllMediaDevices()
})
</script>

<style scoped></style>