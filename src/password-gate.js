const ACCESS_KEY = "skLabAccessGranted";
const SITE_PASSWORD = "123";

export function requirePasswordAccess() {
  if (sessionStorage.getItem(ACCESS_KEY) === "true") return Promise.resolve();

  document.body.classList.add("is-locked");

  return new Promise((resolve) => {
    const gate = document.createElement("div");
    gate.className = "password-gate";
    gate.innerHTML = `
      <div class="gate-grid" aria-hidden="true"></div>
      <div class="gate-card" role="dialog" aria-modal="true" aria-labelledby="gateTitle">
        <div class="gate-orb" aria-hidden="true">
          <span></span>
          <span></span>
          <strong>SK</strong>
        </div>
        <p class="gate-kicker">PRIVATE SIGNAL</p>
        <h1 id="gateTitle">SK Lab 访问验证</h1>
        <p class="gate-copy">输入访问密码，解锁嵌入式开发、项目实验室和游戏动漫频道。</p>
        <form class="gate-form">
          <label for="gatePassword">Access Password</label>
          <div class="gate-input-row">
            <input id="gatePassword" type="password" inputmode="numeric" autocomplete="current-password" placeholder="输入密码" />
            <button type="submit">解锁</button>
          </div>
          <p class="gate-error" role="alert" aria-live="polite"></p>
        </form>
      </div>
    `;

    const form = gate.querySelector(".gate-form");
    const input = gate.querySelector("#gatePassword");
    const error = gate.querySelector(".gate-error");

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (input.value === SITE_PASSWORD) {
        sessionStorage.setItem(ACCESS_KEY, "true");
        gate.dataset.message = "ACCESS GRANTED";
        gate.classList.add("is-unlocking");
        window.setTimeout(() => {
          gate.remove();
          document.body.classList.remove("is-locked");
          resolve();
        }, 840);
        return;
      }

      error.textContent = "密码错误，请重新输入。";
      gate.classList.remove("is-denied");
      requestAnimationFrame(() => gate.classList.add("is-denied"));
      input.select();
    });

    document.body.append(gate);
    window.setTimeout(() => input.focus(), 80);
  });
}
