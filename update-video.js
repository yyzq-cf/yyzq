const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UID = '519573454';
const HTML_PATH = path.join(__dirname, 'index.html');

// WBI 签名计算
function getWbiKey() {
    return new Promise((resolve, reject) => {
        https.get('https://api.bilibili.com/x/web-interface/nav', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.bilibili.com'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.data && json.data.wbi_img) {
                        const imgUrl = json.data.wbi_img.img_url;
                        const subUrl = json.data.wbi_img.sub_url;
                        resolve({
                            imgKey: imgUrl.split('/').pop().split('.')[0],
                            subKey: subUrl.split('/').pop().split('.')[0]
                        });
                    } else {
                        reject(new Error('Failed to get WBI keys'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function encWbi(params, imgKey, subKey) {
    const mixinKeyEncTab = [
        46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35,
        27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13,
        37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4,
        22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52
    ];
    
    const orig = imgKey + subKey;
    let temp = '';
    for (let i = 0; i < 64; i++) {
        temp += orig[mixinKeyEncTab[i]];
    }
    const mixinKey = temp.slice(0, 32);
    
    const wts = Math.floor(Date.now() / 1000);
    params.wts = wts;
    
    const paramsStr = Object.keys(params).sort().map(key => {
        return `${key}=${encodeURIComponent(params[key])}`;
    }).join('&');
    
    const w_rid = crypto.createHash('md5').update(paramsStr + mixinKey).digest('hex');
    
    return { ...params, w_rid };
}

// 获取B站最新视频
async function fetchLatestVideo() {
    const { imgKey, subKey } = await getWbiKey();
    
    const params = {
        mid: UID,
        ps: 1,
        pn: 1,
        order: 'pubdate'
    };
    
    const signedParams = encWbi(params, imgKey, subKey);
    const queryString = Object.keys(signedParams).map(key => {
        return `${key}=${encodeURIComponent(signedParams[key])}`;
    }).join('&');
    
    const url = `https://api.bilibili.com/x/space/wbi/arc/search?${queryString}`;
    
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://space.bilibili.com'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.code === 0 && json.data && json.data.list && json.data.list.vlist && json.data.list.vlist.length > 0) {
                        resolve(json.data.list.vlist[0]);
                    } else {
                        reject(new Error(json.message || 'No videos found'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// 更新HTML文件
function updateHTML(video) {
    let html = fs.readFileSync(HTML_PATH, 'utf8');
    
    const videoHTML = `
        <!-- 最新视频预览 -->
        <section class="latest-video">
            <h2>🎬 最新视频</h2>
            <div id="video-container">
                <div class="video-card">
                    <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin-bottom:15px;">
                        <iframe src="https://player.bilibili.com/player.html?bvid=${video.bvid}&page=1&high_quality=1" 
                            scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"
                            style="position:absolute;top:0;left:0;width:100%;height:100%;">
                        </iframe>
                    </div>
                    <h3>${video.title}</h3>
                    <p>📺 ${(video.play / 10000).toFixed(1)}万播放 · 💬 ${video.video_review}弹幕 · 👍 ${video.like}</p>
                    <a href="https://www.bilibili.com/video/${video.bvid}" target="_blank" class="video-link">在B站打开 →</a>
                </div>
            </div>
        </section>`;
    
    // 替换旧的视频部分
    html = html.replace(
        /<!-- 最新视频预览 -->[\s\S]*?<\/section>/,
        videoHTML
    );
    
    fs.writeFileSync(HTML_PATH, html);
    console.log('✅ HTML已更新:', video.title);
}

// 主函数
async function main() {
    try {
        console.log('🦞 正在获取最新视频...');
        const video = await fetchLatestVideo();
        updateHTML(video);
    } catch (error) {
        console.error('❌ 获取失败:', error.message);
        process.exit(1);
    }
}

main();
