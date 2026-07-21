const PHOTO_TABLE = "burunduki";
const VIDEO_TABLE = "burunduki_videos";
const RATING_TABLE = "burunduk_ratings";

/* ---------- Ранги оценки (вместо звёзд) ---------- */
const RANK_LEVELS = [
  { rank: 1, label: "не красивый", asset: "assets/sub3.png" },
  { rank: 2, label: "не особо красивый", asset: "assets/sub5.png" },
  { rank: 3, label: "ближе к норм", asset: "assets/ltn.png" },
  { rank: 4, label: "красивенький", asset: "assets/mtn.png" },
  { rank: 5, label: "красивый крутой", asset: "assets/htn.png" },
  { rank: 6, label: "прям крутой", asset: "assets/chad.png" },
  { rank: 7, label: "true burunduk", asset: "assets/TrueBurunduk.png" },
];

/* ---------- DOM: общие ---------- */
const statusEl = document.getElementById("status");
const toast = document.getElementById("toast");
const tabVideo = document.getElementById("tabVideo");
const tabPhoto = document.getElementById("tabPhoto");
const galleryPhoto = document.getElementById("galleryPhoto");
const galleryVideo = document.getElementById("galleryVideo");
const uploadPhotoBtn = document.getElementById("uploadPhotoBtn");
const uploadVideoBtn = document.getElementById("uploadVideoBtn");
const deleteModal = document.getElementById("deleteModal");
const deleteCancel = document.getElementById("deleteCancel");
const deleteConfirm = document.getElementById("deleteConfirm");
const searchInput = document.getElementById("searchInput");
const whoAmIEl = document.getElementById("whoAmI");
const changeNameBtn = document.getElementById("changeNameBtn");
const nameModal = document.getElementById("nameModal");
const nameInput = document.getElementById("nameInput");
const nameConfirm = document.getElementById("nameConfirm");

/* ---------- DOM: фото ---------- */
const fileInput = document.getElementById("fileInput");
const uploadModal = document.getElementById("uploadModal");
const modalTitle = document.getElementById("modalTitle");
const uploadPreview = document.getElementById("uploadPreview");
const uploadName = document.getElementById("uploadName");
const uploadDescription = document.getElementById("uploadDescription");
const uploadCancel = document.getElementById("uploadCancel");
const uploadConfirm = document.getElementById("uploadConfirm");

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxName = document.getElementById("lightboxName");
const lightboxDescription = document.getElementById("lightboxDescription");
const lightboxHint = document.getElementById("lightboxHint");
const lightboxClose = document.getElementById("lightboxClose");
const zoomContainer = document.getElementById("zoomContainer");
const magnifier = document.getElementById("magnifier");
const modeLoupeBtn = document.getElementById("modeLoupeBtn");
const modeZoomBtn = document.getElementById("modeZoomBtn");
const downloadBtn = document.getElementById("downloadBtn");
const copyBtn = document.getElementById("copyBtn");
const editBtn = document.getElementById("editBtn");
const deleteBtn = document.getElementById("deleteBtn");

/* ---------- DOM: видео ---------- */
const videoModal = document.getElementById("videoModal");
const videoModalTitle = document.getElementById("videoModalTitle");
const sourcePicker = document.getElementById("sourcePicker");
const videoUrl = document.getElementById("videoUrl");
const videoUrlHint = document.getElementById("videoUrlHint");
const videoName = document.getElementById("videoName");
const videoDescription = document.getElementById("videoDescription");
const videoCancel = document.getElementById("videoCancel");
const videoConfirm = document.getElementById("videoConfirm");

const videoLightbox = document.getElementById("videoLightbox");
const videoLightboxClose = document.getElementById("videoLightboxClose");
const videoLightboxName = document.getElementById("videoLightboxName");
const videoLightboxDescription = document.getElementById("videoLightboxDescription");
const videoContainer = document.getElementById("videoContainer");
const videoOpenBtn = document.getElementById("videoOpenBtn");
const videoEditBtn = document.getElementById("videoEditBtn");
const videoDeleteBtn = document.getElementById("videoDeleteBtn");

