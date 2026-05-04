import "./styles.css";

const statusEl = document.querySelector("#adminStatus");
const tokenInput = document.querySelector("#tokenInput");
const commitMessageInput = document.querySelector("#commitMessage");
const mediaInput = document.querySelector("#mediaInput");
const mediaPreview = document.querySelector("#mediaPreview");
const articlePanel = document.querySelector("#articlePanel");
const projectPanel = document.querySelector("#projectPanel");
const articlePanelTitle = document.querySelector("#articlePanelTitle");
const articlePanelHelp = document.querySelector("#articlePanelHelp");
const acgSubsectionWrap = document.querySelector("#acgSubsectionWrap");

const fields = {
  articleSlug: document.querySelector("#articleSlug"),
  articleCategory: document.querySelector("#articleCategory"),
  articleTitle: document.querySelector("#articleTitle"),
  articleSummary: document.querySelector("#articleSummary"),
  articleContent: document.querySelector("#articleContent"),
  acgSubsection: document.querySelector("#acgSubsection"),
  projectIndex: document.querySelector("#projectIndex"),
  projectTags: document.querySelector("#projectTags"),
  projectTitle: document.querySelector("#projectTitle"),
  projectCopy: document.querySelector("#projectCopy")
};

let content = null;
let remoteSha = null;
let selectedFiles = [];

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.dataset.type = type;
}

function getPublishType() {
  return document.querySelector("input[name='publishType']:checked")?.value || "dev";
}

function getAcgSection() {
  return fields.acgSubsection.value || "game";
}

function acgSectionTitle(id) {
  return content?.acgSections?.find((section) => section.id === id)?.title || "游戏与动漫频道";
}

function explainGitHubError(message = "") {
  if (message.includes("Resource not accessible by personal access token") || message.includes("403")) {
    return "Token 权限不足：请重新生成 Fine-grained Token，只授权 salilklq/sk-lab-blog，并把 Repository permissions 里的 Contents 设置为 Read and write。";
  }

  return message;
}

function toSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "") || `post-${Date.now()}`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatDisplayDate(date = new Date()) {
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function encodeBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

function safeFileName(fileName) {
  const dotIndex = fileName.lastIndexOf(".");
  const ext = dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
  const base = dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName;
  return `${toSlug(base)}-${Date.now()}${ext}`;
}

function mediaType(file) {
  return file.type.startsWith("video/") ? "video" : "image";
}

function syncCounts() {
  const articleCount = content.articles.length;
  const projectCount = content.projects.length;
  const articleMetric = content.metrics.find((item) => item.label === "已发布文章");
  const projectMetric = content.metrics.find((item) => item.label === "公开项目");

  if (articleMetric) articleMetric.value = String(articleCount);
  if (projectMetric) projectMetric.value = String(projectCount);

  const statusItem = content.timeline.find((item) => item.label === "真实数据");
  if (statusItem) {
    statusItem.title = `文章为 ${articleCount}，公开项目为 ${projectCount}，访问统计未接入`;
    statusItem.copy = `当前已有 ${articleCount} 篇真实文章，${projectCount} 个公开项目。访问统计未接入前，不展示虚构阅读量。`;
  }

  content.updatedAt = new Date().toISOString();
}

async function loadContent() {
  const response = await fetch("../content.json", { cache: "no-store" });
  if (!response.ok) throw new Error("无法加载 content.json");
  content = await response.json();
  syncCounts();
  setStatus("线上内容已加载，可以新增内容。", "ok");
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
    const error = await response.json().catch(() => ({}));
    throw new Error(explainGitHubError(error.message || "无法读取 content.json，请检查 Token 的 Contents 权限。"));
  }

  const file = await response.json();
  remoteSha = file.sha;
}

async function putFileToGitHub({ token, path, base64Content, message }) {
  const { owner, name, branch } = content.repo;
  const body = {
    message,
    content: base64Content,
    branch
  };

  const response = await fetch(`https://api.github.com/repos/${owner}/${name}/contents/${path}`, {
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
    throw new Error(explainGitHubError(error.message || `上传 ${path} 失败`));
  }

  return response.json();
}

async function uploadMediaFiles(token, slug) {
  const files = Array.from(selectedFiles);
  const uploaded = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    setStatus(`正在上传媒体 ${index + 1}/${files.length}: ${file.name}`, "busy");
    const fileName = safeFileName(file.name);
    const path = `${content.repo.uploadDir}/${slug}/${fileName}`;
    const buffer = await file.arrayBuffer();

    await putFileToGitHub({
      token,
      path,
      base64Content: arrayBufferToBase64(buffer),
      message: `Upload media ${fileName}`
    });

    uploaded.push({
      type: mediaType(file),
      name: file.name,
      url: `uploads/${slug}/${fileName}`,
      alt: file.name
    });
  }

  return uploaded;
}

async function saveContentFile(token) {
  await loadRemoteSha(token);

  const { owner, name, branch, contentPath } = content.repo;
  const body = {
    message: commitMessageInput.value.trim() || "Publish new content from admin",
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
    throw new Error(explainGitHubError(error.message || "保存 content.json 失败"));
  }

  const result = await response.json();
  remoteSha = result.content.sha;
}

