const PHOTO_TABLE = "burunduki";
const VIDEO_TABLE = "burunduki_videos";
const CATEGORY_TABLE = "burunduk_categories";

let db = null;
let allCategories = [];
let allPhotos = [];
let allVideos = [];

const toast = document.getElementById("toast");
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2500);
}

function initSupabase() {
  if (typeof SUPABASE_URL === "undefined" || typeof SUPABASE_ANON_KEY === "undefined") {
    showToast("Нет config.js с ключами Supabase");
    return false;
  }
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return true;
}

function publicUrlFor(storagePath) {
  const { data } = db.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
  return data.publicUrl;
}

/* ==================================================================
   Универсальное окошко подтверждения
   ================================================================== */
const confirmModal = document.getElementById("confirmModal");
const confirmModalTitle = document.getElementById("confirmModalTitle");
const confirmModalText = document.getElementById("confirmModalText");
const confirmModalOk = document.getElementById("confirmModalOk");
const confirmModalCancel = document.getElementById("confirmModalCancel");

function askConfirm(title, text) {
  return new Promise((resolve) => {
    confirmModalTitle.textContent = title;
    confirmModalText.textContent = text;
    confirmModal.classList.add("active");

    function cleanup(result) {
      confirmModal.classList.remove("active");
      confirmModalOk.removeEventListener("click", onOk);
      confirmModalCancel.removeEventListener("click", onCancel);
      resolve(result);
    }
    function onOk() { cleanup(true); }
    function onCancel() { cleanup(false); }

    confirmModalOk.addEventListener("click", onOk);
    confirmModalCancel.addEventListener("click", onCancel);
  });
}

/* ==================================================================
   РАЗДЕЛЫ
   ================================================================== */
async function loadCategories() {
  const { data, error } = await db
    .from(CATEGORY_TABLE)
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    showToast("Ошибка загрузки разделов: " + error.message);
    return;
  }
  allCategories = data || [];
  renderPendingCategories();
  renderAllCategories();
  fillPhotoCategoryFilter();
}

function renderPendingCategories() {
  const el = document.getElementById("pendingCategoriesList");
  const pending = allCategories.filter(c => c.status === "pending");

  if (!pending.length) {
    el.innerHTML = `<div class="empty-note">Заявок нет</div>`;
    return;
  }

  el.innerHTML = "";
  pending.forEach((cat) => {
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <div class="admin-row-main">
        <div class="admin-row-title">${escapeHtml(cat.name)}</div>
        <div class="admin-row-sub">от ${escapeHtml(cat.created_by_name || "неизвестно")}</div>
      </div>
      <div class="admin-row-actions">
        <button class="pick-btn small" data-approve>Одобрить</button>
        <button class="tool-btn danger" data-reject>Отклонить</button>
      </div>
    `;
    row.querySelector("[data-approve]").addEventListener("click", () => approveCategory(cat));
    row.querySelector("[data-reject]").addEventListener("click", () => rejectCategory(cat));
    el.appendChild(row);
  });
}

async function approveCategory(cat) {
  const { error } = await db
    .from(CATEGORY_TABLE)
    .update({ status: "approved" })
    .eq("id", cat.id);

  if (error) {
    showToast("Не удалось одобрить: " + error.message);
    return;
  }
  showToast(`Раздел «${cat.name}» одобрен ✅`);
  await loadCategories();
}

async function rejectCategory(cat) {
  const ok = await askConfirm("Отклонить раздел?", `Раздел «${cat.name}» и фото в нём останутся скрыты для всех, кроме автора.`);
  if (!ok) return;

  const { error } = await db
    .from(CATEGORY_TABLE)
    .update({ status: "rejected" })
    .eq("id", cat.id);

  if (error) {
    showToast("Не удалось отклонить: " + error.message);
    return;
  }
  showToast(`Раздел «${cat.name}» отклонён`);
  await loadCategories();
}

function renderAllCategories() {
  const el = document.getElementById("categoriesList");
  if (!allCategories.length) {
    el.innerHTML = `<div class="empty-note">Разделов пока нет</div>`;
    return;
  }

  el.innerHTML = "";
  allCategories.forEach((cat) => {
    const photoCount = allPhotos.filter(p => p.category_id === cat.id).length;
    const videoCount = allVideos.filter(v => v.category_id === cat.id).length;
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <div class="admin-row-main">
        <div class="admin-row-title">
          ${escapeHtml(cat.name)}
          ${cat.status !== "approved" ? `<span class="badge-pending">${cat.status === "pending" ? "на рассмотрении" : "отклонён"}</span>` : ""}
        </div>
        <div class="admin-row-sub">фото: ${photoCount} · видео: ${videoCount}</div>
      </div>
      <div class="admin-row-actions">
        <button class="tool-btn" data-rename>Переименовать</button>
        <button class="tool-btn danger" data-delete>Удалить раздел</button>
      </div>
    `;
    row.querySelector("[data-rename]").addEventListener("click", () => renameCategory(cat));
    row.querySelector("[data-delete]").addEventListener("click", () => deleteCategory(cat));
    el.appendChild(row);
  });
}