/* ---------- DOM: оценки ---------- */
const ratingEls = {
  photo: {
    summaryImg: document.getElementById("photoRatingSummaryImg"),
    score: document.getElementById("photoRatingScore"),
    label: document.getElementById("photoRatingLabel"),
    picker: document.getElementById("photoRatingPicker"),
    comment: document.getElementById("photoRatingComment"),
    submit: document.getElementById("photoRatingSubmit"),
    comments: document.getElementById("photoRatingComments"),
  },
  video: {
    summaryImg: document.getElementById("videoRatingSummaryImg"),
    score: document.getElementById("videoRatingScore"),
    label: document.getElementById("videoRatingLabel"),
    picker: document.getElementById("videoRatingPicker"),
    comment: document.getElementById("videoRatingComment"),
    submit: document.getElementById("videoRatingSubmit"),
    comments: document.getElementById("videoRatingComments"),
  },
};

let selectedRank = { photo: null, video: null };
let currentRatingTarget = { photo: null, video: null };

let db = null;

/* ==================================================================
   ЛИЧНОСТЬ (имя + секретный код в этом браузере)
   ================================================================== */
const IDENTITY_KEY = "burunduk-identity";

function getIdentity() {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveIdentity(name) {
  const code = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();
  const identity = { name, code };
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  return identity;
}

function updateIdentityName(name) {
  const identity = getIdentity() || saveIdentity(name);
  identity.name = name;
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  return identity;
}

let currentIdentity = getIdentity();

function refreshWhoAmI() {
  whoAmIEl.textContent = currentIdentity ? currentIdentity.name : "—";
}

function ensureIdentity() {
  if (currentIdentity) {
    refreshWhoAmI();
    return;
  }
  nameModal.classList.add("active");
}

nameConfirm.addEventListener("click", () => {
  const name = nameInput.value.trim();
  if (!name) {
    showToast("Введи своё имя");
    return;
  }
  currentIdentity = currentIdentity ? updateIdentityName(name) : saveIdentity(name);
  nameModal.classList.remove("active");
  nameInput.value = "";
  refreshWhoAmI();
});

changeNameBtn.addEventListener("click", () => {
  nameInput.value = currentIdentity ? currentIdentity.name : "";
  nameModal.classList.add("active");
});

function isOwner(record) {
  // Старые записи без владельца считаются общими — редактировать может кто угодно
  if (!record.owner_code) return true;
  return currentIdentity && record.owner_code === currentIdentity.code;
}

let currentTab = "video";
let currentPickedFile = null;
let editingPhotoRecord = null;
let currentPhotoRecord = null;
let currentPhotoSrc = null;

let selectedSource = "google_drive";
let editingVideoRecord = null;
let currentVideoRecord = null;

const SOURCE_HINTS = {
  google_drive: "Открой файл в Google Drive → Настроить доступ → 'Все, у кого есть ссылка' → скопируй ссылку сюда",
  youtube: "Просто вставь обычную ссылку на видео с YouTube",
  tiktok: "Вставь ссылку на видео из TikTok (кнопка 'Поделиться' → 'Копировать ссылку')",
  tenor: "Вставь ссылку на гифку/видео с Tenor",
  other: "Вставь прямую ссылку на видео (.mp4 и т.п.) или на страницу с ним",
};

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2500);
}

/* ---------- Инициализация Supabase ---------- */
function initSupabase() {
  if (!window.supabase || SUPABASE_URL.includes("ВСТАВЬ") || SUPABASE_ANON_KEY.includes("ВСТАВЬ")) {
    statusEl.innerHTML = `Настрой config.js — вставь свои SUPABASE_URL и SUPABASE_ANON_KEY (инструкция в README.txt)`;
    uploadPhotoBtn.disabled = true;
    uploadVideoBtn.disabled = true;
    return false;
  }
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return true;
}

/* ==================================================================
   ВКЛАДКИ
   ================================================================== */
function switchTab(tab) {
  currentTab = tab;
  searchInput.value = "";
  tabVideo.classList.toggle("active", tab === "video");
  tabPhoto.classList.toggle("active", tab === "photo");
  uploadVideoBtn.classList.toggle("hidden", tab !== "video");
  uploadPhotoBtn.classList.toggle("hidden", tab !== "photo");
  galleryVideo.classList.toggle("hidden", tab !== "video");
  galleryPhoto.classList.toggle("hidden", tab !== "photo");

  if (tab === "video") loadVideos();
  else loadPhotos();
}

