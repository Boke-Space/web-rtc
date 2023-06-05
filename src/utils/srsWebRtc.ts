import browserTool from 'browser-tool';

import { useNetworkStore } from '@/store/network';

function prettierInfo(
  str: string,
  data: {
    browser: string;
  },
  type?: 'log' | 'warn' | 'error',
  ...args
) {
  console[type || 'log'](
    `${new Date().toLocaleString()}，${data.browser}浏览器，${str}`,
    ...args
  );
}

export class SRSWebRTCClass {
  roomId = '-1';
  videoEl;

  peerConnection: RTCPeerConnection | null = null;
  dataChannel: RTCDataChannel | null = null;

  candidateFlag = false;

  sender?: RTCRtpTransceiver;

  getStatsSetIntervalDelay = 1000;
  getStatsSetIntervalTimer;

  // getStatsSetIntervalDelay是1秒的话，forceINumsMax是3，就代表一直卡了3秒。
  forceINums = 0; // 发送forceI次数
  forceINumsMax = 3; // 最多发送几次forceI

  preFramesDecoded = -1; // 上一帧

  browser: {
    device: string;
    language: string;
    engine: string;
    browser: string;
    system: string;
    systemVersion: string;
    platform: string;
    isWebview: boolean;
    isBot: boolean;
    version: string;
  };

  rtcStatus = {
    joined: false,
    icecandidate: false,
    createOffer: false,
    setLocalDescription: false,
    answer: false,
    setRemoteDescription: false,
    addStream: false,
    loadstart: false,
    loadedmetadata: false,
  };

  localDescription: any;

  constructor({ roomId, videoEl }: { roomId: string, videoEl: HTMLVideoElement }) {
    this.roomId = roomId;
    this.videoEl = videoEl;
    this.browser = browserTool();
    this.createPeerConnection();
    this.update();
  }

  // 推流 音视频轨道添加到WebRTC连接中
  addTrack = ({ track, stream, direction }) => {
    console.log('addTrack', track.kind);
    this.sender = this.peerConnection?.addTransceiver(track, {
      streams: [stream],
      direction,
    });
    // this.peerConnection?.addTrack(track, stream);
  };

  // 拉流 本地媒体流添加到 peerConnection 中
  addStream = (stream) => {
    console.log('addStream');
    if (!this.peerConnection) return;
    this.rtcStatus.addStream = true;
    this.update();
    document.querySelector<HTMLVideoElement>('#localVideo')!.srcObject = stream;
  };

  // 监听 WebRTC视频流的事件
  initStreamEvent = () => {
    console.log(`开始监听pc的addstream`);

    // 拉流
    this.peerConnection?.addEventListener('addstream', (event: any) => {
      console.log(`pc收到addstream事件`);
      this.addStream(event.stream);
    });

    this.peerConnection?.addEventListener('ontrack', (event: any) => {
      console.log(`${this.roomId}，pc收到ontrack事件`, event);
      this.addStream(event.streams[0]);
    });
  };

  // 创建对等连接
  createPeerConnection = () => {
    if (!this.peerConnection) {
      this.peerConnection = new RTCPeerConnection();
      console.log('创建对等连接 RTCPeerConnection')
      this.startConnect();
      this.update();
    }
  };

  // 创建offer
  createOffer = async () => {
    if (!this.peerConnection) return;
    try {
      // SDP
      const description = await this.peerConnection.createOffer();
      this.localDescription = description;
      // 已成功创建Offer
      this.rtcStatus.createOffer = true;
      this.update();
      console.log('createOffer');
      return description;
    } catch (error) {
      console.log(error);
    }
  };

  // 设置本地描述
  setLocalDescription = async (description) => {
    if (!this.peerConnection) return;
    try {
      await this.peerConnection.setLocalDescription(description);
      this.rtcStatus.setLocalDescription = true;
      this.update();
      console.log('localDescription');
    } catch (error) {
      console.log(error);
    }
  };

