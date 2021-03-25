// ==UserScript==
// @name 视频拦截器
// @namespace https://github.com/592767809
// @author yu ge
// @version 0.1
// @match *://v.youku.com/*
// @match *://v.qq.com/*
// @match *://www.iqiyi.com/*
// @run-at document-start
// @require https://unpkg.com/ajax-hook@2.0.0/dist/ajaxhook.min.js
// ==/UserScript==

var videotitle, m3u8url, m3u8text, videoid, bid;

var storage = {
    // 通用
    addr: "http://127.0.0.1:7809",
    cbFn: {},
};

var handler = {
    'v.youku.com': function () {
        jsonpHook("mtop.youku.play.ups.appinfo.get", youkucb);
    },
    'v.qq.com': function () {
        ajaxHook({
            onreadystatechange: function(xhr) {
                if (xhr.readyState === 4 && xhr.responseURL === "https://vd.l.qq.com/proxyhttp"){
                    var responsedata = JSON.parse(xhr.responseText);
                    if (responsedata.vinfo){
                        responsedata = JSON.parse(responsedata.vinfo);
                        videotitle = responsedata.vl.vi[0].ti;
                        if (responsedata.vl.vi[0].hasOwnProperty('ckc')){
                            console.log("加密视频")
                        }else {
                            console.log("非加密视频");
                            videoid = parseInt(responsedata.vl.vi[0].keyid.split('.')[1]);
                            bid = "";
                            responsedata.fl.fi.forEach(function (items) {
                                if (items.id === videoid){
                                    bid = items.resolution
                                }
                            });
                            videotitle = videotitle + "_" + bid;
                            m3u8url = responsedata.vl.vi[0].ul.ui[3].url;
                            // console.log(videotitle);
                            // console.log(m3u8url);
                            posttopy({
                                "title": videotitle,
                                "m3u8url": m3u8url
                            })
                        }
                    }
                }
            }
        });
    },
    'www.iqiyi.com': function () {
        ajaxHook({
            onreadystatechange: function(xhr) {
                if (xhr.readyState === 4 && xhr.responseURL.includes("cache.video.iqiyi.com/dash")){
                    var responsedata = JSON.parse(xhr.responseText);
                    videotitle = document.title.indexOf("-") !== -1 ? document.title.substring(0, document.title.indexOf("-")) : document.title.replace(/\s/, "");
                    responsedata.data.program.video.forEach(function (items) {
                        if(items.hasOwnProperty('m3u8')){
                            m3u8text = items.m3u8;
                            if (m3u8text.includes("#EXTM3U")){
                                console.log("非加密视频");
                                // console.log(m3u8text);
                                // console.log(videotitle)
                                posttopy({
                                    "title": videotitle,
                                    "m3u8text": m3u8text
                                })
                            }else {
                                console.log("加密视频")
                            }
                        }
                    })
                }
            }
        });
    }
};

function youkucb(rs, url){
    if (rs.data.data.video.drm_type === "default"){
        console.log("非加密视频");
        try {
            videotitle = rs.data.data.show.stage;
            if (videotitle < 10){
                videotitle = '0' + videotitle
            }
            videotitle = rs.data.data.show.title + ' ' + videotitle
        }catch (e) {
            try {
                videotitle = rs.data.data.show.stage + ' ' + rs.data.data.video.title
            }catch (e) {
                videotitle = rs.data.data.video.title
            }
        }
        var videoslist = rs.data.data.stream;
        videoslist.sort(function (a, b) {
            return b.size - a.size
        });
        videotitle = videotitle + " " + videoslist[0].stream_type;
        m3u8url = videoslist[0].m3u8_url;
        posttopy({
            "title": videotitle,
            "m3u8url": m3u8url
        })
    }else if(rs.data.data.video.drm_type === "copyrightDRM"){
        console.log("加密视频")
    }else {
        console.log("加密视频")
    }
}


handler[window.location.host]();

function ajaxHook() {
    ah.hook(...arguments);
    unsafeWindow.XMLHttpRequest = XMLHttpRequest;
}

function jsonpHook(urlKey, cbFunc, options = {}) {
    var { cbParamName = 'callback', once = false, onMatch } = options;
    var handled = false;

    document.createElement = new Proxy(document.createElement, {
        apply: function(fn, thisArg, [tagName]) {

            var ele = fn.apply(thisArg, [tagName]);

            if (tagName.toLowerCase() === 'script') {
                setTimeout(() => {
                    if (ele.src.indexOf(urlKey) > 0) {
                        if (once && handled) return;
                        handled = true;
                        onMatch && onMatch(ele.src);

                        var cbName = ele.src.match(new RegExp(cbParamName + '=([^&]+)'))[1];
                        if (!storage.cbFn[cbName]) {
                            storage.cbFn[cbName] = unsafeWindow[cbName];
                            Object.defineProperty(unsafeWindow, cbName, {
                                get: () => {
                                    if (!storage.cbFn[cbName]) {
                                        return undefined;
                                    }
                                    return (rs) => {
                                        try {
                                            cbFunc(rs, ele.src);
                                        } catch (e) {}
                                        storage.cbFn[cbName](rs);
                                    };
                                },
                                set: (fn) => {
                                    storage.cbFn[cbName] = fn;
                                }
                            });
                        }
                    }

                }, 0);
            }
            return ele;
        }
    });
}

function posttopy(postdata) {
    var xmlhttpyg7809 = new XMLHttpRequest();
    xmlhttpyg7809.open("POST", "http://127.0.0.1:7809", true);
    xmlhttpyg7809.send(JSON.stringify(postdata));
}