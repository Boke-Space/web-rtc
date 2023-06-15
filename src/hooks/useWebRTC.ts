import type { Ref } from 'vue';

export function useWebRTC() {

    const audioInputs = ref<MediaDeviceInfo[]>([])
    const audioOutputs = ref<MediaDeviceInfo[]>([])
    const videoInputs = ref<MediaDeviceInfo[]>([])
    // 是否共享屏幕
    const isSharedScreen = ref(false)
    const localStream = ref()

    // 获取所有设备信息
    async function getMediaDevices() {
        const devices = await navigator.mediaDevices.enumerateDevices()
        devices.forEach((device) => {
            if (device.kind === 'audioinput') {
                audioInputs.value.push(device)
            } else if (device.kind === 'audiooutput') {
                audioOutputs.value.push(device)
            } else if (device.kind === 'videoinput') {
                videoInputs.value.push(device)
            }
        })
    }

    // 共享屏幕
    async function sharedScreen() {
        try {
            const container = ({
                video: true,
                audio: true
            })
            const res = await navigator.mediaDevices.getDisplayMedia(container)
            localStream.value = res
            isSharedScreen.value = true
            return res
            // localVideoRef.value!.srcObject = res
        } catch (err) {
            console.error('媒体设备获取失败: ', err);
            // return [];
        }
    }

    async function endShared() {
        localStream.value = null
        isSharedScreen.value = false
        // localVideoRef.value!.srcObject = null
    }

    // 开启摄像头
    async function startCamera() {
        try {
            const container = ({
                video: true,
                audio: true
            })
            const res = await navigator.mediaDevices.getUserMedia(container);
            localStream.value = res
            return res
        } catch (err) {
            console.error('媒体设备获取失败: ', err);
            // return [];
        }
    }

    return { 
        audioInputs,
        audioOutputs,
        videoInputs,
        isSharedScreen,
        localStream,
        getMediaDevices,
        sharedScreen,
        endShared,
        startCamera,
    }
}