/*
 * @Author: HuYanan
 * @Date: 2021-05-13 18:08:50
 * @LastEditTime: 2021-05-14 00:11:45
 * @LastEditors: HuYanan
 * @Description: 
 * @Version: 0.0.1
 * @FilePath: /wx-version-download/main.js
 * @Contributors: [HuYanan, other]
 */

// https://dldir1.qq.com/weixin/android/weixin673android1360.apk
// https://dldir1.qq.com/weixin/android/weixin700android1380_arm64.apk 不管用
// https://dldir1.qq.com/weixin/android/weixin708android1540_arm64.apk 不管用
// https://dldir1.qq.com/weixin/android/weixin709android1560_arm64.apk
// https://dldir1.qq.com/weixin/android/weixin7010android1580_arm64.apk
// https://dldir1.qq.com/weixin/android/weixin7018android1740_arm64.apk
// https://dldir1.qq.com/weixin/android/weixin7019android1760_arm64.apk
// https://dldir1.qq.com/weixin/android/weixin7020android1780_arm64.apk
// https://dldir1.qq.com/weixin/android/weixin709android1560_arm64.apk

const https  = require("https");
const fs = require('fs');

class WxVersion {
  maxVersion = 810
  constructor(numVersion, formatVersion) {
    // console.log(numVersion, formatVersion);
    this.numVersion = numVersion;
    this.strVersion = String(numVersion);
    this.formatVersion = formatVersion || this.formatVersion(this.strVersion);
  }

  formatVersion(strVersion) {

    const firstVersion = strVersion.substr(0, 1);
    const middleVersion = strVersion.substr(1, 1);
    const lastVersion = strVersion.substring(2, strVersion.length);
    
    return [Number(firstVersion), Number(middleVersion), Number(lastVersion)];
  }

  getPrevWxVersion() {
    const [firstVersion, middleVersion, lastVersion] = this.formatVersion || formatWxVersion(numVersion);
    // console.log(firstVersion, middleVersion, lastVersion)
    let preLastVersion = lastVersion - 1;
    let preMiddleVersion = middleVersion;
    let preFirstVersion = firstVersion;
    if (preLastVersion < 0) {

      preMiddleVersion = middleVersion - 1;
      preLastVersion = 20
    }
    if (preMiddleVersion < 0) {
      preMiddleVersion = 0;
      preFirstVersion = preFirstVersion - 1;
      preMiddleVersion = 9;
      preLastVersion = 20;
    }
    // console.log(preFirstVersion, preMiddleVersion, preLastVersion)
    const numVersion = Number(`${preFirstVersion}${preMiddleVersion}${preLastVersion}`);
    const formatVersion = [preFirstVersion, preMiddleVersion, preLastVersion];
    return new WxVersion(numVersion, formatVersion);
  }

  getNextWxVersion () {
    const [firstVersion, middleVersion, lastVersion] = this.formatVersion || formatWxVersion(numVersion);
    // console.log(firstVersion, middleVersion, lastVersion)
    let preLastVersion = lastVersion + 1;
    let preMiddleVersion = middleVersion;
    let preFirstVersion = firstVersion;
    if (preLastVersion > 20) {
      preMiddleVersion = middleVersion + 1;
      preLastVersion = 0
    }
    if (preMiddleVersion > 9) {
      preFirstVersion = preFirstVersion + 1;
      preMiddleVersion = 0;
      preLastVersion = 0;
    }
    // console.log(preFirstVersion, preMiddleVersion, preLastVersion)
    const numVersion = Number(`${preFirstVersion}${preMiddleVersion}${preLastVersion}`);
    // if (numVersion === this.maxVersion) {
    //   return null;
    // }
    const formatVersion = [preFirstVersion, preMiddleVersion, preLastVersion];
    return new WxVersion(numVersion, formatVersion);
  }
}






function createUrls({
  startWexinVersion,
  endWeixinVersion,
  startAndroidVersion,
  endAndroidVersion
}) {
  console.log(startWexinVersion);
  const requestUrls = [];

  let wxVersion = new WxVersion(startWexinVersion);
  let androidVersion = startAndroidVersion;

  let maxLimit = 100;
  while (wxVersion.numVersion != endWeixinVersion && maxLimit > 0) {
    wxVersion = wxVersion.getPrevWxVersion();
    androidVersion = getPrevAndroidVersion(androidVersion);
    requestUrls.push(getDownLoadUrl(wxVersion, androidVersion));
    maxLimit--;
  }
  return requestUrls;
}

