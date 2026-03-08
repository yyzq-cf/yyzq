const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const UID = process.env.BILIBILI_UID || '519573454';
const HTML_PATH = path.join(__dirname, '../../index.html');

async function fetchLatestVideo() {
    console.log('🦞 正在获取B站最新视频...');
    
    // 尝试多个RSS源
    const rssSources = [
        `https://rsshub.io/bilibili/user/video/${UID}`,
        `https://rsshub.app/bilibili/user/video/${UID}`,
    ];
    
    // 方法1: 尝试RSS源
    for (const rssUrl of rssSources) {
        try {
            console.log(`尝试RSS源: ${rssUrl}`);
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
                    console.log('✅ 通过RSS获取成功:', title);
                    return { bvid, title, cover };
                }
            }
        } catch (rssError) {
            console.log(`RSS源 ${rssUrl} 获取失败:`, rssError.message);
        }
    }
    
    // 方法2: 通过B站API获取
    try {
        console.log('尝试B站API...');
        const apiUrl = `https://api.bilibili.com/x/space/arc/search?mid=${UID}&pn=1&jsonp=jsonp`;
        const response = await axios.get(apiUrl, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.bilibili.com'
            }
        });
        
        if (response.data && response.data.data && response.data.data.list && response.data.data.list.vlist) {
            const video = response.data.data.list.vlist[0];
            console.log('✅ 通过API获取成功:', video.title);
            return {
                bvid: video.bvid,
                title: video.title,
                cover: `https:${video.pic}`
            };
        }
    } catch (apiError) {
        console.log('B站API获取失败:', apiError.message);
    }
    
    // 方法3: 通过空间页面获取
    try {
        console.log('尝试通过页面获取...');
        const spaceUrl = `https://space.bilibili.com/${UID}/video`;
        const response = await axios.get(spaceUrl, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.bilibili.com'
            }
        });
        
        // 从页面中提取__INITIAL_STATE__
        const stateMatch = response.data.match(/window\.\__INITIAL_STATE__\s*=\s*({.+?});/);
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
    } catch (pageError) {
        console.log('页面获取失败:', pageError.message);
    }
    
    throw new Error('所有获取方式都失败了');
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
    console.log('✅ 更新成功:', video.title);
    return true;
}

async function main() {
    try {
        const video = await fetchLatestVideo();
        const hasChanges = updateHTML(video);
        
        if (!hasChanges) {
            console.log('ℹ️ 没有新视频，退出');
            process.exit(0);
        }
        
        console.log('🦞 完成！');
    } catch (error) {
        console.error('❌ 获取失败:', error.message);
        process.exit(1);
    }
}

main();