const stroageKey = "KinerSwitchHostConfig";
const KinerSwitchHostGlobalConfig = "KinerSwitchHostGlobalConfig";
let oldConfig = [];
let info = {};
let isOpen = false;

/**
 * 设置本地存储
 * @param key
 * @param val
 * @param cb
 */
function storageSet(key, val, cb){
    chrome.storage.local.set({[key]: val}, cb);
}

/**
 *
 * @param key           string[]            key数组，可同时传多个key获取多个数据
 * @param defaultVal    any                 默认值，若是获取不到时返回默认值
 * @param cb            (result)=>void      result是一个对象，如传入的key为["key1","key2"],那么返回的result为{"key1": {}, "key2": {}}
 */
function storageGet(key, defaultVal, cb){
    const realKey = Array.isArray(key)?key:[key];
    chrome.storage.local.get(realKey, function (result) {
        cb && cb(result);
    });
}

/**
 *
 * @param key           string              获取单个本地存储的值
 * @param defaultVal    any                 默认值，获取不到则返回这个值
 * @param cb            (result)=>void      result为获取到的目标值
 */
function storageGetSimple(key, defaultVal, cb){
    storageGet([key], {}, function (result) {
        if(result && result[key]){
            cb && cb(result[key]);
        }else{
            cb && cb(defaultVal);
        }
    })
}

/**
 * 实现PAC代理的方法
 * @param hostsList     host配置列表
 */
function proxy(hostsList) {
    let condition = ``;
    hostsList.forEach(item => {
        if (item.isOpen&&item.domain) {
            const realDomain = item.domain.replace(/\./g, "\\.");
            // TODO 解决https的代理问题
            condition += `
                if(shExpMatch(url, 'http:\/\/${realDomain}*')){
                    return 'PROXY ${item.ip}:80';
                }
		    `;
        }
    });
    const script = `var FindProxyForURL = function(url, host){
						${condition}
						return 'DIRECT'
					}
	`;

    const config = {
        mode: "pac_script",
        pacScript: {
            data: script
        }
    };

    chrome.proxy.settings.set({value: config, scope: 'regular'}, function () {});
}

/**
 * 初始化获取本地数据
 */
storageGet([KinerSwitchHostGlobalConfig, stroageKey], function (result) {
    info = {
        list: result[stroageKey],
        isOpen: result[KinerSwitchHostGlobalConfig]
    };
});

startListener();
function startListener(){
    // 监听消息
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

        sendResponse(info);

    });
}