tabVideo.addEventListener("click", () => switchTab("video"));
tabPhoto.addEventListener("click", () => switchTab("photo"));

/* ==================================================================
   ПОИСК ПО ИМЕНИ
   ================================================================== */
function applySearch() {
  const query = searchInput.value.trim().toLowerCase();

  if (currentTab === "photo") {
    const filtered = query
      ? allPhotoRecords.filter(r => r.name.toLowerCase().includes(query))
      : allPhotoRecords;
    statusEl.textContent = query
      ? `Найдено: ${filtered.length}`
      : `Фото в галерее: ${allPhotoRecords.length}`;
    renderPhotoGallery(filtered);
  } else {
    const filtered = query
      ? allVideoRecords.filter(r => r.name.toLowerCase().includes(query))
      : allVideoRecords;
    statusEl.textContent = query
      ? `Найдено: ${filtered.length}`
      : `Видео в галерее: ${allVideoRecords.length}`;
    renderVideoGallery(filtered);
  }
}

searchInput.addEventListener("input", applySearch);

/* ==================================================================
   ФОТО
   ================================================================== */
async function loadPhotos() {
  statusEl.textContent = "Загружаю бурундуков...";

  const { data, error } = await db
    .from(PHOTO_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    statusEl.textContent = "Ошибка загрузки: " + error.message;
    return;
  }

  allPhotoRecords = data || [];

  if (!allPhotoRecords.length) {
    statusEl.textContent = "Пока нет ни одного фото — добавь первое!";
    galleryPhoto.innerHTML = "";
    return;
  }

  applySearch();
}

function publicUrlFor(storagePath) {
  const { data } = db.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
  return data.publicUrl;
}