async function renameCategory(cat) {
  const newName = prompt("Новое название раздела:", cat.name);
  if (!newName || !newName.trim() || newName.trim() === cat.name) return;

  const { error } = await db
    .from(CATEGORY_TABLE)
    .update({ name: newName.trim() })
    .eq("id", cat.id);

  if (error) {
    showToast("Не удалось переименовать: " + error.message);
    return;
  }
  showToast("Раздел переименован");
  await loadCategories();
}

async function deleteCategory(cat) {
  const photoCount = allPhotos.filter(p => p.category_id === cat.id).length;
  const videoCount = allVideos.filter(v => v.category_id === cat.id).length;
  const count = photoCount + videoCount;
  const ok = await askConfirm(
    "Удалить раздел?",
    count
      ? `В разделе «${cat.name}» есть ${photoCount} фото и ${videoCount} видео — они останутся, но без раздела.`
      : `Раздел «${cat.name}» будет удалён.`
  );
  if (!ok) return;

  await db.from(PHOTO_TABLE).update({ category_id: null }).eq("category_id", cat.id);
  await db.from(VIDEO_TABLE).update({ category_id: null }).eq("category_id", cat.id);

  const { error } = await db.from(CATEGORY_TABLE).delete().eq("id", cat.id);
  if (error) {
    showToast("Не удалось удалить: " + error.message);
    return;
  }
  showToast("Раздел удалён");
  await loadCategories();
  await loadPhotos();
  await loadVideos();
  renderUsers();
}

document.getElementById("addCategoryDirectBtn").addEventListener("click", async () => {
  const input = document.getElementById("newCategoryDirectInput");
  const name = input.value.trim();
  if (!name) {
    showToast("Введи название раздела");
    return;
  }
  const { error } = await db.from(CATEGORY_TABLE).insert({ name, status: "approved" });
  if (error) {
    showToast("Не удалось добавить: " + error.message);
    return;
  }
  input.value = "";
  showToast(`Раздел «${name}» добавлен ✅`);
  await loadCategories();
});

function fillPhotoCategoryFilter() {
  [document.getElementById("photoCategoryFilter"), document.getElementById("videoCategoryFilter")].forEach((sel) => {
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = `<option value="all">Все разделы</option><option value="none">Без раздела</option>`;
    allCategories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name + (cat.status !== "approved" ? ` (${cat.status})` : "");
      sel.appendChild(opt);
    });
    if (prev) sel.value = prev;
  });
}

/* ==================================================================
   ФОТО
   ================================================================== */
async function loadPhotos() {
  const { data, error } = await db
    .from(PHOTO_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    showToast("Ошибка загрузки фото: " + error.message);
    return;
  }
  allPhotos = data || [];
  renderAllCategories();
  renderPhotos();
}

