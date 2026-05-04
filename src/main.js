import "./styles.css";
import { requirePasswordAccess } from "./password-gate.js";

const canvas = document.querySelector("#particle-canvas");
const ctx = canvas.getContext("2d");
const cursorOrb = document.querySelector(".cursor-orb");
const progressBar = document.querySelector(".reading-progress");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".nav-links a, .nav-cta");

let particles = [];
let width = 0;
let height = 0;
let dpr = Math.min(window.devicePixelRatio || 1, 2);

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function resizeCanvas() {
  if (!canvas || !ctx) return;

  width = window.innerWidth;
  height = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.min(110, Math.floor((width * height) / 15000));
  particles = Array.from({ length: count }, () => ({
    x: randomBetween(0, width),
    y: randomBetween(0, height),
    vx: randomBetween(-0.22, 0.22),
    vy: randomBetween(-0.18, 0.18),
    size: randomBetween(0.7, 2.1),
    alpha: randomBetween(0.28, 0.9)
  }));
}

function drawParticles() {
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  particles.forEach((particle, index) => {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < 0 || particle.x > width) particle.vx *= -1;
    if (particle.y < 0 || particle.y > height) particle.vy *= -1;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(136, 232, 255, ${particle.alpha})`;
    ctx.fill();

    for (let i = index + 1; i < particles.length; i += 1) {
      const other = particles[i];
      const dx = particle.x - other.x;
      const dy = particle.y - other.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 132) {
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(other.x, other.y);
        ctx.strokeStyle = `rgba(0, 229, 255, ${0.12 * (1 - distance / 132)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  });

  requestAnimationFrame(drawParticles);
}

function updateProgress() {
  if (!progressBar) return;

  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progressBar.style.width = `${progress}%`;
}

function initReveal() {
  const elements = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  elements.forEach((element) => observer.observe(element));
}

function initTilt() {
  const cards = document.querySelectorAll("[data-tilt]");

  cards.forEach((card) => {
    if (card.dataset.tiltReady === "true") return;
    card.dataset.tiltReady = "true";

    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateX = ((y / rect.height) - 0.5) * -8;
      const rotateY = ((x / rect.width) - 0.5) * 8;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "perspective(900px) rotateX(0) rotateY(0) translateY(0)";
    });
  });
}

function initMenu() {
  if (!menuToggle) return;

  menuToggle.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("menu-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      document.body.classList.remove("menu-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

function initCursorGlow() {
  if (!cursorOrb) return;

  window.addEventListener("pointermove", (event) => {
    cursorOrb.style.opacity = "1";
    cursorOrb.style.transform = `translate3d(${event.clientX - 160}px, ${event.clientY - 160}px, 0)`;
  });

  window.addEventListener("pointerleave", () => {
    cursorOrb.style.opacity = "0";
  });
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element && value !== undefined) element.textContent = value;
}

function setAllText(selector, value) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
}

