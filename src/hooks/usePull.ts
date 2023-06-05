import { getRandomString } from 'billd-utils';

import { type ILiveUser, type IOffer, type IAdminIn, type ICandidate, type Chat, ChatEnum } from "@/types";
import { SRSWebRTCClass } from "@/utils/srsWebRtc";
import { WebRTCClass } from "@/utils/webRtc";
import { SocketMessage, SocketStatus } from '@/types/websocket';
import { WebSocketClass } from '@/utils/webSocket';

export function usePull({
    localVideoRef,
    isSRS,
    isFlv,
}: {
    localVideoRef;
    isSRS?: boolean;
    isFlv?: boolean;
}) {
    const route = useRoute();
    const networkStore = useNetworkStore();
    const userStore = useUserStore();

    const heartbeatTimer = ref();
    const roomId = route.params.roomId as string
    const roomName = ref('');
    const streamurl = ref('');
    const flvurl = ref('');
    const chat = ref('');
    const chatList = ref<Chat[]>([]);
    const liveUserList = ref<ILiveUser[]>([]);
    const roomNoLive = ref(false);
    const track = reactive({
        audio: true,
        video: true,
    });

    watch(
        [
            () => userStore.userInfo,
            () => networkStore.wsMap.get(roomId)?.socketIo?.connected,
        ],
        ([userInfo, connected]) => {
            if (userInfo && connected) {
                const instance = networkStore.wsMap.get(roomId);
                if (!instance) return;
                instance.send({
                    msgType: SocketMessage.updateJoinInfo,
                    data: {
                        userInfo: userStore.userInfo,
                    },
                });
            }
        }
    );

    function sendJoin(roomId: string) {
        const instance = networkStore.wsMap.get(roomId);
        instance.send({
            msgType: SocketMessage.join,
            data: { userInfo: userStore.userInfo },
        });
    }

    // Websocket心跳机制 用于保持客户端和服务器之间的长连接
    function handleHeartbeat(roomId: string) {
        const heartbeatTimer = ref();
        heartbeatTimer.value = setInterval(() => {
            const instance = networkStore.wsMap.get(roomId);
            if (!instance) return;
            instance.send({
                msgType: SocketMessage.heartbeat,
                data: 'Websocket心跳机制'
            });
        }, 1000 * 30);
    }


    function webSocketInit() {
        const ws = new WebSocketClass({
            roomId,
            url: 'ws://192.168.192.131:3000',
            isAdmin: false,
        });
        ws.update();
        initReveive()
        // const instance = networkStore.wsMap.get(roomId)!
        // useWebSocket(instance, roomId)
    }

    function initReveive() {
        const instance = networkStore.wsMap.get(roomId)!

        if (!instance?.socketIo) return;
        // websocket连接成功
        instance.socketIo.on(SocketStatus.connect, () => {
            console.log('【websocket】websocket连接成功');
            instance.status = SocketStatus.connect;
            instance.update();
            sendJoin(roomId);
            handleHeartbeat(roomId);
        });

        // websocket连接断开
        instance.socketIo.on(SocketStatus.disconnect, () => {
            console.log('【websocket】websocket连接断开');
            instance.status = SocketStatus.disconnect;
            instance.update();
        });

        // 当前所有在线用户
        instance.socketIo.on(SocketMessage.roomLiveing, (data: IAdminIn) => {
            console.log('【websocket】收到管理员正在直播', data);
            if (isSRS && !isFlv) {
                startNewWebRtc();
            }
        });

        // 当前所有在线用户
        instance.socketIo.on(SocketMessage.roomNoLive, (data: IAdminIn) => {
            console.log('【websocket】收到管理员不在直播', data);
            roomNoLive.value = true;
            closeRtc();
        });

        // 当前所有在线用户
        instance.socketIo.on(SocketMessage.liveUser, (data) => {
            console.log('【websocket】当前所有在线用户', data);
            // 用户进入房间刷新人数
            liveUserList.value = data.map((item) => ({
                avatar: 'red',
                socketId: item.id,
            }));
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
            roomName.value = data.data.roomName;
            streamurl.value = data.data.streamUrl;
            flvurl.value = data.data.flvUrl;
            if (isFlv) {
                const { play } = useFlvPlay(flvurl.value, localVideoRef.value!)
                play()
            }
            instance.send({ msgType: SocketMessage.getLiveUser });
        });

        // 其他用户加入房间
        instance.socketIo.on(SocketMessage.otherJoin, (data) => {
            console.log('【websocket】其他用户加入房间', data);
        });

        // 用户离开房间
        instance.socketIo.on(SocketMessage.leave, (data) => {
            console.log('【websocket】用户离开房间', data);
            instance.socketIo?.emit(SocketMessage.leave, {
                roomId: instance.roomId,
            });
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

    function webRTCInit() {
        const instance = networkStore.wsMap.get(roomId)!
        // 收到offer
        instance.socketIo.on(SocketMessage.offer, async (data: IOffer) => {
            console.warn('【websocket】收到offer', data);
            if (isSRS) return;
            if (data.data.receiver === getSocketId()) {
                console.log('收到offer，这个offer是发给我的');
                const rtc = await startNewWebRtc(data.data.sender);
                if (rtc) {
                    await rtc.setRemoteDescription(data.data.sdp);
                    const sdp = await rtc.createAnswer();
                    await rtc.setLocalDescription(sdp);
                    instance.send({
                        msgType: SocketMessage.answer,
                        data: { sdp, sender: getSocketId(), receiver: data.data.sender },
                    });
                }
            } else {
                console.log('收到offer，但是这个offer不是发给我的');
            }
        });

        // 收到answer
        instance.socketIo.on(SocketMessage.answer, async (data: IOffer) => {
            console.warn('【websocket】收到answer', data);
            if (isSRS) return;
            const rtc = networkStore.getRtcMap(`${roomId}___${data.socketId}`);
            if (!rtc) return;
            rtc.rtcStatus.answer = true;
            rtc.update();
            if (data.data.receiver === getSocketId()) {
                console.log('收到answer，这个answer是发给我的');
                await rtc.setRemoteDescription(data.data.sdp);
            } else {
                console.log('收到answer，但这个answer不是发给我的');
            }
        });

        // 收到candidate
        instance.socketIo.on(SocketMessage.candidate, (data: ICandidate) => {
            console.warn('【websocket】收到candidate', data);
            if (isSRS) return;
            const rtc = networkStore.getRtcMap(`${roomId}___${data.socketId}`);
            if (!rtc) return;
            if (data.socketId !== getSocketId()) {
                console.log('不是我发的candidate');
                const candidate = new RTCIceCandidate({
                    sdpMid: data.data.sdpMid,
                    sdpMLineIndex: data.data.sdpMLineIndex,
                    candidate: data.data.candidate,
                });
                rtc.peerConnection
                    ?.addIceCandidate(candidate)
                    .then(() => {
                        console.log('candidate成功');
                    })
                    .catch((err) => {
                        console.error('candidate失败', err);
                    });
            } else {
                console.log('是我发的candidate');
            }
        });
    }

    function initPull() {
        webSocketInit()
        webRTCInit()
        localVideoRef.value.addEventListener('loadstart', () => {
            console.warn('视频流-loadstart');
            const rtc = networkStore.getRtcMap(roomId);
            if (!rtc) return;
            rtc.rtcStatus.loadstart = true;
            rtc.update();
        });

        localVideoRef.value.addEventListener('loadedmetadata', () => {
            console.warn('视频流-loadedmetadata');
            const rtc = networkStore.getRtcMap(roomId);
            if (!rtc) return;
            rtc.rtcStatus.loadedmetadata = true;
            rtc.update();
        });
    }

    function closeWs() {
        const instance = networkStore.wsMap.get(roomId);
        instance?.close();
    }

    function closeRtc() {
        networkStore.rtcMap.forEach((rtc) => {
            rtc.close();
        });
    }

    function getSocketId() {
        return networkStore.wsMap.get(roomId!)?.socketIo?.id || '-1';
    }

    /** 原生的webrtc时，receiver必传 */
    async function startNewWebRtc(receiver?: string) {
        if (isSRS) {
            console.warn('开始new SRSWebRTCClass', getSocketId());
            const rtc = new SRSWebRTCClass({
                roomId: `${roomId}___${getSocketId()}`,
            });
            rtc.rtcStatus.joined = true;
            rtc.update();
            // 检查是否含视频和音频轨道
            if (track.video) {
                rtc.peerConnection?.addTransceiver('video', { direction: 'recvonly' });
            }
            if (track.audio) {
                rtc.peerConnection?.addTransceiver('audio', { direction: 'recvonly' });
            }
            try {
                const offer = await rtc.createOffer();
                if (!offer) return;
                await rtc.setLocalDescription(offer);
                // offer 对象发送给服务器，以便服务器将其转发给远程客户端
                const res: any = await fetchRTCPlayApi({
                    api: `http://192.168.192.131:1985/rtc/v1/play/`,
                    clientip: null,
                    sdp: offer.sdp!,
                    streamurl: streamurl.value,
                    tid: getRandomString(10),
                });
                await rtc.setRemoteDescription(
                    new RTCSessionDescription({ type: 'answer', sdp: res.sdp })
                );
            } catch (error) {
                console.log(error);
            }
        } else {
            console.warn('开始new WebRTCClass');
            const rtc = new WebRTCClass({ roomId: `${roomId}___${receiver!}` });
            return rtc;
        }
    }

    function keydownDanmu(event: KeyboardEvent) {
        const key = event.key.toLowerCase();
        if (key === 'enter') {
            event.preventDefault();
            sendMessage();
        }
    }

    function sendMessage() {
        if (!chat.value.trim().length) {
            return;
        }
        const instance = networkStore.wsMap.get(roomId);
        const content: Chat = {
            socketId: getSocketId(),
            userInfo: userStore.userInfo,
            msgType: ChatEnum.chat,
            msg: chat.value,
            color: '#87ceeb',
        };
        instance.send({
            msgType: SocketMessage.message,
            data: content,
        });
        chatList.value.push(content);
        chat.value = '';
    }

    return {
        initPull,
        closeWs,
        closeRtc,
        getSocketId,
        keydownDanmu,
        sendMessage,
        roomName,
        roomNoLive,
        chatList,
        liveUserList,
        chat,
    };
}
