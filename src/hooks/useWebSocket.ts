import type { IAdminIn, IOffer } from "@/types";
import { SocketMessage, SocketStatus } from "@/types/websocket";
import { WebSocketClass } from "@/utils/webSocket";

const networkStore = useNetworkStore();
const userStore = useUserStore();

function sendJoin(roomId: string) {
    const instance = networkStore.wsMap.get(roomId);
    if (!instance) return;
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

// WebSocket 发送加入房间发送消息，客户端加入房间时向服务器发送加入房间的请求。
export function useWebSocket(instance: WebSocketClass, roomId: string) {

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
        if (!instance) return;
        instance.status = SocketStatus.disconnect;
        instance.update();
    });

    // 当前所有在线用户
    instance.socketIo.on(SocketMessage.roomLiveing, (data: IAdminIn) => {
        console.log('【websocket】收到管理员正在直播', data);
        // if (isSRS && !isFlv) {
        //     startNewWebRtc();
        // }
    });

    // 当前所有在线用户
    instance.socketIo.on(SocketMessage.roomNoLive, (data: IAdminIn) => {
        console.log('【websocket】收到管理员不在直播', data);
        // roomNoLive.value = true;
        // closeRtc();
    });

    // 当前所有在线用户
    instance.socketIo.on(SocketMessage.liveUser, (data) => {
        console.log('【websocket】当前所有在线用户', data);
    });

    // 收到用户发送消息
    instance.socketIo.on(SocketMessage.message, (data) => {
        console.log('【websocket】收到用户发送消息', data);
    });

    // 用户加入房间
    instance.socketIo.on(SocketMessage.joined, (data) => {
        console.log('【websocket】用户加入房间完成', data);
        instance.send({ msgType: SocketMessage.getLiveUser });
    });

    // 其他用户加入房间
    instance.socketIo.on(SocketMessage.otherJoin, (data) => {
        console.log('【websocket】其他用户加入房间', data);
    });

    // 用户离开房间
    instance.socketIo.on(SocketMessage.leave, (data) => {
        console.log('【websocket】用户离开房间', data);
        if (!instance) return;
        instance.socketIo?.emit(SocketMessage.leave, {
            roomId: instance.roomId,
        });
    });

    // 用户离开房间完成
    instance.socketIo.on(SocketMessage.leaved, (data) => {
        console.log('【websocket】用户离开房间完成', data);
        if (!instance) return;
    });


}