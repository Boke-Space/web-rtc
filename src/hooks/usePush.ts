import { getRandomString } from 'billd-utils';

import { type Ref } from 'vue';
import { type IDanmu, type ILiveUser, DanmuMsgTypeEnum, type IOffer, type IAdminIn, type ICandidate, MediaTypeEnum, type Chat, ChatEnum } from "@/types";
import { SRSWebRTCClass } from "@/utils/srsWebRtc";
import { WebRTCClass } from "@/utils/webRtc";
import { SocketMessage, SocketStatus } from '@/types/websocket';
import { WebSocketClass } from '@/utils/webSocket';
import type { MediaType } from '@/types/media';
import { errorMessage } from '@/utils/message';

async function getAllMediaDevices() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices;
    } catch (err) {
        console.error('媒体设备获取失败: ', err);
        return [];
    }
}

export function usePush({
    localVideoRef,
    isSRS,
}: {
    localVideoRef: Ref<HTMLVideoElement | undefined>;
    isSRS?: boolean;
}) {
    const route = useRoute();
    const router = useRouter();
    const networkStore = useNetworkStore();
    const userStore = useUserStore();

    const roomId = getRandomString(15)
    const roomName = ref('');
    const isDone = ref(false);
    const joined = ref(false);
    const startDisabled = ref(true);
    const endDisabled = ref(true);
    const localStream = ref();
    const offerSended = ref(new Set());
    const hooksRtcMap = ref(new Set());

    const track = reactive({
        audio: true,
        video: true,
    });

    const streamurl = ref(
        `webrtc://192.168.192.131/live/${roomId}`
    );
    const flvurl = ref(
        `http://192.168.192.131:5001/live/${roomId}.flv`
    );

    const chat = ref('');
    const chatList = ref<Chat[]>([]);
    const liveUserList = ref<ILiveUser[]>([]);

    const allMediaTypeList = {
        [MediaTypeEnum.camera]: {
            type: MediaTypeEnum.camera,
            txt: '摄像头',
        },
        [MediaTypeEnum.screen]: {
            type: MediaTypeEnum.screen,
            txt: '窗口',
        },
    };

    const currMediaTypeList = ref<MediaType[]>([]);
    const currMediaType = ref<MediaType>();

    function getSocketId() {
        return networkStore.wsMap.get(roomId!)?.socketIo?.id || '-1';
    }

    function confirmRoomName() {
        if (!roomNameIsOk()) return;
        startDisabled.value = false
    }

    function roomNameIsOk() {
        if (!roomName.value.length) {
            errorMessage('请输入房间名！');
            return false;
        }
        if (roomName.value.length < 3 || roomName.value.length > 10) {
            errorMessage('房间名要求3-10个字符！');
            return false;
        }
        return true;
    }

    /** 窗口 */
    async function startGetDisplayMedia() {
        if (!localStream.value) {
            // 获取屏幕共享流
            const event = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });
            currMediaType.value = allMediaTypeList[MediaTypeEnum.screen];
            currMediaTypeList.value.push(allMediaTypeList[MediaTypeEnum.screen]);
            localStream.value = event;
            if (!localVideoRef.value) return;
            // 展示视频流
            localVideoRef.value.srcObject = event;
            // 判断屏幕共享流中是否包含音频和视频轨道
            const audio = event.getAudioTracks();
            const video = event.getVideoTracks();
            track.audio = !!audio.length;
            track.video = !!video.length;
        }
    }

    /** 摄像头 */
    async function startGetUserMedia() {
        if (!localStream.value) {
            const event = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            currMediaType.value = allMediaTypeList[MediaTypeEnum.camera];
            currMediaTypeList.value.push(allMediaTypeList[MediaTypeEnum.camera]);
            if (!localVideoRef.value) return;
            localVideoRef.value.srcObject = event;
            localStream.value = event;
        }
    }

    function startLive() {
        if (!roomNameIsOk()) return;
        if (currMediaTypeList.value.length <= 0) {
            errorMessage('请选择一个素材！')
            return;
        }
        startDisabled.value = true
        endDisabled.value = false
        initReceive();
        if (isSRS) {
            sendJoin();
        }
    }

    function webSocketInit() {
        const ws = new WebSocketClass({
            roomId: roomId,
            url: 'ws://192.168.192.131:3000',
            isAdmin: true,
        });
        ws.update();
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
            // if (!isSRS) {
            //     sendJoin();
            // }
        });

        // websocket连接断开
        instance.socketIo.on(SocketStatus.disconnect, async () => {
            console.log('【websocket】websocket连接断开');
            instance.status = SocketStatus.disconnect;
            instance.update();
            await deleteLiveListApi({ roomId })
        });

        // WebRTC 收到offer
        // instance.socketIo.on(SocketMessage.offer, async (data: IOffer) => {
        //     console.warn('【websocket】收到offer', data);
        //     if (isSRS) return;
        //     if (!instance) return;
        //     if (data.data.receiver === getSocketId()) {
        //         console.log('收到offer，这个offer是发给我的');
        //         const rtc = await startNewWebRtc(data.data.sender);
        //         if (rtc) {
        //             await rtc.setRemoteDescription(data.data.sdp);
        //             const sdp = await rtc.createAnswer();
        //             await rtc.setLocalDescription(sdp);
        //             instance.send({
        //                 msgType: SocketMessage.answer,
        //                 data: { sdp, sender: getSocketId(), receiver: data.data.sender },
        //             });
        //         }
        //     } else {
        //         console.log('收到offer，但是这个offer不是发给我的');
        //     }
        // });

        // WebRTC 收到answer
        // instance.socketIo.on(SocketMessage.answer, async (data: IOffer) => {
        //     console.warn('【websocket】收到answer', data);
        //     if (isSRS) return;
        //     if (isDone.value) return;
        //     if (!instance) return;
        //     const rtc = networkStore.getRtcMap(`${roomId}___${data.socketId}`);
        //     if (!rtc) return;
        //     rtc.rtcStatus.answer = true;
        //     rtc.update();
        //     if (data.data.receiver === getSocketId()) {
        //         console.log('收到answer，这个answer是发给我的');
        //         await rtc.setRemoteDescription(data.data.sdp);
        //     } else {
        //         console.log('收到answer，但这个answer不是发给我的');
        //     }
        // });

        // WebRTC 收到candidate
        // instance.socketIo.on(SocketMessage.candidate, (data: ICandidate) => {
        //     console.warn('【websocket】收到candidate', data);
        //     if (isSRS) return;
        //     if (isDone.value) return;
        //     if (!instance) return;
        //     const rtc = networkStore.getRtcMap(`${roomId}___${data.socketId}`);
        //     if (!rtc) return;
        //     if (data.socketId !== getSocketId()) {
        //         console.log('不是我发的candidate');
        //         const candidate = new RTCIceCandidate({
        //             sdpMid: data.data.sdpMid,
        //             sdpMLineIndex: data.data.sdpMLineIndex,
        //             candidate: data.data.candidate,
        //         });
        //         rtc.peerConnection
        //             ?.addIceCandidate(candidate)
        //             .then(() => {
        //                 console.log('candidate成功');
        //             })
        //             .catch((err) => {
        //                 console.error('candidate失败', err);
        //             });
        //     } else {
        //         console.log('是我发的candidate');
        //     }
        // });

        // 当前所有在线用户
        instance.socketIo.on(SocketMessage.roomLiveing, (data: IAdminIn) => {
            console.log('【websocket】收到管理员正在直播', data);
        });

        // 当前所有在线用户
        instance.socketIo.on(SocketMessage.roomNoLive, (data: IAdminIn) => {
            console.log('【websocket】收到管理员不在直播', data);
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
            instance.send({ msgType: SocketMessage.getLiveUser });
            if (isSRS) {
                startNewWebRtc();
            } else {
                batchSendOffer();
            }
        });

        // 其他用户加入房间
        instance.socketIo.on(SocketMessage.otherJoin, (data) => {
            console.log('【websocket】其他用户加入房间', data);
            const content: Chat = {
                msgType: ChatEnum.otherJoin,
                socketId: data.socketId,
                username: data.username,
            };
            chatList.value.push(content);
            if (isSRS) return;
            if (joined.value) {
                batchSendOffer();
            }
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

    // 发送加入房间信令
    function sendJoin() {
        const instance = networkStore.wsMap.get(roomId);
        if (!instance) return;
        instance.send({
            msgType: SocketMessage.join,
            data: {
                roomName: roomName.value,
                // coverImg: handleCoverImg(),
                srs: isSRS
                    ? {
                        streamurl: streamurl.value,
                        flvurl: flvurl.value,
                    }
                    : undefined,
                track,
                userInfo: userStore.userInfo,
            },
        });
    }

    /** 结束直播 */
    function endLive() {
        startDisabled.value = false
        endDisabled.value = true
        closeRtc();
        currMediaTypeList.value = [];
        localStream.value = null;
        localVideoRef.value!.srcObject = null;
        const instance = networkStore.wsMap.get(roomId);
        if (!instance) return;
        instance.send({
            msgType: SocketMessage.roomNoLive,
        });
        // setTimeout(() => {
        //     instance.close();
        // }, 500);
    }

    function addTrack() {
        if (!localStream.value) return;
        liveUserList.value.forEach((item) => {
            if (item.socketId !== getSocketId()) {
                localStream.value.getTracks().forEach((track) => {
                    const rtc = networkStore.getRtcMap(
                        `${roomId}___${item.socketId}`
                    );
                    rtc?.addTrack(track, localStream.value);
                });
            }
        });
    }

    async function sendOffer({
        sender,
        receiver,
    }: {
        sender: string;
        receiver: string;
    }) {
        if (isDone.value) return;
        const instance = networkStore.wsMap.get(roomId);
        if (!instance) return;
        const rtc = networkStore.getRtcMap(`${roomId}___${receiver}`);
        if (!rtc) return;
        const sdp = await rtc.createOffer();
        await rtc.setLocalDescription(sdp);
        instance.send({
            msgType: SocketMessage.offer,
            data: { sdp, sender, receiver },
        });
    }

    /** 原生的webrtc时，receiver必传 */
    async function startNewWebRtc(receiver?: string) {
        if (isSRS) {
            console.log('开始new SRSWebRTCClass');
            const rtc = new SRSWebRTCClass({
                roomId: `${roomId}___${getSocketId()}`,
                videoEl: localVideoRef.value!,
            });

            // 音视频轨道添加到WebRTC连接中
            console.log('音视频轨道添加到WebRTC连接中')
            localStream.value.getTracks().forEach((track) => {
                rtc.addTrack({
                    track,
                    stream: localStream.value,
                    direction: 'sendonly',
                });
            });

            try {
                const offer = await rtc.createOffer();
                if (!offer) return;
                await rtc.setLocalDescription(offer);
                // offer 对象发送给服务器，以便服务器将其转发给远程客户端
                const res: any = await fetchRtcPublish({
                    api: `http://192.168.192.131:1985/rtc/v1/publish/`,
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
            const rtc = new SRSWebRTCClass({
                roomId: `${roomId}___${receiver!}`,
                videoEl: localVideoRef.value!,
            });
            return rtc;
        }
    }

    function batchSendOffer() {
        liveUserList.value.forEach(async (item) => {
            if (
                !offerSended.value.has(item.socketId) &&
                item.socketId !== getSocketId()
            ) {
                hooksRtcMap.value.add(await startNewWebRtc(item.socketId));
                await addTrack();
                console.warn('new WebRTCClass完成');
                console.log('执行sendOffer', {
                    sender: getSocketId(),
                    receiver: item.socketId,
                });
                sendOffer({ sender: getSocketId(), receiver: item.socketId });
                offerSended.value.add(item.socketId);
            }
        });
    }


    async function closeWs() {
        const instance = networkStore.wsMap.get(roomId);
        instance?.close();
    }

    async function closeRtc() {
        networkStore.rtcMap.forEach((rtc) => {
            rtc.close();
        });
    }

    async function initPush() {
        // 跳转到指定房间
        router.push({ query: { ...route.query, roomId: roomId } });
        // 获取媒体设备信息
        const all = await getAllMediaDevices();
        allMediaTypeList[MediaTypeEnum.camera] = {
            txt: all.find((item) => item.kind === 'videoinput')?.label || '摄像头',
            type: MediaTypeEnum.camera,
        };
        // 连接WebSocket
        webSocketInit()

        //  监听视频流的加载状态 
        localVideoRef.value?.addEventListener('loadstart', () => {
            console.warn('视频流-loadstart');
            const rtc = networkStore.getRtcMap(roomId);
            if (!rtc) return;
            rtc.rtcStatus.loadstart = true;
            rtc.update();
        });

        localVideoRef.value?.addEventListener('loadedmetadata', () => {
            console.warn('视频流-loadedmetadata');
            const rtc = networkStore.getRtcMap(roomId);
            if (!rtc) return;
            rtc.rtcStatus.loadedmetadata = true;
            rtc.update();
            if (isSRS) return;
            if (joined.value) {
                batchSendOffer();
            }
        });
    }


    return {
        initPush,
        getSocketId,
        currMediaTypeList,
        liveUserList,
        startGetDisplayMedia,
        startGetUserMedia,
        startDisabled,
        endDisabled,
        endLive,
        startLive,
        roomName,
        confirmRoomName,
        closeWs,
        closeRtc,
        chat,
        chatList,
        sendMessage,
    };
}