function nameFromFilename(filename) {
  return filename.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

let allPhotoRecords = [];
let allVideoRecords = [];

function renderPhotoGallery(records) {
  galleryPhoto.innerHTML = "";
  records.forEach((record) => {
    const src = publicUrlFor(record.storage_path);
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${src}" alt="${record.name}" loading="lazy">
      <div class="name">${record.name}</div>
      ${record.owner_name ? `<div class="owner-tag">от ${record.owner_name}</div>` : ""}
    `;
    card.addEventListener("click", () => openLightbox(record, src));
    galleryPhoto.appendChild(card);
  });
}

uploadPhotoBtn.addEventListener("click", () => {
  editingPhotoRecord = null;
  modalTitle.textContent = "Новый бурундук 🐿️";
  uploadConfirm.textContent = "Добавить в галерею";
  uploadPreview.src = "";
  uploadName.value = "";
  uploadDescription.value = "";
  currentPickedFile = null;
  fileInput.click();
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  currentPickedFile = file;
  uploadPreview.src = URL.createObjectURL(file);
  uploadName.value = nameFromFilename(file.name);
  uploadModal.classList.add("active");
});

uploadCancel.addEventListener("click", () => {
  uploadModal.classList.remove("active");
  fileInput.value = "";
  currentPickedFile = null;
  editingPhotoRecord = null;
});

uploadConfirm.addEventListener("click", async () => {
  const displayName = uploadName.value.trim() || "безымянный бурундук";
  const description = uploadDescription.value.trim();

  uploadConfirm.disabled = true;

  if (editingPhotoRecord) {
    uploadConfirm.textContent = "Сохраняю...";
    const { error } = await db
      .from(PHOTO_TABLE)
      .update({ name: displayName, description: description || null })
      .eq("id", editingPhotoRecord.id);

    uploadConfirm.disabled = false;
    uploadConfirm.textContent = "Сохранить";

    if (error) {
      showToast("Не удалось сохранить: " + error.message);
      return;
    }

    uploadModal.classList.remove("active");
    editingPhotoRecord = null;
    showToast("Изменения сохранены ✏️");
    closeLightbox();
    loadPhotos();
    return;
  }

  if (!currentPickedFile) return;
  uploadConfirm.textContent = "Загружаю...";

  const ext = (currentPickedFile.name.split(".").pop() || "png").toLowerCase();
  const storagePath = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await db.storage
    .from(BUCKET_NAME)
    .upload(storagePath, currentPickedFile, { cacheControl: "3600", upsert: false });

  if (uploadError) {
    uploadConfirm.disabled = false;
    uploadConfirm.textContent = "Добавить в галерею";
    showToast("Не удалось загрузить файл: " + uploadError.message);
    return;
  }

  const { error: insertError } = await db.from(PHOTO_TABLE).insert({
    storage_path: storagePath,
    name: displayName,
    description: description || null,
    owner_name: currentIdentity ? currentIdentity.name : null,
    owner_code: currentIdentity ? currentIdentity.code : null,
  });

  uploadConfirm.disabled = false;
  uploadConfirm.textContent = "Добавить в галерею";

  if (insertError) {
    showToast("Файл загружен, но не удалось сохранить запись: " + insertError.message);
    return;
  }

  uploadModal.classList.remove("active");
  fileInput.value = "";
  currentPickedFile = null;
  showToast("Бурундук добавлен в галерею 🐿️");
  loadPhotos();
});

editBtn.addEventListener("click", () => {
  if (!currentPhotoRecord) return;
  editingPhotoRecord = currentPhotoRecord;
  modalTitle.textContent = "Изменить бурундука ✏️";
  uploadConfirm.textContent = "Сохранить";
  uploadPreview.src = currentPhotoSrc;
  uploadName.value = currentPhotoRecord.name;
  uploadDescription.value = currentPhotoRecord.description || "";
  uploadModal.classList.add("active");
});

deleteBtn.addEventListener("click", () => {
  if (!currentPhotoRecord) return;
  deleteModal.dataset.kind = "photo";
  deleteModal.classList.add("active");
});

/* ---------- Лайтбокс фото ---------- */
let currentMode = "loupe";

function openLightbox(record, src) {
  currentPhotoRecord = record;
  currentPhotoSrc = src;
  lightboxImg.src = src;
  lightboxImg.style.transform = "";
  lightboxName.textContent = record.name;
  lightboxDescription.textContent = record.description || "";
  lightboxDescription.style.display = record.description ? "block" : "none";
  magnifier.style.backgroundImage = `url('${src}')`;
  setMode("loupe");

  const owner = isOwner(record);
  editBtn.classList.toggle("hidden", !owner);
  deleteBtn.classList.toggle("hidden", !owner);

  lightbox.classList.add("active");
  loadRatings("photo", record.id);
}

function closeLightbox() {
  lightbox.classList.remove("active");
  magnifier.style.display = "none";
  currentPhotoRecord = null;
}

lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

function setMode(mode) {
  currentMode = mode;
  modeLoupeBtn.classList.toggle("active", mode === "loupe");
  modeZoomBtn.classList.toggle("active", mode === "zoom");
  zoomContainer.classList.toggle("mode-zoom", mode === "zoom");
  magnifier.style.display = "none";
  resetPan();

  lightboxHint.textContent = mode === "loupe"
    ? "Наведи курсор на фото, чтобы приблизить · колесо мыши — размер лупы"
    : "Колесо мыши — приблизить/отдалить · зажми и таскай мышью, чтобы двигать фото";
}

modeLoupeBtn.addEventListener("click", () => setMode("loupe"));
modeZoomBtn.addEventListener("click", () => setMode("zoom"));

let magSize = 180;
let ZOOM = 2.5;

zoomContainer.addEventListener("mousemove", (e) => {
  if (currentMode !== "loupe") return;
  const rect = zoomContainer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
    magnifier.style.display = "none";
    return;
  }

  magnifier.style.display = "block";
  magnifier.style.width = `${magSize}px`;
  magnifier.style.height = `${magSize}px`;
  magnifier.style.left = `${x - magSize / 2}px`;
  magnifier.style.top = `${y - magSize / 2}px`;

  const bgWidth = rect.width * ZOOM;
  const bgHeight = rect.height * ZOOM;
  magnifier.style.backgroundSize = `${bgWidth}px ${bgHeight}px`;

  const bgX = -(x * ZOOM - magSize / 2);
  const bgY = -(y * ZOOM - magSize / 2);
  magnifier.style.backgroundPosition = `${bgX}px ${bgY}px`;
});

zoomContainer.addEventListener("mouseleave", () => {
  if (currentMode === "loupe") magnifier.style.display = "none";
});

let scale = 1, panX = 0, panY = 0, isDragging = false, dragStartX = 0, dragStartY = 0;

function applyTransform() {
  lightboxImg.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

function resetPan() {
  scale = 1; panX = 0; panY = 0;
  applyTransform();
}

zoomContainer.addEventListener("wheel", (e) => {
  e.preventDefault();
  if (currentMode === "loupe") {
    magSize = Math.min(400, Math.max(60, magSize - e.deltaY * 0.2));
    ZOOM = Math.min(6, Math.max(1.2, ZOOM - e.deltaY * 0.002));
  } else {
    scale = Math.min(6, Math.max(1, scale - e.deltaY * 0.0015));
    applyTransform();
  }
}, { passive: false });

zoomContainer.addEventListener("mousedown", (e) => {
  if (currentMode !== "zoom") return;
  isDragging = true;
  zoomContainer.classList.add("dragging");
  dragStartX = e.clientX - panX;
  dragStartY = e.clientY - panY;
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging || currentMode !== "zoom") return;
  panX = e.clientX - dragStartX;
  panY = e.clientY - dragStartY;
  applyTransform();
});

window.addEventListener("mouseup", () => {
  isDragging = false;
  zoomContainer.classList.remove("dragging");
});

downloadBtn.addEventListener("click", async () => {
  if (!currentPhotoSrc || !currentPhotoRecord) return;
  const res = await fetch(currentPhotoSrc);
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = currentPhotoRecord.name + (currentPhotoRecord.storage_path.match(/\.[^.]+$/)?.[0] || ".png");
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast("Фото скачано 💾");
});

copyBtn.addEventListener("click", async () => {
  if (!currentPhotoSrc) return;
  try {
    const res = await fetch(currentPhotoSrc);
    const blob = await res.blob();
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type || "image/png"]: blob })
    ]);
    showToast("Скопировано в буфер обмена 📋");
  } catch (err) {
    showToast("Не удалось скопировать (нужен HTTPS, на GitHub Pages сработает)");
    console.error(err);
  }
});

/* ==================================================================
   ВИДЕО
   ================================================================== */
async function loadVideos() {
  statusEl.textContent = "Загружаю видео...";

  const { data, error } = await db
    .from(VIDEO_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    statusEl.textContent = "Ошибка загрузки: " + error.message +
      (error.message.includes("does not exist") ? " (выполни migration_add_videos.sql в Supabase)" : "");
    return;
  }

  allVideoRecords = data || [];

  if (!allVideoRecords.length) {
    statusEl.textContent = "Пока нет ни одного видео — добавь первое!";
    galleryVideo.innerHTML = "";
    return;
  }

  applySearch();
}

const SOURCE_LABELS = {
  google_drive: "Drive",
  youtube: "YouTube",
  tiktok: "TikTok",
  tenor: "Tenor",
  other: "Видео",
};

function renderVideoGallery(records) {
  galleryVideo.innerHTML = "";
  records.forEach((record) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="video-thumb">
        <img src="assets/video-cover.png" alt="${record.name}" loading="lazy">
      </div>
      <div class="video-badge">${SOURCE_LABELS[record.source] || "Видео"}</div>
      <div class="name">${record.name}</div>
      ${record.owner_name ? `<div class="owner-tag">от ${record.owner_name}</div>` : ""}
    `;
    card.addEventListener("click", () => openVideoLightbox(record));
    galleryVideo.appendChild(card);
  });
}

/* ---------- Определение embed-ссылки по источнику ---------- */
function buildEmbedHtml(record) {
  const url = record.video_url.trim();

  if (record.source === "google_drive") {
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch) {
      const fileId = idMatch[1];
      return { html: `<iframe src="https://drive.google.com/file/d/${fileId}/preview" allow="autoplay" allowfullscreen></iframe>`, landscape: true };
    }
  }

  if (record.source === "youtube") {
    let videoId = null;
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) videoId = shortMatch[1];
    else if (longMatch) videoId = longMatch[1];
    else if (shortsMatch) videoId = shortsMatch[1];

    if (videoId) {
      return { html: `<iframe src="https://www.youtube.com/embed/${videoId}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`, landscape: !shortsMatch };
    }
  }

  if (record.source === "tiktok") {
    const idMatch = url.match(/\/video\/(\d+)/);
    if (idMatch) {
      return { html: `<iframe src="https://www.tiktok.com/embed/v2/${idMatch[1]}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`, landscape: false };
    }
  }

  if (record.source === "tenor") {
    // Tenor обычно даёт прямую ссылку на .gif/.mp4 или страницу — пробуем как видео/картинку
    if (/\.(mp4|webm)(\?.*)?$/i.test(url)) {
      return { html: `<video src="${url}" controls autoplay loop></video>`, landscape: true };
    }
    if (/\.gif(\?.*)?$/i.test(url)) {
      return { html: `<img src="${url}" style="width:100%;height:100%;object-fit:contain;">`, landscape: true };
    }
    return { html: `<iframe src="${url}" allowfullscreen></iframe>`, landscape: true };
  }

  // other / фолбэк
  if (/\.(mp4|webm|mov)(\?.*)?$/i.test(url)) {
    return { html: `<video src="${url}" controls autoplay></video>`, landscape: true };
  }
  return { html: `<iframe src="${url}" allowfullscreen></iframe>`, landscape: true };
}