function buildArticle(type, media) {
  const now = new Date();
  const title = fields.articleTitle.value.trim();
  if (!title) throw new Error("请填写文章标题。 ");

  const contentText = fields.articleContent.value.trim();
  if (!contentText && !media.length) throw new Error("请填写文章正文，或至少上传一个图片/视频。 ");

  const slug = toSlug(fields.articleSlug.value || title);
  const section = type === "acg" ? getAcgSection() : "dev";
  const defaultCategory = type === "acg" ? acgSectionTitle(section) : "SK 的开发笔记";

  return {
    slug,
    section,
    title,
    category: fields.articleCategory.value.trim() || defaultCategory,
    date: now.toISOString(),
    displayDate: formatDisplayDate(now),
    summary: fields.articleSummary.value.trim() || contentText.slice(0, 120) || "媒体内容",
    content: contentText,
    media
  };
}

function buildProject(media) {
  const title = fields.projectTitle.value.trim();
  if (!title) throw new Error("请填写项目标题。 ");

  const copy = fields.projectCopy.value.trim();
  if (!copy && !media.length) throw new Error("请填写项目介绍，或至少上传一个图片/视频。 ");

  const now = new Date();
  return {
    index: fields.projectIndex.value.trim() || String(content.projects.length + 1).padStart(2, "0"),
    title,
    copy,
    tags: fields.projectTags.value.split(",").map((tag) => tag.trim()).filter(Boolean),
    media,
    date: now.toISOString(),
    displayDate: formatDisplayDate(now)
  };
}

function addLatestUpdate(item) {
  content.latestUpdates = content.latestUpdates || [];
  content.latestUpdates.unshift(item);
  content.latestUpdates = content.latestUpdates.slice(0, 8);
}

async function publishContent() {
  const token = tokenInput.value.trim();
  if (!token) throw new Error("请先输入 GitHub Token。 ");
  if (!content) await loadContent();

  localStorage.setItem("skLabAdminToken", token);

  const type = getPublishType();
  const slugSource = type === "project" ? fields.projectTitle.value : fields.articleTitle.value;
  const slug = toSlug(type === "project" ? slugSource : (fields.articleSlug.value || slugSource));
  const media = await uploadMediaFiles(token, slug);

  if (type === "project") {
    const project = buildProject(media);
    content.projects.unshift(project);
    addLatestUpdate({
      type: "project",
      title: project.title,
      section: "SK 的项目实验室",
      date: project.date,
      displayDate: project.displayDate
    });
  } else {
    const article = buildArticle(type, media);
    content.articles.unshift(article);
    addLatestUpdate({
      type: "article",
      title: article.title,
      section: type === "dev" ? "SK 的开发笔记" : acgSectionTitle(article.section),
      date: article.date,
      displayDate: article.displayDate
    });
  }

  syncCounts();
  setStatus("正在保存内容索引...", "busy");
  await saveContentFile(token);
  clearForm();
  setStatus("发布成功。GitHub Pages 正在自动部署，通常几十秒后生效。", "ok");
}

function clearForm() {
  Object.values(fields).forEach((field) => {
    field.value = "";
  });
  mediaInput.value = "";
  selectedFiles = [];
  renderMediaPreview();
}

function renderMediaPreview() {
  if (!selectedFiles.length) {
    mediaPreview.innerHTML = "<p>还没有选择媒体文件。</p>";
    return;
  }

  mediaPreview.innerHTML = selectedFiles.map((file) => `
    <div class="media-preview-item">
      <strong>${escapeHtml(file.name)}</strong>
      <span>${escapeHtml(file.type || "unknown")} · ${(file.size / 1024 / 1024).toFixed(2)} MB</span>
    </div>
  `).join("");
}

function updateTypeDefaults() {
  const type = getPublishType();
  const isProject = type === "project";
  articlePanel.hidden = isProject;
  projectPanel.hidden = !isProject;
  acgSubsectionWrap.hidden = type !== "acg";

  if (type === "dev") {
    articlePanelTitle.textContent = "新增开发笔记";
    articlePanelHelp.textContent = "内容只会发布到 SK 的开发笔记区域。";
    fields.articleCategory.placeholder = "嵌入式开发 / 调试记录 / MCU";
    fields.articleCategory.value = "";
  }

  if (type === "acg") {
    articlePanelTitle.textContent = "新增游戏与动漫文章";
    articlePanelHelp.textContent = "内容只会发布到游戏与动漫频道，且会归入你选择的子板块。";
    fields.articleCategory.placeholder = acgSectionTitle(getAcgSection());
    fields.articleCategory.value = "";
  }
}

function bindEvents() {
  document.querySelector("#loadRemote").addEventListener("click", async () => {
    try {
      await loadContent();
    } catch (error) {
      setStatus(error.message, "error");
    }
  });

  document.querySelector("#publishContent").addEventListener("click", async () => {
    try {
      setStatus("开始发布...", "busy");
      await publishContent();
    } catch (error) {
      setStatus(error.message, "error");
    }
  });

  document.querySelector("#clearToken").addEventListener("click", () => {
    localStorage.removeItem("skLabAdminToken");
    tokenInput.value = "";
    setStatus("Token 已从当前浏览器清除。", "ok");
  });

  document.querySelectorAll("input[name='publishType']").forEach((input) => {
    input.addEventListener("change", updateTypeDefaults);
  });

  fields.acgSubsection.addEventListener("change", updateTypeDefaults);

  mediaInput.addEventListener("change", () => {
    selectedFiles = Array.from(mediaInput.files || []);
    renderMediaPreview();
  });
}

async function initAdmin() {
  tokenInput.value = localStorage.getItem("skLabAdminToken") || "";
  bindEvents();
  renderMediaPreview();
  updateTypeDefaults();

  try {
    await loadContent();
  } catch (error) {
    setStatus(error.message, "error");
  }
}

initAdmin();
