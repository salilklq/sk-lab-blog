# SK Lab

SK 的个人博客网站，面向公网发布。当前真实状态：文章 1 篇，公开项目 0 个，访问统计未接入。

公网地址：`https://salilklq.github.io/sk-lab-blog/`

## 当前文章

| 标题 | 分类 | 发布时间 | 页面 |
| --- | --- | --- | --- |
| test | 游戏与动漫频道 | 2026-05-04 10:49 +08:00 | `articles/test.html` |

## 本地开发

```bash
npm install
npm run dev
```

## 生产构建

```bash
npm run build
npm run preview
```

构建产物会生成到 `dist/`，可部署到 Vercel、Netlify、Cloudflare Pages、GitHub Pages 或任意静态网站服务器。

## 写新文章

当前是静态多页面结构。新增文章时：

1. 在 `articles/` 目录新建一个 HTML 文件，例如 `articles/my-post.html`。
2. 复制 `articles/test.html` 的结构，替换标题、分类、时间和正文。
3. 在 `index.html` 的文章区新增一张文章卡片。
4. 在 `vite.config.js` 的 `rollupOptions.input` 中加入新文章入口。
5. 运行 `npm run build` 验证。
6. 提交并推送到 GitHub，GitHub Pages 会自动部署。

## 发布建议

有真实域名后再添加 `sitemap.xml`，不要用示例域名发布。

如果用 Vercel 或 Netlify，直接导入仓库，构建命令填 `npm run build`，输出目录填 `dist`。