function openVideoLightbox(record) {
  currentVideoRecord = record;
  videoLightboxName.textContent = record.name;
  videoLightboxDescription.textContent = record.description || "";
  videoLightboxDescription.style.display = record.description ? "block" : "none";

  const { html, landscape } = buildEmbedHtml(record);
  videoContainer.innerHTML = html;
  videoContainer.classList.toggle("landscape", !!landscape);

  const owner = isOwner(record);
  videoEditBtn.classList.toggle("hidden", !owner);
  videoDeleteBtn.classList.toggle("hidden", !owner);

  videoLightbox.classList.add("active");
  loadRatings("video", record.id);
}

function closeVideoLightbox() {
  videoLightbox.classList.remove("active");
  videoContainer.innerHTML = ""; // остановить воспроизведение
  currentVideoRecord = null;
}

videoLightboxClose.addEventListener("click", closeVideoLightbox);
videoLightbox.addEventListener("click", (e) => {
  if (e.target === videoLightbox) closeVideoLightbox();
});

videoOpenBtn.addEventListener("click", () => {
  if (!currentVideoRecord) return;
  window.open(currentVideoRecord.video_url, "_blank");
});

/* ---------- Модалка добавления / редактирования видео ---------- */
sourcePicker.addEventListener("click", (e) => {
  const btn = e.target.closest(".source-btn");
  if (!btn) return;
  selectedSource = btn.dataset.source;
  [...sourcePicker.children].forEach(b => b.classList.toggle("active", b === btn));
  videoUrlHint.textContent = SOURCE_HINTS[selectedSource] || "";
});

