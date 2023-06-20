<template>
    <div class="webrtc-push-wrap">
        <div ref="topRef" class="left">
            <div class="video-wrap" :id="id + 'video'">
                <video :id="id" ref="localVideoRef" autoplay muted controls></video>
                <label style="position: absolute;left: 5px;bottom: 5px;color: antiquewhite;font-size: 18px;z-index: 999;">
                    {{ id }}
                </label>
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
                        <el-dropdown placement="top" style="margin-right: 16px;">
                            <el-button class="item" type="primary">
                                <span>麦克风</span>
                            </el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item @click="handleDrop(item)" v-for="(item, index) in audioInputs"
                                        :key="index">{{ item.label }}</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                        <el-dropdown placement="top" style="margin-right: 16px;">
                            <el-button class="item" type="primary">
                                <span>扬声器</span>
                            </el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item @click="handleDrop(item)" v-for="(item, index) in audioOutputs"
                                        :key="index">{{ item.label }}</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                        <el-button v-if="!isSharedScreen" class="item" type="primary" @click="displayScreen">
                            <span>共享屏幕</span>
                        </el-button>
                        <el-button v-if="!isSharedScreen" class="item" type="primary" @click="displayCamera">
                            <span>开启摄像头</span>
                        </el-button>
                        <el-button v-if="!isSharedScreen" class="item" type="primary" @click="mergeStream">
                            <span>合并推流</span>
                        </el-button>
                        <el-button v-else class="item" type="primary" @click="end">
                            <span>结束共享</span>
                        </el-button>
                    </div>
                </div>
            </div>
        </div>
        <div class="right">
            <div class="list">
                <template v-for="item of others" :key="item.socketId">
                    <div class="item background"
                        style="background-image: url('http://192.168.192.131:3000/img/SupperMoment.jpg')"
                        :id="item.id + 'video'">
                        <div class="triangle"></div>
                        <label
                            style="position: absolute;left: 5px;bottom: 5px;color: antiquewhite;font-size: 18px;z-index: 999;">
                            {{ item.id }}
                        </label>
                        <video :id="item.id" style="object-fit: fill;height: 100%;width: 100%;"
                            @click=swap(item.id)></video>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { SocketMessage, SocketStatus, type WebsocketType } from '@/types/websocket';
import { WebSocketClass } from '@/utils/webSocket';
import { getRandomString } from 'billd-utils';
import { uniqueObjectList } from '../../utils/Array';

const {
    isSharedScreen,
    localStream,
    getMediaDevices,
    sharedScreen,
    endShared,
    startCamera,
    audioInputs,
    audioOutputs
} = useWebRTC()

const networkStore = useNetworkStore();

let roomId = getRandomString(15)
let type: WebsocketType = 'meeting'
let socketId: string
const PeerConnection = window.RTCPeerConnection;
const srsServerRTCURL = 'webrtc://192.168.192.131/live/';