function renderPhotos() {
  const el = document.getElementById("photosList");
  const query = document.getElementById("photoSearch").value.trim().toLowerCase();
  const catFilter = document.getElementById("photoCategoryFilter").value;

  let filtered = allPhotos;
  if (query) filtered = filtered.filter(p => p.name.toLowerCase().includes(query));
  if (catFilter === "none") filtered = filtered.filter(p => !p.category_id);
  else if (catFilter !== "all") filtered = filtered.filter(p => p.category_id === catFilter);

  if (!filtered.length) {
    el.innerHTML = `<div class="empty-note">Ничего не найдено</div>`;
    return;
  }

  el.innerHTML = "";
  filtered.forEach((photo) => {
    const cat = allCategories.find(c => c.id === photo.category_id);
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <img src="${publicUrlFor(photo.storage_path)}" alt="${escapeHtml(photo.name)}">
      <div class="admin-row-main">
        <div class="admin-row-title">${escapeHtml(photo.name)}</div>
        <div class="admin-row-sub">
          ${photo.owner_name ? "автор: " + escapeHtml(photo.owner_name) : "автор не указан"}
          ${cat ? " · раздел: " + escapeHtml(cat.name) : " · без раздела"}
        </div>
      </div>
      <div class="admin-row-actions">
        <button class="tool-btn" data-edit>Изменить</button>
        <button class="tool-btn danger" data-delete>Удалить</button>
      </div>
    `;
    row.querySelector("[data-edit]").addEventListener("click", () => openEditPhoto(photo));
    row.querySelector("[data-delete]").addEventListener("click", () => deletePhoto(photo));
    el.appendChild(row);
  });
}

document.getElementById("photoSearch").addEventListener("input", renderPhotos);
document.getElementById("photoCategoryFilter").addEventListener("change", renderPhotos);

/* ---------- Редактирование фото ---------- */
const editPhotoModal = document.getElementById("editPhotoModal");
const editPhotoPreview = document.getElementById("editPhotoPreview");
const editPhotoName = document.getElementById("editPhotoName");
const editPhotoDescription = document.getElementById("editPhotoDescription");
const editPhotoCategory = document.getElementById("editPhotoCategory");
const editPhotoOwner = document.getElementById("editPhotoOwner");
const editPhotoDate = document.getElementById("editPhotoDate");
const editPhotoCancel = document.getElementById("editPhotoCancel");
const editPhotoSave = document.getElementById("editPhotoSave");
const editPhotoDelete = document.getElementById("editPhotoDelete");

// Преобразует ISO-дату из базы (UTC) в значение для <input type="datetime-local">,
// которое всегда показывается и вводится в локальном времени браузера.
function isoToLocalInputValue(isoString) {
  const d = isoString ? new Date(isoString) : new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Обратное преобразование: значение из datetime-local (локальное время)
// в корректный ISO-таймстамп для записи в Supabase.
function localInputValueToIso(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

let editingPhoto = null;

function openEditPhoto(photo) {
  editingPhoto = photo;
  editPhotoPreview.src = publicUrlFor(photo.storage_path);
  editPhotoName.value = photo.name || "";
  editPhotoDescription.value = photo.description || "";

  editPhotoOwner.innerHTML = `<option value="">Без автора (общее фото)</option>`;
  collectUsers().forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u.code;
    opt.dataset.name = u.name;
    opt.textContent = `${u.name} (фото: ${u.photoCount}, видео: ${u.videoCount})`;
    editPhotoOwner.appendChild(opt);
  });
  editPhotoOwner.value = photo.owner_code || "";

  editPhotoCategory.innerHTML = `<option value="">Без раздела</option>`;
  allCategories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name + (cat.status !== "approved" ? ` (${cat.status})` : "");
    editPhotoCategory.appendChild(opt);
  });
  editPhotoCategory.value = photo.category_id || "";

  editPhotoDate.value = isoToLocalInputValue(photo.created_at);

  editPhotoModal.classList.add("active");
}

editPhotoCancel.addEventListener("click", () => {
  editPhotoModal.classList.remove("active");
  editingPhoto = null;
});

editPhotoSave.addEventListener("click", async () => {
  if (!editingPhoto) return;

  const selectedOpt = editPhotoOwner.options[editPhotoOwner.selectedIndex];
  const ownerCode = editPhotoOwner.value || null;
  const ownerName = ownerCode ? selectedOpt.dataset.name : null;

  const { error } = await db
    .from(PHOTO_TABLE)
    .update({
      name: editPhotoName.value.trim() || "безымянный бурундук",
      description: editPhotoDescription.value.trim() || null,
      category_id: editPhotoCategory.value || null,
      owner_code: ownerCode,
      owner_name: ownerName,
      created_at: localInputValueToIso(editPhotoDate.value) || editingPhoto.created_at,
    })
    .eq("id", editingPhoto.id);

  if (error) {
    showToast("Не удалось сохранить: " + error.message);
    return;
  }

  showToast("Фото обновлено ✏️");
  editPhotoModal.classList.remove("active");
  editingPhoto = null;
  await loadPhotos();
});

editPhotoDelete.addEventListener("click", async () => {
  if (!editingPhoto) return;
  const ok = await askConfirm("Удалить фото?", `«${editingPhoto.name}» будет удалено безвозвратно.`);
  if (!ok) return;
  await deletePhoto(editingPhoto);
  editPhotoModal.classList.remove("active");
  editingPhoto = null;
});

async function deletePhoto(photo) {
  const ok = editingPhoto === photo ? true : await askConfirm("Удалить фото?", `«${photo.name}» будет удалено безвозвратно.`);
  if (!ok) return;

  await db.storage.from(BUCKET_NAME).remove([photo.storage_path]);
  const { error } = await db.from(PHOTO_TABLE).delete().eq("id", photo.id);

  if (error) {
    showToast("Не удалось удалить: " + error.message);
    return;
  }
  showToast("Фото удалено 🗑️");
  await loadPhotos();
}

/* ==================================================================
   ВИДЕО
   ================================================================== */
async function loadVideos() {
  const { data, error } = await db
    .from(VIDEO_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    showToast("Ошибка загрузки видео: " + error.message);
    return;
  }
  allVideos = data || [];
  renderAllCategories();
  renderVideos();
}

function renderVideos() {
  const el = document.getElementById("videosList");
  const query = document.getElementById("videoSearch").value.trim().toLowerCase();
  const catFilter = document.getElementById("videoCategoryFilter").value;

  let filtered = allVideos;
  if (query) filtered = filtered.filter(v => v.name.toLowerCase().includes(query));
  if (catFilter === "none") filtered = filtered.filter(v => !v.category_id);
  else if (catFilter !== "all") filtered = filtered.filter(v => v.category_id === catFilter);

  if (!filtered.length) {
    el.innerHTML = `<div class="empty-note">Ничего не найдено</div>`;
    return;
  }

  el.innerHTML = "";
  filtered.forEach((video) => {
    const cat = allCategories.find(c => c.id === video.category_id);
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <div class="admin-row-main">
        <div class="admin-row-title">${escapeHtml(video.name)}</div>
        <div class="admin-row-sub">
          ${video.owner_name ? "автор: " + escapeHtml(video.owner_name) : "автор не указан"}
          · источник: ${escapeHtml(video.source)}
          ${cat ? " · раздел: " + escapeHtml(cat.name) : " · без раздела"}
        </div>
      </div>
      <div class="admin-row-actions">
        <button class="tool-btn" data-edit>Изменить</button>
        <button class="tool-btn danger" data-delete>Удалить</button>
      </div>
    `;
    row.querySelector("[data-edit]").addEventListener("click", () => openEditVideo(video));
    row.querySelector("[data-delete]").addEventListener("click", () => deleteVideo(video));
    el.appendChild(row);
  });
}

