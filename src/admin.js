import "./styles.css";

const statusEl = document.querySelector("#adminStatus");
const tokenInput = document.querySelector("#tokenInput");
const commitMessageInput = document.querySelector("#commitMessage");
const articleList = document.querySelector("#articleList");
const jsonEditor = document.querySelector("#jsonEditor");

const fields = {
  siteBrand: document.querySelector("#siteBrand"),
  siteEmail: document.querySelector("#siteEmail"),
  heroTitle: document.querySelector("#heroTitle"),
  heroCopy: document.querySelector("#heroCopy"),
  aboutTitle: document.querySelector("#aboutTitle"),
  aboutCopy: document.querySelector("#aboutCopy"),
  articleSlug: document.querySelector("#articleSlug"),
  articleCategory: document.querySelector("#articleCategory"),
  articleTitle: document.querySelector("#articleTitle"),
  articleSummary: document.querySelector("#articleSummary"),
  articleDate: document.querySelector("#articleDate"),
  articleDisplayDate: document.querySelector("#articleDisplayDate"),
  articleContent: document.querySelector("#articleContent")
};

let content = null;
let selectedArticleIndex = 0;
let remoteSha = null;

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.dataset.type = type;
}

function toSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "") || `post-${Date.now()}`;
}

function formatDisplayDate(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function syncArticleCount() {
  const metric = content.metrics.find((item) => item.label === "已发布文章");
  if (metric) metric.value = String(content.articles.length);

  const timelineItem = content.timeline.find((item) => item.label === "真实数据");
  if (timelineItem) {
    timelineItem.title = `文章为 ${content.articles.length}，访问统计未接入`;
    timelineItem.copy = content.articles.length
      ? `当前已有 ${content.articles.length} 篇真实文章。访问统计未接入前，不展示虚构阅读量。`
      : "当前还没有公开文章。访问统计未接入前，不展示虚构阅读量。";
  }

  content.updatedAt = new Date().toISOString();
}

function renderJson() {
  jsonEditor.value = JSON.stringify(content, null, 2);
}

function renderArticleList() {
  articleList.innerHTML = content.articles.map((article, index) => `
    <button type="button" class="admin-article-item ${index === selectedArticleIndex ? "is-active" : ""}" data-index="${index}">
      <strong>${article.title || "未命名文章"}</strong>
      <span>${article.category || "未分类"}</span>
    </button>
  `).join("");

  articleList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      selectedArticleIndex = Number(button.dataset.index);
      renderForms();
    });
  });
}

function renderForms() {
  fields.siteBrand.value = content.site.brand;
  fields.siteEmail.value = content.site.email;
  fields.heroTitle.value = content.hero.title;
  fields.heroCopy.value = content.hero.copy;
  fields.aboutTitle.value = content.about.title;
  fields.aboutCopy.value = content.about.copy;

  renderArticleList();

  const article = content.articles[selectedArticleIndex];
  if (article) {
    fields.articleSlug.value = article.slug;
    fields.articleCategory.value = article.category;
    fields.articleTitle.value = article.title;
    fields.articleSummary.value = article.summary;
    fields.articleDate.value = article.date;
    fields.articleDisplayDate.value = article.displayDate;
    fields.articleContent.value = article.content;
  } else {
    fields.articleSlug.value = "";
    fields.articleCategory.value = "";
    fields.articleTitle.value = "";
    fields.articleSummary.value = "";
    fields.articleDate.value = "";
    fields.articleDisplayDate.value = "";
    fields.articleContent.value = "";
  }

  renderJson();
}

function applySiteFields() {
  content.site.brand = fields.siteBrand.value.trim() || "SK Lab";
  content.site.email = fields.siteEmail.value.trim() || "sxypgnuq@outlook.com";
  content.hero.title = fields.heroTitle.value.trim();
  content.hero.copy = fields.heroCopy.value.trim();
  content.about.title = fields.aboutTitle.value.trim();
  content.about.copy = fields.aboutCopy.value.trim();
  syncArticleCount();
}

function applyArticleFields() {
  if (!content.articles[selectedArticleIndex]) return;

  const title = fields.articleTitle.value.trim() || "未命名文章";
  content.articles[selectedArticleIndex] = {
    slug: toSlug(fields.articleSlug.value || title),
    title,
    category: fields.articleCategory.value.trim() || "未分类",
    date: fields.articleDate.value.trim() || new Date().toISOString(),
    displayDate: fields.articleDisplayDate.value.trim() || formatDisplayDate(),
    summary: fields.articleSummary.value.trim() || fields.articleContent.value.trim().slice(0, 120),
    content: fields.articleContent.value.trim()
  };

  syncArticleCount();
  renderForms();
  setStatus("文章修改已应用，点击“保存并发布”后才会上线。", "ok");
}

