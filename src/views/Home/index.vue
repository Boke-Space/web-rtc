<template>
  <div class="home-wrap">
    <div class="left">
      <div class="cover" :style="{ backgroundImage: `url(${currentLiveRoom?.coverImg})` }"></div>
      <video v-if="currentLiveRoom?.flvUrl" ref="videoRef" id="localVideo" controls autoplay muted></video>
      <template v-if="currentLiveRoom">
        <div class="join-btn">
          <div v-if="currentLiveRoom?.streamUrl" class="btn webrtc" @click="joinRoom()">
            进入直播（webrtc）
          </div>
          <div v-if="currentLiveRoom?.flvUrl && currentLiveRoom?.isLive === 0" class="btn flv" @click="joinFlvRoom()">
            进入直播（flv）
          </div>
        </div>
      </template>
    </div>
    <div class="right">
      <div v-if="liveRoomList.length" class="list">
        <div v-for="(item, index) in liveRoomList" :key="index" @click="changeLive(item)"
          :class="{ item: 1, active: item.roomId === currentLiveRoom?.roomId }"
          :style="{ backgroundImage: `url(${item.coverImg})` }">
          <div class="border" :style="{
            opacity: item.roomId === currentLiveRoom?.roomId ? 1 : 0,
          }"></div>
          <div v-if="item.roomId === currentLiveRoom?.roomId" class="triangle"></div>
          <div class="txt">{{ item.roomName }}</div>
        </div>
      </div>
      <div v-else class="none">
        当前没有在线的直播间
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { liveTypeEnum } from '@/types';
import { SocketStatus } from '@/types/websocket';
import { getDanmuData } from '@/utils/danmu';
import { WebSocketClass } from '@/utils/webSocket';


export interface danmakuType {
  time: number,
  color: string,
  type: number,
  text: string,
}

const videoRef = ref<HTMLVideoElement>();
const liveRoomList = ref<any[]>([])
const currentLiveRoom = ref()
const router = useRouter();
const networkStore = useNetworkStore();

function changeLive(item: any) {
  const { pause } = useFlvPlay(currentLiveRoom.value?.flvUrl, videoRef.value!)
  pause()
  currentLiveRoom.value = item
  const { play } = useFlvPlay(currentLiveRoom.value?.flvUrl, videoRef.value!)
  play()
}

function joinRoom() {
  if (currentLiveRoom.value?.streamUrl) {
    router.push({
      path: `/pull/${currentLiveRoom.value?.roomId}`,
      query: {
        liveType: liveTypeEnum.srsWebrtcPull,
      },
    });
  } else {
    router.push({
      path: `/pull/${currentLiveRoom.value?.roomId}`,
      query: {
        liveType: liveTypeEnum.webrtcPull,
      },
    });
  }
}

function joinFlvRoom() {
  router.push({
    path: `/pull/${currentLiveRoom.value?.roomId}`,
    query: {
      liveType: liveTypeEnum.srsFlvPull,
    },
  });
}

const websocket = new WebSocketClass({
  roomId: 'home',
  url: 'http://192.168.192.131:3000',
  type: 'flv',
});
websocket.update();

const instance = networkStore.wsMap.get('home')!

instance!.socketIo!.on(SocketStatus.connect, () => {
  console.log('Home websocket连接成功');
  instance.socketIo?.emit('live')
  instance.status = SocketStatus.connect;
  instance.update();
});

instance!.socketIo!.on('live', (data: any[]) => {
  if (!currentLiveRoom.value) {
    currentLiveRoom.value = data[0];
    nextTick(() => {
      if (currentLiveRoom.value?.flvUrl) {
        const { play } = useFlvPlay(currentLiveRoom.value?.flvUrl, videoRef.value!)
        play()
      }
    });
  }
  liveRoomList.value = data;
});

instance!.socketIo!.on(SocketStatus.disconnect, () => {
  console.log('【websocket】websocket连接断开');
  instance.status = SocketStatus.disconnect;
  instance.update();
});

// onUnmounted(() => {
//   const { pause } = useFlvPlay(currentLiveRoom.value?.flvUrl, videoRef.value!, false)
//   pause()
// })

</script>

<style lang="scss" scoped>
.home-wrap {
  padding: 20px 0;
  min-width: $large-width;
  height: 610px;
  background-color: skyblue;
  text-align: center;

  .left {
    position: relative;
    display: inline-block;
    overflow: hidden;
    box-sizing: border-box;
    width: $large-left-width;
    height: 610px;
    border-radius: 4px;
    background-color: rgba($color: #000000, $alpha: 0.3);
    vertical-align: top;


    .cover {
      position: absolute;
      background-position: center center;
      background-size: cover;
      filter: blur(30px);

      inset: 0;
    }

    #localVideo {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .controls {
      display: none;
    }

    &:hover {
      .join-btn {
        display: inline-flex;
      }

      .controls {
        display: block;
      }
    }

    .join-btn {
      position: absolute;
      top: 50%;
      left: 50%;
      display: none;
      align-items: center;
      transform: translate(-50%, -50%);

      .btn {
        padding: 14px 26px;
        border: 2px solid rgba($color: skyblue, $alpha: 0.5);
        border-radius: 6px;
        background-color: rgba(0, 0, 0, 0.3);
        color: skyblue;
        font-size: 16px;
        cursor: pointer;

        &:hover {
          background-color: rgba($color: skyblue, $alpha: 0.5);
        }

        &.webrtc {
          margin-right: 10px;
        }

        &.flv {}
      }
    }
  }

  .right {
    display: inline-block;
    overflow: scroll;
    box-sizing: border-box;
    margin-left: 10px;
    padding: 12px;
    height: 610px;
    border-radius: 4px;
    background-color: rgba($color: #000000, $alpha: 0.3);
    vertical-align: top;

    .list {
      .item {
        position: relative;
        box-sizing: border-box;
        margin-bottom: 10px;
        width: 200px;
        height: 110px;
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

    .none {
      color: white;
      font-size: 14px;
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