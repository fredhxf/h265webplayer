var player, logcatbox = document.getElementsByName('logcatbox')[0],
    flvLoad = false,
    paused = false;
var audioElement = document.getElementsByName('ks-audio')[0];
var urlInput = document.getElementsByName('265urlinput')[0];
var canvas = document.getElementById('ks-display-canvas');
var videoElement = document.getElementsByName('videoElement')[0];
var domainUrl = location.origin;
var mutedEle = document.getElementsByClassName('ks-controls-muted')[0];
var loadingEle = document.getElementsByClassName('ks-loader')[0];
var currentEle = document.getElementsByClassName('ks-current')[0];
var durationEle = document.getElementsByClassName('ks-duration')[0];

audioElement.ontimeupdate = function () {
    var current = secondToDate(this.currentTime);
    currentEle.innerHTML = current;
}

function flv_load() {
    loadingEle.setAttribute('class', 'ks-loader show');
    if (typeof player !== "undefined") {
        if (player != null) {
            player.destroy();
            player = null;
        }
    }

    player = h265js.createPlayer({
        isLive: false,
        type: 'mp4'
    }, {
        maxLength4ToBeDecodeQueue: 7 + 30 * 30, //待解码NALU队列最大长度 (fps * s) 7 + 30 * 30
        maxLength4ToBeRenderQueue: 200, //待渲染frame队列最大长度 (720p每帧2M，1080p每帧3M) 200
        enableYUVrender: true,
        enableSkipFrame: true,
        disableStreamLoader: false,
        lazyLoadMaxDuration: 3 * 60,
        seekType: 'range',
        wasmFilePath: 'https://github.com/ksvc/h265webplayer/libqydecoder.wasm',
        url: urlInput.value,
        timeToDecideWaiting: 50000, //暂停多久算卡顿, 默认500ms
        // decodingCapacityInadequateDuration: 10,  //解码能力不足持续的时间，默认10s
        // threshold4decodingCamacityIndequte: 0.8,     //实际fps统计值／码流fps < threshold4decodingCamacityIndequte, 持续decodingCapacityInadequateDuration秒，则判定为解码能力不足
        bufferTime: 0 //启播前缓冲视频时长（ms）
    }, {
        audioElement: audioElement,
        canvas: canvas,
        videoElement: videoElement
    });

    if (player) {

        player.on(h265js.Events.READY, function (event, data) {
            // console.warn('ready: ', event, data);
            flvLoad = true;
            paused = false;
            player.load();
            //safari浏览器audio标签需要主动触发才可播放
            // if (browser_detect('safari')) {
            //     player.play();
            // }

            // for (event in h265js.Events) {
            //     player.on(h265js.Events[event], function(e, data) {
            //         console.log(data);
            //         if (h265js.Events[event] == h265js.Events.ERROR && data) {
            //             console.log(data.type, data.detail, data.info);
            //         }
            //     });
            // }
        });

        // player.on(h265js.Events.LOADSTART, function(event, data){
        //     console.log('loadStart: ', event, data);
        // });
        player.on(h265js.Events.MEDIAINFO, function (event, data) {
            loadingEle.setAttribute('class', 'ks-loader hide');
            var duration = secondToDate(data.audioDuration);
            durationEle.innerHTML = duration;
            console.warn('mediaInfo: ', data);
        });
        // player.on(h265js.Events.VOLUMECHANGE, function(event, data){
        //     console.log('volumechange: ', event, data);
        // });
        player.on(h265js.Events.ERROR, function (event, data) {
            console.warn('error: ', event, data.type, data.detail, data.info, data.info.code, data.info.msg);
        });
        // player.on(h265js.Events.WARNING, function(event, data){
        //     console.warn('warning: ', event, data);
        // });
        // player.on(h265js.Events.STATISTICSINFO, function(event, data){
        //     console.log('statisticsInfo: ', event, data);
        // });
        // player.on(h265js.Events.WAITING, function(event, data){
        //     console.warn('waiting: ', event, data);
        // });
        player.on(h265js.Events.PLAYING, function (event, data) {
            // console.warn('playing: ', event, data);
            let isHide = loadingEle.getAttribute('class');
            if (isHide === 'ks-loader show') {
                loadingEle.setAttribute('class', 'ks-loader hide');
            }
        });

        // player.on(h265js.Events.LOADEDEND, function(event, data){
        //     console.log('loadedEnd: ', event, data);
        // });
        // player.on(h265js.Events.PLAY, function(event, data){
        //     console.log('play: ', event, data);
        // });
        // player.on(h265js.Events.PAUSE, function(event, data){
        //     console.log('pause: ', event, data);
        // });
        // player.on(h265js.Events.RELOAD, function(event, data){
        //     console.warn('reload: ', event, data);
        // });
        // player.on(h265js.Events.ENDED, function(event, data){
        //     console.warn('ended');
        // });

        // setInterval(function(){
        //     console.log('===========change canvas size===========');
        //     player.updateCanvasSize(Number((Math.random() * 1000).toFixed(0)));
        // },10000);
    }
}