const route = useRoute()
const roomName = ref('')
const topRef = ref<HTMLDivElement>();
const bottomRef = ref<HTMLDivElement>();
const localVideoRef = ref<HTMLVideoElement | null>(null);
const streamList = ref<any[]>([]);
const RTCPushPeer = ref()
const RTCPullPeerMap = ref(new Map())
const id = ref('')
const roomUserList = ref<any[]>([])
const others = ref<any[]>([])
const currentUser = ref()
// 是否推流
const isPush = ref(false)

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
    instance.socketIo.on(SocketStatus.connect, async () => {
        console.log('【websocket】websocket连接成功, socketIo', instance.socketIo?.id!);
        instance.status = SocketStatus.connect;
        instance.update();
        id.value = instance.socketIo?.id!
        socketId = instance.socketIo?.id!
        instance.send({
            msgType: SocketMessage.join,
            data: {
                type
            }
        });
    })

    // 收到其他用户发起共享屏幕
    instance.socketIo.on(SocketMessage.getSharedScreen, async (data) => {
        console.log('【websocket】监听到用户分享屏幕', data);
        roomUserList.value = data.liveUser;
        others.value = uniqueObjectList(roomUserList.value.filter(item => item.id !== id.value))
        if (id.value !== data.socketId) {
            await getPullSdp(data.socketId)
        }
        // await initMeetingRoom()
    });

    // 收到其他用户发起共享屏幕
    instance.socketIo.on(SocketMessage.getPauseScreen, async (data) => {
        console.log('【websocket】监听到用户结束屏幕', data);
        roomUserList.value = data.liveUser;
        others.value = uniqueObjectList(roomUserList.value.filter(item => item.id !== id.value))
        let video = document.getElementById(data.socketId) as HTMLVideoElement
        video.srcObject = null
    });

    // 用户加入房间
    instance.socketIo.on(SocketMessage.joined, async (data) => {
        console.log('【websocket】用户加入房间完成', data);
        roomUserList.value = data.liveUser;
        others.value = uniqueObjectList(roomUserList.value.filter(item => item.id !== id.value))
        // 拉流
        await initMeetingRoom()
        // 若没开启屏幕分享将他人屏幕分享
        // if (localVideoRef.value?.srcObject === null && others.value.length > 0) {
        //     const first = others.value[0].id
        //     const stream = streamList.value.find((item) => item.id === first)
        //     localVideoRef.value.srcObject = stream.stream
        //     // others.value.splice(0, 1)
        //     others.value[0].isOpen = false
        // }
    });

    // 其他用户加入房间
    instance.socketIo.on(SocketMessage.otherJoin, async (data) => {
        console.log('【websocket】其他用户加入房间', data);
        roomUserList.value = data.liveUser;
        others.value = uniqueObjectList(roomUserList.value.filter(item => item.id !== id.value))
        // await getPullSdp(data.username)
        let video = document.getElementById(data.username) as HTMLVideoElement
        // 其他用户没开启屏幕分享
        // if (video?.srcObject === null && others.value.length > 0) {
        //     others.value[0].isOpen = false
        // }
        // if (others.value.length > 0) {
        //     const user = others.value.find((item) => item.id === data.username)
        //     user.isOpen = true
        // }
    });

    // 当前所有在线用户
    instance.socketIo.on(SocketMessage.roomLiveing, async (data: any) => {
        console.log('【websocket】收到管理员正在直播', data);
        roomUserList.value = data;
        others.value = uniqueObjectList(roomUserList.value.filter(item => item.id !== id.value))
        // await initMeetingRoom()
        // 进入会议者没有开启共享屏幕
        // if (localVideoRef.value?.srcObject === null && others.value.length > 0) {
        //     const first = others.value[0].id
        //     const stream = streamList.value.find((item) => item.id === first)
        //     localVideoRef.value.srcObject = stream.stream
        //     others.value.splice(0, 1)
        // }
    });

    // 用户离开房间
    instance.socketIo.on(SocketMessage.leave, (data) => {
        console.log('【websocket】用户离开房间', data);
        instance.socketIo?.emit(SocketMessage.leave, {
            roomId: instance.roomId,
        });
        roomUserList.value = roomUserList.value.filter(
            (item) => item.id !== data.socketId
        );
        others.value = uniqueObjectList(roomUserList.value.filter(item => item.id !== id.value))
        currentUser.value = data.socketId
    });

    // 用户离开房间完成
    instance.socketIo.on(SocketMessage.leaved, (data) => {
        console.log('【websocket】用户离开房间完成', data);
        // 交换位置
        if (socketId !== id.value) {
            // 获取交换位置后元素的视频流
            const stream = streamList.value.findLast(item => item.id === socketId)
            // 获取交换位置后元素的位置
            let video = document.getElementById(socketId) as HTMLVideoElement
            localVideoRef.value!.srcObject = stream.stream
            others.value.map((item) => {
                if (item.id === socketId) {
                    item.id = id.value
                    video!.srcObject = null
                }
            })
            // id复原
            id.value = socketId
        }
        // removeChildVideoDom(currentUser.value + 'video', data.socketId)
    });

    instance.socketIo.on(SocketStatus.disconnect, async () => {
        console.log('【websocket】websocket连接断开');
        instance.status = SocketStatus.disconnect;
        instance.update();
    });
}

