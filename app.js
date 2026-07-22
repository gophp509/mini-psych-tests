const app = document.querySelector("#app");

const params = new URLSearchParams(location.search);
const testId = params.get("test") || "love-attraction";

const state = {
  config: null,
  answers: [],
  screen: "loading",
};

async function loadConfig() {
  if (params.has("config")) {
    const encoded = params.get("config");
    const json = decodeURIComponent(escape(atob(encoded.replace(/-/g, "+").replace(/_/g, "/"))));
    return JSON.parse(json);
  }

  const response = await fetch(`./configs/${testId}.json`, { cache: "no-store" });
  if (!response.ok) throw new Error(`配置不存在：${testId}`);
  return response.json();
}

function score() {
  const counts = Object.fromEntries(state.config.results.map((item) => [item.key, 0]));
  for (const answer of state.answers) counts[answer] = (counts[answer] || 0) + 1;
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const primary = ranked[0][0];
  const secondary = ranked[1] && ranked[0][1] - ranked[1][1] <= state.config.secondaryThreshold ? ranked[1][0] : null;
  return { counts, primary, secondary };
}

function layout(inner) {
  app.innerHTML = `<div class="shell"><div class="topline"></div>${inner}</div>`;
}

function renderHome() {
  const config = state.config;
  layout(`
    <section class="card">
      <div class="eyebrow">${config.badge}</div>
      <h1>${config.title}</h1>
      <p class="lead">${config.subtitle}</p>
      <div class="section-grid">
        ${config.dimensions.map((item) => `<div class="pill">${item}</div>`).join("")}
      </div>
      <p>${config.intro}</p>
      <button class="primary-btn" data-action="start">开始测试</button>
      <p class="muted">${config.disclaimer}</p>
    </section>
  `);
}

function renderQuestion() {
  const config = state.config;
  const index = state.answers.length;
  const question = config.questions[index];
  layout(`
    <section class="card">
      <div class="progress">${String(index + 1).padStart(2, "0")} / ${config.questions.length}</div>
      <div class="module">${question.module}</div>
      <h2>${question.text}</h2>
      ${question.options
        .map(
          (option) => `
            <button class="option" data-answer="${option.key}">
              <span class="option-key">${option.key}</span>
              <span>${option.text}</span>
            </button>
          `,
        )
        .join("")}
      <p class="muted">选择后自动进入下一题</p>
    </section>
  `);
}

function renderResult() {
  const config = state.config;
  const result = score();
  const profile = config.results.find((item) => item.key === result.primary);
  const secondary = config.results.find((item) => item.key === result.secondary);
  const total = state.answers.length || 1;
  layout(`
    <section class="card">
      <div class="eyebrow">你的测试结果</div>
      <h1 class="result-title">${profile.name}</h1>
      <p class="lead">${profile.subtitle}</p>
      <div class="metric">
        ${Object.entries(result.counts)
          .map(([key, value]) => {
            const name = config.results.find((item) => item.key === key)?.name || key;
            return `
              <div class="metric-row"><span>${name}</span><span>${value}/${total}</span></div>
              <div class="bar"><span style="width:${Math.round((value / total) * 100)}%"></span></div>
            `;
          })
          .join("")}
      </div>
      ${secondary ? `<p class="muted">副倾向：${secondary.name}</p>` : ""}
      ${profile.report
        .map(
          (block) => `
            <div class="report-block">
              <h3>${block.title}</h3>
              <p>${block.body}</p>
            </div>
          `,
        )
        .join("")}
      <div class="actions">
        <button class="secondary-btn" data-action="restart">重新测试</button>
        <button class="primary-btn" data-action="copy">复制结果</button>
      </div>
    </section>
  `);
}

function renderError(error) {
  layout(`
    <section class="card error">
      <h2>配置加载失败</h2>
      <p>${error.message}</p>
      <p class="muted">检查 URL 里的 test 参数，或确认 configs 目录里存在对应 JSON。</p>
    </section>
  `);
}

function render() {
  if (state.screen === "home") renderHome();
  if (state.screen === "question") renderQuestion();
  if (state.screen === "result") renderResult();
}

app.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.action === "start") {
    state.answers = [];
    state.screen = "question";
    render();
  }

  if (button.dataset.answer) {
    state.answers.push(button.dataset.answer);
    state.screen = state.answers.length >= state.config.questions.length ? "result" : "question";
    render();
  }

  if (button.dataset.action === "restart") {
    state.answers = [];
    state.screen = "home";
    render();
  }

  if (button.dataset.action === "copy") {
    const result = score();
    const profile = state.config.results.find((item) => item.key === result.primary);
    await navigator.clipboard.writeText(`我测出了：${profile.name}\n${profile.subtitle}`);
    button.textContent = "已复制";
  }
});

loadConfig()
  .then((config) => {
    state.config = config;
    state.screen = "home";
    document.title = config.metaTitle || config.title;
    render();
  })
  .catch(renderError);
