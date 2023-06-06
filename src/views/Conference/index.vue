<template>
    <div class="webrtc-push-wrap">
        <div ref="topRef" class="left">
            <div class="video-wrap">
                <video id="localVideo" ref="localVideoRef" autoplay muted controls></video>
                <div class="add-wrap">
                    <!-- <el-button class="item" type="primary" @click="startGetUserMedia">
                        摄像头
                    </el-button> -->
                    <el-button class="item" type="primary" @click="startGetDisplayMedia">
                        屏幕
                    </el-button>
                </div>
            </div>
            <div ref="bottomRef" class="control">
                <div class="info">
                    <div class="avatar"></div>
                    <div class="detail">
                        <div class="top">
                            <el-input v-model="roomName" size="small" placeholder="输入房间名" :style="{ width: '50%' }" />
                            <!-- <el-button size="small" type="primary" @click="confirmRoomName">
                                确定
                            </el-button> -->
                        </div>
                        <!-- <div class="bottom">
                            <span>socketId：{{ getSocketId() }}</span>
                        </div> -->
                    </div>
                </div>
                <div class="other">
                    <div class="top">
                        <!-- <span class="item">
                            <i class="ico"></i>
                            <span>正在观看人数：{{ liveUserList.length }}</span>
                        </span> -->
                    </div>
                    <div class="bottom">
                        <!-- <el-button class="item" type="primary" @click="startLive" :disabled="startDisabled">
                            共享屏幕
                        </el-button>
                        <el-button class="item" type="primary" @click="endLive" :disabled="endDisabled">
                            结束共享
                        </el-button> -->
                    </div>
                </div>
            </div>
        </div>
        <div class="right">
            <div class="list">
                <div class="item" v-for="item of otherList" :key="item.socketId">
                    <div class="border"></div>
                    <div class="triangle"></div>
                    <div class="txt">{{ item.socketId }}</div>
                    <video :id="item.socketId" style="width: 100%;height:100%" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ChatEnum, liveTypeEnum } from '@/types';
import { SRSWebRTCClass } from '@/utils/srsWebRtc';
import { getRandomString } from 'billd-utils';
import { onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const userStore = useUserStore();
const roomId = getRandomString(15)
const roomName = ref('')

const topRef = ref<HTMLDivElement>();
const bottomRef = ref<HTMLDivElement>();
const localVideoRef = ref<HTMLVideoElement>();
const liveType = route.query.liveType;
const chatRef = ref<HTMLDivElement | null>(null)
const localStream = ref()

// 是否会议创建人
const isCreate = ref(false)

const {
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
} = useConference(roomId, true)

onMounted(() => {
    webSocketInit()
    if (topRef.value && bottomRef.value && localVideoRef.value) {
        const res =
            bottomRef.value.getBoundingClientRect().top -
            topRef.value.getBoundingClientRect().top;
        localVideoRef.value.style.height = `${res}px`;
    }
});

async function startGetDisplayMedia() {
    const res = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
    });
    localStream.value = res
    setDomVideoStream("localVideo", res);
    const { data } = await fetchLiveByIdApi(roomId)
    if (data == null) isCreate.value = true
    webSocketInit()
    await getPushSdp(localStream.value);
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
