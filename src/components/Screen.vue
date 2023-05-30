<template>
    <div>
        <div>{{ username }}</div>
        <div>
            <div>
                <span>当前状态</span>
                <span style="color:red">{{ status }}</span>
            </div>
            <button v-if="status === '开始通话'" @click="createOffer()">拨号</button>
            <button v-if="status === '请接听通话'" @click="createAnswer()">接听</button>
        </div>
        <video style="width:80vw" ref="videoRef" autoplay controls></video>
        <video style="width:80vw" ref="remoteVideoRef" autoplay controls></video>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const videoRef = ref<HTMLVideoElement>()
const remoteVideoRef = ref<HTMLVideoElement>()
const rtcRef = ref<RTCPeerConnection>()
const text = ref('')
const localStreamRef = ref<MediaStream>()
const websocket = ref(new WebSocket('ws://192.168.192.131:1234'))
const username = (Math.random() + 1).toString(36).substring(7)
const status = ref('开始通话')

// 获取摄像头和音频
async function getMediaDives() {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
    videoRef.value!.srcObject = stream
    localStreamRef.value = stream
}

// 创建WebRTC连接
function createRtcConnect() {
    const _rtc = new RTCPeerConnection({
        iceServers: [
            {
                urls: ['stun:stun.stunprotocol.org:3478']
            }
        ]
    })
    _rtc.onicecandidate = (e) => {
        if (e.candidate) {
            console.log('candidate', JSON.stringify(e.candidate))
            webSocketSend('candidate', JSON.stringify(e.candidate))
        }
    }
    _rtc.ontrack = e => {
        remoteVideoRef.value!.srcObject = e.streams[0]
    }
    rtcRef.value = _rtc
    console.log('webRTC连接成功')
}

// 创建Offer
function createOffer() {
    rtcRef.value?.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
    }).then(res => {
        console.log('offer', JSON.stringify(res))
        rtcRef.value?.setLocalDescription(res)
        webSocketSend('offer', JSON.stringify(res))
        status.value = '等待对方接听'
    })
}

// 创建Answer
function createAnswer() {
    rtcRef.value?.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
    }).then(res => {
        console.log('answer', JSON.stringify(res))
        rtcRef.value?.setLocalDescription(res)
        webSocketSend('answer', JSON.stringify(res))
        status.value = '通话中'
    })
}

// 将本地视频添加到webRTC
function addLocalSteamToRTConnection() {
    const localSteam = localStreamRef.value!
    localSteam.getTracks().forEach(track => {
        rtcRef.value?.addTrack(track, localSteam)
    })
    console.log('将本地视频添加到webRTC成功')
}

function initWebSocket() {
    websocket.value.onopen = () => {
        console.log('websocket连接成功')
    }
    websocket.value.onmessage = webSocketMessage
}

function webSocketSend(type: string, data: any) {
    websocket.value.send(JSON.stringify({
        username,
        type,
        data
    }))
}

function webSocketMessage(e: MessageEvent) {
    let result = null
    const reader = new FileReader()
    reader.readAsText(e.data, "UTF-8")
    reader.onload = () => {
        result = JSON.parse(reader.result)
        console.log('websocket', result)
        const websocketUsername = result['username']
        console.log('websocketUsername', websocketUsername)
        if (username === websocketUsername) {
            console.log('跳过本次处理')
            return
        }
        const type = result['type']
        const data = result['data']
        if (type === 'offer') {
            rtcRef.value?.setRemoteDescription(new RTCSessionDescription(JSON.parse(data)))
            text.value = data
            status.value = '请接听通话'
        }
        if (type === 'answer') {
            rtcRef.value?.setRemoteDescription(new RTCSessionDescription(JSON.parse(data)))
            text.value = data
            status.value = '通话中'
        }
        if (type === 'candidate') {
            rtcRef.value?.addIceCandidate(new RTCIceCandidate(JSON.parse(data)))
            text.value = data
        }
    }
}

onMounted(async () => {
    initWebSocket()
    await getMediaDives()
    createRtcConnect()
    addLocalSteamToRTConnection()
})
</script>
  
<style></style>