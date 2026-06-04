const API_BASE = localStorage.getItem("YW_API_BASE") || "http://127.0.0.1:5000";
const ASSETS = "./assets/images";

const state = {
  patterns: {},
  patternList: [],
  demoItems: [],
  selectedFile: null,
  selectedPreviewUrl: "",
  latestResult: null,
  selectedPatternId: null,
};

const els = {
  navBtns: document.querySelectorAll(".nav-btn"),
  brandLink: document.querySelector(".brand"),
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
  fileDropZone: document.getElementById("file-drop-zone"),
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
  resultConfidencePct: document.getElementById("result-confidence-pct"),
  resultConfidenceFill: document.getElementById("result-confidence-fill"),
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

function patternCoverUrl(pattern) {
  const id = pattern.pattern_id || pattern.patternId;
  if (id) return `${ASSETS}/patterns/${id}.jpg`;
  const examples = pattern.image_examples || [];
  if (examples[0]) return toApiUrl(examples[0]);
  return "";
}

function imgOnError(el) {
  el.onerror = null;
  el.style.opacity = "0.35";
  el.alt = "图片待补充";
}

function setActiveView(viewName) {
  Object.entries(els.views).forEach(([name, element]) => {
    element.classList.toggle("active", name === viewName);
  });
  els.navBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setPreview(file, previewUrl) {
  state.selectedFile = file;
  state.selectedPreviewUrl = previewUrl || "";
  els.selectedFileTip.textContent = file ? `已选择：${file.name}` : "";
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

function applyFile(file) {
  if (!file) return;
  const previewUrl = URL.createObjectURL(file);
  setPreview(file, previewUrl);
  document.querySelectorAll(".demo-item").forEach((node) => node.classList.remove("active"));
  setRecognizeError("");
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
    div.innerHTML = `
      <img src="${toApiUrl(item.thumb)}" alt="${safeText(item.patternName)}" />
      <div class="demo-item-body">
        <strong>${safeText(item.patternName)}</strong>
        <div class="muted">${safeText(item.filename)}</div>
      </div>
    `;
    const img = div.querySelector("img");
    img.onerror = () => imgOnError(img);
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
    if (res.ok) blob = await res.blob();
  } catch (_) {
    /* ignore */
  }
  if (!blob) blob = new Blob(["demo"], { type: "image/jpeg" });

  const file = new File([blob], item.filename, { type: blob.type || "image/jpeg" });
  applyFile(file);
}

function renderArtifactCard(artifact) {
  const item = document.createElement("article");
  item.className = "artifact-item";
  const imgSrc = toApiUrl(artifact.image);
  item.innerHTML = `
    <img src="${imgSrc}" alt="${safeText(artifact.name)}" />
    <div class="artifact-item-body">
      <strong>${safeText(artifact.name)}</strong>
      <div class="artifact-meta">${safeText(artifact.period)} · ${safeText(artifact.object_type)}</div>
      <p>${safeText(artifact.description)}</p>
    </div>
  `;
  const img = item.querySelector("img");
  img.onerror = () => imgOnError(img);
  return item;
}

function renderKnowledgeFilterOptions() {
  const objectSet = new Set();
  state.patternList.forEach((pattern) => {
    (pattern.common_objects || []).forEach((name) => objectSet.add(name));
  });
  Array.from(objectSet)
    .sort((a, b) => a.localeCompare(b, "zh-CN"))
    .forEach((name) => {
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
    if (pattern.pattern_id === state.selectedPatternId) {
      article.classList.add("is-selected");
    }
    const cover = patternCoverUrl(pattern);
    const apiFallback = (pattern.image_examples || [])[0] ? toApiUrl(pattern.image_examples[0]) : "";
    const tags = (pattern.keywords || [])
      .slice(0, 3)
      .map((k) => `<span class="tag">${safeText(k)}</span>`)
      .join("");

    article.innerHTML = `
      <img class="pattern-item-thumb" src="${cover}" alt="${safeText(pattern.name)}" data-fallback="${apiFallback}" />
      <div class="pattern-item-body">
        <h4>${safeText(pattern.name)}</h4>
        <p class="muted">${safeText(pattern.visual_features).slice(0, 48)}…</p>
        <div class="pattern-tags">${tags}</div>
      </div>
    `;
    const thumb = article.querySelector(".pattern-item-thumb");
    thumb.onerror = function onThumbError() {
      if (thumb.dataset.fallback && thumb.src !== thumb.dataset.fallback) {
        thumb.src = thumb.dataset.fallback;
        thumb.onerror = () => imgOnError(thumb);
        return;
      }
      imgOnError(thumb);
    };
    article.addEventListener("click", () => showPatternDetail(pattern, article));
    els.patternGrid.appendChild(article);
  });
}

async function showPatternDetail(pattern, cardEl) {
  const patternId = pattern.pattern_id;
  state.selectedPatternId = patternId;
  document.querySelectorAll(".pattern-item").forEach((el) => {
    el.classList.toggle("is-selected", el === cardEl);
  });

  let detail = pattern;
  let artifacts = [];
  try {
    detail = await requestJson(`${API_BASE}/api/patterns/${patternId}`);
    artifacts = await requestJson(`${API_BASE}/api/artifacts?pattern=${encodeURIComponent(patternId)}`);
  } catch (_) {
    artifacts = [];
  }

  els.patternDetail.classList.remove("hidden");
  els.detailName.textContent = safeText(detail.name);
  els.detailVisual.innerHTML = `<strong>视觉特征</strong> ${safeText(detail.visual_features)}`;
  els.detailMeaning.innerHTML = `<strong>文化寓意</strong> ${safeText(detail.cultural_meaning)}`;
  els.detailObjects.innerHTML = `<strong>常见器物</strong> ${safeText((detail.common_objects || []).join("、"))}`;
  els.detailPeriods.innerHTML = `<strong>常见时期</strong> ${safeText((detail.periods || []).join("、"))}`;
  els.detailTips.innerHTML = `<strong>鉴赏提示</strong> ${safeText(detail.appreciation_tips)}`;

  els.detailArtifacts.innerHTML = "";
  artifacts.slice(0, 3).forEach((artifact) => {
    els.detailArtifacts.appendChild(renderArtifactCard(artifact));
  });

  els.patternDetail.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderResult(result) {
  if (!result || !result.success) {
    els.resultEmpty.classList.remove("hidden");
    els.resultContent.classList.add("hidden");
    return;
  }

  els.resultEmpty.classList.add("hidden");
  els.resultContent.classList.remove("hidden");

  const pct = Math.round(Number(result.confidence || 0) * 100);
  els.resultPatternName.textContent = safeText(result.pattern_name);
  if (els.resultConfidencePct) els.resultConfidencePct.textContent = String(pct);
  els.resultConfidence.textContent = `纹样匹配度`;
  if (els.resultConfidenceFill) {
    requestAnimationFrame(() => {
      els.resultConfidenceFill.style.width = `${pct}%`;
    });
  }

  const note = safeText(result.note);
  els.resultNote.textContent = note;
  els.resultNote.classList.toggle("hidden", !note);

  els.resultVisualReason.textContent = safeText(result.visual_reason);
  els.resultExplanation.textContent = safeText(result.ai_explanation);

  if (state.selectedPreviewUrl) {
    els.resultImage.src = state.selectedPreviewUrl;
    els.resultImage.classList.remove("hidden");
  } else {
    els.resultImage.classList.add("hidden");
  }

  const knowledge = result.knowledge || {};
  const knowledgeRows = [
    { label: "文化寓意", value: safeText(knowledge.meaning) },
    { label: "常见器物", value: safeText((knowledge.common_objects || []).join("、")) },
    { label: "常见时期", value: safeText((knowledge.periods || []).join("、")) },
    { label: "鉴赏提示", value: safeText(knowledge.appreciation) },
  ];
  els.knowledgeList.innerHTML = knowledgeRows
    .map(
      (row) => `
    <li class="knowledge-item">
      <span class="knowledge-label">${row.label}</span>
      <p class="knowledge-value">${row.value}</p>
    </li>`
    )
    .join("");

  els.artifactList.innerHTML = "";
  (result.similar_artifacts || []).forEach((artifact) => {
    els.artifactList.appendChild(renderArtifactCard(artifact));
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

function bindDropZone() {
  const zone = els.fileDropZone;
  if (!zone) return;

  ["dragenter", "dragover"].forEach((evt) => {
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.add("is-dragover");
    });
  });

  ["dragleave", "drop"].forEach((evt) => {
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.remove("is-dragover");
    });
  });

  zone.addEventListener("drop", (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (file) applyFile(file);
  });
}

function bindEvents() {
  els.apiBaseTip.textContent = API_BASE;

  els.navBtns.forEach((btn) => {
    btn.addEventListener("click", () => setActiveView(btn.dataset.view));
  });

  if (els.brandLink) {
    els.brandLink.addEventListener("click", (e) => {
      e.preventDefault();
      setActiveView("home");
    });
  }

  document.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => setActiveView(btn.dataset.goto));
  });

  els.homeStartBtn.addEventListener("click", () => setActiveView("recognize"));
  els.homeKnowledgeBtn.addEventListener("click", () => setActiveView("knowledge"));
  els.recognizeBtn.addEventListener("click", runRecognize);

  els.fileInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) applyFile(file);
  });

  bindDropZone();
  els.searchInput.addEventListener("input", renderPatternCards);
  els.objectFilter.addEventListener("change", renderPatternCards);
}

async function checkBackendHealth() {
  const pill = els.backendStatus;
  pill.classList.remove("is-ok", "is-error");
  try {
    const result = await requestJson(`${API_BASE}/api/health`);
    if (result.status === "ok") {
      pill.textContent = "服务正常";
      pill.classList.add("is-ok");
      return;
    }
  } catch (_) {
    /* ignore */
  }
  pill.textContent = "后端未连接";
  pill.classList.add("is-error");
}

async function bootstrap() {
  bindEvents();
  renderResult(null);
  setPreview(null, "");
  if (els.resultConfidenceFill) els.resultConfidenceFill.style.width = "0%";
  await checkBackendHealth();
  try {
    await initData();
  } catch (error) {
    setRecognizeError(`初始化失败：${error.message}`);
  }
}

bootstrap();
