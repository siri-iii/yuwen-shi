const API_BASE = localStorage.getItem("YW_API_BASE") || "http://127.0.0.1:5000";

const state = {
  patterns: {},
  patternList: [],
  demoItems: [],
  selectedFile: null,
  selectedPreviewUrl: "",
  latestResult: null,
};

const els = {
  navBtns: document.querySelectorAll(".nav-btn"),
  views: {
    home: document.getElementById("view-home"),
    recognize: document.getElementById("view-recognize"),
    result: document.getElementById("view-result"),
    knowledge: document.getElementById("view-knowledge"),
    about: document.getElementById("view-about"),
  },
  homeStartBtn: document.getElementById("home-start-btn"),
  homeKnowledgeBtn: document.getElementById("home-knowledge-btn"),
  fileInput: document.getElementById("file-input"),
  selectedFileTip: document.getElementById("selected-file-tip"),
  previewImage: document.getElementById("preview-image"),
  previewPlaceholder: document.getElementById("preview-placeholder"),
  demoGrid: document.getElementById("demo-grid"),
  recognizeBtn: document.getElementById("recognize-btn"),
  loadingBox: document.getElementById("loading-box"),
  recognizeError: document.getElementById("recognize-error"),
  resultEmpty: document.getElementById("result-empty"),
  resultContent: document.getElementById("result-content"),
  resultPatternName: document.getElementById("result-pattern-name"),
  resultConfidence: document.getElementById("result-confidence"),
  resultNote: document.getElementById("result-note"),
  resultVisualReason: document.getElementById("result-visual-reason"),
  resultExplanation: document.getElementById("result-explanation"),
  resultImage: document.getElementById("result-image"),
  knowledgeList: document.getElementById("knowledge-list"),
  artifactList: document.getElementById("artifact-list"),
  searchInput: document.getElementById("search-input"),
  objectFilter: document.getElementById("object-filter"),
  patternGrid: document.getElementById("pattern-grid"),
  patternDetail: document.getElementById("pattern-detail"),
  detailName: document.getElementById("detail-name"),
  detailVisual: document.getElementById("detail-visual"),
  detailMeaning: document.getElementById("detail-meaning"),
  detailObjects: document.getElementById("detail-objects"),
  detailPeriods: document.getElementById("detail-periods"),
  detailTips: document.getElementById("detail-tips"),
  detailArtifacts: document.getElementById("detail-artifacts"),
  apiBaseTip: document.getElementById("api-base-tip"),
  backendStatus: document.getElementById("backend-status"),
};

