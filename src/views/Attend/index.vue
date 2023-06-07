<template>
    <div class="container">

        <el-row v-if="!isShow" style="display: flex;flex-direction: row;justify-content: flex-start;flex-wrap: wrap;">
            <div style="position: relative;width: 400px;height: 300px;">
                <label style="position: absolute;left: 5px;bottom: 5px;color: antiquewhite;font-size: 18px;z-index: 999;">{{
                    id }}</label>
                <video id="localMediaDom" style="object-fit: fill;height: 100%;width: 100%;"></video>
            </div>
            <div style="position: relative;width: 400px;height: 300px;" v-for="item in others" :key="item.userId"
                :id="item.userId">
                <label style="position: absolute;left: 5px;bottom: 5px;color: antiquewhite;font-size: 18px;z-index: 999;">{{
                    item.id }}</label>
                <video :id="item.id" style="object-fit: fill;height: 100%;width: 100%;" controls></video>
            </div>
        </el-row>

        <div v-if="isShow">
            <div class="dialog-inner-container">
                <el-form :model="formInline" :rules="rules" ref="ruleForm" label-width="80px" style="width: 300px">
                    <el-form-item label="身份ID" prop="userId">
                        <el-input style="width:220px " v-model="formInline.userId" placeholder="不填默认为浏览器ID"></el-input>
                    </el-form-item>
                    <el-form-item label="房间号" prop="roomId">
                        <el-input style="width:220px " v-model="formInline.roomId" placeholder="房间号"></el-input>
                    </el-form-item>
                    <el-form-item label="用户名" prop="nickname">
                        <el-input style="width:220px " v-model="formInline.nickname" placeholder="展示昵称"></el-input>
                    </el-form-item>
                    <el-form-item label="摄像头" prop="videoId">
                        <el-select v-model="formInline.videoId" placeholder="摄像头">
                            <el-option v-for="(item, index) in localDevice.videoIn " :key="index" :label="item.label"
                                :value="item.id"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="麦克风" prop="audioInId">
                        <el-select v-model="formInline.audioInId" placeholder="麦克风">
                            <el-option v-for="(item, index) in localDevice.audioIn " :key="index" :label="item.label"
                                :value="item.id"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="分辨率" prop="rao">
                        <el-select v-model="formInline.rao" placeholder="分辨率">
                            <el-option v-for="(item, index) in raoList " :key="index" :label="item"
                                :value="item"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-button style="margin-left: 70px;" type="warning" @click="joinRoom('ruleForm')">进入</el-button>
                    </el-form-item>
                </el-form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { reactive, onMounted } from 'vue';
import { getRandomString } from 'billd-utils';
import { WebSocketClass } from '@/utils/webSocket';
import { SocketMessage, SocketStatus } from '@/types/websocket';

var PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;

const srsServerAPIURL = 'http://192.168.192.131:1985/';
const srsServerRTCURL = 'webrtc://192.168.192.131:1935/live/';
const srsServerFlvURL = 'http://192.168.192.131:5001/live/';
const serverSocketUrl = 'ws://192.168.192.131:3000'

const linkSocket = ref()
const centerDialogVisible = ref(true)
const roomUserList = ref<any[]>([])
const others = ref<any[]>([])
const RTCPushPeer = ref()
const RTCPullPeerMap = ref(new Map())
const localStream = ref()

const localDevice = reactive({
    audioIn: [],
    videoIn: [],
    audioOut: []
})

const formInline = reactive({
    rtcmessage: '',
    rtcmessageRes: '',//响应
    videoId: '',
    audioInId: '',
    nickname: '',//展示昵称
    roomId: '',//房间号
    rao: '640X480',
    userId: ''
})

const isAdmin = ref(false)
const id = ref('')

const raoList = [
    '1920X1080',
    '1080X720',
    '720X640',
    '640X480',
    '480X320'
]

function getParams(queryName) {
    let url = window.location.href
    let query = decodeURI(url.split('?')[1]);
    let vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] === queryName) {
            return pair[1];
        }
    }
    return null;
}

