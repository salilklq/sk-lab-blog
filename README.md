# SK Lab

SK 的个人博客网站，面向公网发布。当前真实状态：文章 1 篇，公开项目 0 个，访问统计未接入。

公网地址：`https://salilklq.github.io/sk-lab-blog/`

管理员入口：`https://salilklq.github.io/sk-lab-blog/admin/`

## 当前文章

| 标题 | 分类 | 发布时间 | 页面 |
| --- | --- | --- | --- |
| test | 游戏与动漫频道 | 2026-05-04 10:49 +08:00 | `article.html?slug=test` |

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

## 管理员模式

默认访客只能查看网站内容。管理员可以打开 `/admin/`，输入 GitHub Token 后在网页端编辑首页文案和文章内容。

Token 建议使用 Fine-grained personal access token：

1. 打开 GitHub Token 页面：`https://github.com/settings/tokens?type=beta`
2. Repository access 只选择 `salilklq/sk-lab-blog`
3. Repository permissions 里给 `Contents` 设置 `Read and write`
4. 生成 Token 后粘贴到管理员页面
5. 编辑内容，点击“保存并发布”

Token 只保存在当前浏览器的 `localStorage`，不会写入仓库。不要把 Token 发给别人，也不要在公共电脑上保存。

## 内容结构

网站内容集中存放在 `public/content.json`。前台首页和文章详情页都会读取这个文件渲染。

## 手动写新文章

如果不使用管理员模式，也可以手动编辑 `public/content.json`：

1. 在 `articles` 数组中新增一项。
2. `slug` 保持唯一，例如 `my-first-post`。
3. `content` 字段写正文，空行会在网页中渲染成段落。
4. 运行 `npm run build` 验证。
5. 提交并推送到 GitHub，GitHub Pages 会自动部署。

## 发布建议

有真实域名后再添加 `sitemap.xml`，不要用示例域名发布。

如果用 Vercel 或 Netlify，直接导入仓库，构建命令填 `npm run build`，输出目录填 `dist`。