  // 设置远端描述
  setRemoteDescription = async (description) => {
    if (!this.peerConnection) return;
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));
      this.rtcStatus.setRemoteDescription = true;
      this.update();
      console.log('remoteDescription');
    } catch (error) {
      console.log(error);
    }
  };

  // 创建连接
  startConnect = () => {
    if (!this.peerConnection) return;
    // 推流
    console.log(`开始监听pc的icecandidate`);

    // 收到 ICE 候选项
    this.peerConnection.addEventListener('icecandidate', (event) => {

    });

    this.initStreamEvent();

    // ICE 连接状态改变
    this.peerConnection.addEventListener(
      'iceconnectionstatechange',
      (event: any) => {
        // https://developer.mozilla.org/zh-CN/docs/Web/API/RTCPeerConnection/connectionState
        const iceConnectionState = event.currentTarget.iceConnectionState;
        console.log(
          'pc收到iceconnectionstatechange',
          `iceConnectionState:${iceConnectionState}`
        );
        if (iceConnectionState === 'connected') {
          // ICE 代理至少对每个候选发现了一个可用的连接，此时仍然会继续测试远程候选以便发现更优的连接。同时可能在继续收集候选。
          console.warn('iceConnectionState:connected', event);
        }
        if (iceConnectionState === 'completed') {
          // ICE 代理已经发现了可用的连接，不再测试远程候选。
          console.warn('iceConnectionState:completed', event);
        }
        if (iceConnectionState === 'failed') {
          // ICE 候选测试了所有远程候选没有发现匹配的候选。也可能有些候选中发现了一些可用连接。
          console.error('iceConnectionState:failed', event);
        }
        if (iceConnectionState === 'disconnected') {
          // 测试不再活跃，这可能是一个暂时的状态，可以自我恢复。
          console.error('iceConnectionState:disconnected', event);
        }
        if (iceConnectionState === 'closed') {
          // ICE 代理关闭，不再应答任何请求。
          console.error('iceConnectionState:closed', event);
        }
      }
    );

    // 连接状态改变
    this.peerConnection.addEventListener(
      'connectionstatechange',
      (event: any) => {
        const connectionState = event.currentTarget.connectionState;
        console.log(
          'pc收到connectionstatechange',
          // eslint-disable-next-line
          `connectionState:${connectionState}`
        );
        if (connectionState === 'connected') {
          // 表示每一个 ICE 连接要么正在使用（connected 或 completed 状态），要么已被关闭（closed 状态）；并且，至少有一个连接处于 connected 或 completed 状态。
          console.warn('connectionState:connected');
        }
        if (connectionState === 'disconnected') {
          // 表示至少有一个 ICE 连接处于 disconnected 状态，并且没有连接处于 failed、connecting 或 checking 状态。
          console.error('connectionState:disconnected');
        }
        if (connectionState === 'closed') {
          // 表示 RTCPeerConnection 已关闭。
          console.error('connectionState:closed');
        }
        if (connectionState === 'failed') {
          // 表示至少有一个 ICE 连接处于 failed 的状态。
          console.error('connectionState:failed');
        }
      }
    );
  };

  handleWebRtcError = () => {
    this.getStatsSetIntervalTimer = setInterval(() => {
      this.peerConnection
        ?.getStats()
        .then((res) => {
          let isBlack = false;
          let currFramesDecoded = -1;
          res.forEach((report: RTCInboundRtpStreamStats) => {
            // 不能结构report的值，不然如果卡主之后，report的值就一直都是
            // const { type, kind, framesDecoded } = report;
            const data = {
              type: report.type,
              kind: report.kind,
              framesDecoded: report.framesDecoded,
              decoderImplementation: report.decoderImplementation,
              isChrome: false,
              isSafari: false,
              other: '',
            };
            if (this.browser.browser === 'safari') {
              data.isSafari = true;
            } else if (this.browser.browser === 'chrome') {
              data.isChrome = true;
            } else {
              data.other = this.browser.browser;
            }
            const isStopFlag = this.getCurrentFramesDecoded(data);
            const isBlackFlag = this.isBlackScreen(data);
            if (isStopFlag !== false) {
              currFramesDecoded = isStopFlag;
            }
            if (isBlackFlag !== false) {
              isBlack = isBlackFlag;
            }
          });
          /** 处理视频流卡主 */
          const handleStreamStop = () => {
            if (this.preFramesDecoded === currFramesDecoded) {
              if (this.forceINums >= this.forceINumsMax) {
                prettierInfo(
                  '超过forceI次数，提示更换网络',
                  { browser: this.browser.browser },
                  'warn'
                );
                this.forceINums = 0;
              } else {
                this.forceINums += 1;
                prettierInfo(
                  `当前视频流卡主了，主动刷新云手机（${this.forceINums}/${this.forceINumsMax}）`,
                  { browser: this.browser.browser },
                  'warn'
                );
              }
            } else {
              this.forceINums = 0;
              // console.warn('视频流没有卡主');
            }
            this.preFramesDecoded = currFramesDecoded;
          };
          /** 处理黑屏 */
          const handleBlackScreen = () => {
            if (isBlack) {
              prettierInfo(
                '黑屏了',
                { browser: this.browser.browser },
                'error'
              );
            }
            // else {
            //   console.warn('没有黑屏');
            // }
          };
          /** 处理rtcStatus */
          const handleRtcStatus = () => {
            const res = this.rtcStatusIsOk();
            const length = Object.keys(res).length;
            if (length) {
              prettierInfo(
                `rtcStatus错误：${Object.keys(res).join()}`,
                { browser: this.browser.browser },
                'error'
              );
            }
            //  else {
            //   console.warn('rtcStatus正常');
            // }
          };
          handleStreamStop();
          handleBlackScreen();
          handleRtcStatus();
          // if (!networkStore.errorCode.length) {
          //   networkStore.setShowErrorModal(false);
          // }
        })
        .catch((err) => {
          console.error(new Date().toLocaleString(), 'getStatsErr', err);
          // networkStore.setErrorCode(frontendErrorCode.getStatsErr);
          // networkStore.setShowErrorModal(true);
        });
    }, this.getStatsSetIntervalDelay);
  };

  /** rtcStatus是否都是true了 */
  rtcStatusIsOk = () => {
    const res = {};
    const status = this.rtcStatus;
    Object.keys(status).forEach((key) => {
      if (!status[key]) {
        res[key] = false;
      }
    });
    return res;
  };

  /** 当前是否黑屏,true代表黑屏了，false代表没有黑屏 */
  isBlackScreen = ({
    type,
    kind,
    framesDecoded,
    decoderImplementation,
    isSafari = false,
    isChrome = false,
  }) => {
    // https://blog.csdn.net/weixin_44523653/article/details/127414387
    // console.warn(
    //   // eslint-disable-next-line
    //   `type:${type},kind:${kind},framesDecoded:${framesDecoded},decoderImplementation:${decoderImplementation}`
    // );
    if (isSafari) {
      if (
        type === 'inbound-rtp' &&
        kind === 'video' &&
        // framesDecoded等于0代表黑屏
        framesDecoded === 0
      ) {
        return true;
      }
    } else if (isChrome) {
      if (
        (type === 'track' || type === 'inbound-rtp') &&
        kind === 'video' &&
        // framesDecoded等于0代表黑屏
        framesDecoded === 0
      ) {
        return true;
      }
    } else {
      if (
        (type === 'track' || type === 'inbound-rtp') &&
        kind === 'video' &&
        // framesDecoded等于0代表黑屏
        framesDecoded === 0
      ) {
        // 安卓的qq浏览器适用这个黑屏判断
        return true;
      }
    }

    return false;
  };

  /** 获取当前帧 */
  getCurrentFramesDecoded = ({
    type,
    kind,
    framesDecoded = this.preFramesDecoded,
    isSafari = false,
    isChrome = false,
  }) => {
    if (isSafari) {
      if (type === 'inbound-rtp' && kind === 'video') {
        return framesDecoded;
      }
    } else if (isChrome) {
      if ((type === 'track' || type === 'inbound-rtp') && kind === 'video') {
        return framesDecoded;
      }
    } else {
      if ((type === 'track' || type === 'inbound-rtp') && kind === 'video') {
        // 安卓的qq浏览器适用这个卡屏判断
        return framesDecoded;
      }
    }
    return false;
  };

  // 手动关闭webrtc连接
  close = () => {
    console.log(`${new Date().toLocaleString()}，手动关闭webrtc连接`);
    if (this.sender?.sender) {
      this.peerConnection?.removeTrack(this.sender?.sender);
    }
    this.peerConnection?.close();
    this.dataChannel?.close();
    this.peerConnection = null;
    this.dataChannel = null;
    this.update();
  };

  // 更新store
  update = () => {
    const networkStore = useNetworkStore();
    networkStore.updateRtcMap(this.roomId, this);
  };
}
