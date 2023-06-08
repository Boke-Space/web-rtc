<template>
    <div class="webrtc-push-wrap">
        <div ref="topRef" class="left">
            <div class="video-wrap">
                <video id="localVideo" ref="localVideoRef" autoplay muted controls></video>
            </div>
            <div ref="bottomRef" class="control">
                <div class="info">
                    <div class="avatar"></div>
                    <div class="detail">
                        <div class="top">
                            <el-input v-model="roomName" size="small" placeholder="输入房间名" :style="{ width: '50%' }" />
                            <el-button size="small" type="primary">
                                确定
                            </el-button>
                        </div>
                        <div class="bottom">
                            <span>房间号：{{ roomId }}</span>
                        </div>
                    </div>
                </div>
                <div class="other">
                    <div class="top">
                        <span class="item">
                            <i class="ico"></i>
                            <span>正在观看人数：{{ roomUserList.length }}</span>
                        </span>
                    </div>
                    <div class="bottom">
                        <el-button v-if="!isSharedScreen" class="item" type="primary" @click="sharedScreen">
                            共享屏幕
                        </el-button>
                        <el-button v-else class="item" type="primary" @click="endShared">
                            结束共享
                        </el-button>
                        <el-button class="item" type="primary" @click="start">
                            开始会议
                        </el-button>
                    </div>
                </div>
            </div>
        </div>
        <div class="right">
            <div class="list">
                <div class="item" v-for="item of others" :key="item.socketId" :id="item.id">
                    <div class="triangle"></div>
                    <label
                        style="position: absolute;left: 5px;bottom: 5px;color: antiquewhite;font-size: 18px;z-index: 999;">
                        {{ item.id }}
                    </label>
                    <video :id="item.id + 'video'" style="object-fit: fill;height: 100%;width: 100%;" controls></video>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ChatEnum, liveTypeEnum } from '@/types';
import { SocketMessage, SocketStatus, type WebsocketType } from '@/types/websocket';
import { SRSWebRTCClass } from '@/utils/srsWebRtc';
import { WebSocketClass } from '@/utils/webSocket';
import { getRandomString } from 'billd-utils';

let roomId = getRandomString(15)
let type: WebsocketType = 'meeting'
const roomName = ref('')
const route = useRoute()

const topRef = ref<HTMLDivElement>();
const bottomRef = ref<HTMLDivElement>();
const localVideoRef = ref<HTMLVideoElement>();

const {
    isSharedScreen,
    localStream,
    getMediaDevices,
    sharedScreen,
    endShared,
    startCamera
} = useWebRTC()

const networkStore = useNetworkStore();

const PeerConnection = window.RTCPeerConnection;
const RTCPushPeer = ref()
const RTCPullPeerMap = ref(new Map())
const srsServerRTCURL = 'webrtc://192.168.192.131/live/';
const id = ref('')
const roomUserList = ref<any[]>([])
const others = ref<any[]>([])

