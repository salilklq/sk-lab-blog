# SK Lab

SK 的个人博客网站，面向公网发布。当前真实状态：文章 0 篇，公开项目 0 个，访问统计未接入。

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

## 发布建议

有真实域名后再添加 `sitemap.xml`，不要用示例域名发布。

如果用 Vercel 或 Netlify，直接导入仓库，构建命令填 `npm run build`，输出目录填 `dist`。
