# 🦞 有云转晴 - 个人主页

> 我的个人主页和作品展示网站

![GitHub stars](https://img.shields.io/github/stars/yyzq-cf/yyzq)
![GitHub forks](https://img.shields.io/github/forks/yyzq-cf/yyzq)

## 📝 项目简介

这是一个个人主页网站，展示我的个人资料、社交链接和最新动态。

### 主要页面

- **index.html** - 首页，展示个人简介和社交链接
- **about.html** - 关于页面，个人详细介绍
- **contact.html** - 联系方式

### 功能特性

- 🌙 支持亮色/暗色主题切换
- 📱 响应式设计，完美适配移动端
- 🕐 实时时钟显示
- 📺 B站最新视频自动更新

## 🔧 技术栈

- HTML5 + CSS3
- JavaScript (原生)
- GitHub Actions (自动化部署)

## 🤖 自动化

### 每日自动更新 B 站视频

项目使用 GitHub Actions 每天自动获取我在 B 站的最新视频并更新到首页。

**工作流程：**
1. 每天北京时间 8:00 自动运行
2. 通过 B 站 API 获取最新视频
3. 自动更新 index.html 中的视频播放器

**手动触发：**
访问 [Actions](https://github.com/yyzq-cf/yyzq/actions) 页面，点击 "Run workflow"

## 📁 目录结构

```
yyzq/
├── .github/
│   └── workflows/
│       └── update-video.yml    # 自动更新B站视频
├── css/
│   └── style.css               # 样式文件
├── images/                     # 图片资源
├── index.html                  # 首页
├── about.html                  # 关于页
└── contact.html                # 联系页
```

## 🚀 部署

本项目可以直接部署到 GitHub Pages：

1. 进入仓库 Settings
2. 找到 Pages 选项
3. Source 选择 "Deploy from a branch"
4. Branch 选择 "master"，目录选择 "/ (root)"
5. 保存后即可访问：`https://yyzq-cf.github.io/yyzq`

## 🤝 欢迎改进

如果你对本项目有任何建议，欢迎提交 Issue 或 Pull Request！

## 📄 许可证

MIT License

---

Made with ❤️ by [yyzq-cf](https://github.com/yyzq-cf)