function initInnerLocalDevice() {
    let constraints = { video: true, audio: true }
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.log("浏览器不支持");
        return;
    }
    navigator.mediaDevices.getUserMedia(constraints)
        .then(function (stream) {
            stream.getTracks().forEach(trick => {
                trick.stop()
            })

            navigator.mediaDevices.enumerateDevices()
                .then(function (devices) {
                    devices.forEach(function (device) {
                        let obj = { id: device.deviceId, kind: device.kind, label: device.label }
                        if (device.kind === 'audioinput') {
                            if (localDevice.audioIn.filter(e => e.id === device.deviceId).length === 0) {
                                localDevice.audioIn.push(obj)
                            }
                        } if (device.kind === 'audiooutput') {
                            if (localDevice.audioOut.filter(e => e.id === device.deviceId).length === 0) {
                                localDevice.audioOut.push(obj)
                            }
                        } else if (device.kind === 'videoinput') {
                            if (localDevice.videoIn.filter(e => e.id === device.deviceId).length === 0) {
                                localDevice.videoIn.push(obj)
                            }
                        }
                    });
                })
                .catch(handleError);

        })
        .catch(handleError);
}

function handleError(error) {
    alert("缺少必要的音频或视频输入驱动设备")
    console.error('navigator.MediaDevices error: ', error.message, error.name);
}

const isShow = ref(true)

onMounted(() => {
    initInnerLocalDevice()
    let usession = window.sessionStorage.getItem("userInfo")
    if (usession) {
        usession = JSON.parse(usession)
        console.log(usession)
        // formInline = usession
    } else {
        formInline.nickname = getParams("nickname");
        formInline.roomId = getParams("roomId");
        formInline.userId = getParams("userId");
    }
    formInline.userId = getRandomString(15)
})

function joinRoom(formName) {
    isShow.value = false
    init()
}

async function init() {
    const { data } = await fetchLiveByIdApi(formInline.roomId)
    if (data === null) isAdmin.value = true
    const ws = new WebSocketClass({
        roomId: formInline.roomId,
        url: 'ws://192.168.192.131:3000',
        isAdmin: isAdmin.value,
    });
    ws.update();
    const networkStore = useNetworkStore();
    const instance = networkStore.wsMap.get(formInline.roomId)!

    if (!instance?.socketIo) return;
    // websocket连接成功
    instance.socketIo.on(SocketStatus.connect, () => {
        console.log('【websocket】websocket连接成功');
        instance.status = SocketStatus.connect;
        instance.update();
        const socketId = instance.socketIo?.id
        id.value = socketId!
        if (isAdmin.value === true) {
            instance.send({
                msgType: SocketMessage.join,
                data: {
                    roomName: formInline.nickname,
                    srs: {
                        streamurl: `webrtc://192.168.192.131/live/${socketId}`,
                        flvurl: `http://192.168.192.131:5001/live/${socketId}.flv`,
                    }
                },
            });
            initMeetingRoom()
        } else {
            instance.send({
                msgType: SocketMessage.join
            });
        }
    });

    // 当前所有在线用户
    instance.socketIo.on(SocketMessage.liveUser, async (data) => {
        console.log('【websocket】当前所有在线用户', data);
        roomUserList.value = data;
        others.value = roomUserList.value.filter(item => item.id !== id.value)
    });

    // 用户加入房间
    instance.socketIo.on(SocketMessage.joined, async (data) => {
        console.log('【websocket】用户加入房间完成', data);
    });

    // 当前所有在线用户
    instance.socketIo.on(SocketMessage.roomLiveing, async (data: any) => {
        console.log('【websocket】收到管理员正在直播', data);
        initMeetingRoom()
        roomUserList.value = data.liveUser;
    });

    // 其他用户加入房间
    instance.socketIo.on(SocketMessage.otherJoin, async (data) => {
        console.log('【websocket】其他用户加入房间', data);
        await getPullSdp(data.username)
    });

    // linkSocket.value = io(serverSocketUrl, {
    //     reconnectionDelayMax: 10000,
    //     transports: ["websocket"],
    //     query: formInline
    // });
    // linkSocket.value.on("connect", async (e) => {
    //     console.log("server init connect success", linkSocket.value)
    //     //获取房间用户列表
    //     linkSocket.value.emit('roomUserList', { roomId: formInline.roomId })
    // })
    // linkSocket.value.on("roomUserList", (e) => {
    //     console.log("roomUserList", e)
    //     roomUserList.value = e;
    //     initMeetingRoom()
    // })
    // linkSocket.value.on("msg", async (e) => {
    //     console.log("msg", e)
    //     if (e['type'] === 'join' || e['type'] === 'leave') {
    //         const userId = e['data']['userId']
    //         const nickname = e['data']['nickname']
    //         if (e['type'] === 'join') {
    //             others.value.push({
    //                 userId: userId,
    //                 nickname: nickname
    //             })
    //             await getPullSdp(userId)
    //         } else {
    //             removeChildVideoDom(userId)
    //         }

    //     }
    // })
    // linkSocket.value.on("error", (e) => {
    //     console.log("error", e)
    // })
}

