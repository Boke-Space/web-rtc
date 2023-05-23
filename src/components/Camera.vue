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
    <div>
      <button @click="takePhotos">点击拍照</button>
      <button @click="shared">屏幕分享</button>
      <button @click="record">录制</button>
    </div>
    <div v-for="(item, index) in imgList.length" :key="index" class="item">
      <img :src="item" alt="" />
    </div>
    <canvas style="width:80vw" ref="pictureRef"></canvas>
    <video style="width:80vw" ref="sharedRef" autoplay></video>
    <video style="width:80vw" ref="videoRef" autoplay></video>
    <video style="width:80vw" ref="remoteVideoRef" autoplay></video>
  </div>
</template>

<!-- <button @click="createOffer()">创建Offer</button> -->
<!-- <button @click="setRemoteDescription()">设置远程描述</button> -->
<!-- <button @click="createAnswer()">创建Answer</button> -->
<!-- <button @click="addCandidate()">添加候选</button> -->
<!-- <textarea v-model="text"></textarea> -->

<script setup lang="ts">
import { ref, onMounted } from "vue";

const videoRef = ref<HTMLVideoElement>()
const remoteVideoRef = ref<HTMLVideoElement>()
const rtcRef = ref<RTCPeerConnection>()
const text = ref('')
const localStreamRef = ref<MediaStream>()
const websocket = ref(new WebSocket('ws://127.0.0.1:1234'))
const username = (Math.random() + 1).toString(36).substring(7)
const status = ref('开始通话')
const pictureRef = ref<HTMLCanvasElement>()
const sharedRef = ref<HTMLVideoElement>()
const imgList = ref<string[]>([])

// 获取摄像头和音频
async function getMediaDives() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
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

function takePhotos() {
  pictureRef.value!.width = videoRef.value?.offsetWidth!
  pictureRef.value!.height = videoRef.value?.offsetHeight!
  pictureRef.value!.getContext('2d')!.drawImage(videoRef.value!, 0, 0, pictureRef.value!.width, pictureRef.value!.height)
  imgList.value.push(pictureRef.value!.toDataURL('image/png'))
  console.log(imgList.value)
}

async function shared() {
  let localStream = await navigator.mediaDevices.getDisplayMedia({
    audio: false,
    video: true,
  })
  // 播放本地视频流
  playStream(localStream)
}

// 在视频标签中播放视频流
function playStream(stream: MediaStream) {
  sharedRef.value!.srcObject = stream
}

// 录制媒体流
async function record() {
  const kbps = 1024
  const Mbps = kbps * kbps
  const options = {
    audioBitsPerSecond: 128000,
    videoBitsPerSecond: 2500000,
    mimeType: 'video/webm; codecs="vp8,opus"',
  }
  let localStream = await navigator.mediaDevices.getDisplayMedia({
    audio: false,
    video: true,
  })
  const mediaRecorder = new MediaRecorder(localStream, options)
  mediaRecorder.start()

  mediaRecorder.ondataavailable = (e) => {
    // 将录制的数据合并成一个 Blob 对象
    // const blob = new Blob([e.data], { type: e.data.type })
    // 🌸重点是这个地方，我们不要把获取到的 e.data.type设置成 blob 的 type，而是直接改成 mp4
    const blob = new Blob([e.data], { type: 'video/mp4' })
    downloadBlob(blob)
  }
  mediaRecorder.onstop = (e: Event) => {
    // 停止录制
  }
}

// 下载 Blob
function downloadBlob(blob: Blob) {
  // 将 Blob 对象转换成一个 URL 地址
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  // 设置 a 标签的 href 属性为刚刚生成的 URL 地址
  a.href = url
  // 设置 a 标签的 download 属性为文件名
  a.download = `${new Date().getTime()}.${blob.type.split('/')[1]}`
  // 模拟点击 a 标签
  a.click()
  // 释放 URL 地址
  URL.revokeObjectURL(url)
}


// 设置远程描述成功
function setRemoteDescription() {
  const remoteSdp = JSON.parse(text.value)
  rtcRef.value?.setRemoteDescription(new RTCSessionDescription(remoteSdp))
  console.log('设置远程描述成功', remoteSdp)
}

// 添加候选
function addCandidate() {
  const candidate = JSON.parse(text.value)
  rtcRef.value?.addIceCandidate(new RTCIceCandidate(candidate))
  console.log('添加候选成功', candidate)
}

onMounted(async () => {
  initWebSocket()
  await getMediaDives()
  createRtcConnect()
  addLocalSteamToRTConnection()
})
</script>

<style></style>