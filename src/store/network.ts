import type { WebRTCClass } from "@/utils/webRtc";
import type { WebSocketClass } from "@/utils/webSocket";

type State = {
    wsMap: Map<string, WebSocketClass>;
    rtcMap: Map<string, WebRTCClass>;
    fromUserMap: Map<string, string>;
};

export const useNetworkStore = defineStore({
    id: 'network',
    state: (): State => {
        return {
            wsMap: new Map(),
            rtcMap: new Map(),
            fromUserMap: new Map(),
        };
    },
    actions: {
        updateWsMap(roomId: string, arg: any) {
            const val = this.wsMap.get(roomId);
            if (val) {
                this.wsMap.set(roomId, { ...val, ...arg });
            } else {
                this.wsMap.set(roomId, arg);
            }
        },
        updateRtcMap(roomId: string, arg: any) {
            const val = this.rtcMap.get(roomId);
            if (val) {
                this.rtcMap.set(roomId, { ...val, ...arg });
            } else {
                this.rtcMap.set(roomId, arg);
            }
        },
        updateFromUserMap(socketId: string, data: any) {
            this.fromUserMap.set(socketId, data);
        },
        getRtcMap(roomId: string) {
            return this.rtcMap.get(roomId);
        },
    },
})