function webSocketInit() {
    const ws = new WebSocketClass({
        url: 'ws://192.168.192.131:3000',
        type,
        roomId,
    });
    ws.update();
    const instance = networkStore.wsMap.get(roomId)!

    if (!instance?.socketIo) return;
    // websocket连接成功
    instance.socketIo.on(SocketStatus.connect, () => {
        console.log('【websocket】websocket连接成功');
        instance.status = SocketStatus.connect;
        instance.update();
        id.value = instance.socketIo?.id!
        if (type === 'attend') {
            instance.send({
                msgType: SocketMessage.join,
                data: {
                    type
                }
            });
        }
    })

    // 当前所有在线用户
    instance.socketIo.on(SocketMessage.liveUser, async (data) => {
        console.log('【websocket】当前所有在线用户', data);
        roomUserList.value = data;
        others.value = roomUserList.value.filter(item => item.id !== id.value)
    });

    // 用户加入房间
    instance.socketIo.on(SocketMessage.joined, async (data) => {
        console.log('【websocket】用户加入房间完成', data);
        if (data.liveUser) {
            roomUserList.value = data.liveUser;
        }
    });

    // 当前所有在线用户
    instance.socketIo.on(SocketMessage.roomLiveing, async (data: any) => {
        console.log('【websocket】收到管理员正在直播', data);
        initMeetingRoom()
        roomUserList.value = data;
    });

    // 其他用户加入房间
    instance.socketIo.on(SocketMessage.otherJoin, async (data) => {
        console.log('【websocket】其他用户加入房间', data);
        await getPullSdp(data.username)
    });

    // 用户离开房间
    instance.socketIo.on(SocketMessage.leave, (data) => {
        console.log('【websocket】用户离开房间', data);
        instance.socketIo?.emit(SocketMessage.leave, {
            roomId: instance.roomId,
        });
        removeChildVideoDom(data.socketId)
        roomUserList.value = roomUserList.value.filter(
            (item) => item.socketId !== data.socketId
        );
        others.value = roomUserList.value.filter(item => item.id !== id.value)
    });

    // 用户离开房间完成
    instance.socketIo.on(SocketMessage.leaved, (data) => {
        console.log('【websocket】用户离开房间完成', data);
        // 用户离开房间刷新人数
        // roomUserList.value = roomUserList.value.filter(
        //     (item) => item.socketId !== data.socketId
        // );
    });
}

function start() {
    const instance = networkStore.wsMap.get(roomId)!
    instance.send({
        msgType: SocketMessage.join,
        data: {
            roomName: roomName.value,
            type
        },
    })
    initMeetingRoom()
}

async function initMeetingRoom() {
    //推流
    localVideoRef.value!.srcObject = localStream.value
    await getPushSdp(id.value, localStream.value);
    //判断房间内是否有其他人
    others.value = roomUserList.value.filter(item => item.id !== id.value)
    for (let i = 0; i < others.value.length; i++) {
        let user = others.value[i];
        //拉其他用户媒体流
        await getPullSdp(user.id)
    }
}

