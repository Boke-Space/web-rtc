import { ChatEnum, type Chat, type IAdminIn, type ILiveUser } from "@/types";
import { SocketMessage, SocketStatus } from "@/types/websocket";
import { WebSocketClass } from "@/utils/webSocket";

export function useConference(roomId: string, isAdmin: boolean) {

    const networkStore = useNetworkStore();
    const liveUserList = ref<ILiveUser[]>([]);
    const otherList = ref<ILiveUser[]>([]);

    const chatList = ref<Chat[]>([]);

    const track = reactive({
        audio: true,
        video: true,
    });

    const RTCPushPeer = ref()
    const RTCPullPeerMap = ref(new Map())


    const streamurl = ref(`webrtc://192.168.192.131/live/${roomId}`);
    const flvurl = ref(`http://192.168.192.131:5001/live/${roomId}.flv`);

    function webSocketInit() {
        const ws = new WebSocketClass({
            roomId,
            url: 'ws://192.168.192.131:3000',
            isAdmin,
        });
        ws.update();
        initReceive()
    }

    // WebSocket 实现了 WebRTC 信令交互 offer，answer，candidate 的交换
    function initReceive() {
        const instance = networkStore.wsMap.get(roomId)!

        if (!instance?.socketIo) return;
        // websocket连接成功
        instance.socketIo.on(SocketStatus.connect, () => {
            console.log('【websocket】websocket连接成功');
            instance.status = SocketStatus.connect;
            instance.update();
            sendJoin()
        });

        // websocket连接断开
        instance.socketIo.on(SocketStatus.disconnect, async () => {
            console.log('【websocket】websocket连接断开');
            instance.status = SocketStatus.disconnect;
            instance.update();
            await deleteLiveListApi({ roomId })
        });

        // 当前所有在线用户
        instance.socketIo.on(SocketMessage.roomLiveing, (data: IAdminIn) => {
            console.log('【websocket】收到管理员正在直播', data);
        });

        // 当前所有在线用户
        instance.socketIo.on(SocketMessage.roomNoLive, (data: IAdminIn) => {
            console.log('【websocket】收到管理员不在直播', data);
        });

        // 当前所有在线用户
        instance.socketIo.on(SocketMessage.liveUser, async (data) => {
            console.log('【websocket】当前所有在线用户', data);
            // 用户进入房间刷新人数
            liveUserList.value = data.map((item) => ({
                avatar: 'red',
                socketId: item.id,
            }));
            otherList.value = liveUserList.value.slice(1)
            for (const item of otherList.value) {
                await getPullSdp(item.socketId)
            }
        });

        // 收到用户发送消息
        instance.socketIo.on(SocketMessage.message, (data) => {
            console.log('【websocket】收到用户发送消息', data);
            const content: Chat = {
                msgType: ChatEnum.chat,
                socketId: data.socketId,
                userInfo: data.data.userInfo,
                msg: data.data.msg,
                color: data.data.color,
            };
            chatList.value.push(content);
            console.log(chatList.value)
        });

        // 用户加入房间
        instance.socketIo.on(SocketMessage.joined, (data) => {
            console.log('【websocket】用户加入房间完成', data);
            instance.send({ msgType: SocketMessage.getLiveUser });
            console.log(data)
            // if (isSRS) {
            //     startNewWebRtc();
            // } else {
            //     batchSendOffer();
            // }
        });

        // 其他用户加入房间
        instance.socketIo.on(SocketMessage.otherJoin, (data) => {
            console.log('【websocket】其他用户加入房间', data);
            const content: Chat = {
                msgType: ChatEnum.otherJoin,
                socketId: data.socketId,
                userInfo: data.data.userInfo,
                msg: data.data.msg,
            };
            chatList.value.push(content);
            // if (isSRS) return;
            // if (joined.value) {
            //     batchSendOffer();
            // }
        });

        // 用户离开房间
        instance.socketIo.on(SocketMessage.leave, (data) => {
            console.log('【websocket】用户离开房间', data);
            instance.socketIo?.emit(SocketMessage.leave, {
                roomId: instance.roomId,
            });
            const content: Chat = {
                msgType: ChatEnum.userLeaved,
                socketId: data.socketId,
                msg: data.data.msg,
            };
            chatList.value.push(content);
        });

        // 用户离开房间完成
        instance.socketIo.on(SocketMessage.leaved, (data) => {
            console.log('【websocket】用户离开房间完成', data);
            // 用户离开房间刷新人数
            liveUserList.value = liveUserList.value.filter(
                (item) => item.socketId !== data.socketId
            );
        });
    }

    // 发送加入房间信令
    function sendJoin() {
        const instance = networkStore.wsMap.get(roomId);
        if (!instance) return;
        instance.send({
            msgType: SocketMessage.join,
            data: {
                roomName: roomId,
                srs: {
                    streamurl: streamurl.value,
                    flvurl: flvurl.value,
                },
                track,
            },
        });
    }

    //指定dom挂载元素
    async function setDomVideoStream(domId: string, newStream: any) {
        let video = document.getElementById(domId) as HTMLVideoElement
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

    //移除指定DOM
    function removeChildVideoDom(domId: string) {
        let video = document.getElementById(domId) as HTMLVideoElement
        if (video) {
            video.parentNode.removeChild(video)
        }
    }

    //SRS 推流
    async function getPushSdp(stream) {
        RTCPushPeer.value = new RTCPeerConnection(null);
        RTCPushPeer.value?.addTransceiver("audio", { direction: "sendonly" });
        RTCPushPeer.value?.addTransceiver("video", { direction: "sendonly" });
        stream.getTracks().forEach(function (track) {
            RTCPushPeer.value?.addTrack(track);
        });
        let offer = await RTCPushPeer.value?.createOffer();
        await RTCPushPeer?.value.setLocalDescription(offer)
        let params = {
            api: `http://192.168.192.131:1985/rtc/v1/play/`,
            streamurl: streamurl.value,
            sdp: offer.sdp
        }
        const res: any = await fetchRtcPublish(params);
        await RTCPushPeer.value.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: res.sdp }))
    }

    //SRS 推流
    async function getPullSdp(streamId) {
        console.log(streamId)
        let pc = RTCPullPeerMap.value.get(streamId)
        if (pc) {
            pc.close();
        } else {
            RTCPullPeerMap.value.set(streamId, pc)
        }
        pc = new RTCPeerConnection(null);
        pc.addTransceiver("audio", { direction: "recvonly" });
        pc.addTransceiver("video", { direction: "recvonly" });
        pc.ontrack = function (e) {
            //这里DOM ID 就是用户UserID 和 streamID一致  
            this.setDomVideoTrick(streamId, e.track)
        }
        let offer = await pc.createOffer();
        await pc.setLocalDescription(offer)
        let params = {
            api: `http://192.168.192.131:1985/rtc/v1/play/`,
            streamurl: streamurl.value,
            sdp: offer.sdp
        }
        const res: any = await fetchRtcPublish(params);
        await RTCPushPeer.value.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: res.sdp }))
    }

    function setDomVideoTrick(domId: string, trick: any) {
        let video = document.getElementById(domId)
        let stream = video.srcObject
        if (stream) {
            stream.addTrack(trick)
        } else {
            stream = new MediaStream()
            stream.addTrack(trick)
            video.srcObject = stream
            video.controls = true;
            video.autoplay = true;
            video.muted = true
        }
    }

    return {
        otherList,
        liveUserList,
        chatList,
        webSocketInit,
        initReceive,
        sendJoin,
        setDomVideoStream,
        removeChildVideoDom,
        getPushSdp,
        getPullSdp
    }
}