function setMailLinks(email) {
  document.querySelectorAll("[data-site-email], [data-footer-email]").forEach((link) => {
    link.href = `mailto:${email}`;
  });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function textToHtml(value = "") {
  return escapeHtml(value)
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replaceAll("\n", "<br />")}</p>`)
    .join("");
}

function inlineMarkdown(value = "") {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, `<a href="$2" target="_blank" rel="noreferrer">$1</a>`);
}

function markdownToHtml(value = "") {
  const lines = value.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let paragraph = [];
  let list = [];
  let inCode = false;
  let code = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!list.length) return;
    html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
    list = [];
  };

  lines.forEach((line) => {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = [];
        inCode = false;
      } else {
        flushParagraph();
        flushList();
        inCode = true;
      }
      return;
    }

    if (inCode) {
      code.push(line);
      return;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      html.push(`<h${heading[1].length + 1}>${inlineMarkdown(heading[2])}</h${heading[1].length + 1}>`);
      return;
    }

    const item = line.match(/^[-*+]\s+(.+)$/);
    if (item) {
      flushParagraph();
      list.push(item[1]);
      return;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      return;
    }

    paragraph.push(line.trim());
  });

  flushParagraph();
  flushList();
  if (inCode) html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);

  return html.join("");
}

function renderMedia(media = []) {
  if (!media.length) return "";

  return `<div class="media-grid">${media.map((item) => {
    const url = escapeHtml(item.url);
    const alt = escapeHtml(item.alt || item.name || "媒体文件");

    if (item.type === "video") {
      return `<figure class="media-frame"><video controls preload="metadata" src="${url}"></video>${item.name ? `<figcaption>${escapeHtml(item.name)}</figcaption>` : ""}</figure>`;
    }

    return `<figure class="media-frame"><button class="media-lightbox-trigger" type="button" data-fullsrc="${url}" aria-label="放大查看图片"><img src="${url}" alt="${alt}" loading="lazy" /></button>${item.name ? `<figcaption>${escapeHtml(item.name)}</figcaption>` : ""}</figure>`;
  }).join("")}</div>`;
}

function initMediaLightbox() {
  document.querySelectorAll(".media-lightbox-trigger").forEach((button) => {
    if (button.dataset.lightboxReady === "true") return;
    button.dataset.lightboxReady = "true";

    button.addEventListener("click", () => {
      const src = button.dataset.fullsrc;
      if (!src) return;

      const overlay = document.createElement("div");
      overlay.className = "media-lightbox";
      overlay.innerHTML = `<button type="button" aria-label="关闭预览">×</button><img src="${src}" alt="" />`;
      overlay.addEventListener("click", () => overlay.remove());
      document.body.append(overlay);
    });
  });
}

function renderArticleCard(article) {
  return `
    <article class="article-card glass-card reveal" data-tilt>
      <div class="card-meta">
        <span>${escapeHtml(article.category)}</span>
        <time datetime="${escapeHtml(article.date)}">${escapeHtml(article.displayDate)}</time>
      </div>
      <h3>${escapeHtml(article.title)}</h3>
      <p>${escapeHtml(article.summary)}</p>
      ${article.media?.[0] ? `<div class="card-media-preview">${article.media[0].type === "video" ? "VIDEO" : "IMAGE"}</div>` : ""}
      <a href="article.html?slug=${encodeURIComponent(article.slug)}">阅读全文</a>
    </article>
  `;
}

function renderArticleCommand(article, index = 0) {
  const hasMedia = Boolean(article.media?.length);
  return `
    <a class="article-command-item ${index === 0 ? "is-active" : ""}" href="article.html?slug=${encodeURIComponent(article.slug)}">
      <span>${String(index + 1).padStart(2, "0")}</span>
      <div>
        <strong>${escapeHtml(article.title)}</strong>
        <em>${escapeHtml(article.category)} / ${escapeHtml(article.displayDate)}</em>
      </div>
      ${hasMedia ? `<small>${article.media[0].type === "video" ? "VIDEO" : "IMAGE"}</small>` : ""}
    </a>
  `;
}

function renderArticleCommandCenter(articles) {
  if (!articles.length) {
    return `<div class="empty-state empty-state-strong glass-card reveal"><span class="empty-code">NO MCU LOG CAPTURED</span><h3>等待下一次调试记录</h3><p>当某次调试终于留下痕迹，它会在这里成为第一束信号。</p></div>`;
  }

  const featured = articles[0];
  const list = articles.map(renderArticleCommand).join("");
  return `
    <article class="featured-article-card glass-card reveal" data-tilt>
      <span class="feature-kicker">LATEST NOTE</span>
      <h3>${escapeHtml(featured.title)}</h3>
      <p>${escapeHtml(featured.summary)}</p>
      <div class="feature-meta">
        <span>${escapeHtml(featured.category)}</span>
        <time datetime="${escapeHtml(featured.date)}">${escapeHtml(featured.displayDate)}</time>
      </div>
      ${featured.media?.[0] ? `<div class="card-media-preview">${featured.media[0].type === "video" ? "VIDEO" : "IMAGE"}</div>` : ""}
      <a class="inline-link" href="article.html?slug=${encodeURIComponent(featured.slug)}">打开实验记录</a>
    </article>
    <div class="article-command-list glass-card reveal">
      <div class="command-list-head"><span>NOTE INDEX</span><strong>${articles.length}</strong></div>
      ${list}
    </div>
  `;
}

async function loadGitHubProjects(owner = "salilklq") {
  const response = await fetch(`https://api.github.com/users/${owner}/repos?sort=updated&per_page=100`, { cache: "no-store" }).catch(() => null);
  if (!response?.ok) return [];
  const repos = await response.json();

  return repos
    .filter((repo) => repo.name !== "sk-lab-blog");
}