uploadVideoBtn.addEventListener("click", () => {
  editingVideoRecord = null;
  videoModalTitle.textContent = "Новое видео 🎬";
  videoConfirm.textContent = "Добавить в галерею";
  videoUrl.value = "";
  videoName.value = "";
  videoDescription.value = "";
  selectedSource = "google_drive";
  [...sourcePicker.children].forEach(b => b.classList.toggle("active", b.dataset.source === "google_drive"));
  videoUrlHint.textContent = SOURCE_HINTS.google_drive;
  videoModal.classList.add("active");
});

videoCancel.addEventListener("click", () => {
  videoModal.classList.remove("active");
  editingVideoRecord = null;
});

videoConfirm.addEventListener("click", async () => {
  const url = videoUrl.value.trim();
  const displayName = videoName.value.trim() || "безымянный бурундук";
  const description = videoDescription.value.trim();

  if (!url) {
    showToast("Вставь ссылку на видео");
    return;
  }

  videoConfirm.disabled = true;

  if (editingVideoRecord) {
    videoConfirm.textContent = "Сохраняю...";
    const { error } = await db
      .from(VIDEO_TABLE)
      .update({ video_url: url, source: selectedSource, name: displayName, description: description || null })
      .eq("id", editingVideoRecord.id);

    videoConfirm.disabled = false;
    videoConfirm.textContent = "Сохранить";

    if (error) {
      showToast("Не удалось сохранить: " + error.message);
      return;
    }

    videoModal.classList.remove("active");
    editingVideoRecord = null;
    showToast("Изменения сохранены ✏️");
    closeVideoLightbox();
    loadVideos();
    return;
  }

  videoConfirm.textContent = "Добавляю...";
  const { error } = await db.from(VIDEO_TABLE).insert({
    video_url: url,
    source: selectedSource,
    name: displayName,
    description: description || null,
    owner_name: currentIdentity ? currentIdentity.name : null,
    owner_code: currentIdentity ? currentIdentity.code : null,
  });

  videoConfirm.disabled = false;
  videoConfirm.textContent = "Добавить в галерею";

  if (error) {
    showToast("Не удалось добавить: " + error.message);
    return;
  }

  videoModal.classList.remove("active");
  showToast("Видео добавлено в галерею 🎬");
  loadVideos();
});

