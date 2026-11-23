/* ИИ-озвучка Burunduki — отдельный модуль, не вмешивается в аудиоплеер и плейлисты. */
(() => {
  "use strict";
  const TABLE = "burunduk_ai_voices";
  const workerUrl = () => (typeof AI_VOICE_WORKER_URL === "string" ? AI_VOICE_WORKER_URL : "").replace(/\/$/, "");
  let voices = [];
  let activeVoice = null;
  let sampleMode = "upload";
  let generatedObjectUrl = null;

  const $ = id => document.getElementById(id);
  const gallery = $("galleryAiVoices");
  const detail = $("aiVoiceDetail");
  const modal = $("aiVoiceCreateModal");
  const addButton = $("audioAiNarrationBtn");

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function toast(message) {
    if (typeof showToast === "function") showToast(message);
    else alert(message);
  }
  function setAudioMode(mode) {
    if (typeof currentAudioSectionMode !== "undefined") currentAudioSectionMode = mode;
    $("audioLibraryBtn")?.classList.toggle("active", mode === "audio");
    $("audioPlaylistsBtn")?.classList.toggle("active", mode === "playlists");
    addButton?.classList.toggle("active", mode === "ai-voices");
    $("uploadAudioBtn")?.classList.toggle("hidden", mode !== "audio");
    $("uploadPlaylistBtn")?.classList.toggle("hidden", mode !== "playlists");
    $("uploadAiVoiceBtn")?.classList.toggle("hidden", mode !== "ai-voices");
    $("galleryAudio")?.classList.toggle("hidden", mode !== "audio");
    $("galleryPlaylists")?.classList.toggle("hidden", mode !== "playlists");
    gallery?.classList.toggle("hidden", mode !== "ai-voices");
    $("playlistsModal")?.classList.add("hidden");
    detail?.classList.add("hidden");
    if (mode === "ai-voices") {
      loadVoices();
      $("status").textContent = "Общая библиотека ИИ-голосов";
    } else if (mode === "audio" && typeof applyAudioSearch === "function") applyAudioSearch();
  }

  async function loadVoices() {
    if (!gallery || !db) return;
    gallery.innerHTML = '<div class="ai-voice-empty">Загружаю голоса…</div>';
    const {data, error} = await db.from(TABLE)
      .select("id,title,description,sample_r2_key,sample_r2_url,cover_url,owner_name,owner_code,category_id,created_at")
      .order("created_at", {ascending:false}).limit(300);
    if (error) {
      gallery.innerHTML = '<div class="ai-voice-empty">Не удалось загрузить голоса. Проверь migration_add_ai_voices.sql: '+escapeHtml(error.message)+'</div>';
      return;
    }
    voices = data || [];
    renderVoices();
  }

  function renderVoices() {
    if (!gallery) return;
    const query = ($("searchInput")?.value || "").trim().toLocaleLowerCase("ru");
    const allowed = Array.isArray(allCategories) ? new Set(allCategories.map(c => c.id)) : null;
    const rows = voices.filter(v =>
      (!v.category_id || !allowed || allowed.has(v.category_id)) &&
      (typeof currentCategoryFilter === "undefined" || currentCategoryFilter === "all" || v.category_id === currentCategoryFilter) &&
      (!query || `${v.title} ${v.description || ""} ${v.owner_name || ""}`.toLocaleLowerCase("ru").includes(query))
    );
    if (!rows.length) {
      gallery.innerHTML = `<div class="ai-voice-empty"><div class="ai-voice-empty-icon">🎙️</div><b>Голосов пока нет</b><span>Добавь первый голос в общую библиотеку.</span></div>`;
      return;
    }
    gallery.innerHTML = rows.map(v => `
      <button class="ai-voice-card" type="button" data-voice-id="${escapeHtml(v.id)}">
        <div class="ai-voice-card-cover">${v.cover_url ? `<img src="${escapeHtml(v.cover_url)}" alt="">` : '<span>🎙️</span>'}</div>
        <div class="ai-voice-card-info"><strong>${escapeHtml(v.title)}</strong>
          <span class="ai-voice-card-author">Автор: ${escapeHtml(v.owner_name || "Неизвестен")}</span>
          <span class="ai-voice-card-description">${escapeHtml(v.description || "Описание не добавлено")}</span>
        </div>
      </button>`).join("");
    gallery.querySelectorAll("[data-voice-id]").forEach(card => card.addEventListener("click", () => openVoice(card.dataset.voiceId)));
  }

  function openVoice(id) {
    activeVoice = voices.find(v => v.id === id);
    if (!activeVoice) return;
    gallery.classList.add("hidden");
    detail.classList.remove("hidden");
    detail.innerHTML = `
      <button class="tool-btn ai-voice-back" id="aiVoiceBack" type="button">← К общей ленте</button>
      <div class="ai-voice-detail-head">
        <div class="ai-voice-detail-cover">${activeVoice.cover_url ? `<img src="${escapeHtml(activeVoice.cover_url)}" alt="">` : "🎙️"}</div>
        <div><h2>${escapeHtml(activeVoice.title)}</h2><div class="ai-voice-card-author">Автор: ${escapeHtml(activeVoice.owner_name || "Неизвестен")}</div>
        <p>${escapeHtml(activeVoice.description || "Описание не добавлено")}</p></div>
      </div>
      <div class="ai-voice-generator">
        <h3>✨ Создать озвучку</h3>
        <p>Введи текст — язык определится автоматически. Используй только голос, на клонирование которого у тебя есть разрешение.</p>
        <textarea id="aiVoiceText" rows="7" maxlength="5000" placeholder="Напиши текст, который нужно озвучить…"></textarea>
        <button id="aiVoiceGenerate" class="pick-btn" type="button">✨ Сгенерировать озвучку</button>
        <div id="aiVoiceGenerateStatus" class="ai-voice-generate-status" aria-live="polite"></div>
        <div id="aiVoiceResult" class="ai-voice-result hidden">
          <audio id="aiVoiceResultAudio" controls></audio>
          <a id="aiVoiceDownload" class="pick-btn small" download="burunduki-ai-voice.mp3">⬇ Скачать аудио</a>
        </div>
      </div>`;
    $("aiVoiceBack").addEventListener("click", () => {
      detail.classList.add("hidden"); gallery.classList.remove("hidden"); activeVoice = null;
    });
    $("aiVoiceGenerate").addEventListener("click", generateSpeech);
  }

  async function generateSpeech() {
    const text = $("aiVoiceText")?.value.trim();
    if (!text) return toast("Введи текст для озвучки");
    if (text.length > 5000) return toast("Максимум 5000 символов");
    const status = $("aiVoiceGenerateStatus"), button = $("aiVoiceGenerate");
    const base = workerUrl();
    if (!base || base.includes("REPLACE-WITH")) return toast("Сначала укажи URL Cloudflare Worker в config.js");
    button.disabled = true;
    status.textContent = "Модель готовит озвучку. Это может занять несколько минут…";
    $("aiVoiceResult").classList.add("hidden");
    try {
      const response = await fetch(`${base}/generate`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({text, referenceAudioUrl:activeVoice.sample_r2_url})
      });
      if (!response.ok) {
        let message = `Ошибка Worker: HTTP ${response.status}`;
        try { const data = await response.json(); message = data.error || message; } catch {}
        throw new Error(message);
      }
      const blob = await response.blob();
      if (!blob.size) throw new Error("Модель вернула пустой аудиофайл");
      if (generatedObjectUrl) URL.revokeObjectURL(generatedObjectUrl);
      generatedObjectUrl = URL.createObjectURL(blob);
      $("aiVoiceResultAudio").src = generatedObjectUrl;
      $("aiVoiceDownload").href = generatedObjectUrl;
      $("aiVoiceDownload").download = `${(activeVoice.title || "voice").replace(/[^\p{L}\p{N}_-]+/gu,"_")}-generated.mp3`;
      $("aiVoiceResult").classList.remove("hidden");
      status.textContent = "Готово! Аудио доступно для прослушивания и скачивания. Оно не публиковалось в аудиогалерее.";
    } catch (error) {
      status.textContent = error.message || "Не удалось сгенерировать озвучку";
    } finally { button.disabled = false; }
  }

  function populateCategories() {
    const select = $("aiVoiceCategory");
    if (!select) return;
    const categories = Array.isArray(allCategories) ? allCategories.filter(c => c.status === "approved") : [];
    select.innerHTML = '<option value="">Выбери раздел</option>' +
      categories.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join("") +
      '<option value="__new__">＋ Предложить новый раздел…</option>';
  }

  function populateAudioLibrary() {
    const select = $("aiVoiceAudioSelect");
    if (!select) return;
    const records = Array.isArray(allAudioRecords) ? allAudioRecords : [];
    select.innerHTML = '<option value="">Выбери аудиозапись</option>' + records.map(a =>
      `<option value="${escapeHtml(a.id)}">${escapeHtml(a.title)} — ${escapeHtml(a.owner_name || "Автор неизвестен")}</option>`).join("");
    if (!records.length) select.innerHTML = '<option value="">Аудиогалерея пока пуста</option>';
  }

  function setSampleMode(mode) {
    sampleMode = mode;
    $("aiVoiceUploadSource").classList.toggle("active", mode === "upload");
    $("aiVoiceLibrarySource").classList.toggle("active", mode === "library");
    $("aiVoiceUploadPanel").classList.toggle("hidden", mode !== "upload");
    $("aiVoiceLibraryPanel").classList.toggle("hidden", mode !== "library");
    if (mode === "library") {
      if (typeof loadAudio === "function" && (!Array.isArray(allAudioRecords) || !allAudioRecords.length)) {
        loadAudio().then(populateAudioLibrary);
      } else populateAudioLibrary();
    }
  }

  function openCreateModal() {
    if (!currentIdentity) { toast("Сначала выбери имя"); return; }
    $("aiVoiceTitle").value = ""; $("aiVoiceDescription").value = "";
    $("aiVoiceSampleFile").value = ""; $("aiVoiceNewCategory").value = "";
    $("aiVoiceNewCategoryWrap").classList.add("hidden");
    populateCategories(); setSampleMode("upload");
    modal.classList.add("active");
  }

  $("aiVoiceCategory")?.addEventListener("change", () => $("aiVoiceNewCategoryWrap").classList.toggle("hidden", $("aiVoiceCategory").value !== "__new__"));
  $("aiVoiceUploadSource")?.addEventListener("click", () => setSampleMode("upload"));
  $("aiVoiceLibrarySource")?.addEventListener("click", () => setSampleMode("library"));
  $("aiVoiceCreateCancel")?.addEventListener("click", () => modal.classList.remove("active"));
  addButton?.addEventListener("click", () => setAudioMode("ai-voices"));

  $("aiVoiceCreateSave")?.addEventListener("click", async () => {
    if (!currentIdentity) return toast("Сначала выбери имя");
    const title = $("aiVoiceTitle").value.trim();
    if (!title) return toast("Введи название голоса");
    let sampleFile = null, sampleUrl = null, sampleKey = null, coverUrl = null;
    if (sampleMode === "upload") {
      sampleFile = $("aiVoiceSampleFile").files[0];
      if (!sampleFile) return toast("Выбери образец аудио");
      if (sampleFile.size > 20 * 1024 * 1024) return toast("Файл должен быть не больше 20 МБ");
      if (!sampleFile.type.startsWith("audio/")) return toast("Нужен аудиофайл");
    } else {
      const audio = (Array.isArray(allAudioRecords) ? allAudioRecords : []).find(a => a.id === $("aiVoiceAudioSelect").value);
      if (!audio) return toast("Выбери трек из аудиогалереи");
      sampleUrl = audio.r2_url; sampleKey = null; coverUrl = audio.cover_r2_url || null;
      if (!sampleUrl) return toast("У выбранного трека отсутствует ссылка на файл");
    }
    let categoryId = $("aiVoiceCategory").value;
    if (!categoryId) return toast("Выбери раздел публикации");
    if (categoryId === "__new__") {
      const name = $("aiVoiceNewCategory").value.trim();
      if (!name) return toast("Введи название нового раздела");
      const created = await createPendingCategory(name, currentIdentity.name, currentIdentity.code);
      if (!created) return toast("Не удалось создать раздел");
      categoryId = created.id;
    }

    const save = $("aiVoiceCreateSave"), progress = $("aiVoiceUploadProgress");
    save.disabled = true; progress.classList.remove("hidden");
    try {
      if (sampleFile) {
        progress.textContent = "Загружаю образец в Cloudflare R2…";
        const form = new FormData(); form.append("file", sampleFile);
        const response = await fetch(`${workerUrl()}/upload`, {method:"POST", body:form});
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `R2 upload HTTP ${response.status}`);
        sampleUrl = result.url; sampleKey = result.key;
      } else {
        progress.textContent = "Копирую выбранный трек в Cloudflare R2…";
        const response = await fetch(`${workerUrl()}/import`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body:JSON.stringify({url:sampleUrl})
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `R2 import HTTP ${response.status}`);
        sampleUrl = result.url; sampleKey = result.key;
      }
      const {error} = await db.from(TABLE).insert({
        title, description:$("aiVoiceDescription").value.trim() || null,
        sample_r2_key:sampleKey, sample_r2_url:sampleUrl, cover_url:coverUrl,
        owner_name:currentIdentity.name, owner_code:currentIdentity.code,
        category_id:categoryId, created_at:new Date().toISOString()
      });
      if (error) throw error;
      modal.classList.remove("active");
      toast("Голос опубликован в общей ленте 🎙️");
      await loadVoices();
    } catch (error) {
      progress.textContent = "Ошибка: " + (error.message || error);
      toast("Не удалось опубликовать голос: " + (error.message || error));
    } finally { save.disabled = false; }
  });

  // Подхватываем поиск и категорийный фильтр сайта, не трогая другие вкладки.
  window.applyAiVoiceSearch = renderVoices;
  document.addEventListener("DOMContentLoaded", () => {
    $("aiVoiceCreateBtn")?.addEventListener("click", openCreateModal);
  });
  // Кнопка публикации расположена в общей зоне действий аудио.
  const uploadBtn = document.createElement("button");
  uploadBtn.id = "uploadAiVoiceBtn"; uploadBtn.className = "pick-btn hidden"; uploadBtn.type = "button";
  uploadBtn.textContent = "＋ Добавить голос";
  $("audioSectionActions")?.appendChild(uploadBtn);
  uploadBtn.addEventListener("click", openCreateModal);
  $("audioLibraryBtn")?.addEventListener("click", () => setAudioMode("audio"));
  $("audioPlaylistsBtn")?.addEventListener("click", () => setAudioMode("playlists"));
  if (typeof window !== "undefined") window.openAiVoice = openVoice;
})();