async function displayScreen() {
    await sharedScreen()
    const instance = networkStore.wsMap.get(roomId)!
    // 发起共享屏幕
    instance.send({
        msgType: SocketMessage.sharedScreen,
        data: {
            roomName: roomName.value,
            type
        },
    })
    // 展示屏幕并将流添加到数组中
    await setDomVideoStream(id.value, localStream.value)
    if (!isPush.value) {
        // 推流
        await getPushSdp(id.value, localStream.value);
    }
}

async function displayCamera() {
    await startCamera()
    const instance = networkStore.wsMap.get(roomId)!
    // 发起共享屏幕
    instance.send({
        msgType: SocketMessage.sharedScreen,
        data: {
            roomName: roomName.value,
            type
        },
    })
    // 展示屏幕并将流添加到数组中
    await setDomVideoStream(id.value, localStream.value)
    await getPushSdp(id.value, localStream.value);
}

async function mergeStream() {
    const instance = networkStore.wsMap.get(roomId)!
    // 发起共享屏幕
    instance.send({
        msgType: SocketMessage.sharedScreen,
        data: {
            roomName: roomName.value,
            type
        },
    })
    const result = await useMerger()
    isSharedScreen.value = true
    // // 展示屏幕并将流添加到数组中
    await setDomVideoStream(id.value, result)
    await getPushSdp(id.value, result);
}

// 停止推流
async function stopPush() {
    const { streams } = await getStreamsApi()
    // 找出需要停止推流的目标
    const stream = streams.find((item: any) => item.name === socketId)
    // 停止推流
    await deleteStreamsApi(stream.publish.cid)
}

async function end() {
    const instance = networkStore.wsMap.get(roomId)!
    // 结束共享屏幕
    instance.send({
        msgType: SocketMessage.pauseScreen,
        data: {
            roomName: roomName.value,
            type
        },
    })
    await stopPush()
    // 没有交换位置
    if (socketId === id.value) {
        await endShared()
        let video = document.getElementById(id.value) as HTMLVideoElement
        video!.srcObject = null
    } else {
        localVideoRef.value!.srcObject = null
        //  获取交换前的视频流
        const stream = streamList.value.findLast(item => item.id === id.value)
        //  获取交换后的位置
        let video = document.getElementById(socketId) as HTMLVideoElement
        // 获取旁观者元素原有位置
        others.value.map((item) => {
            if (item.id === socketId) {
                item.id = id.value
                video!.srcObject = stream.stream
            }
        })
        // id复原
        id.value = socketId
        // console.log('others', others.value)
    }
    // if (others.value.length) {
    //     const first = others.value[0].id
    //     const stream = streamList.value.find((item) => item.id === first)
    //     localVideoRef.value!.srcObject = stream.stream
    //     others.value.splice(0, 1)
    //     id.value = first
    // }
}