videoEditBtn.addEventListener("click", () => {
  if (!currentVideoRecord) return;
  editingVideoRecord = currentVideoRecord;
  videoModalTitle.textContent = "Изменить видео ✏️";
  videoConfirm.textContent = "Сохранить";
  videoUrl.value = currentVideoRecord.video_url;
  videoName.value = currentVideoRecord.name;
  videoDescription.value = currentVideoRecord.description || "";
  selectedSource = currentVideoRecord.source;
  [...sourcePicker.children].forEach(b => b.classList.toggle("active", b.dataset.source === selectedSource));
  videoUrlHint.textContent = SOURCE_HINTS[selectedSource] || "";
  videoModal.classList.add("active");
});

videoDeleteBtn.addEventListener("click", () => {
  if (!currentVideoRecord) return;
  deleteModal.dataset.kind = "video";
  deleteModal.classList.add("active");
});

/* ==================================================================
   ОЦЕНКИ ("ранг бурундука" от 1 до 7, вместо звёзд)
   ================================================================== */
function pluralRatings(n) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "оценка";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "оценки";
  return "оценок";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function nearestRankLevel(avg) {
  const idx = Math.min(6, Math.max(0, Math.round(avg) - 1));
  return RANK_LEVELS[idx];
}

function buildRatingPicker(kind) {
  const el = ratingEls[kind].picker;
  el.innerHTML = "";
  RANK_LEVELS.forEach((level) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "rating-btn";
    btn.dataset.rank = String(level.rank);
    btn.title = level.label;
    btn.innerHTML = `<img src="${level.asset}" alt="${level.label}"><span>${level.rank}</span>`;
    btn.addEventListener("click", () => {
      selectedRank[kind] = level.rank;
      [...el.children].forEach((b) => b.classList.toggle("active", b === btn));
    });
    el.appendChild(btn);
  });
}

buildRatingPicker("photo");
buildRatingPicker("video");

function renderRatingSummary(kind, ratings) {
  const els = ratingEls[kind];
  if (!ratings.length) {
    els.summaryImg.style.visibility = "hidden";
    els.score.textContent = "Пока нет оценок";
    els.label.textContent = "Будь первым, кто оценит";
    return;
  }
  const avg = ratings.reduce((sum, r) => sum + r.rank, 0) / ratings.length;
  const level = nearestRankLevel(avg);
  els.summaryImg.style.visibility = "visible";
  els.summaryImg.src = level.asset;
  els.summaryImg.alt = level.label;
  els.score.textContent = `${avg.toFixed(1)} / 7 · ${ratings.length} ${pluralRatings(ratings.length)}`;
  els.label.textContent = level.label;
}

function renderRatingComments(kind, ratings) {
  const el = ratingEls[kind].comments;
  el.innerHTML = "";
  if (!ratings.length) {
    el.innerHTML = `<div class="rating-comments-empty">Комментариев пока нет</div>`;
    return;
  }
  ratings.forEach((r) => {
    const level = RANK_LEVELS[r.rank - 1];
    const item = document.createElement("div");
    item.className = "rating-comment-item";
    item.innerHTML = `
      <img src="${level.asset}" alt="${level.label}" class="rating-comment-icon">
      <div class="rating-comment-body">
        <div class="rating-comment-head">
          <span class="rating-comment-author">${escapeHtml(r.rater_name || "аноним")}</span>
          <span class="rating-comment-rank">${level.label}</span>
        </div>
        ${r.comment ? `<div class="rating-comment-text">${escapeHtml(r.comment)}</div>` : ""}
      </div>
    `;
    el.appendChild(item);
  });
}