async function initMeetingRoom() {
    localStream.value = await getLocalUserMedia();
    //本地预览自己的画面
    setDomVideoStream("localMediaDom", localStream.value);
    //推流
    await getPushSdp(id.value, localStream.value);
    //判断房间内是否有其他人
    others.value = roomUserList.value.filter(item => item.id !== id.value)
    for (let i = 0; i < others.value.length; i++) {
        let user = others.value[i];
        //拉其他用户媒体流
        await getPullSdp(user.id)
    }
}

async function getLocalUserMedia() {
    const audioId = formInline.audioInId
    const videoId = formInline.videoId
    let width = formInline.rao.split('X')[0]
    let height = formInline.rao.split('X')[1]
    console.log(width, height)
    const constraints = {
        video: true,
        audio: true,
        // audio: { deviceId: audioId ? { exact: audioId } : undefined },
        // video: {
        //     deviceId: videoId ? { exact: videoId } : undefined,
        //     width: width,
        //     height: height,
        //     frameRate: { ideal: 20, max: 24 }
        // }
    };
    // if (window.stream) {
    //     window.stream.getTracks().forEach(track => {
    //         track.stop();
    //     });
    // }
    return await navigator.mediaDevices.getDisplayMedia(constraints).catch(handleError)
}

async function setDomVideoStream(domId, newStream) {
    let video = document.getElementById(domId)
    let stream = video.srcObject
    if (stream) {
        stream.getAudioTracks().forEach(e => {
            stream.removeTrack(e)
        })
        stream.getVideoTracks().forEach(e => {
            stream.removeTrack(e)
        })
    }
    video.srcObject = newStream
    video.muted = true
    video.autoplay = true
}

function removeChildVideoDom(domId) {
    let video = document.getElementById(domId)
    if (video) {
        video.parentNode.removeChild(video)
    }
}
//SRS 推流
async function getPushSdp(streamId, stream) {
    RTCPushPeer.value = await new PeerConnection(null);
    RTCPushPeer.value.addTransceiver("audio", { direction: "sendonly" });
    RTCPushPeer.value.addTransceiver("video", { direction: "sendonly" });
    //send
    stream.getTracks().forEach(function (track) {
        RTCPushPeer.value.addTrack(track);
    });
    let offer = await RTCPushPeer.value.createOffer();
    await RTCPushPeer.value.setLocalDescription(offer)
    const res: any = await fetchRtcPublish({
        api: `http://192.168.192.131:1985/rtc/v1/publish/`,
        sdp: offer.sdp!,
        streamurl: srsServerRTCURL + streamId,
    });
    if (res.code === 0) {
        await RTCPushPeer.value.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: res.sdp }))
    } else {
        console.log('失败')
    }
}
//SRS  拉流
async function getPullSdp(streamId) {
    let pc = RTCPullPeerMap.value.get(streamId)
    if (pc) {
        pc.close();
    } else {
        RTCPullPeerMap.value.set(streamId, pc)
    }
    pc = await new PeerConnection(null);
    pc.addTransceiver("audio", { direction: "recvonly" });
    pc.addTransceiver("video", { direction: "recvonly" });
    pc.ontrack = function (e) {
        //这里DOM ID 就是用户UserID 和 streamID一致  
        setDomVideoTrick(streamId, e.track)
    }
    let offer = await pc.createOffer();
    await pc.setLocalDescription(offer)
    const res: any = await fetchRTCPlayApi({
        api: `http://192.168.192.131:1985/rtc/v1/play/`,
        sdp: offer.sdp!,
        streamurl: srsServerRTCURL + streamId,
    });
    if (res.code === 0) {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: res.sdp }))
    }
}
function setDomVideoTrick(domId, trick) {
    console.log('videoId', domId)
    let video = document.getElementById(domId)
    console.log('video', video)
    let stream = video?.srcObject
    if (stream) {
        stream.addTrack(trick)
    } else {
        stream = new MediaStream()
        stream.addTrack(trick)
        video.srcObject = stream
        video.controls = true;
        video.autoplay = true;
        video.style.width = "100%"
        video.style.height = "100%"
        video.muted = true
    }
}
</script>

<style scoped>
.container {
    padding-top: 20px;
    height: 90vh;
}

.dialog-inner-container {
    margin-left: 35%;
    margin-top: 5%;
}
</style>