const galleryEl = document.getElementById("gallery");
const statusEl = document.getElementById("status");
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");

const uploadModal = document.getElementById("uploadModal");
const modalTitle = document.getElementById("modalTitle");
const uploadPreview = document.getElementById("uploadPreview");
const uploadName = document.getElementById("uploadName");
const uploadDescription = document.getElementById("uploadDescription");
const uploadCancel = document.getElementById("uploadCancel");
const uploadConfirm = document.getElementById("uploadConfirm");

const deleteModal = document.getElementById("deleteModal");
const deleteCancel = document.getElementById("deleteCancel");
const deleteConfirm = document.getElementById("deleteConfirm");

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
const toast = document.getElementById("toast");

const TABLE_NAME = "burunduki";

let db = null;
let currentPickedFile = null;
let editingRecord = null; // если не null — модалка работает в режиме редактирования
let currentRecord = null; // запись, открытая сейчас в лайтбоксе

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
    uploadBtn.disabled = true;
    return false;
  }
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return true;
}

/* ---------- Загрузка списка бурундуков из базы ---------- */
async function loadGallery() {
  statusEl.textContent = "Загружаю бурундуков...";

  const { data, error } = await db
    .from(TABLE_NAME)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    statusEl.textContent = "Ошибка загрузки: " + error.message +
      (error.message.includes("does not exist") ? " (похоже, таблица не создана — выполни setup.sql)" : "");
    return;
  }

  if (!data || !data.length) {
    statusEl.textContent = "Пока нет ни одного бурундука — добавь первого!";
    galleryEl.innerHTML = "";
    return;
  }

  statusEl.textContent = `Бурундуков в галерее: ${data.length}`;
  renderGallery(data);
}

function publicUrlFor(storagePath) {
  const { data } = db.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
  return data.publicUrl;
}

function nameFromFilename(filename) {
  return filename.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

function renderGallery(records) {
  galleryEl.innerHTML = "";
  records.forEach((record) => {
    const src = publicUrlFor(record.storage_path);

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${src}" alt="${record.name}" loading="lazy">
      <div class="name">${record.name}</div>
    `;
    card.addEventListener("click", () => openLightbox(record, src));
    galleryEl.appendChild(card);
  });
}

/* ---------- Модалка добавления / редактирования ---------- */
uploadBtn.addEventListener("click", () => {
  editingRecord = null;
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
  editingRecord = null;
});

uploadConfirm.addEventListener("click", async () => {
  const displayName = uploadName.value.trim() || "безымянный бурундук";
  const description = uploadDescription.value.trim();

  uploadConfirm.disabled = true;

  if (editingRecord) {
    // Режим редактирования — просто обновляем название/описание в базе
    uploadConfirm.textContent = "Сохраняю...";
    const { error } = await db
      .from(TABLE_NAME)
      .update({ name: displayName, description: description || null })
      .eq("id", editingRecord.id);

    uploadConfirm.disabled = false;
    uploadConfirm.textContent = "Сохранить";

    if (error) {
      showToast("Не удалось сохранить: " + error.message);
      return;
    }

    uploadModal.classList.remove("active");
    editingRecord = null;
    showToast("Изменения сохранены ✏️");
    closeLightbox();
    loadGallery();
    return;
  }

  // Режим добавления нового бурундука
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

  const { error: insertError } = await db.from(TABLE_NAME).insert({
    storage_path: storagePath,
    name: displayName,
    description: description || null,
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
  loadGallery();
});

/* ---------- Редактирование существующего ---------- */
editBtn.addEventListener("click", () => {
  if (!currentRecord) return;
  editingRecord = currentRecord;
  modalTitle.textContent = "Изменить бурундука ✏️";
  uploadConfirm.textContent = "Сохранить";
  uploadPreview.src = currentSrc;
  uploadName.value = currentRecord.name;
  uploadDescription.value = currentRecord.description || "";
  uploadModal.classList.add("active");
});

/* ---------- Удаление ---------- */
deleteBtn.addEventListener("click", () => {
  if (!currentRecord) return;
  deleteModal.classList.add("active");
});

deleteCancel.addEventListener("click", () => {
  deleteModal.classList.remove("active");
});

deleteConfirm.addEventListener("click", async () => {
  if (!currentRecord) return;
  deleteConfirm.disabled = true;
  deleteConfirm.textContent = "Удаляю...";

  await db.storage.from(BUCKET_NAME).remove([currentRecord.storage_path]);
  const { error } = await db.from(TABLE_NAME).delete().eq("id", currentRecord.id);

  deleteConfirm.disabled = false;
  deleteConfirm.textContent = "Удалить";

  if (error) {
    showToast("Не удалось удалить: " + error.message);
    return;
  }

  deleteModal.classList.remove("active");
  closeLightbox();
  showToast("Бурундук удалён 🗑️");
  loadGallery();
});

/* ---------- Лайтбокс ---------- */
let currentSrc = null;
let currentMode = "loupe";

function openLightbox(record, src) {
  currentRecord = record;
  currentSrc = src;
  lightboxImg.src = src;
  lightboxImg.style.transform = "";
  lightboxName.textContent = record.name;
  lightboxDescription.textContent = record.description || "";
  lightboxDescription.style.display = record.description ? "block" : "none";
  magnifier.style.backgroundImage = `url('${src}')`;
  setMode("loupe");
  lightbox.classList.add("active");
}

function closeLightbox() {
  lightbox.classList.remove("active");
  magnifier.style.display = "none";
  currentRecord = null;
}

lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeLightbox();
    uploadModal.classList.remove("active");
    deleteModal.classList.remove("active");
  }
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

/* --- Лупа 1 --- */
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

/* --- Лупа 2 --- */
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

/* ---------- Скачать / Копировать ---------- */
downloadBtn.addEventListener("click", async () => {
  if (!currentSrc || !currentRecord) return;
  const res = await fetch(currentSrc);
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = currentRecord.name + (currentRecord.storage_path.match(/\.[^.]+$/)?.[0] || ".png");
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast("Фото скачано 💾");
});

copyBtn.addEventListener("click", async () => {
  if (!currentSrc) return;
  try {
    const res = await fetch(currentSrc);
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

/* ---------- Старт ---------- */
if (initSupabase()) {
  loadGallery();
}