async function initMeetingRoom() {
    //推流
    // localVideoRef.value!.srcObject = localStream.value
    // if (localStream.value) {
    //     await getPushSdp(id.value, localStream.value);
    // }
    //判断房间内是否有其他人
    others.value = uniqueObjectList(roomUserList.value.filter(item => item.id !== id.value))
    for (let i = 0; i < others.value.length; i++) {
        let user = others.value[i];
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
        clientip: null,
        tid: getRandomString(10),
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
    pc.ontrack = function (e: any) {
        //这里DOM ID 就是用户UserID 和 streamID一致  
        setDomVideoTrick(streamId, e.track)
    }
    let offer = await pc.createOffer();
    let count = localStorage.getItem('count')
    await pc.setLocalDescription(offer)
    const res: any = await fetchRTCPlayApi({
        api: `http://192.168.192.131:1985/rtc/v1/play/`,
        sdp: offer.sdp!,
        streamurl: srsServerRTCURL + streamId,
    });
    if (res.code === 0) {
        console.log('pull', count)
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
        const obj = {
            id: domId,
            stream,
        }
        // streamList.value.map((item) => {
        //     if (item.id === domId && stream !== undefined) {
        //         item.stream = stream
        //     } else {
        //         streamList.value.push(obj)
        //     }
        // })
        streamList.value.push(obj)
        const newStream = streamList.value.findLast((item) => item.id === domId)
        // console.log('streamList', streamList.value)
        video.srcObject = newStream.stream
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
        stream.getAudioTracks().forEach((e: any) => {
            stream.removeTrack(e)
        })
        stream.getVideoTracks().forEach((e: any) => {
            stream.removeTrack(e)
        })
    }
    const obj = {
        id: domId,
        stream: newStream
    }
    // streamList.value.map((item) => {
    //     if (item.id === domId && stream !== undefined) {
    //         item.stream = stream
    //     } else {
    //         streamList.value.push(obj)
    //     }
    // })
    streamList.value.push(obj)
    const Stream = streamList.value.findLast((item) => item.id === domId)
    // console.log('streamList', streamList.value)
    // console.log('stream', Stream)
    video.srcObject = Stream.stream
    video.muted = true
    video.autoplay = true
}

function removeChildVideoDom(domId: string, socketId?: string) {
    let video = document.getElementById(domId) as HTMLVideoElement
    if (video?.id.replace('video', '') === id.value) {
        const index = others.value.findIndex((item) => item.id === socketId)
        const videoId = others.value[index].id
        const stream = streamList.value.find((item) => item.id === videoId)
        localVideoRef.value!.srcObject = stream.stream
        others.value.splice(index, 1)
        // id复原
        id.value = socketId!
    } else {
        video.remove()
    }
}

async function closeWs() {
    const instance = networkStore.wsMap.get(roomId);
    instance?.close();
}

async function closeRtc() {
    await deleteLiveListApi({ roomId })
    networkStore.rtcMap.forEach((rtc) => {
        rtc.close();
    });
}

onMounted(async () => {
    await getMediaDevices()
    // await startCamera()
    if (route.query.roomId) {
        roomId = route.query.roomId as string
        type = 'attend'
    }
    webSocketInit()
    if (topRef.value && bottomRef.value && localVideoRef.value) {
        const res =
            bottomRef.value.getBoundingClientRect().top -
            topRef.value.getBoundingClientRect().top;
        localVideoRef.value.style.height = `${res}px`;
    }
    if (localStorage.getItem('count') === null) {
        localStorage.setItem('count', '0')
    }
});

onUnmounted(() => {
    closeWs();
    closeRtc();
});

function swap(domId: string) {
    let videoId = domId
    const video = document.getElementById(videoId) as HTMLVideoElement
    const stream = streamList.value.find((item) => item.id === videoId)
    let oldStream = localVideoRef.value?.srcObject
    const localId = localVideoRef.value?.id!
    others.value.map((item) => {
        if (item.id === domId) {
            item.id = localId
        }
    })
    localVideoRef.value!.srcObject = stream.stream
    video!.srcObject = oldStream!
    id.value = video.id
}

function handleDrop(item: any) {
    console.log(item)
}

// 媒体控制
function mediumControl(flag: boolean, kind: 'audio' | 'video') {
    const senders = RTCPushPeer.value.getSenders()
    console.log('senders', senders)
    const medium = senders.find((item: any) => item.track.kind === kind)
    medium.track.enabled = flag
    isSharedScreen.value = flag
}
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

            .background {
                /* 背景图垂直、水平均居中 */
                background-position: center center;
                /* 背景图不平铺 */
                background-repeat: no-repeat;
                /* 让背景图基于容器大小伸缩 */
                background-size: cover;
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