async function loadRatings(kind, targetId) {
  currentRatingTarget[kind] = targetId;
  selectedRank[kind] = null;
  ratingEls[kind].comment.value = "";
  [...ratingEls[kind].picker.children].forEach((b) => b.classList.remove("active"));

  const { data, error } = await db
    .from(RATING_TABLE)
    .select("*")
    .eq("target_type", kind)
    .eq("target_id", targetId)
    .order("created_at", { ascending: false });

  if (error) {
    ratingEls[kind].summaryImg.style.visibility = "hidden";
    ratingEls[kind].score.textContent = "Не удалось загрузить оценки";
    ratingEls[kind].label.textContent = "";
    ratingEls[kind].comments.innerHTML = "";
    return;
  }

  const ratings = data || [];
  renderRatingSummary(kind, ratings);
  renderRatingComments(kind, ratings);

  if (currentIdentity) {
    const own = ratings.find((r) => r.rater_code === currentIdentity.code);
    if (own) {
      selectedRank[kind] = own.rank;
      ratingEls[kind].comment.value = own.comment || "";
      const ownBtn = [...ratingEls[kind].picker.children].find((b) => Number(b.dataset.rank) === own.rank);
      if (ownBtn) ownBtn.classList.add("active");
    }
  }
}

async function submitRating(kind) {
  if (!currentRatingTarget[kind]) return;

  if (!selectedRank[kind]) {
    showToast("Выбери оценку от 1 до 7");
    return;
  }

  if (!currentIdentity) {
    ensureIdentity();
    return;
  }

  const btn = ratingEls[kind].submit;
  btn.disabled = true;
  btn.textContent = "Сохраняю...";

  const { error } = await db.from(RATING_TABLE).upsert(
    {
      target_type: kind,
      target_id: currentRatingTarget[kind],
      rank: selectedRank[kind],
      comment: ratingEls[kind].comment.value.trim() || null,
      rater_name: currentIdentity.name,
      rater_code: currentIdentity.code,
    },
    { onConflict: "target_type,target_id,rater_code" }
  );

  btn.disabled = false;
  btn.textContent = "Оценить";

  if (error) {
    showToast("Не удалось сохранить оценку: " + error.message);
    return;
  }

  showToast("Оценка сохранена 🐿️");
  loadRatings(kind, currentRatingTarget[kind]);
}

ratingEls.photo.submit.addEventListener("click", () => submitRating("photo"));
ratingEls.video.submit.addEventListener("click", () => submitRating("video"));

/* ==================================================================
   УДАЛЕНИЕ (общее для фото и видео)
   ================================================================== */
deleteCancel.addEventListener("click", () => {
  deleteModal.classList.remove("active");
});

deleteConfirm.addEventListener("click", async () => {
  const kind = deleteModal.dataset.kind;
  deleteConfirm.disabled = true;
  deleteConfirm.textContent = "Удаляю...";

  if (kind === "photo" && currentPhotoRecord) {
    await db.storage.from(BUCKET_NAME).remove([currentPhotoRecord.storage_path]);
    const { error } = await db.from(PHOTO_TABLE).delete().eq("id", currentPhotoRecord.id);
    deleteConfirm.disabled = false;
    deleteConfirm.textContent = "Удалить";
    if (error) {
      showToast("Не удалось удалить: " + error.message);
      return;
    }
    deleteModal.classList.remove("active");
    closeLightbox();
    showToast("Бурундук удалён 🗑️");
    loadPhotos();
  }

  if (kind === "video" && currentVideoRecord) {
    const { error } = await db.from(VIDEO_TABLE).delete().eq("id", currentVideoRecord.id);
    deleteConfirm.disabled = false;
    deleteConfirm.textContent = "Удалить";
    if (error) {
      showToast("Не удалось удалить: " + error.message);
      return;
    }
    deleteModal.classList.remove("active");
    closeVideoLightbox();
    showToast("Видео удалено 🗑️");
    loadVideos();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeLightbox();
    closeVideoLightbox();
    uploadModal.classList.remove("active");
    videoModal.classList.remove("active");
    deleteModal.classList.remove("active");
  }
});

/* ---------- Старт ---------- */
refreshWhoAmI();
ensureIdentity();
if (initSupabase()) {
  videoUrlHint.textContent = SOURCE_HINTS.google_drive;
  switchTab("photo");
}
