// 主 JavaScript 文件

document.addEventListener('DOMContentLoaded', function() {
    // 移动端菜单切换
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            if (navLinks.style.display === 'flex') {
                navLinks.style.display = 'none';
            } else {
                navLinks.style.display = 'flex';
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '70px';
                navLinks.style.left = '0';
                navLinks.style.right = '0';
                navLinks.style.background = 'white';
                navLinks.style.padding = '20px';
                navLinks.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            }
        });
    }
    
    // 加载视频列表（如果是在视频页面）
    if (document.getElementById('video-list')) {
        loadVideos();
    }
    
    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

// 视频数据
const videos = [
    {
        id: 'E5AHlwy1MrE',
        title: 'OpenClaw中文版Windows部署教程|2000万Tokens免费领|对接飞书|国内网络环境优化',
        views: '3,080',
        duration: '18:57',
        platform: 'YouTube'
    },
    {
        id: 'UshT0LNJt30', 
        title: 'Mac部署OpenClaw中文版教程-2000万Tokens免费领-通讯方式对接飞书',
        views: '1,377',
        duration: '16:46',
        platform: 'YouTube'
    },
    {
        id: 'zd3KnaUDDlg',
        title: 'linux部署OpenClaw中文版教程-2000万Tokens免费领-通讯方式对接飞书/电报',
        views: '595',
        duration: '15:43',
        platform: 'YouTube'
    },
    {
        id: 'rGf6JQCieME',
        title: '腾讯QQ正式开放OpenClaw官方接入|配置简单|更方便调教大龙虾',
        views: '223',
        duration: '3:16',
        platform: 'YouTube'
    },
    {
        id: 'JWzV8G0tBTA',
        title: '飞牛NAS使用Docker部署OpenClaw中文版教程|2000万Tokens免费领',
        views: '120',
        duration: '12:58',
        platform: 'YouTube'
    }
];

function loadVideos() {
    const videoList = document.getElementById('video-list');
    if (!videoList) return;
    
    // 已经有静态内容，不需要额外加载
    // 如果需要动态加载，可以使用以下代码
    /*
    videos.forEach(video => {
        const card = createVideoCard(video);
        videoList.appendChild(card);
    });
    */
}

function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.innerHTML = `
        <div class="video-thumb">
            <img src="https://img.youtube.com/vi/${video.id}/maxresdefault.jpg" alt="${video.title}">
            <span class="duration">${video.duration}</span>
        </div>
        <div class="video-info">
            <h3>${video.title}</h3>
            <p class="video-meta">${video.views} 次观看 · ${video.platform}</p>
        </div>
    `;
    card.addEventListener('click', () => {
        window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank');
    });
    return card;
}

// 获取URL参数
function getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}