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

  elements.forEach((element) => element.classList.remove("is-visible"));

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
    return `<div class="empty-state empty-state-strong glass-card reveal"><span class="empty-code">NO MCU LOG CAPTURED</span><h3>等待下一次调试记录</h3><p>发布“SK 的开发笔记”后，这里会生成最新记录和索引列表。</p></div>`;
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

function sectionTitle(content, sectionId) {
  if (sectionId === "dev") return "SK 的开发笔记";
  return content.acgSections?.find((section) => section.id === sectionId)?.title || "文章";
}

function renderLatestSignal(content) {
  const articles = [...(content.articles || [])]
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    .slice(0, 4);

  if (!articles.length) {
    return `<div class="empty-state empty-state-strong glass-card reveal"><span class="empty-code">LATEST_SIGNAL = NULL</span><h3>还没有捕获到内容信号</h3><p>发布任意频道文章后，它会优先出现在这里。</p></div>`;
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
    `).join("") : `<div class="empty-state empty-state-strong glass-card reveal"><span class="empty-code">PROJECT BAY EMPTY</span><h3>等待第一个实验项目</h3><p>上传项目后，这里会变成 SK 的硬件和工具陈列舱。</p></div>`;
  }

  setText("[data-timeline-eyebrow]", content.timelineIntro.eyebrow);
  setText("[data-timeline-title]", content.timelineIntro.title);

  const timeline = document.querySelector("[data-timeline]");
  if (timeline) {
    const articleUpdates = (content.latestUpdates || []).filter((item) => item.type === "article");
    timeline.innerHTML = articleUpdates.length ? articleUpdates.map((item) => `
      <div class="timeline-item reveal">
        <span>新文章 · ${escapeHtml(item.section || "文章")}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>发布时间：${escapeHtml(item.displayDate || item.date)}</p>
      </div>
    `).join("") : `<div class="timeline-item reveal"><span>公告</span><h3>暂无新文章公告</h3><p>发布新文章后会显示在这里。</p></div>`;
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
  if (body) body.innerHTML = `${renderMedia(article.media)}${textToHtml(article.content)}`;
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