function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function toApiUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE}${path}`;
}

function setActiveView(viewName) {
  Object.entries(els.views).forEach(([name, element]) => {
    element.classList.toggle("active", name === viewName);
  });
  els.navBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });
}

function setPreview(file, previewUrl) {
  state.selectedFile = file;
  state.selectedPreviewUrl = previewUrl || "";
  els.selectedFileTip.textContent = file ? `当前图片：${file.name}` : "";
  if (previewUrl) {
    els.previewImage.src = previewUrl;
    els.previewImage.classList.remove("hidden");
    els.previewPlaceholder.classList.add("hidden");
  } else {
    els.previewImage.src = "";
    els.previewImage.classList.add("hidden");
    els.previewPlaceholder.classList.remove("hidden");
  }
}

function setRecognizeError(message) {
  if (!message) {
    els.recognizeError.classList.add("hidden");
    els.recognizeError.textContent = "";
    return;
  }
  els.recognizeError.textContent = message;
  els.recognizeError.classList.remove("hidden");
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `请求失败：${response.status}`);
  }
  return data;
}

function buildDemoItems(patterns) {
  const list = [];
  Object.keys(patterns).forEach((patternId) => {
    const pattern = patterns[patternId];
    const examples = pattern.image_examples || [];
    [1, 2].forEach((index) => {
      list.push({
        id: `${patternId}_${index}`,
        filename: `${patternId}_demo_0${index}.jpg`,
        patternId,
        patternName: pattern.name,
        thumb: examples[index - 1] || examples[0] || "",
      });
    });
  });
  return list;
}

function renderDemoGrid() {
  els.demoGrid.innerHTML = "";
  state.demoItems.forEach((item) => {
    const div = document.createElement("div");
    div.className = "demo-item";
    div.dataset.filename = item.filename;
    div.innerHTML = `
      <img src="${toApiUrl(item.thumb)}" alt="${item.patternName}" />
      <div><strong>${safeText(item.patternName)}</strong></div>
      <div class="muted">${safeText(item.filename)}</div>
    `;
    div.addEventListener("click", () => selectDemoItem(item, div));
    els.demoGrid.appendChild(div);
  });
}

async function selectDemoItem(item, element) {
  document.querySelectorAll(".demo-item").forEach((node) => node.classList.remove("active"));
  element.classList.add("active");

  let blob;
  try {
    const res = await fetch(toApiUrl(item.thumb));
    blob = await res.blob();
  } catch (_) {
    blob = new Blob(["demo"], { type: "image/jpeg" });
  }

  const file = new File([blob], item.filename, { type: blob.type || "image/jpeg" });
  const previewUrl = URL.createObjectURL(blob);
  setPreview(file, previewUrl);
  setRecognizeError("");
}

function renderKnowledgeFilterOptions() {
  const objectSet = new Set();
  state.patternList.forEach((pattern) => {
    (pattern.common_objects || []).forEach((name) => objectSet.add(name));
  });
  const options = Array.from(objectSet).sort((a, b) => a.localeCompare(b, "zh-CN"));
  options.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    els.objectFilter.appendChild(option);
  });
}

function renderPatternCards() {
  const keyword = els.searchInput.value.trim().toLowerCase();
  const objectFilter = els.objectFilter.value;

  const filtered = state.patternList.filter((pattern) => {
    const name = safeText(pattern.name).toLowerCase();
    const keywords = (pattern.keywords || []).join(" ").toLowerCase();
    const matchesKeyword = !keyword || name.includes(keyword) || keywords.includes(keyword);
    const matchesObject = !objectFilter || (pattern.common_objects || []).includes(objectFilter);
    return matchesKeyword && matchesObject;
  });

  els.patternGrid.innerHTML = "";
  filtered.forEach((pattern) => {
    const article = document.createElement("article");
    article.className = "pattern-item";
    article.innerHTML = `
      <h4>${safeText(pattern.name)}</h4>
      <p class="muted">${safeText(pattern.visual_features)}</p>
      <p>常见器物：${safeText((pattern.common_objects || []).join("、"))}</p>
    `;
    article.addEventListener("click", () => showPatternDetail(pattern));
    els.patternGrid.appendChild(article);
  });
}

async function showPatternDetail(pattern) {
  const patternId = pattern.pattern_id;
  let detail = pattern;
  let artifacts = [];
  try {
    detail = await requestJson(`${API_BASE}/api/patterns/${patternId}`);
    artifacts = await requestJson(`${API_BASE}/api/artifacts?pattern=${encodeURIComponent(patternId)}`);
  } catch (_) {
    // 接口失败时回退到本地已加载数据，保证页面仍可展示。
    artifacts = [];
  }

  els.patternDetail.classList.remove("hidden");
  els.detailName.textContent = safeText(detail.name);
  els.detailVisual.textContent = `视觉特征：${safeText(detail.visual_features)}`;
  els.detailMeaning.textContent = `文化寓意：${safeText(detail.cultural_meaning)}`;
  els.detailObjects.textContent = `常见器物：${safeText((detail.common_objects || []).join("、"))}`;
  els.detailPeriods.textContent = `常见时期：${safeText((detail.periods || []).join("、"))}`;
  els.detailTips.textContent = `鉴赏提示：${safeText(detail.appreciation_tips)}`;

  els.detailArtifacts.innerHTML = "";
  artifacts.slice(0, 3).forEach((artifact) => {
    const item = document.createElement("article");
    item.className = "artifact-item";
    item.innerHTML = `
      <div><strong>${safeText(artifact.name)}</strong></div>
      <div class="muted">${safeText(artifact.period)} · ${safeText(artifact.object_type)}</div>
      <p>${safeText(artifact.description)}</p>
      <img src="${toApiUrl(artifact.image)}" alt="${safeText(artifact.name)}" />
    `;
    els.detailArtifacts.appendChild(item);
  });
}

function renderResult(result) {
  if (!result || !result.success) {
    els.resultEmpty.classList.remove("hidden");
    els.resultContent.classList.add("hidden");
    return;
  }

  els.resultEmpty.classList.add("hidden");
  els.resultContent.classList.remove("hidden");
  els.resultPatternName.textContent = `${safeText(result.pattern_name)}（${safeText(result.pattern_id)}）`;
  els.resultConfidence.textContent = `匹配度：${Math.round(Number(result.confidence || 0) * 100)}%`;
  els.resultNote.textContent = safeText(result.note);
  els.resultVisualReason.textContent = `视觉依据：${safeText(result.visual_reason)}`;
  els.resultExplanation.textContent = safeText(result.ai_explanation);
  els.resultImage.src = state.selectedPreviewUrl || "";
  els.resultImage.classList.toggle("hidden", !state.selectedPreviewUrl);

  const knowledge = result.knowledge || {};
  els.knowledgeList.innerHTML = `
    <li>文化寓意：${safeText(knowledge.meaning)}</li>
    <li>常见器物：${safeText((knowledge.common_objects || []).join("、"))}</li>
    <li>常见时期：${safeText((knowledge.periods || []).join("、"))}</li>
    <li>鉴赏提示：${safeText(knowledge.appreciation)}</li>
  `;

  const artifacts = result.similar_artifacts || [];
  els.artifactList.innerHTML = "";
  artifacts.forEach((artifact) => {
    const item = document.createElement("article");
    item.className = "artifact-item";
    item.innerHTML = `
      <div><strong>${safeText(artifact.name)}</strong></div>
      <div class="muted">${safeText(artifact.period)} · ${safeText(artifact.object_type)}</div>
      <p>${safeText(artifact.description)}</p>
      <img src="${toApiUrl(artifact.image)}" alt="${safeText(artifact.name)}" />
    `;
    els.artifactList.appendChild(item);
  });
}

async function runRecognize() {
  setRecognizeError("");
  if (!state.selectedFile) {
    setRecognizeError("请先选择图片或点击示例图片。");
    return;
  }

  els.loadingBox.classList.remove("hidden");
  try {
    const formData = new FormData();
    formData.append("image", state.selectedFile, state.selectedFile.name);
    const result = await requestJson(`${API_BASE}/api/recognize`, {
      method: "POST",
      body: formData,
    });
    state.latestResult = result;
    renderResult(result);
    setActiveView("result");
  } catch (error) {
    setRecognizeError(error.message || "识别失败，请稍后重试。");
  } finally {
    els.loadingBox.classList.add("hidden");
  }
}

async function initData() {
  const patternsObj = await requestJson(`${API_BASE}/api/patterns`);
  state.patterns = patternsObj || {};
  state.patternList = Object.values(patternsObj || {});
  state.demoItems = buildDemoItems(state.patterns);

  renderDemoGrid();
  renderKnowledgeFilterOptions();
  renderPatternCards();
}

function bindEvents() {
  els.apiBaseTip.textContent = API_BASE;

  els.navBtns.forEach((btn) => {
    btn.addEventListener("click", () => setActiveView(btn.dataset.view));
  });

  els.homeStartBtn.addEventListener("click", () => setActiveView("recognize"));
  els.homeKnowledgeBtn.addEventListener("click", () => setActiveView("knowledge"));
  els.recognizeBtn.addEventListener("click", runRecognize);

  els.fileInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setPreview(file, previewUrl);
    document.querySelectorAll(".demo-item").forEach((node) => node.classList.remove("active"));
    setRecognizeError("");
  });

  els.searchInput.addEventListener("input", renderPatternCards);
  els.objectFilter.addEventListener("change", renderPatternCards);
}

async function checkBackendHealth() {
  try {
    const result = await requestJson(`${API_BASE}/api/health`);
    if (result.status === "ok") {
      els.backendStatus.textContent = "后端状态：正常";
      return;
    }
  } catch (_) {
    // ignore
  }
  els.backendStatus.textContent = "后端状态：不可用（请先启动 backend/app.py）";
}

async function bootstrap() {
  bindEvents();
  renderResult(null);
  setPreview(null, "");
  await checkBackendHealth();
  try {
    await initData();
  } catch (error) {
    setRecognizeError(`初始化失败：${error.message}`);
  }
}

bootstrap();