//SRS 推流
async function getPushSdp(streamId: string, stream: any) {
    RTCPushPeer.value = new PeerConnection();
    RTCPushPeer.value.addTransceiver("audio", { direction: "sendonly" });
    RTCPushPeer.value.addTransceiver("video", { direction: "sendonly" });
    //send
    stream.getTracks().forEach(function (track: any) {
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
async function getPullSdp(streamId: string) {
    let pc = RTCPullPeerMap.value.get(streamId)
    if (pc) {
        pc.close();
    } else {
        RTCPullPeerMap.value.set(streamId, pc)
    }
    pc = new PeerConnection();
    pc.addTransceiver("audio", { direction: "recvonly" });
    pc.addTransceiver("video", { direction: "recvonly" });
    pc.ontrack = function (e) {
        //这里DOM ID 就是用户UserID 和 streamID一致  
        setDomVideoTrick(streamId + 'video', e.track)
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

function setDomVideoTrick(domId: string, trick: any) {
    let video = document.getElementById(domId) as any
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

async function setDomVideoStream(domId: any, newStream: any) {
    let video = document.getElementById(domId) as any
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

function removeChildVideoDom(domId: string) {
    let video = document.getElementById(domId) as any
    console.log(video)
    if (video) {
        video.remove()
    }
}

onMounted(async () => {
    await getMediaDevices()
    if (route.query.roomId) {
        roomId = route.query.roomId as string
        type = 'attend'
        await startCamera()
        console.log(localStream.value)
        setDomVideoStream("localVideo", localStream.value);
        await getPushSdp(id.value, localStream.value)
    }
    webSocketInit()
    if (topRef.value && bottomRef.value && localVideoRef.value) {
        const res =
            bottomRef.value.getBoundingClientRect().top -
            topRef.value.getBoundingClientRect().top;
        localVideoRef.value.style.height = `${res}px`;
    }
});

</script>

<style lang="scss" scoped>
.webrtc-push-wrap {
    margin: 20px auto 0;
    min-width: $large-width;
    height: 710px;
    text-align: center;

    .left {
        position: relative;
        display: inline-block;
        box-sizing: border-box;
        width: $large-left-width;
        height: 100%;
        border-radius: 6px;
        overflow: hidden;
        background-color: white;
        color: #9499a0;
        vertical-align: top;

        .video-wrap {
            position: relative;
            background-color: #18191c;

            #localVideo {
                max-width: 100%;
                max-height: 100%;
            }

            .add-wrap {
                position: absolute;
                top: 50%;
                left: 50%;
                display: flex;
                align-items: center;
                justify-content: space-around;
                padding: 0 20px;
                height: 50px;
                border-radius: 5px;
                background-color: white;
                transform: translate(-50%, -50%);
            }
        }

        .control {
            position: absolute;
            right: 0;
            bottom: 0;
            left: 0;
            display: flex;
            justify-content: space-between;
            padding: 20px;
            background-color: papayawhip;

            .info {
                display: flex;
                align-items: center;

                .avatar {
                    margin-right: 20px;
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    background-color: skyblue;
                    background-position: center center;
                    background-size: cover;
                    background-repeat: no-repeat;
                }

                .detail {
                    display: flex;
                    flex-direction: column;
                    text-align: initial;

                    .top {
                        margin-bottom: 10px;
                        color: #18191c;

                        .btn {
                            margin-left: 10px;
                        }
                    }

                    .bottom {
                        font-size: 14px;
                    }
                }
            }

            .other {
                display: flex;
                flex-direction: column;
                justify-content: center;
                font-size: 12px;

                .top {
                    display: flex;
                    align-items: center;

                    .item {
                        display: flex;
                        align-items: center;
                        margin-right: 20px;

                        .ico {
                            display: inline-block;
                            margin-right: 4px;
                            width: 10px;
                            height: 10px;
                            border-radius: 50%;
                            background-color: skyblue;
                        }
                    }
                }

                .bottom {
                    margin-top: 10px;
                }
            }
        }
    }

    .right {
        position: relative;
        display: inline-block;
        box-sizing: border-box;
        margin-left: 10px;
        width: 360px;
        height: 100%;
        border-radius: 6px;
        background-color: white;
        color: #9499a0;

        .list {
            .item {
                position: relative;
                box-sizing: border-box;
                margin-bottom: 10px;
                width: 360px;
                height: 230px;
                border-radius: 4px;
                background-color: rgba($color: #000000, $alpha: 0.3);
                cursor: pointer;


                &:last-child {
                    margin-bottom: 0;
                }

                .border {
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    z-index: 1;
                    border: 2px solid skyblue;
                    border-radius: 4px;
                }

                .triangle {
                    position: absolute;
                    top: 50%;
                    left: 0;
                    display: inline-block;
                    border: 5px solid transparent;
                    border-right-color: skyblue;
                    transform: translate(-100%, -50%);
                }

                &.active {
                    &::before {
                        background-color: transparent;
                    }
                }

                &:hover {
                    &::before {
                        background-color: transparent;
                    }
                }

                &::before {
                    position: absolute;
                    display: block;
                    width: 100%;
                    height: 100%;
                    border-radius: 4px;
                    background-color: rgba(0, 0, 0, 0.4);
                    content: '';
                    transition: all cubic-bezier(0.22, 0.58, 0.12, 0.98) 0.4s;
                }

                .txt {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    box-sizing: border-box;
                    padding: 4px 8px;
                    width: 100%;
                    border-radius: 0 0 4px 4px;
                    background-image: linear-gradient(-180deg,
                            rgba(0, 0, 0, 0),
                            rgba(0, 0, 0, 0.6));
                    color: white;
                    text-align: initial;
                    font-size: 13px;
                }
            }
        }
    }
}

// 屏幕宽度小于$large-width的时候
@media screen and (max-width: $large-width) {
    .home-wrap {
        height: 460px;

        .left {
            width: $medium-left-width;
            height: 460px;
        }

        .right {
            height: 460px;

            .list {
                .item {
                    width: 150px;
                    height: 80px;
                }
            }
        }
    }
}
</style>