// 扫描所有微信版本的下载地址
async function getAllWxVersionDownloadUrl ({
  startWexinVersion,
  endWeixinVersion,
  startAndroidVersion,
  endAndroidVersion
}) {
  const rightUrls = [];
  const allUrls = createAllUrls({
    startWexinVersion,
    endWeixinVersion,
    startAndroidVersion,
    endAndroidVersion
  });
  // console.log(allUrls);

  let url = ''
  let count = 0;
  // for (let i = 0; i < allUrls.length; i++) {
  //   url = allUrls[i];
  //   // console.log(url);
  //   isRightUrl(url)
  //     .then((res) => {
  //       console.log(res);
  //       // if (res.flag) {
  //       //   console.log(url);
  //       //   rightUrls.push(url);
  //       // } else {
  //       //   console.log('404 '+ url);
  //       // }
  //     }).finally(() => {
  //       count++;
  //       if (count === i) {
  //         resolve(rightUrls);
  //       }
  //     });
  // }

  let res = null;
  for (let i = 0; i < allUrls.length; i++) {
    url = allUrls[i];
    try {
      res = await isRightUrl(url);
      if (res.flag) {
        console.log('200 '+ url);
        rightUrls.push(url);
      } else {
        console.log('404 '+ url);
      }
    } catch (error) {
      
    }
  }
  return rightUrls;
}

function createAllUrls ({
  startWexinVersion,
  endWeixinVersion,
  startAndroidVersion,
  endAndroidVersion
}) {
  const urls = [];
  const allWeixinVersion = getAllWxVersion(startWexinVersion, endWeixinVersion);
  const allAndroidVersion = getAllAndroidVersion(startAndroidVersion, endAndroidVersion);
  allWeixinVersion.forEach(wxVersion => {
    // console.log(wxVersion.numVersion);
    allAndroidVersion.forEach(androidVersion => {
      urls.push(getDownLoadUrl(wxVersion, androidVersion));
      urls.push(getArm64DownLoadUrl(wxVersion, androidVersion));
    })
  });
  // allAndroidVersion.forEach(androidVersion => {
  //   console.log(androidVersion);
  // });
  // console.log(allWeixinVersion.length, allAndroidVersion.length);
  
  return urls;
}

// 获取所有微信版本
function getAllWxVersion (startWexinVersion, endWeixinVersion) {
  const allWxVersion = [];
  let wxVersion = new WxVersion(startWexinVersion);
  allWxVersion.push(wxVersion);
  while (wxVersion.numVersion !== endWeixinVersion) {
    wxVersion = wxVersion.getNextWxVersion();
    allWxVersion.push(wxVersion);
  }

  // console.log(allWxVersion);
  return allWxVersion;
}

function getAllAndroidVersion (startAndroidVersion, endAndroidVersion) {
  const allAndroidVersion = [];
  let androidVersion = startAndroidVersion;
  allAndroidVersion.push(androidVersion);
  while (androidVersion !== endAndroidVersion) {
    androidVersion = getNextAndroidVersion(androidVersion);
    allAndroidVersion.push(androidVersion);
  }
  return allAndroidVersion;
}

// 批量请求
async function requestOneByOne ({
  startWexinVersion,
  endWeixinVersion,
  startAndroidVersion,
  endAndroidVersion
}) {
  let rightUrl = [];
  let isDone = false;
  let wxVersion = new WxVersion(startWexinVersion);
  let androidVersion = getPrevAndroidVersion(startAndroidVersion);
  let maxLimit = 10000;
  while (androidVersion !== endAndroidVersion || maxLimit > 0) {
    wxVersion = wxVersion.getPrevWxVersion();
    const url = getDownLoadUrl(wxVersion, androidVersion);
    const arm64Url = getArm64DownLoadUrl(wxVersion, androidVersion);
    let isRightUrlRes = await isRightUrl(url);
    if (isRightUrlRes.flag) {
      rightUrl.push(url);
      androidVersion = getPrevAndroidVersion(androidVersion);
    } else {
      isRightUrlRes = await isRightUrl(arm64Url);
      if (isRightUrlRes.flag) {
        rightUrl.push(arm64Url);
        androidVersion = getPrevAndroidVersion(androidVersion);
      }
    }
    maxLimit--;
  }
}