document.getElementById("videoSearch").addEventListener("input", renderVideos);
document.getElementById("videoCategoryFilter").addEventListener("change", renderVideos);

/* ---------- Редактирование видео ---------- */
const editVideoModal = document.getElementById("editVideoModal");
const editVideoUrl = document.getElementById("editVideoUrl");
const editVideoName = document.getElementById("editVideoName");
const editVideoDescription = document.getElementById("editVideoDescription");
const editVideoCategory = document.getElementById("editVideoCategory");
const editVideoOwner = document.getElementById("editVideoOwner");
const editVideoDate = document.getElementById("editVideoDate");
const editVideoCancel = document.getElementById("editVideoCancel");
const editVideoSave = document.getElementById("editVideoSave");
const editVideoDelete = document.getElementById("editVideoDelete");

let editingVideo = null;

function openEditVideo(video) {
  editingVideo = video;
  editVideoUrl.value = video.video_url || "";
  editVideoName.value = video.name || "";
  editVideoDescription.value = video.description || "";

  editVideoOwner.innerHTML = `<option value="">Без автора (общее видео)</option>`;
  collectUsers().forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u.code;
    opt.dataset.name = u.name;
    opt.textContent = `${u.name} (фото: ${u.photoCount}, видео: ${u.videoCount})`;
    editVideoOwner.appendChild(opt);
  });
  editVideoOwner.value = video.owner_code || "";

  editVideoCategory.innerHTML = `<option value="">Без раздела</option>`;
  allCategories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name + (cat.status !== "approved" ? ` (${cat.status})` : "");
    editVideoCategory.appendChild(opt);
  });
  editVideoCategory.value = video.category_id || "";

  editVideoDate.value = isoToLocalInputValue(video.created_at);

  editVideoModal.classList.add("active");
}

editVideoCancel.addEventListener("click", () => {
  editVideoModal.classList.remove("active");
  editingVideo = null;
});