async function loadContent() {
  const response = await fetch("../content.json", { cache: "no-store" });
  if (!response.ok) throw new Error("无法加载 content.json");
  content = await response.json();
  selectedArticleIndex = 0;
  renderForms();
  setStatus("内容已加载。", "ok");
}

async function loadRemoteSha(token) {
  const { owner, name, branch, contentPath } = content.repo;
  const response = await fetch(`https://api.github.com/repos/${owner}/${name}/contents/${contentPath}?ref=${branch}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json"
    }
  });

  if (!response.ok) {
    throw new Error("无法读取 GitHub 文件信息，请检查 Token 权限。 ");
  }

  const file = await response.json();
  remoteSha = file.sha;
}

function encodeBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

async function saveToGitHub() {
  applySiteFields();

  const token = tokenInput.value.trim();
  if (!token) {
    setStatus("请先输入 GitHub Token。", "error");
    return;
  }

  localStorage.setItem("skLabAdminToken", token);
  setStatus("正在保存到 GitHub...", "busy");

  await loadRemoteSha(token);

  const { owner, name, branch, contentPath } = content.repo;
  const body = {
    message: commitMessageInput.value.trim() || "Update site content from admin",
    content: encodeBase64Utf8(`${JSON.stringify(content, null, 2)}\n`),
    sha: remoteSha,
    branch
  };

  const response = await fetch(`https://api.github.com/repos/${owner}/${name}/contents/${contentPath}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "保存失败");
  }

  const result = await response.json();
  remoteSha = result.content.sha;
  renderJson();
  setStatus("保存成功。GitHub Pages 正在自动部署，通常几十秒后生效。", "ok");
}

function bindEvents() {
  document.querySelector("#loadRemote").addEventListener("click", loadContent);
  document.querySelector("#saveContent").addEventListener("click", async () => {
    try {
      await saveToGitHub();
    } catch (error) {
      setStatus(error.message, "error");
    }
  });

  document.querySelector("#clearToken").addEventListener("click", () => {
    localStorage.removeItem("skLabAdminToken");
    tokenInput.value = "";
    setStatus("Token 已从当前浏览器清除。", "ok");
  });

  document.querySelector("#newArticle").addEventListener("click", () => {
    const now = new Date();
    content.articles.unshift({
      slug: `post-${now.getTime()}`,
      title: "新文章",
      category: "游戏与动漫频道",
      date: now.toISOString(),
      displayDate: formatDisplayDate(now),
      summary: "这里填写文章摘要。",
      content: "这里填写文章正文。"
    });
    selectedArticleIndex = 0;
    syncArticleCount();
    renderForms();
    setStatus("已创建新文章草稿，编辑后点击“保存并发布”。", "ok");
  });

  document.querySelector("#applyArticle").addEventListener("click", applyArticleFields);

  document.querySelector("#deleteArticle").addEventListener("click", () => {
    if (!content.articles[selectedArticleIndex]) return;
    if (!confirm("确定删除当前文章吗？保存并发布后线上也会删除。")) return;
    content.articles.splice(selectedArticleIndex, 1);
    selectedArticleIndex = Math.max(0, selectedArticleIndex - 1);
    syncArticleCount();
    renderForms();
    setStatus("文章已删除，点击“保存并发布”后才会上线。", "ok");
  });

  document.querySelector("#formatJson").addEventListener("click", () => {
    try {
      jsonEditor.value = JSON.stringify(JSON.parse(jsonEditor.value), null, 2);
      setStatus("JSON 已格式化。", "ok");
    } catch {
      setStatus("JSON 格式错误，无法格式化。", "error");
    }
  });

  document.querySelector("#applyJson").addEventListener("click", () => {
    try {
      content = JSON.parse(jsonEditor.value);
      selectedArticleIndex = 0;
      syncArticleCount();
      renderForms();
      setStatus("JSON 已应用到表单，点击“保存并发布”后才会上线。", "ok");
    } catch {
      setStatus("JSON 格式错误，无法应用。", "error");
    }
  });

  [fields.siteBrand, fields.siteEmail, fields.heroTitle, fields.heroCopy, fields.aboutTitle, fields.aboutCopy].forEach((field) => {
    field.addEventListener("change", () => {
      applySiteFields();
      renderJson();
    });
  });
}

async function initAdmin() {
  tokenInput.value = localStorage.getItem("skLabAdminToken") || "";
  bindEvents();

  try {
    await loadContent();
  } catch (error) {
    setStatus(error.message, "error");
  }
}

initAdmin();
