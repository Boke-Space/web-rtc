<template>
    <div>
        Pull
    </div>
</template>

<script setup lang="ts">

const route = useRoute();
const liveType = route.query.liveType

const topRef = ref<HTMLDivElement>();
const bottomRef = ref<HTMLDivElement>();
const localVideoRef = ref<HTMLVideoElement>();

</script>

<style lang="scss" scoped>
.srs-webrtc-pull-wrap {
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
        background-color: white;
        color: #9499a0;
        vertical-align: top;
        overflow: hidden;

        .head {
            display: flex;
            justify-content: space-between;
            padding: 20px;
            background-color: papayawhip;

            .tag {
                display: inline-block;
                margin-right: 5px;
                padding: 1px 4px;
                border: 1px solid;
                border-radius: 2px;
                color: #9499a0;
                font-size: 12px;
            }

            .info {
                display: flex;
                align-items: center;
                text-align: initial;

                .avatar {
                    margin-right: 20px;
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    background-color: skyblue;
                }

                .detail {
                    .top {
                        margin-bottom: 10px;
                        color: #18191c;
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

        .video-wrap {
            position: relative;
            background-color: #18191c;

            #localVideo {
                max-width: 100%;
                max-height: 100%;
            }

            .controls {
                display: none;
            }

            &:hover {
                .controls {
                    display: block;
                }
            }
        }

        .gift {
            position: absolute;
            right: 0;
            bottom: 0;
            left: 0;
            display: flex;
            align-items: center;
            justify-content: space-around;
            height: 100px;
            background-color: papayawhip;

            .item {
                margin-right: 10px;
                text-align: center;

                .ico {
                    width: 50px;
                    height: 50px;
                    background-color: skyblue;
                }

                .name {
                    color: #18191c;
                    font-size: 12px;
                }

                .price {
                    color: #9499a0;
                    font-size: 12px;
                }
            }
        }
    }

    .right {
        position: relative;
        display: inline-block;
        box-sizing: border-box;
        margin-left: 10px;
        min-width: 300px;
        height: 100%;
        border-radius: 6px;
        background-color: papayawhip;
        color: #9499a0;

        .tab {
            display: flex;
            align-items: center;
            justify-content: space-evenly;
            padding: 5px 0;
            font-size: 12px;
        }

        .user-list {
            overflow-y: scroll;
            padding: 0 15px;
            height: 100px;
            background-color: papayawhip;

            .item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 12px;

                .info {
                    display: flex;
                    align-items: center;

                    .avatar {
                        margin-right: 5px;
                        width: 25px;
                        height: 25px;
                        border-radius: 50%;
                        background-color: skyblue;
                    }

                    .username {
                        color: black;
                    }
                }
            }
        }

        .danmu-list {
            overflow-y: scroll;
            padding: 0 15px;
            height: 450px;
            text-align: initial;

            .item {
                margin-bottom: 10px;
                font-size: 12px;

                .name {
                    color: #9499a0;

                    &.system {
                        color: red;
                    }
                }

                .msg {
                    color: #61666d;
                }
            }
        }

        .send-msg {
            position: absolute;
            bottom: 15px;
            box-sizing: border-box;
            padding: 0 10px;
            width: 100%;

            .ipt {
                display: block;
                box-sizing: border-box;
                margin: 0 auto;
                padding: 10px;
                width: 100%;
                height: 60px;
                outline: none;
                border: 1px solid hsla(0, 0%, 60%, 0.2);
                border-radius: 4px;
                background-color: #f1f2f3;
                font-size: 14px;
            }

            .btn {
                box-sizing: border-box;
                margin-top: 10px;
                margin-left: auto;
                padding: 5px;
                width: 80px;
                border-radius: 4px;
                background-color: skyblue;
                color: white;
                text-align: center;
                font-size: 12px;
                cursor: pointer;
            }
        }
    }
}

// 屏幕宽度小于$large-width的时候
@media screen and (max-width: $large-width) {
    .srs-webrtc-pull-wrap {
        .left {
            width: $medium-left-width;
        }

        .right {
            .list {
                .item {
                    width: 150px;
                    height: 80px;
                }
            }
        }
    }
}</style>