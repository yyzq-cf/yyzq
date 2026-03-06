const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const UID = process.env.BILIBILI_UID || '519573454';
const HTML_PATH = path.join(__dirname, '../../index.html');

async function fetchLatestVideo() {
    try {
        console.log('🦞 正在获取B站最新视频...');
        
        // 方法1: 通过RSSHub获取
        try {
            const rssUrl = `https://rsshub.app/bilibili/user/video/${UID}`;
            const response = await axios.get(rssUrl, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            const $ = cheerio.load(response.data, { xmlMode: true });
            const firstItem = $('item').first();
            
            if (firstItem.length > 0) {
                const title = firstItem.find('title').text();
                const link = firstItem.find('link').text();
                const description = firstItem.find('description').text();
                
                // 提取BV号
                const bvMatch = link.match(/BV[a-zA-Z0-9]+/);
                const bvid = bvMatch ? bvMatch[0] : '';
                
                // 提取封面图
                const imgMatch = description.match(/src="([^"]+)"/);
                const cover = imgMatch ? imgMatch[1] : '';
                
                if (bvid) {
                    console.log('✅ 通过RSSHub获取成功:', title);
                    return { bvid, title, cover };
                }
            }
        } catch (rssError) {
            console.log('RSSHub获取失败，尝试备用方案...');
        }
        
        // 方法2: 通过空间页面获取
        const spaceUrl = `https://space.bilibili.com/${UID}/video`;
        const response = await axios.get(spaceUrl, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.bilibili.com'
            }
        });
        
        // 从页面中提取__INITIAL_STATE__
        const stateMatch = response.data.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/);
        if (stateMatch) {
            const state = JSON.parse(stateMatch[1]);
            if (state.videoList && state.videoList.length > 0) {
                const video = state.videoList[0];
                console.log('✅ 通过页面获取成功:', video.title);
                return {
                    bvid: video.bvid,
                    title: video.title,
                    cover: video.pic
                };
            }
        }
        
        throw new Error('无法获取视频信息');
        
    } catch (error) {
        console.error('❌ 获取失败:', error.message);
        throw error;
    }
}

function updateHTML(video) {
    console.log('📝 正在更新HTML...');
    
    let html = fs.readFileSync(HTML_PATH, 'utf8');
    
    // 提取当前已有的BV号，检查是否有变化
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
    
    // 替换旧的视频部分
    const newHTML = html.replace(
        /<!-- 最新视频预览 -->[\s\S]*?<\/section>/,
        videoHTML
    );
    
    fs.writeFileSync(HTML_PATH, newHTML);
    console.log('✅ HTML已更新:', video.title);
    return true;
}

async function main() {
    try {
        const video = await fetchLatestVideo();
        const updated = updateHTML(video);
        
        if (updated) {
            console.log('🎉 更新完成！');
            process.exit(0);
        } else {
            console.log('👍 已经是最新视频');
            process.exit(0);
        }
    } catch (error) {
        console.error('❌ 更新失败:', error.message);
        process.exit(1);
    }
}

main();