function flv_start() {
    if (player) {
        player.play();
    }
}

function flv_pause() {
    if (player) {
        player.pause();
        paused = true;
    }
}

function flv_destroy() {
    if (player) {
        setTimeout(function () {
            player.destroy();
            player = null;
        }, 500);
    }
    flvLoad = false;
}

function flv_seekto() {
    loadingEle.setAttribute('class', 'ks-loader show');
    var input = document.getElementsByName('ks-seek-to')[0];
    player.currentTime = parseFloat(input.value);
}

function muted() {
    var type = mutedEle.getAttribute('data-type');
    switch (type) {
        case 'muted':
            mutedEle.setAttribute('data-type', 'unmuted');
            mutedEle.innerHTML = 'Unmuted';
            audioElement.muted = true;
            break;
        case 'unmuted':
            mutedEle.setAttribute('data-type', 'muted');
            mutedEle.innerHTML = 'Muted';
            audioElement.muted = false;
            break;
        default:
    }
}

function getUrlParam(key, defaultValue) {
    var pageUrl = window.location.search.substring(1);
    var pairs = pageUrl.split('&');
    for (var i = 0; i < pairs.length; i++) {
        var keyAndValue = pairs[i].split('=');
        if (keyAndValue[0] === key) {
            return keyAndValue[1];
        }
    }
    return defaultValue;
}

function browser_detect(name) {
    // Opera 8.0+
    var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

    // Firefox 1.0+
    var isFirefox = typeof InstallTrigger !== 'undefined';

    // Safari 3.0+ "[object HTMLElementConstructor]"
    var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) {
        return p.toString() === "[object SafariRemoteNotification]";
    })(!window['safari'] || safari.pushNotification);

    // Internet Explorer 6-11
    var isIE = /*@cc_on!@*/ false || !!document.documentMode;

    // Edge 20+
    var isEdge = !isIE && !!window.StyleMedia;

    // Chrome 1+
    var isChrome = !!window.chrome && !!window.chrome.webstore;

    // Blink engine detection
    var isBlink = (isChrome || isOpera) && !!window.CSS;

    switch (name) {
        case 'safari':
            return isSafari;
        case 'chrome':
            return isChrome;
        case 'opera':
            return isOpera;
        case 'firefox':
            return isFirefox;
        default:
            return '请输入要检测的浏览器名称';
    }
}

// h265js.LoggingControl.addLogListener(function(type, str) {
//     logcatbox.value = logcatbox.value + str + '\n';
//     logcatbox.scrollTop = logcatbox.scrollHeight;
// });

document.addEventListener('DOMContentLoaded', function () {
    // flv_load();
});

// 各种浏览器兼容
var state, visibilityChange;
if (typeof document.hidden !== "undefined") { //normal
    visibilityChange = "visibilitychange";
    state = "visibilityState";
} else if (typeof document.mozHidden !== "undefined") { //moz
    visibilityChange = "mozvisibilitychange";
    state = "mozVisibilityState";
} else if (typeof document.msHidden !== "undefined") { //ms
    visibilityChange = "msvisibilitychange";
    state = "msVisibilityState";
} else if (typeof document.webkitHidden !== "undefined") { //webkit
    visibilityChange = "webkitvisibilitychange";
    state = "webkitVisibilityState";
}

// document.addEventListener(visibilityChange, function() {
//     if (!browser_detect('opera')) {
//         if (document[state] === "visible") {
//             if (flvLoad) {
//                 flv_load();
//             }
//         } else {
//             if (flvLoad) {
//                 flv_destroy();
//                 flvLoad = true;
//             }
//         }
//     }
// });
// document.addEventListener('DOMContentLoaded', function () {
//     flv_load();
// });

//秒数转时分秒格式（ 00:00:00 ）
function secondToDate(result) {
    let h = Math.floor(result / 3600) < 10 ? '0' + Math.floor(result / 3600) : Math.floor(result / 3600);
    let m = Math.floor((result / 60 % 60)) < 10 ? '0' + Math.floor((result / 60 % 60)) : Math.floor((result / 60 % 60));
    let s = Math.floor((result % 60)) < 10 ? '0' + Math.floor((result % 60)) : Math.floor((result % 60));
    return result = h + ":" + m + ":" + s;
}