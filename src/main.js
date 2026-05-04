import "./styles.css";

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
      return `<video controls preload="metadata" src="${url}"></video>`;
    }

    return `<img src="${url}" alt="${alt}" loading="lazy" />`;
  }).join("")}</div>`;
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

function updateSiteShell(content) {
  setAllText("[data-site-brand]", content.site.brand);
  setAllText("[data-site-footer]", content.site.footer);
  setMailLinks(content.site.email);
}

function renderHome(content) {
  updateSiteShell(content);

  setText("[data-hero-eyebrow]", content.hero.eyebrow);
  setText("[data-hero-title]", content.hero.title);
  setText("[data-hero-copy]", content.hero.copy);
  setText("[data-identity-title]", content.hero.identityTitle);
  setText("[data-identity-subtitle]", content.hero.identitySubtitle);
  setText("[data-terminal-name]", content.hero.terminalName);
  setText("[data-terminal-status]", content.hero.terminalStatus);

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

  setText("[data-articles-eyebrow]", content.articlesIntro.eyebrow);
  setText("[data-articles-title]", content.articlesIntro.title);
  setText("[data-articles-copy]", content.articlesIntro.copy);

  const articleGrid = document.querySelector("[data-article-grid]");
  if (articleGrid) {
    const devArticles = content.articles.filter((article) => article.section === "dev");
    articleGrid.innerHTML = devArticles.length
      ? devArticles.map(renderArticleCard).join("")
      : `<div class="empty-state glass-card reveal"><span class="empty-code">DEV_ARTICLE_COUNT = 0</span><h3>暂无开发笔记</h3><p>管理员发布“SK 的开发笔记”后会显示在这里。</p></div>`;
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
    `).join("") : `<div class="empty-state glass-card reveal"><span class="empty-code">PROJECT_COUNT = 0</span><h3>暂无公开项目</h3><p>管理员上传项目后会显示在这里。</p></div>`;
  }

  setText("[data-timeline-eyebrow]", content.timelineIntro.eyebrow);
  setText("[data-timeline-title]", content.timelineIntro.title);

  const timeline = document.querySelector("[data-timeline]");
  if (timeline) {
    const latest = content.latestUpdates?.map((item) => `
      <div class="timeline-item reveal">
        <span>${escapeHtml(item.section || item.type)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>更新时间：${escapeHtml(item.displayDate || item.date)}</p>
      </div>
    `).join("") || "";

    timeline.innerHTML = content.timeline.map((item) => `
      <div class="timeline-item reveal">
        <span>${escapeHtml(item.label)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.copy)}</p>
      </div>
    `).join("") + latest + `<div class="timeline-item reveal" data-github-status><span>GitHub</span><h3>正在读取最新提交</h3><p>如果网络允许，这里会显示仓库最新更新时间。</p></div>`;
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
        ? posts.map((article) => `
          <article class="acg-post-card">
            <time datetime="${escapeHtml(article.date)}">${escapeHtml(article.displayDate)}</time>
            <h4>${escapeHtml(article.title)}</h4>
            <p>${escapeHtml(article.summary)}</p>
            ${renderMedia(article.media)}
            <a class="inline-link" href="article.html?slug=${encodeURIComponent(article.slug)}">阅读全文</a>
          </article>
        `).join("")
        : `<p class="empty-mini">这个子板块还没有文章。</p>`;

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

async function renderGitHubStatus(content) {
  const status = document.querySelector("[data-github-status]");
  if (!status) return;

  try {
    const response = await fetch(`https://api.github.com/repos/${content.repo.owner}/${content.repo.name}/commits/${content.repo.branch}`, { cache: "no-store" });
    if (!response.ok) throw new Error("GitHub API unavailable");
    const commit = await response.json();
    const date = new Date(commit.commit.committer.date);
    status.innerHTML = `
      <span>GitHub</span>
      <h3>最新提交：${escapeHtml(commit.commit.message)}</h3>
      <p>更新时间：${date.toLocaleString("zh-CN")}；提交：${escapeHtml(commit.sha.slice(0, 7))}</p>
    `;
  } catch {
    status.innerHTML = `
      <span>GitHub</span>
      <h3>最新提交暂时无法读取</h3>
      <p>content.json 更新时间：${escapeHtml(content.updatedAt)}</p>
    `;
  }
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
    if (page === "home") renderGitHubStatus(content);
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
  await renderContent();
  restoreHashPosition();
  resizeCanvas();
  drawParticles();
  initReveal();
  initTilt();
  initMenu();
  initCursorGlow();
  updateProgress();
}

init();

window.addEventListener("resize", resizeCanvas);
window.addEventListener("scroll", updateProgress, { passive: true });
