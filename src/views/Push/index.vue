<template>
    <div class="webrtc-push-wrap">
        <div ref="topRef" class="left">
            <div class="video-wrap">
                <vue-danmaku v-model:danmus="chatList" isSuspend v-bind="config">
                    <video id="localVideo" ref="localVideoRef" autoplay muted controls></video>
                    <!-- 弹幕slot -->
                    <template v-slot:dm="{ danmu }">
                        <div class="danmu-item">
                            <span :style="{ color: `${danmu.color}`}">{{ danmu.msg }}</span>
                        </div>
                    </template>
                </vue-danmaku>
                <div v-if="(!currMediaTypeList) || (currMediaTypeList.length <= 0)" class="add-wrap">
                    <el-button class="item" type="primary" @click="startGetUserMedia">
                        摄像头
                    </el-button>
                    <el-button class="item" type="primary" @click="startGetDisplayMedia">
                        屏幕
                    </el-button>
                </div>
            </div>
            <div ref="bottomRef" class="control">
                <div class="info">
                    <div class="avatar" :style="{ backgroundImage: `url(${userStore.userInfo?.avatar})` }"></div>
                    <div class="detail">
                        <div class="top">
                            <el-input v-model="roomName" size="small" placeholder="输入房间名" :style="{ width: '50%' }"
                                />
                            <el-button size="small" type="primary" @click="confirmRoomName">
                                确定
                            </el-button>
                        </div>
                        <div class="bottom">
                            <span>socketId：{{ getSocketId() }}</span>
                        </div>
                    </div>
                </div>
                <div class="other">
                    <div class="top">
                        <span class="item">
                            <i class="ico"></i>
                            <span>正在观看人数：{{ liveUserList.length }}</span>
                        </span>
                    </div>
                    <div class="bottom">
                        <el-button class="item" type="primary" @click="startLive" :disabled="startDisabled">
                            开始直播
                        </el-button>
                        <el-button class="item" type="primary" @click="endLive" :disabled="endDisabled">
                            结束直播
                        </el-button>
                    </div>
                </div>
            </div>
        </div>
        <div class="right">
            <div class="resource-card">
                <div class="title">素材列表</div>
                <div class="list">
                    <div v-for="(item, index) in currMediaTypeList" :key="index" class="item">
                        <span class="name">{{ item.txt }}</span>
                    </div>
                </div>
            </div>
            <div class="danmu-card">
                <div class="title">弹幕互动</div>
                <div class="list-wrap" ref="chatRef">
                    <div class="list">
                        <div v-for="(item, index) in chatList" :key="index" class="item">
                            <template v-if="item.msgType === ChatEnum.chat">
                                <span class="name">{{ item.socketId }}：</span>
                                <span class="msg">{{ item.msg }}</span>
                            </template>
                            <template v-else-if="item.msgType === ChatEnum.otherJoin">
                                <span class="name system">系统通知：</span>
                                {{ item }}
                                <span class="msg">{{ item.username }}进入直播！</span>
                            </template>
                            <template v-else-if="item.msgType === ChatEnum.userLeaved">
                                <span class="name system">系统通知：</span>
                                <span class="msg">{{ item.socketId }}离开直播！</span>
                            </template>
                        </div>
                    </div>
                </div>
                <div class="send-msg">
                    <input v-model="chat" class="ipt" />
                    <n-button type="info" size="small" @click="sendMessage">
                        发送
                    </n-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ChatEnum, liveTypeEnum } from '@/types';
import { onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import vueDanmaku from 'vue3-danmaku'

const route = useRoute();
const userStore = useUserStore();

const topRef = ref<HTMLDivElement>();
const bottomRef = ref<HTMLDivElement>();
const localVideoRef = ref<HTMLVideoElement>();
const liveType = route.query.liveType;
const chatRef = ref<HTMLDivElement | null>(null)


const config = reactive({
    useSlot: true, // 是否开启slot
    loop: false, // 是否开启弹幕循环
    speeds: 200, // 弹幕速度，实际为弹幕滚动完一整屏的秒数，值越小速度越快
    fontSize: 20, // 文本模式下的字号
    top: 10, // 弹幕轨道间的垂直间距
    right: 0, // 同一轨道弹幕的水平间距
    debounce: 100, // 弹幕刷新频率（多少毫秒插入一条弹幕，建议不小于50）
    randomChannel: true, // 随机弹幕轨道
})

const {
    initPush,
    getSocketId,
    currMediaTypeList,
    liveUserList,
    startGetDisplayMedia,
    startGetUserMedia,
    startLive,
    endLive,
    roomName,
    startDisabled,
    endDisabled,
    confirmRoomName,
    closeWs,
    closeRtc,
    chat,
    chatList,
    sendMessage
} = usePush({
    localVideoRef,
    isSRS: liveType === liveTypeEnum.srsPush,
});

onMounted(() => {
    initPush();
    if (topRef.value && bottomRef.value && localVideoRef.value) {
        const res =
            bottomRef.value.getBoundingClientRect().top -
            topRef.value.getBoundingClientRect().top;
        localVideoRef.value.style.height = `${res}px`;
    }
});

onUnmounted(() => {
    closeWs();
    closeRtc();
});

watch(chatList, () => nextTick(() => chatRef.value!.scrollTop = chatRef.value?.scrollHeight!), { deep: true})
</script>

<style lang="scss" scoped>
.webrtc-push-wrap {
    margin: 20px auto 0;
    min-width: $large-width;
    height: 700px;
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
        width: 240px;
        height: 100%;
        border-radius: 6px;
        background-color: white;
        color: #9499a0;

        .resource-card {
            box-sizing: border-box;
            margin-bottom: 5%;
            margin-bottom: 10px;
            padding: 10px;
            width: 100%;
            height: 290px;
            border-radius: 6px;
            background-color: papayawhip;

            .title {
                text-align: initial;
            }

            .item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin: 5px 0;
                font-size: 12px;
            }
        }

        .danmu-card {
            box-sizing: border-box;
            padding: 10px;
            width: 100%;
            height: 400px;
            border-radius: 6px;
            background-color: papayawhip;
            text-align: initial;

            .title {
                margin-bottom: 10px;
            }

            .list-wrap {
                overflow-y: scroll;
            }

            .list {
                margin-bottom: 10px;
                height: 300px;

                .item {
                    margin-bottom: 10px;
                    font-size: 12px;

                    .name {
                        color: #9499a0;
                    }

                    .msg {
                        color: #61666d;
                    }
                }
            }

            .send-msg {
                display: flex;
                align-items: center;
                box-sizing: border-box;

                .ipt {
                    display: block;
                    box-sizing: border-box;
                    margin: 0 auto;
                    margin-right: 10px;
                    padding: 10px;
                    width: 80%;
                    height: 30px;
                    outline: none;
                    border: 1px solid hsla(0, 0%, 60%, 0.2);
                    border-radius: 4px;
                    background-color: #f1f2f3;
                    font-size: 14px;
                }
            }
        }
    }
}

// 屏幕宽度小于$large-width的时候
@media screen and (max-width: $large-width) {
    .webrtc-push-wrap {
        .left {
            width: $medium-left-width;
        }

        .right {
            .list {
                .item {}
            }
        }
    }
}
</style>
  