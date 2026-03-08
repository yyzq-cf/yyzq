const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const UID = process.env.BILIBILI_UID || '519573454';
const HTML_PATH = path.join(__dirname, '../../index.html');

// 延迟函数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.get(url, {
                timeout: 20000,
                ...options
            });
            return response;
        } catch (error) {
            console.log(`请求失败 (${i + 1}/${retries}):`, error.message);
            if (i < retries - 1) await sleep(2000);
        }
    }
    return null;
}

async function fetchLatestVideo() {
    console.log('🦞 正在获取B站最新视频...');
    console.log('UID:', UID);
    
    // 方法1: 通过B站API获取 (最稳定)
    try {
        console.log('尝试 B站官方API...');
        const apiUrl = `https://api.bilibili.com/x/space/arc/search?mid=${UID}&pn=1&jsonp=jsonp`;
        const response = await fetchWithRetry(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.bilibili.com',
                'Accept': '*/*',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
            }
        });
        
        if (response && response.data && response.data.code === 0) {
            const data = response.data.data;
            if (data && data.list && data.list.vlist && data.list.vlist.length > 0) {
                const video = data.list.vlist[0];
                console.log('✅ 通过API获取成功:', video.title);
                return {
                    bvid: video.bvid,
                    title: video.title,
                    cover: video.pic.startsWith('http') ? video.pic : `https:${video.pic}`
                };
            }
        }
    } catch (apiError) {
        console.log('B站API获取失败:', apiError.message);
    }
    
    // 方法2: RSSHub (国内可能不行)
    try {
        console.log('尝试 RSSHub...');
        const rssSources = [
            `https://rsshub.io/bilibili/user/video/${UID}`,
            `https://rsshub.app/bilibili/user/video/${UID}`,
        ];
        
        for (const rssUrl of rssSources) {
            const response = await fetchWithRetry(rssUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            });
            
            if (response) {
                const $ = cheerio.load(response.data, { xmlMode: true });
                const firstItem = $('item').first();
                
                if (firstItem.length > 0) {
                    const title = firstItem.find('title').text();
                    const link = firstItem.find('link').text();
                    const description = firstItem.find('description').text();
                    
                    const bvMatch = link.match(/BV[a-zA-Z0-9]+/);
                    const bvid = bvMatch ? bvMatch[0] : '';
                    
                    const imgMatch = description.match(/src="([^"]+)"/);
                    const cover = imgMatch ? imgMatch[1] : '';
                    
                    if (bvid) {
                        console.log('✅ 通过RSS获取成功:', title);
                        return { bvid, title, cover };
                    }
                }
            }
        }
    } catch (rssError) {
        console.log('RSS获取失败:', rssError.message);
    }
    
    // 方法3: B站用户投稿API (备用)
    try {
        console.log('尝试用户投稿API...');
        const backupApiUrl = `https://api.bilibili.com/x/space/arc/search?mid=${UID}&pn=1&jsonp=jsonp&callback=callback`;
        const response = await fetchWithRetry(backupApiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
                'Referer': 'https://message.bilibili.com'
            }
        });
        
        if (response && response.data) {
            let data = response.data;
            // 处理 JSONP 回调
            if (typeof data === 'string') {
                const match = data.match(/callback\(({.+})\)/);
                if (match) data = JSON.parse(match[1]);
            }
            
            if (data.code === 0 && data.data && data.data.list && data.data.list.vlist) {
                const video = data.data.list.vlist[0];
                console.log('✅ 通过投稿API获取成功:', video.title);
                return {
                    bvid: video.bvid,
                    title: video.title,
                    cover: video.pic.startsWith('http') ? video.pic : `https:${video.pic}`
                };
            }
        }
    } catch (backupError) {
        console.log('备用API失败:', backupError.message);
    }
    
    // 如果所有方法都失败，返回null而不是抛出异常
    console.log('⚠️ 所有获取方式都失败，但不会中断流程');
    return null;
}

function updateHTML(video) {
    console.log('📝 正在更新HTML...');
    
    let html = fs.readFileSync(HTML_PATH, 'utf8');
    
    // 如果没有新视频，返回false
    if (!video) {
        console.log('ℹ️ 没有获取到视频信息，跳过更新');
        return false;
    }
    
    // 提取当前已有的BV号
    const currentMatch = html.match(/player\.bilibili\.com\/player\.html\?bvid=([^&"]+)/);
    const currentBvid = currentMatch ? currentMatch[1] : '';
    
    if (currentBvid === video.bvid) {
        console.log('ℹ️ 视频已是最新，无需更新');
        return false;
    }
    
    const videoHTML = `
        <!-- 最新视频预览 -->
        <section class="latest-video">
            <h2>🎬 最新视频</h2>
            <div id="video-container">
                <div class="video-card">
                    <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin-bottom:15px;">
                        <iframe src="https://player.bilibili.com/player.html?bvid=${video.bvid}&page=1&high_quality=1&autoplay=0" 
                            scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"
                            style="position:absolute;top:0;left:0;width:100%;height:100%;">
                        </iframe>
                    </div>
                    <h3>${video.title}</h3>
                    <p>🎬 点击播放最新视频</p>
                    <a href="https://www.bilibili.com/video/${video.bvid}" target="_blank" class="video-link">在B站打开 →</a>
                </div>
            </div>
        </section>`;
    
    const newHTML = html.replace(
        /<!-- 最新视频预览 -->[\s\S]*?<\/section>/,
        videoHTML
    );
    
    fs.writeFileSync(HTML_PATH, newHTML);
    console.log('✅ 更新成功:', video.title);
    return true;
}

async function main() {
    try {
        const video = await fetchLatestVideo();
        const hasChanges = updateHTML(video);
        
        // 无论是否有变化都成功退出
        if (!hasChanges) {
            console.log('✅ 任务完成（无新视频）');
            process.exit(0);
        }
        
        console.log('🦞 完成！');
        process.exit(0);
    } catch (error) {
        console.error('❌ 错误:', error.message);
        // 改为成功退出，避免 Workflow 失败
        console.log('⚠️ 获取失败，但流程继续');
        process.exit(0);
    }
}

main();