// 通过微信版本获取下载地址
async function getDownLoadUrlWithWxVersion (numWxVersion, startAndroidVersion) {
  // console.log('getDownLoadUrlWithWxVersion', numWxVersion);
  let isFinded = false;
  let wxVersion = new WxVersion(numWxVersion);
  let androidVersion = startAndroidVersion;
  let resUrl = ''
  while (!isFinded) {
    androidVersion = getPrevAndroidVersion(androidVersion);
    const url = getDownLoadUrl(wxVersion, androidVersion);
    const arm64Url = getArm64DownLoadUrl(wxVersion, androidVersion);
    let isRightUrlRes = await isRightUrl(url);
    if (isRightUrlRes.flag) {
      isFinded = true;
      resUrl = url;
    } else {
      isRightUrlRes = await isRightUrl(arm64Url);
      if (isRightUrlRes.flag) {
        isFinded = true;
        resUrl = arm64Url;
      }
    }
  }
  return resUrl;
}

function isRightUrl (url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (response) => {
      console.log(response.statusCode + ' ' + url);
      if (response.statusCode === 200) {
        req.destroy();
        resolve({flag: true});
      } else {
        resolve({flag: false});
      }
      // let todo = '';

      // // called when a data chunk is received.
      // response.on('data', (chunk) => {
      //   // console.log(chunk);
      //   todo += chunk;
      // });

      // // called when the complete response is received.
      // response.on('end', () => {
      //   // console.log(JSON.parse(todo).title);
      //   console.log(todo);
      // });

    }).on("error", (error) => {
      console.log("Error: " + error.message);
      reject({flag: false});
    });
  })
}

function getDownLoadUrl(wxVersion, androidVersion) {
  // return `https://dldir1.qq.com/weixin/android/weixin709android1560_arm64.apk`
  return `https://dldir1.qq.com/weixin/android/weixin${wxVersion.numVersion}android${androidVersion}.apk`;
}
function getArm64DownLoadUrl (wxVersion, androidVersion) {
  return `https://dldir1.qq.com/weixin/android/weixin${wxVersion.numVersion}android${androidVersion}_arm64.apk`;
}

function getPrevAndroidVersion(androidVersion) {
  return androidVersion - 20;
}

function getNextAndroidVersion(androidVersion){
  return androidVersion + 20;
}


async function main () {
  let startAndroidVersion = 1560;
  let endAndroidVersion = 1360;

  let startWexinVersion = 709;
  let endWeixinVersion = 673;

  let requestUrls = [];
  let successUrls = [];

  let res = null;
  

  // requestUrls = createUrls({
  //   startAndroidVersion,
  //   endAndroidVersion,
  //   startWexinVersion,
  //   endWeixinVersion
  // })
  // console.log(requestUrls);

  // 一个一个的请求
  // requestOneByOne({
  //   startAndroidVersion,
  //   endAndroidVersion,
  //   startWexinVersion,
  //   endWeixinVersion
  // });

  // const res = await isRightUrl('https://dldir1.qq.com/weixin/android/weixin709android1560_arm64.apk');
  // console.log(res);

  // 获取第一个版本的下载地址
  // res = await getDownLoadUrlWithWxVersion(641, 1360);
  // console.log(res);


  startWexinVersion = 600;
  endWeixinVersion = 900;
  startAndroidVersion = 1200;
  endAndroidVersion = 3000;

  // 全量扫描全部微信版本下载地址
  res = await getAllWxVersionDownloadUrl({
    startWexinVersion,
    endWeixinVersion,
    startAndroidVersion,
    endAndroidVersion
  });
  saveRightUrls(res);

  console.log(res);

  // saveRightUrls(['11', '22'])
}

// 写入文件
function saveRightUrls (urls) {
  fs.writeFile('./wxVersionDownloadUrls.json', JSON.stringify(urls), (error) => {
    if (error) throw error;
    console.log('文件已被保存');
  })
}

main();