async function loadRepositoryReadme(repo) {
  const response = await fetch(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/readme`, { cache: "no-store" }).catch(() => null);
  if (!response?.ok) return "";
  const data = await response.json();
  if (!data.content) return "";

  try {
    const binary = atob(data.content.replace(/\s/g, ""));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

function repositoryStatus(repo) {
  if (repo.archived) return "ARCHIVED TRACE";
  const days = (Date.now() - new Date(repo.updated_at).getTime()) / 86400000;
  if (days <= 30) return "ACTIVE SIGNAL";
  if (days <= 180) return "STABLE ORBIT";
  return "ARCHIVED TRACE";
}

function projectGroup(repo) {
  if (repo.fork || repo.archived) return "Archive";
  const text = `${repo.name} ${repo.description || ""} ${repo.language || ""}`.toLowerCase();
  if (/firmware|embedded|mcu|stm32|esp32|arduino|driver|hardware|c\b|c\+\+/.test(text)) return "Firmware";
  if (/tool|cli|web|vite|react|vue|node|javascript|typescript|python/.test(text)) return "Web / Tools";
  if (/demo|lab|test|experiment|prototype/.test(text)) return "Experiment";
  return "Archive";
}

function repoInitials(name = "") {
  return name
    .split(/[-_\s]+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase() || "SK";
}

function readmeCover(markdown = "", repo) {
  const match = markdown.match(/!\[[^\]]*\]\(([^)]+)\)/);
  const src = match?.[1]?.trim();
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("#")) return "";

  const path = src.replace(/^\.\//, "");
  return `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/${path}`;
}

function languageTone(language = "") {
  const tones = {
    JavaScript: "#f7df1e",
    TypeScript: "#3178c6",
    Python: "#55ffb6",
    C: "#00e5ff",
    "C++": "#8a5cff",
    HTML: "#ff7a55",
    CSS: "#ff3df2"
  };

  return tones[language] || "#00e5ff";
}

function readmeSummary(markdown = "") {
  return markdown
    .replace(/^---[\s\S]*?---\s*/, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[[^\]]*badge[^\]]*\]\([^)]*\)/gi, "")
    .split(/\n{2,}/)
    .map((block) => block.replace(/^#{1,6}\s+/gm, "").trim())
    .map((block) => block.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[`*_>#-]/g, "").trim())
    .find((block) => block.length > 40)
    ?.slice(0, 360) || "README 还没有留下足够的说明，像一间还没开灯的项目舱。";
}

function renderGitHubDashboard(repos) {
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const latest = repos[0]?.updated_at?.slice(0, 10) || "WAITING";
  const languages = repos.reduce((map, repo) => {
    if (repo.language) map.set(repo.language, (map.get(repo.language) || 0) + 1);
    return map;
  }, new Map());
  const primaryLanguage = [...languages.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Mixed";

  return `
    <div class="github-lab-card glass-card reveal">
      <span>PUBLIC REPOS</span>
      <strong>${repos.length}</strong>
    </div>
    <div class="github-lab-card glass-card reveal">
      <span>PRIMARY LANGUAGE</span>
      <strong>${escapeHtml(primaryLanguage)}</strong>
    </div>
    <div class="github-lab-card glass-card reveal">
      <span>TOTAL STARS</span>
      <strong>${totalStars}</strong>
    </div>
    <div class="github-lab-card glass-card reveal">
      <span>LAST SIGNAL</span>
      <strong>${escapeHtml(latest)}</strong>
    </div>
  `;
}

function renderGitHubProject(repo, index) {
  const group = projectGroup(repo);
  const status = repositoryStatus(repo);
  const tone = languageTone(repo.language);
  const tags = [repo.language, `${repo.stargazers_count} stars`, `${repo.forks_count} forks`, repo.updated_at?.slice(0, 10)]
    .filter(Boolean);

  return `
    <button class="project-card github-project-card ${index === 0 ? "feature-project" : ""} reveal" type="button" data-repo-full-name="${escapeHtml(repo.full_name)}" data-tilt style="--repo-tone: ${escapeHtml(tone)}">
      <span class="project-index">${String(index + 1).padStart(2, "0")}</span>
      <div class="repo-radar" aria-hidden="true"><i></i></div>
      <div class="repo-cover" aria-hidden="true"><span>${escapeHtml(repoInitials(repo.name))}</span></div>
      <small class="repo-group">${escapeHtml(group)} / ${escapeHtml(status)}</small>
      <h3>${escapeHtml(repo.name)}</h3>
      <p>${escapeHtml(repo.description || "这个公开仓库还没有填写描述。")}</p>
      <div class="tech-stack">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
    </button>
  `;
}

function renderGitHubProjectGroups(repos, startIndex = 0) {
  const order = ["Firmware", "Web / Tools", "Experiment", "Archive"];
  let index = startIndex;

  return order.map((group) => {
    const groupRepos = repos.filter((repo) => projectGroup(repo) === group);
    if (!groupRepos.length) return "";

    const cards = groupRepos.map((repo) => renderGitHubProject(repo, index++)).join("");
    return `
      <section class="project-group-panel reveal">
        <div class="project-group-heading">
          <span>${escapeHtml(group)}</span>
          <strong>${groupRepos.length}</strong>
        </div>
        <div class="project-group-grid">${cards}</div>
      </section>
    `;
  }).join("");
}

function bindProjectCards(repos) {
  const repoMap = new Map(repos.map((repo) => [repo.full_name, repo]));
  document.querySelectorAll("[data-repo-full-name]").forEach((card) => {
    if (card.dataset.bound === "true") return;
    card.dataset.bound = "true";
    card.addEventListener("click", () => {
      const repo = repoMap.get(card.dataset.repoFullName);
      if (repo) openProjectDialog(repo);
    });
  });
}

async function openProjectDialog(repo) {
  const overlay = document.createElement("div");
  overlay.className = "project-dialog";
  overlay.innerHTML = `
    <div class="project-dialog-card glass-card" role="dialog" aria-modal="true" aria-label="项目详情">
      <button class="project-dialog-close" type="button" aria-label="关闭项目详情">×</button>
      <span class="feature-kicker">${escapeHtml(projectGroup(repo))} / ${escapeHtml(repositoryStatus(repo))}</span>
      <h2>${escapeHtml(repo.name)}</h2>
      <p>${escapeHtml(repo.description || "这间项目舱还没有写下入口说明。")}</p>
      <div class="project-dialog-stats">
        <span>${escapeHtml(repo.language || "Mixed")}</span>
        <span>${repo.stargazers_count} stars</span>
        <span>${repo.forks_count} forks</span>
        <span>${escapeHtml(repo.updated_at?.slice(0, 10) || "unknown")}</span>
      </div>
      <div class="project-dialog-cover" aria-hidden="true"><span>${escapeHtml(repoInitials(repo.name))}</span></div>
      <div class="project-readme"><p>正在读取 README 信号...</p></div>
      <a class="primary-btn" href="${escapeHtml(repo.html_url)}" target="_blank" rel="noreferrer">查看源码</a>
    </div>
  `;

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
  overlay.querySelector(".project-dialog-close").addEventListener("click", () => overlay.remove());
  document.body.append(overlay);

  const readme = await loadRepositoryReadme(repo);
  const cover = readmeCover(readme, repo);
  const coverEl = overlay.querySelector(".project-dialog-cover");
  if (cover && coverEl) {
    coverEl.innerHTML = `<img src="${escapeHtml(cover)}" alt="" loading="lazy" />`;
  }

  const target = overlay.querySelector(".project-readme");
  if (target) target.innerHTML = `<h3>README 摘要</h3><p>${escapeHtml(readmeSummary(readme))}</p>`;
}

function sectionTitle(content, sectionId) {
  if (sectionId === "dev") return "SK 的开发笔记";
  return content.acgSections?.find((section) => section.id === sectionId)?.title || "文章";
}

function renderLatestSignal(content) {
  const articles = [...(content.articles || [])]
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    .slice(0, 4);

  if (!articles.length) {
    return `<div class="empty-state empty-state-strong glass-card reveal"><span class="empty-code">LATEST_SIGNAL = NULL</span><h3>还没有捕获到内容信号</h3><p>此刻频道保持静默，等待下一次灵感点亮屏幕。</p></div>`;
  }

  return articles.map((article, index) => `
    <a class="latest-signal-card ${index === 0 ? "is-primary" : ""} reveal" href="article.html?slug=${encodeURIComponent(article.slug)}" data-tilt>
      <span>${escapeHtml(sectionTitle(content, article.section))}</span>
      <h3>${escapeHtml(article.title)}</h3>
      <p>${escapeHtml(article.summary)}</p>
      <time datetime="${escapeHtml(article.date)}">${escapeHtml(article.displayDate)}</time>
      ${article.media?.[0] ? `<small>${article.media[0].type === "video" ? "VIDEO SIGNAL" : "IMAGE SIGNAL"}</small>` : ""}
    </a>
  `).join("");
}

function renderAcgMediaCard(article) {
  const firstMedia = article.media?.[0];
  const mediaLabel = firstMedia?.type === "video" ? "VIDEO" : firstMedia ? "IMAGE" : "TEXT";
  const mediaUrl = firstMedia?.url ? escapeHtml(firstMedia.url) : "";
  const mediaAlt = escapeHtml(firstMedia?.alt || firstMedia?.name || article.title);
  const preview = firstMedia?.type === "image"
    ? `<img src="${mediaUrl}" alt="${mediaAlt}" loading="lazy" />`
    : firstMedia?.type === "video"
      ? `<video src="${mediaUrl}#t=0.1" preload="metadata" muted playsinline></video>`
      : `<span>${mediaLabel}</span>`;

  return `
    <a class="acg-archive-card" href="article.html?slug=${encodeURIComponent(article.slug)}">
      <div class="archive-preview ${firstMedia?.type === "video" ? "is-video" : ""}">
        ${preview}
        ${firstMedia ? `<small>${mediaLabel}</small>` : ""}
      </div>
      <div class="archive-info">
        <time datetime="${escapeHtml(article.date)}">${escapeHtml(article.displayDate)}</time>
        <h4>${escapeHtml(article.title)}</h4>
        <p>${escapeHtml(article.summary)}</p>
      </div>
    </a>
  `;
}

function updateSiteShell(content) {
  setAllText("[data-site-brand]", content.site.brand);
  setAllText("[data-site-footer]", content.site.footer);
  setMailLinks(content.site.email);
}

function renderHome(content) {
  updateSiteShell(content);

  setText("[data-hero-eyebrow]", content.hero.eyebrow);
  setText("[data-hero-copy]", content.hero.copy);
  setText("[data-identity-title]", content.hero.identityTitle);
  setText("[data-identity-subtitle]", content.hero.identitySubtitle);
  setText("[data-terminal-name]", content.hero.terminalName);
  setText("[data-terminal-status]", content.hero.terminalStatus);

  const consoleReadout = document.querySelector("[data-console-readout]");
  if (consoleReadout) {
    const latest = (content.latestUpdates || []).find((item) => item.type === "article");
    consoleReadout.innerHTML = `
      <div><span>ARTICLES</span><strong>${escapeHtml(String(content.articles.length))}</strong></div>
      <div><span>PROJECTS</span><strong>${escapeHtml(String(content.projects.length))}</strong></div>
      <div><span>ACCESS</span><strong>PRIVATE</strong></div>
      <div><span>LAST UPDATE</span><strong>${escapeHtml(latest?.displayDate || "WAITING")}</strong></div>
    `;
  }

  const metrics = document.querySelector("[data-metrics]");
  if (metrics) {
    metrics.innerHTML = content.metrics.map((metric) => `
      <div>
        <strong>${escapeHtml(metric.value)}</strong>
        <span>${escapeHtml(metric.label)}</span>
      </div>
    `).join("");
  }

  const tags = document.querySelector("[data-tags]");
  if (tags) {
    tags.innerHTML = content.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  }

  const latestSignal = document.querySelector("[data-latest-signal]");
  if (latestSignal) {
    latestSignal.innerHTML = renderLatestSignal(content);
  }

  setText("[data-articles-eyebrow]", content.articlesIntro.eyebrow);
  setText("[data-articles-title]", content.articlesIntro.title);
  setText("[data-articles-copy]", content.articlesIntro.copy);

  const articleGrid = document.querySelector("[data-article-grid]");
  if (articleGrid) {
    const devArticles = content.articles.filter((article) => article.section === "dev");
    articleGrid.innerHTML = renderArticleCommandCenter(devArticles);
  }

  setText("[data-projects-eyebrow]", content.projectsIntro.eyebrow);
  setText("[data-projects-title]", content.projectsIntro.title);
  setText("[data-projects-copy]", content.projectsIntro.copy);

  const projectGrid = document.querySelector("[data-project-grid]");
  if (projectGrid) {
    projectGrid.innerHTML = content.projects.length ? content.projects.map((project, index) => `
      <article class="project-card ${index === 0 ? "feature-project" : ""} reveal" data-tilt>
        <span class="project-index">${escapeHtml(project.index)}</span>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.copy)}</p>
        ${project.tags?.length ? `<div class="tech-stack">${project.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
        ${renderMedia(project.media)}
      </article>
    `).join("") : `<div class="empty-state empty-state-strong glass-card reveal"><span class="empty-code">PROJECT SIGNAL SEARCH</span><h3>正在寻找远处的仓库星光</h3><p>稍后这里会浮现 SK 留在 GitHub 上的公开项目轨迹。</p></div>`;
  }

  hydrateGitHubProjects(content);

  setText("[data-timeline-eyebrow]", content.timelineIntro.eyebrow);
  setText("[data-timeline-title]", content.timelineIntro.title);

  const timeline = document.querySelector("[data-timeline]");
  if (timeline) {
    const articleUpdates = (content.latestUpdates || []).filter((item) => item.type === "article");
    timeline.innerHTML = articleUpdates.length ? articleUpdates.map((item) => `
      <div class="timeline-item reveal">
        <span>新文章 · ${escapeHtml(item.section || "文章")}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>记录时间：${escapeHtml(item.displayDate || item.date)}</p>
      </div>
    `).join("") : `<div class="timeline-item reveal"><span>公告</span><h3>暂无新文章公告</h3><p>电波暂时安静，下一条记录会在这里亮起。</p></div>`;
  }

  setText("[data-interests-eyebrow]", content.interestsIntro.eyebrow);
  setText("[data-interests-title]", content.interestsIntro.title);
  setText("[data-interests-copy]", content.interestsIntro.copy);

  const interestGrid = document.querySelector("[data-interest-grid]");
  if (interestGrid) {
    const acgSections = content.acgSections || [];
    interestGrid.innerHTML = acgSections.map((section) => {
      const posts = content.articles.filter((article) => article.section === section.id);
      const postList = posts.length
        ? posts.map(renderAcgMediaCard).join("")
        : `<p class="empty-mini">ARCHIVE EMPTY / 这个子板块还没有文章。</p>`;

      return `
        <article class="interest-card acg-section-card reveal" data-tilt>
          <span class="interest-icon">${escapeHtml(section.icon)}</span>
          <h3>${escapeHtml(section.title)}</h3>
          <p>${escapeHtml(section.copy)}</p>
          <div class="acg-post-list">${postList}</div>
        </article>
      `;
    }).join("");
  }

  setText("[data-about-eyebrow]", content.about.eyebrow);
  setText("[data-about-title]", content.about.title);
  setText("[data-about-copy]", content.about.copy);

  const chips = document.querySelector("[data-about-chips]");
  if (chips) {
    chips.innerHTML = content.about.chips.map((chip) => `<span>${escapeHtml(chip)}</span>`).join("");
  }
}

async function hydrateGitHubProjects(content) {
  const projectGrid = document.querySelector("[data-project-grid]");
  const dashboard = document.querySelector("[data-github-dashboard]");
  if (!projectGrid) return;

  const repos = await loadGitHubProjects(content.repo?.owner || "salilklq");
  if (dashboard) dashboard.innerHTML = repos.length ? renderGitHubDashboard(repos) : "";

  if (repos.length) {
    const repoCards = renderGitHubProjectGroups(repos, content.projects.length);
    if (content.projects.length) {
      projectGrid.insertAdjacentHTML("beforeend", repoCards);
    } else {
      projectGrid.innerHTML = repoCards;
    }
  } else if (!content.projects.length) {
    projectGrid.innerHTML = `<div class="empty-state empty-state-strong glass-card reveal"><span class="empty-code">PROJECT BAY QUIET</span><h3>项目舱暂时安静</h3><p>也许只是信号还没抵达，等下一次刷新再看。</p></div>`;
  }

  initReveal();
  initTilt();
  bindProjectCards(repos);
}

function renderArticle(content) {
  updateSiteShell(content);

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug") || content.articles[0]?.slug;
  const article = content.articles.find((item) => item.slug === slug);

  if (!article) {
    document.title = "文章不存在 | SK Lab";
    setText("[data-article-category]", "404");
    setText("[data-article-title]", "文章不存在");
    setText("[data-article-date]", "未找到");
    const body = document.querySelector("[data-article-content]");
    if (body) body.innerHTML = "<p>没有找到这篇文章，请返回文章列表。</p>";
    return;
  }

  document.title = `${article.title} | ${content.site.brand}`;
  document.querySelector("meta[property='og:title']")?.setAttribute("content", `${article.title} | ${content.site.brand}`);
  document.querySelector("meta[property='og:description']")?.setAttribute("content", article.summary);

  setText("[data-article-category]", article.category);
  setText("[data-article-title]", article.title);
  setText("[data-article-date]", article.displayDate);
  document.querySelector("[data-article-date]")?.setAttribute("datetime", article.date);

  const body = document.querySelector("[data-article-content]");
  if (body) body.innerHTML = `${renderMedia(article.media)}${article.format === "markdown" ? markdownToHtml(article.content) : textToHtml(article.content)}`;
}

async function loadContent() {
  const urls = [
    new URL("content.json", document.baseURI),
    new URL("./content.json", window.location.href),
    new URL("/sk-lab-blog/content.json", window.location.origin)
  ];

  for (const url of urls) {
    const response = await fetch(url, { cache: "no-store" }).catch(() => null);
    if (response?.ok) return response.json();
  }

  throw new Error("content.json 加载失败");
}

async function renderContent() {
  const page = document.body.dataset.page;
  if (!page || page === "admin") return;

  try {
    const content = await loadContent();
    if (page === "home") renderHome(content);
    if (page === "article") renderArticle(content);
  } catch (error) {
    console.error(error);
  }
}

function restoreHashPosition() {
  const hash = window.location.hash;
  if (!hash) return;

  const target = document.querySelector(hash);
  if (!target) return;

  requestAnimationFrame(() => {
    target.scrollIntoView({ block: "start" });
  });
}

async function init() {
  await requirePasswordAccess();
  await renderContent();
  restoreHashPosition();
  resizeCanvas();
  drawParticles();
  initReveal();
  initTilt();
  initMediaLightbox();
  initMenu();
  initCursorGlow();
  updateProgress();
}

init();

window.addEventListener("resize", resizeCanvas);
window.addEventListener("scroll", updateProgress, { passive: true });