editVideoSave.addEventListener("click", async () => {
  if (!editingVideo) return;

  const selectedOpt = editVideoOwner.options[editVideoOwner.selectedIndex];
  const ownerCode = editVideoOwner.value || null;
  const ownerName = ownerCode ? selectedOpt.dataset.name : null;

  const { error } = await db
    .from(VIDEO_TABLE)
    .update({
      video_url: editVideoUrl.value.trim(),
      name: editVideoName.value.trim() || "безымянный бурундук",
      description: editVideoDescription.value.trim() || null,
      category_id: editVideoCategory.value || null,
      owner_code: ownerCode,
      owner_name: ownerName,
      created_at: localInputValueToIso(editVideoDate.value) || editingVideo.created_at,
    })
    .eq("id", editingVideo.id);

  if (error) {
    showToast("Не удалось сохранить: " + error.message);
    return;
  }

  showToast("Видео обновлено ✏️");
  editVideoModal.classList.remove("active");
  editingVideo = null;
  await loadVideos();
});

editVideoDelete.addEventListener("click", async () => {
  if (!editingVideo) return;
  const ok = await askConfirm("Удалить видео?", `«${editingVideo.name}» будет удалено безвозвратно.`);
  if (!ok) return;
  await deleteVideo(editingVideo);
  editVideoModal.classList.remove("active");
  editingVideo = null;
});

async function deleteVideo(video) {
  const ok = editingVideo === video ? true : await askConfirm("Удалить видео?", `«${video.name}» будет удалено безвозвратно.`);
  if (!ok) return;

  const { error } = await db.from(VIDEO_TABLE).delete().eq("id", video.id);

  if (error) {
    showToast("Не удалось удалить: " + error.message);
    return;
  }
  showToast("Видео удалено 🗑️");
  await loadVideos();
}

/* ==================================================================
   ПОЛЬЗОВАТЕЛИ (авторы)
   ================================================================== */
function collectUsers() {
  const map = new Map();

  function add(code, name) {
    if (!code) return;
    if (!map.has(code)) map.set(code, { code, name: name || "(без имени)", photoCount: 0, videoCount: 0 });
    if (name) map.get(code).name = name;
  }

  allPhotos.forEach((p) => {
    if (p.owner_code) {
      add(p.owner_code, p.owner_name);
      map.get(p.owner_code).photoCount++;
    }
  });
  allVideos.forEach((v) => {
    if (v.owner_code) {
      add(v.owner_code, v.owner_name);
      map.get(v.owner_code).videoCount++;
    }
  });

  return Array.from(map.values()).sort((a, b) => (b.photoCount + b.videoCount) - (a.photoCount + a.videoCount));
}

function renderUsers() {
  const el = document.getElementById("usersList");
  const users = collectUsers();

  if (!users.length) {
    el.innerHTML = `<div class="empty-note">Пока нет пользователей с указанным авторством</div>`;
    return;
  }

  el.innerHTML = "";
  users.forEach((u) => {
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <div class="admin-row-main">
        <div class="admin-row-title">${escapeHtml(u.name)}</div>
        <div class="admin-row-sub">фото: ${u.photoCount} · видео: ${u.videoCount} · код: ${u.code.slice(0, 8)}...</div>
      </div>
      <div class="admin-row-actions">
        <button class="tool-btn" data-rename>Переименовать везде</button>
      </div>
    `;
    row.querySelector("[data-rename]").addEventListener("click", () => renameUserEverywhere(u));
    el.appendChild(row);
  });
}

async function renameUserEverywhere(user) {
  const newName = prompt(`Новое имя для автора (было «${user.name}»):`, user.name);
  if (!newName || !newName.trim() || newName.trim() === user.name) return;

  const trimmed = newName.trim();

  const [photoRes, videoRes] = await Promise.all([
    db.from(PHOTO_TABLE).update({ owner_name: trimmed }).eq("owner_code", user.code),
    db.from(VIDEO_TABLE).update({ owner_name: trimmed }).eq("owner_code", user.code),
  ]);

  if (photoRes.error || videoRes.error) {
    showToast("Не удалось переименовать везде: " + (photoRes.error?.message || videoRes.error?.message));
    return;
  }

  showToast(`Автор переименован в «${trimmed}» везде ✅`);
  await loadPhotos();
  await loadVideos();
  renderUsers();
}

/* ---------- Присвоение автора старым фото без владельца ---------- */
// В "Изменить" теперь выбор автора из select — это реально проставляет
// owner_code существующего пользователя, а не просто текст. После этого
// фото ведёт себя как будто его добавил именно этот человек: у него
// появляется право редактировать/удалять его через обычный сайт.

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

/* ---------- Старт ---------- */
async function boot() {
  if (!initSupabase()) return;
  await loadCategories();
  await loadPhotos();
  await loadVideos();
  renderUsers();
}

boot();
