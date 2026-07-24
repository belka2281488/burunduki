const PHOTO_TABLE = "burunduki";
const VIDEO_TABLE = "burunduki_videos";
const CATEGORY_TABLE = "burunduk_categories";

let allCategories = [];
let currentCategoryFilter = "all";
let currentAuthorFilter = "all";
let currentSort = "date_desc";
let allRatingsMap = {}; // "photo:<id>" / "video:<id>" -> { avg, count }
const RATING_TABLE = "burunduk_ratings";
const GIGER_TABLE = "burunduk_gigers";
const GIGER_GIFTS_TABLE = "burunduk_giger_gifts";
const VIEWS_TABLE = "burunduk_views";
const ACTIVITY_TABLE = "burunduk_activity";
const COMMENTS_TABLE = "burunduk_comments";
const PROFILES_TABLE = "burunduk_profiles";
const NAME_COLOR_PRESETS = [
  "#a0522d", "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71",
  "#1abc9c", "#3498db", "#9b59b6", "#e84393", "#2c3e50",
];

const NAME_GRADIENT_PRESETS = [
  "linear-gradient(90deg, #ff512f, #dd2476)",
  "linear-gradient(90deg, #f7971e, #ffd200)",
  "linear-gradient(90deg, #56ab2f, #a8e063)",
  "linear-gradient(90deg, #00c6ff, #0072ff)",
  "linear-gradient(90deg, #8e2de2, #4a00e0)",
  "linear-gradient(90deg, #ee0979, #ff6a00)",
];
const FOLLOWS_TABLE = "burunduk_follows";
const KURYMDYK_IMAGE = "assets/kurymdyk.png";
const KURYMDYK_NAME_TEXT = "Курымдык";
const KURYMDYK_NAME_HTML = "Курымдык";
const KURYMDYK_UNLOCKS_TABLE = "burunduk_kurymdyk_unlocks";

const FRAMES_TABLE = "burunduk_frames";

const FRAME_DEFS = [
  { id: "wombatramka", name: "Вомбатрамка", asset: "assets/wombatramka.png", type: "buy", price: 5 },
  { id: "burundukramka", name: "Бурундукрамка", asset: "assets/burundukramka.png", type: "buy", price: 10 },
  { id: "belkoslavramka", name: "Белкославрамка", asset: "assets/belkoslavramka.png", type: "buy", price: 15 },
  { id: "patriotramka", name: "Патриотрамка", asset: "assets/patriotramka.png", type: "posts", postsRequired: 10 },
  { id: "capuchinramka", name: "Капуцинрамка", asset: "assets/capuchinramka.png", type: "posts", postsRequired: 25 },
  { id: "sonkaramka", name: "Сонкарамка", asset: "assets/Sonkaramka.png", type: "views", viewsRequired: 50 },
];

/* ---------- Ранги оценки (вместо звёзд) ---------- */
const RANK_LEVELS = [
  { rank: 1, code: "sub 3", label: "не красивый", asset: "assets/sub3.png" },
  { rank: 2, code: "sub 5", label: "не особо красивый, но лучше", asset: "assets/sub5.png" },
  { rank: 3, code: "ltn", label: "ближе к норм", asset: "assets/ltn.png" },
  { rank: 4, code: "mtn", label: "красивенький", asset: "assets/mtn.png" },
  { rank: 5, code: "htn", label: "красивый крутой прям", asset: "assets/htn.png" },
  { rank: 6, code: "chad", label: "прям такой крутой очень", asset: "assets/chad.png" },
  { rank: 7, code: "true burunduk", label: "абсолютный пик красоты", asset: "assets/TrueBurunduk.png" },
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
const authorFilterEl = document.getElementById("authorFilter");
const sortSelectEl = document.getElementById("sortSelect");
const filterToggleBtn = document.getElementById("filterToggleBtn");
const filterPanel = document.getElementById("filterPanel");

if (filterToggleBtn && filterPanel) {
  filterToggleBtn.addEventListener("click", () => {
    filterPanel.classList.toggle("hidden");
    filterToggleBtn.classList.toggle("active");
  });
}
const whoAmIEl = document.getElementById("whoAmI");
const whoAmIGigers = document.getElementById("whoAmIGigers");
const gigerRemoveSound = document.getElementById("gigerRemoveSound");
const changeNameBtn = document.getElementById("changeNameBtn");
const myProfileBtn = document.getElementById("myProfileBtn");
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
const uploadCategory = document.getElementById("uploadCategory");
const newCategoryWrap = document.getElementById("newCategoryWrap");
const newCategoryName = document.getElementById("newCategoryName");
const uploadFollowersOnly = document.getElementById("uploadFollowersOnly");
const uploadKurymdykEnabled = document.getElementById("uploadKurymdykEnabled");
const uploadKurymdykWrap = document.getElementById("uploadKurymdykWrap");
const uploadKurymdykPrice = document.getElementById("uploadKurymdykPrice");
const uploadKurymdykPriceLabel = document.getElementById("uploadKurymdykPriceLabel");
const categoryTabsEl = document.getElementById("categoryTabs");
const NEW_CATEGORY_VALUE = "__new__";

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxName = document.getElementById("lightboxName");
const photoKurymdykPaywall = document.getElementById("photoKurymdykPaywall");
const photoKurymdykPriceLabel = document.getElementById("photoKurymdykPriceLabel");
const photoKurymdykUnlockBtn = document.getElementById("photoKurymdykUnlockBtn");
const lightboxAuthor = document.getElementById("lightboxAuthor");
const lightboxDescription = document.getElementById("lightboxDescription");
const lightboxDate = document.getElementById("lightboxDate");
const photoViewCounter = document.getElementById("photoViewCounter");
const photoLiveViewers = document.getElementById("photoLiveViewers");
const lightboxHint = document.getElementById("lightboxHint");
const lightboxClose = document.getElementById("lightboxClose");
const activityBellBtn = document.getElementById("activityBellBtn");
const activityBadge = document.getElementById("activityBadge");
const activityPanel = document.getElementById("activityPanel");
const activityCloseBtn = document.getElementById("activityCloseBtn");
const activityList = document.getElementById("activityList");

/* ---------- Профиль автора ---------- */
const mainEl = document.querySelector("main");
const profileView = document.getElementById("profileView");
const profileBackBtn = document.getElementById("profileBackBtn");
const profileBanner = document.getElementById("profileBanner");
const profileEditBannerBtn = document.getElementById("profileEditBannerBtn");
const profileAvatar = document.getElementById("profileAvatar");
const profileAvatarFrame = document.getElementById("profileAvatarFrame");
const profileFramesBtn = document.getElementById("profileFramesBtn");
const framesModal = document.getElementById("framesModal");
const framesShopList = document.getElementById("framesShopList");
const framesModalClose = document.getElementById("framesModalClose");
const profileNameColorBtn = document.getElementById("profileNameColorBtn");
const nameColorModal = document.getElementById("nameColorModal");
const nameColorPreview = document.getElementById("nameColorPreview");
const nameColorModeSolid = document.getElementById("nameColorModeSolid");
const nameColorModeGradient = document.getElementById("nameColorModeGradient");
const nameColorSolidPanel = document.getElementById("nameColorSolidPanel");
const nameColorGradientPanel = document.getElementById("nameColorGradientPanel");
const nameColorSwatches = document.getElementById("nameColorSwatches");
const nameGradientSwatches = document.getElementById("nameGradientSwatches");
const nameColorPicker = document.getElementById("nameColorPicker");
const nameGradientFrom = document.getElementById("nameGradientFrom");
const nameGradientTo = document.getElementById("nameGradientTo");
const nameColorApply = document.getElementById("nameColorApply");
const nameColorCancel = document.getElementById("nameColorCancel");
const nameColorReset = document.getElementById("nameColorReset");
const profileOnlineDot = document.getElementById("profileOnlineDot");
const profileEditAvatarBtn = document.getElementById("profileEditAvatarBtn");
const profileName = document.getElementById("profileName");
const profileEditBtn = document.getElementById("profileEditBtn");
const profileFollowBtn = document.getElementById("profileFollowBtn");
const profileBio = document.getElementById("profileBio");
const profileFollowersCount = document.getElementById("profileFollowersCount");
const profileViewsCount = document.getElementById("profileViewsCount");
const profilePostsCount = document.getElementById("profilePostsCount");
const profileTabPhoto = document.getElementById("profileTabPhoto");
const profileTabVideo = document.getElementById("profileTabVideo");
const profileGalleryPhoto = document.getElementById("profileGalleryPhoto");
const profileGalleryVideo = document.getElementById("profileGalleryVideo");
const profileEmpty = document.getElementById("profileEmpty");
const editProfileModal = document.getElementById("editProfileModal");
const editProfileName = document.getElementById("editProfileName");
const editProfileBio = document.getElementById("editProfileBio");
const editProfileCancel = document.getElementById("editProfileCancel");
const editProfileSave = document.getElementById("editProfileSave");
const avatarFileInput = document.getElementById("avatarFileInput");
const bannerFileInput = document.getElementById("bannerFileInput");
const lightboxPrevBtn = document.getElementById("lightboxPrevBtn");
const lightboxNextBtn = document.getElementById("lightboxNextBtn");
const videoLightboxPrevBtn = document.getElementById("videoLightboxPrevBtn");
const videoLightboxNextBtn = document.getElementById("videoLightboxNextBtn");
const zoomContainer = document.getElementById("zoomContainer");
const magnifier = document.getElementById("magnifier");
const modeLoupeBtn = document.getElementById("modeLoupeBtn");
const modeZoomBtn = document.getElementById("modeZoomBtn");
const downloadBtn = document.getElementById("downloadBtn");
const copyBtn = document.getElementById("copyBtn");
const shareBtn = document.getElementById("shareBtn");
const editBtn = document.getElementById("editBtn");
const deleteBtn = document.getElementById("deleteBtn");
const pinBtn = document.getElementById("pinBtn");

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
const videoCategory = document.getElementById("videoCategory");
const newVideoCategoryWrap = document.getElementById("newVideoCategoryWrap");
const newVideoCategoryName = document.getElementById("newVideoCategoryName");
const videoFollowersOnly = document.getElementById("videoFollowersOnly");
const videoKurymdykEnabled = document.getElementById("videoKurymdykEnabled");
const videoKurymdykWrap = document.getElementById("videoKurymdykWrap");
const videoKurymdykPrice = document.getElementById("videoKurymdykPrice");
const videoKurymdykPriceLabel = document.getElementById("videoKurymdykPriceLabel");

const videoLightbox = document.getElementById("videoLightbox");
const videoLightboxClose = document.getElementById("videoLightboxClose");
const videoLightboxName = document.getElementById("videoLightboxName");
const videoKurymdykPaywall = document.getElementById("videoKurymdykPaywall");
const videoKurymdykPriceLabel2 = document.getElementById("videoKurymdykPriceLabel2");
const videoKurymdykUnlockBtn = document.getElementById("videoKurymdykUnlockBtn");
const videoLightboxAuthor = document.getElementById("videoLightboxAuthor");
const videoLightboxDescription = document.getElementById("videoLightboxDescription");
const videoLightboxDate = document.getElementById("videoLightboxDate");
const videoViewCounter = document.getElementById("videoViewCounter");
const videoLiveViewers = document.getElementById("videoLiveViewers");
const videoContainer = document.getElementById("videoContainer");
const videoOpenBtn = document.getElementById("videoOpenBtn");
const videoShareBtn = document.getElementById("videoShareBtn");
const videoEditBtn = document.getElementById("videoEditBtn");
const videoDeleteBtn = document.getElementById("videoDeleteBtn");
const videoPinBtn = document.getElementById("videoPinBtn");

/* ---------- DOM: оценки ---------- */
const ratingEls = {
  photo: {
    summaryImg: document.getElementById("photoRatingSummaryImg"),
    score: document.getElementById("photoRatingScore"),
    label: document.getElementById("photoRatingLabel"),
    picker: document.getElementById("photoRatingPicker"),
    submit: document.getElementById("photoRatingSubmit"),
  },
  video: {
    summaryImg: document.getElementById("videoRatingSummaryImg"),
    score: document.getElementById("videoRatingScore"),
    label: document.getElementById("videoRatingLabel"),
    picker: document.getElementById("videoRatingPicker"),
    submit: document.getElementById("videoRatingSubmit"),
  },
};

let selectedRank = { photo: null, video: null };
let currentRatingTarget = { photo: null, video: null };

/* ---------- DOM: комментарии (отдельная лента, не привязана к оценке) ---------- */
const commentEls = {
  photo: {
    list: document.getElementById("photoCommentsList"),
    input: document.getElementById("photoCommentInput"),
    submit: document.getElementById("photoCommentSubmit"),
    replyHint: document.getElementById("photoReplyHint"),
    replyHintName: document.getElementById("photoReplyHintName"),
    replyCancel: document.getElementById("photoReplyCancelBtn"),
  },
  video: {
    list: document.getElementById("videoCommentsList"),
    input: document.getElementById("videoCommentInput"),
    submit: document.getElementById("videoCommentSubmit"),
    replyHint: document.getElementById("videoReplyHint"),
    replyHintName: document.getElementById("videoReplyHintName"),
    replyCancel: document.getElementById("videoReplyCancelBtn"),
  },
};

// Кому сейчас отвечаем: { id, name } комментария или null (обычный комментарий).
let commentReplyTarget = { photo: null, video: null };

/* ---------- DOM: гиперзадки ---------- */
const gigerEls = {
  photo: {
    box: document.getElementById("photoGigerBox"),
    checkbox: document.getElementById("photoGigerCheckbox"),
  },
  video: {
    box: document.getElementById("videoGigerBox"),
    checkbox: document.getElementById("videoGigerCheckbox"),
  },
};

// true, если текущий пользователь уже подарил гиперзадку текущей карточке
// (в таком случае чекбокс вообще не показываем — дарить больше нечего)
let alreadyGifted = { photo: false, video: false };

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

nameConfirm.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  if (!name) {
    showToast("Введи своё имя");
    return;
  }
  currentIdentity = currentIdentity ? updateIdentityName(name) : saveIdentity(name);
  nameModal.classList.remove("active");
  nameInput.value = "";
  refreshWhoAmI();
  refreshMyGigerBalance();
  refreshActivityBadge();
  subscribeActivityRealtime();
  subscribeSitePresence();

  if (db && currentIdentity) {
    delete profileCache[currentIdentity.code];
    await db
      .from(PROFILES_TABLE)
      .upsert({ owner_code: currentIdentity.code, display_name: name }, { onConflict: "owner_code" });
    delete profileCache[currentIdentity.code];
  }

  unlockedKurymdykSet = null;
  unlockedKurymdykForCode = null;
  await Promise.all([loadPhotos(), loadVideos()]);
});

changeNameBtn.addEventListener("click", () => {
  nameInput.value = currentIdentity ? currentIdentity.name : "";
  nameModal.classList.add("active");
});

myProfileBtn.addEventListener("click", () => {
  if (!currentIdentity) {
    nameModal.classList.add("active");
    return;
  }
  openProfile(currentIdentity.code);
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
    const approvedCategoryIds = new Set(allCategories.map(c => c.id));
    let base = allPhotoRecords.filter(r => !r.category_id || approvedCategoryIds.has(r.category_id));
    if (currentCategoryFilter !== "all") {
      base = base.filter(r => r.category_id === currentCategoryFilter);
    }
    if (currentAuthorFilter !== "all") {
      base = base.filter(r => r.owner_code === currentAuthorFilter);
    }
    let filtered = query
      ? base.filter(r => r.name.toLowerCase().includes(query))
      : base;
    filtered = applySort(filtered, "photo");
    statusEl.textContent = query
      ? `Найдено: ${filtered.length}`
      : `Фото в галерее: ${filtered.length}`;
    renderPhotoGallery(filtered);
  } else {
    const approvedCategoryIds = new Set(allCategories.map(c => c.id));
    let base = allVideoRecords.filter(r => !r.category_id || approvedCategoryIds.has(r.category_id));
    if (currentCategoryFilter !== "all") {
      base = base.filter(r => r.category_id === currentCategoryFilter);
    }
    if (currentAuthorFilter !== "all") {
      base = base.filter(r => r.owner_code === currentAuthorFilter);
    }
    let filtered = query
      ? base.filter(r => r.name.toLowerCase().includes(query))
      : base;
    filtered = applySort(filtered, "video");
    statusEl.textContent = query
      ? `Найдено: ${filtered.length}`
      : `Видео в галерее: ${filtered.length}`;
    renderVideoGallery(filtered);
  }
}

searchInput.addEventListener("input", applySearch);

/* ==================================================================
   ФОТО
   ================================================================== */
/* ==================================================================
   РАЗДЕЛЫ (категории фото)
   ================================================================== */
async function loadCategories() {
  const { data, error } = await db
    .from(CATEGORY_TABLE)
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  if (error) return;
  allCategories = data || [];
  fillCategorySelect();
  renderCategoryTabs();
}

function fillCategorySelect() {
  [uploadCategory, videoCategory].forEach((selectEl) => {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    allCategories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name;
      selectEl.appendChild(opt);
    });
    const newOpt = document.createElement("option");
    newOpt.value = NEW_CATEGORY_VALUE;
    newOpt.textContent = "➕ Создать свой раздел...";
    selectEl.appendChild(newOpt);
  });
}

if (uploadCategory) {
  uploadCategory.addEventListener("change", () => {
    if (uploadCategory.value === NEW_CATEGORY_VALUE) {
      newCategoryWrap.classList.remove("hidden");
    } else {
      newCategoryWrap.classList.add("hidden");
    }
  });
}

if (videoCategory) {
  videoCategory.addEventListener("change", () => {
    if (videoCategory.value === NEW_CATEGORY_VALUE) {
      newVideoCategoryWrap.classList.remove("hidden");
    } else {
      newVideoCategoryWrap.classList.add("hidden");
    }
  });
}

function renderCategoryTabs() {
  if (!categoryTabsEl) return;
  categoryTabsEl.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.className = "category-tab" + (currentCategoryFilter === "all" ? " active" : "");
  allBtn.textContent = "Все разделы";
  allBtn.addEventListener("click", () => {
    currentCategoryFilter = "all";
    renderCategoryTabs();
    applySearch();
  });
  categoryTabsEl.appendChild(allBtn);

  allCategories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "category-tab" + (currentCategoryFilter === cat.id ? " active" : "");
    btn.textContent = cat.name;
    btn.addEventListener("click", () => {
      currentCategoryFilter = cat.id;
      renderCategoryTabs();
      applySearch();
    });
    categoryTabsEl.appendChild(btn);
  });
}

/* ==================================================================
   ВСЕ РЕЙТИНГИ (для сортировки галереи по оценке)
   ================================================================== */
async function loadAllRatings() {
  const { data, error } = await db.from(RATING_TABLE).select("target_type, target_id, rank");
  if (error) return;

  const sums = {};
  (data || []).forEach((r) => {
    const key = `${r.target_type}:${r.target_id}`;
    if (!sums[key]) sums[key] = { sum: 0, count: 0 };
    sums[key].sum += r.rank;
    sums[key].count += 1;
  });

  allRatingsMap = {};
  Object.keys(sums).forEach((key) => {
    allRatingsMap[key] = { avg: sums[key].sum / sums[key].count, count: sums[key].count };
  });
}

function getAvgRating(kind, id) {
  const entry = allRatingsMap[`${kind}:${id}`];
  return entry ? entry.avg : null;
}

function getRatingCount(kind, id) {
  const entry = allRatingsMap[`${kind}:${id}`];
  return entry ? entry.count : 0;
}

/* ==================================================================
   ФИЛЬТР ПО АВТОРУ И СОРТИРОВКА
   ================================================================== */
function fillAuthorFilter() {
  if (!authorFilterEl) return;
  const names = new Map(); // owner_code -> owner_name

  allPhotoRecords.forEach((r) => { if (r.owner_code && r.owner_name) names.set(r.owner_code, r.owner_name); });
  allVideoRecords.forEach((r) => { if (r.owner_code && r.owner_name) names.set(r.owner_code, r.owner_name); });

  const prev = authorFilterEl.value || "all";
  authorFilterEl.innerHTML = `<option value="all">Все авторы</option>`;
  [...names.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "ru"))
    .forEach(([code, name]) => {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = name;
      authorFilterEl.appendChild(opt);
    });
  authorFilterEl.value = [...names.keys()].includes(prev) || prev === "all" ? prev : "all";
}

if (authorFilterEl) {
  authorFilterEl.addEventListener("change", () => {
    currentAuthorFilter = authorFilterEl.value;
    applySearch();
  });
}

if (sortSelectEl) {
  sortSelectEl.addEventListener("change", () => {
    currentSort = sortSelectEl.value;
    applySearch();
  });
}

function applySort(records, kind) {
  const sorted = [...records];
  switch (currentSort) {
    case "date_asc":
      sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      break;
    case "name_asc":
      sorted.sort((a, b) => a.name.localeCompare(b.name, "ru"));
      break;
    case "name_desc":
      sorted.sort((a, b) => b.name.localeCompare(a.name, "ru"));
      break;
    case "rating_desc":
      sorted.sort((a, b) => {
        const ra = getAvgRating(kind, a.id);
        const rb = getAvgRating(kind, b.id);
        if (ra === null && rb === null) return 0;
        if (ra === null) return 1;
        if (rb === null) return -1;
        return rb - ra;
      });
      break;
    case "rating_asc":
      sorted.sort((a, b) => {
        const ra = getAvgRating(kind, a.id);
        const rb = getAvgRating(kind, b.id);
        if (ra === null && rb === null) return 0;
        if (ra === null) return 1;
        if (rb === null) return -1;
        return ra - rb;
      });
      break;
    case "rating_count_desc":
      sorted.sort((a, b) => getRatingCount(kind, b.id) - getRatingCount(kind, a.id));
      break;
    case "date_desc":
    default:
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
  }
  return sorted;
}

// Создаёт заявку на новый раздел (status = pending) и возвращает её id,
// чтобы сразу привязать фото к этой заявке. Если админ одобрит раздел,
// фото само "станет видно" всем, т.к. категория сменит статус.
async function createPendingCategory(name, ownerName, ownerCode) {
  const { data, error } = await db
    .from(CATEGORY_TABLE)
    .insert({
      name,
      status: "pending",
      created_by_name: ownerName || null,
      created_by_code: ownerCode || null,
    })
    .select()
    .single();

  if (error) return null;
  return data;
}

let mySubscriptions = null; // Set с owner_code тех, на кого подписан текущий пользователь

async function loadMySubscriptions() {
  if (!currentIdentity || !db) {
    mySubscriptions = new Set();
    return mySubscriptions;
  }
  const { data, error } = await db
    .from(FOLLOWS_TABLE)
    .select("target_code")
    .eq("follower_code", currentIdentity.code);

  mySubscriptions = new Set(error ? [] : (data || []).map((r) => r.target_code));
  return mySubscriptions;
}

// true, если текущий пользователь может видеть запись: либо она открытая,
// либо это его собственная публикация, либо он подписан на автора.
if (uploadKurymdykEnabled) {
  uploadKurymdykEnabled.addEventListener("change", () => {
    uploadKurymdykWrap.classList.toggle("hidden", !uploadKurymdykEnabled.checked);
  });
}
if (uploadKurymdykPrice) {
  uploadKurymdykPrice.addEventListener("input", () => {
    uploadKurymdykPriceLabel.textContent = uploadKurymdykPrice.value;
  });
}
if (videoKurymdykEnabled) {
  videoKurymdykEnabled.addEventListener("change", () => {
    videoKurymdykWrap.classList.toggle("hidden", !videoKurymdykEnabled.checked);
  });
}
if (videoKurymdykPrice) {
  videoKurymdykPrice.addEventListener("input", () => {
    videoKurymdykPriceLabel.textContent = videoKurymdykPrice.value;
  });
}

function canSeeRecord(record) {
  if (!record.followers_only) return true;
  if (currentIdentity && record.owner_code === currentIdentity.code) return true;
  if (!mySubscriptions) return false; // подписки ещё не загружены — на всякий случай скрываем
  return mySubscriptions.has(record.owner_code);
}

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

  if (!mySubscriptions) await loadMySubscriptions();
  await loadUnlockedKurymdyk();
  allPhotoRecords = (data || []).filter(canSeeRecord);
  fillAuthorFilter();
  await preloadProfilesFor(allPhotoRecords);

  if (!allPhotoRecords.length) {
    statusEl.textContent = "Пока нет ни одного фото — добавь первое!";
    galleryPhoto.innerHTML = "";
    return;
  }

  applySearch();
}

let unlockedKurymdykSet = null; // Set из "photo:<id>" / "video:<id>", которые текущий юзер уже оплатил
let unlockedKurymdykForCode = null; // owner_code, для которого сейчас загружен unlockedKurymdykSet

async function loadUnlockedKurymdyk() {
  if (!currentIdentity || !db) {
    unlockedKurymdykSet = new Set();
    unlockedKurymdykForCode = null;
    return unlockedKurymdykSet;
  }
  if (unlockedKurymdykSet && unlockedKurymdykForCode === currentIdentity.code) {
    return unlockedKurymdykSet;
  }
  const { data, error } = await db
    .from(KURYMDYK_UNLOCKS_TABLE)
    .select("target_type, target_id")
    .eq("viewer_code", currentIdentity.code);

  if (error) {
    console.error("[kurymdyk] не удалось загрузить разблокировки:", error);
    unlockedKurymdykSet = new Set();
    unlockedKurymdykForCode = null;
    return unlockedKurymdykSet;
  }

  unlockedKurymdykSet = new Set((data || []).map((r) => `${r.target_type}:${r.target_id}`));
  unlockedKurymdykForCode = currentIdentity.code;
  return unlockedKurymdykSet;
}

function isKurymdykLocked(kind, record) {
  const price = record.kurymdyk_price || 0;
  if (price <= 0) return false;
  if (currentIdentity && record.owner_code === currentIdentity.code) return false;
  if (!unlockedKurymdykSet) return true;
  return !unlockedKurymdykSet.has(`${kind}:${record.id}`);
}

async function unlockKurymdyk(kind, record) {
  if (!currentIdentity) {
    showToast("Сначала укажи своё имя 🐿️");
    return false;
  }
  const price = record.kurymdyk_price || 0;
  const { data, error } = await db.rpc("kurymdyk_unlock", {
    p_target_type: kind,
    p_target_id: record.id,
    p_viewer_code: currentIdentity.code,
    p_viewer_name: currentIdentity.name,
    p_owner_code: record.owner_code,
    p_price: price,
  });

  if (error || !data) {
    showToast("Не хватает гиперзадок 😔");
    return false;
  }

  unlockedKurymdykSet.add(`${kind}:${record.id}`);
  await refreshMyGigerBalance();
  showToast("Курымдык разблокирован 🎭");
  return true;
}

function publicUrlFor(storagePath) {
  const { data } = db.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
  return data.publicUrl;
}

function nameFromFilename(filename) {
  return filename.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

function formatPublishDate(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const datePart = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  const timePart = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return `Опубликовано: ${datePart}, ${timePart}`;
}

let allPhotoRecords = [];
let allVideoRecords = [];
let currentPhotoList = [];
let currentPhotoIndex = -1;

function renderPhotoGallery(records) {
  currentPhotoList = records;
  galleryPhoto.innerHTML = "";
  records.forEach((record, idx) => {
    const locked = isKurymdykLocked("photo", record);
    const src = locked ? KURYMDYK_IMAGE : publicUrlFor(record.storage_path);
    const displayName = locked ? KURYMDYK_NAME_TEXT : record.name;
    const displayNameHtml = locked ? KURYMDYK_NAME_HTML : escapeHtml(record.name);
    const card = document.createElement("div");
    card.className = "card" + (locked ? " kurymdyk-locked" : "");
    card.innerHTML = `
      <img src="${src}" alt="${displayName}" loading="lazy">
      ${locked ? `<div class="kurymdyk-badge" title="Платный просмотр"><img src="assets/giperzadka.png" style="width:14px;height:14px;object-fit:contain;"> ${record.kurymdyk_price}</div>` : ""}
      ${record.followers_only ? `<div class="followers-only-badge" title="Только для подписчиков">🔒</div>` : ""}
      <div class="name">${displayNameHtml}</div>
      ${record.owner_name && !locked ? `<div class="owner-tag owner-tag-link" data-owner="${record.owner_code}"><span class="online-dot" data-online-for="${record.owner_code}"></span>от ${displayNameFor(record.owner_code, record.owner_name)}</div>` : ""}
    `;
    card.addEventListener("click", () => openLightbox(record, locked ? KURYMDYK_IMAGE : src, idx));
    const ownerTag = card.querySelector(".owner-tag-link");
    if (ownerTag) {
      ownerTag.addEventListener("click", (e) => {
        e.stopPropagation();
        openProfile(record.owner_code);
      });
    }
    galleryPhoto.appendChild(card);
  });
  applyOnlinePresence();
}

uploadPhotoBtn.addEventListener("click", () => {
  editingPhotoRecord = null;
  modalTitle.textContent = "Новый бурундук 🐿️";
  uploadConfirm.textContent = "Добавить в галерею";
  uploadPreview.src = "";
  uploadName.value = "";
  uploadDescription.value = "";
  currentPickedFile = null;
  if (uploadCategory) uploadCategory.value = allCategories[0] ? allCategories[0].id : NEW_CATEGORY_VALUE;
  if (newCategoryWrap) newCategoryWrap.classList.add("hidden");
  if (newCategoryName) newCategoryName.value = "";
  if (uploadFollowersOnly) uploadFollowersOnly.checked = false;
  if (uploadKurymdykEnabled) uploadKurymdykEnabled.checked = false;
  if (uploadKurymdykWrap) uploadKurymdykWrap.classList.add("hidden");
  if (uploadKurymdykPrice) uploadKurymdykPrice.value = 1;
  if (uploadKurymdykPriceLabel) uploadKurymdykPriceLabel.textContent = "1";
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
      .update({
        name: displayName,
        description: description || null,
        followers_only: uploadFollowersOnly.checked,
        kurymdyk_price: uploadKurymdykEnabled && uploadKurymdykEnabled.checked ? Number(uploadKurymdykPrice.value) : 0,
      })
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

  let categoryId = uploadCategory ? uploadCategory.value : null;
  let isNewPendingCategory = false;

  if (categoryId === NEW_CATEGORY_VALUE) {
    const newName = (newCategoryName.value || "").trim();
    if (!newName) {
      showToast("Введи название нового раздела");
      uploadConfirm.disabled = false;
      return;
    }
    uploadConfirm.textContent = "Отправляю заявку на раздел...";
    const created = await createPendingCategory(
      newName,
      currentIdentity ? currentIdentity.name : null,
      currentIdentity ? currentIdentity.code : null
    );
    if (!created) {
      showToast("Не удалось создать раздел, попробуй ещё раз");
      uploadConfirm.disabled = false;
      uploadConfirm.textContent = "Добавить в галерею";
      return;
    }
    categoryId = created.id;
    isNewPendingCategory = true;
  } else if (!categoryId) {
    showToast("Выбери раздел");
    uploadConfirm.disabled = false;
    return;
  }

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

  const { data: insertedPhoto, error: insertError } = await db
    .from(PHOTO_TABLE)
    .insert({
      storage_path: storagePath,
      name: displayName,
      description: description || null,
      owner_name: currentIdentity ? currentIdentity.name : null,
      owner_code: currentIdentity ? currentIdentity.code : null,
      category_id: categoryId,
      followers_only: uploadFollowersOnly.checked,
      kurymdyk_price: uploadKurymdykEnabled && uploadKurymdykEnabled.checked ? Number(uploadKurymdykPrice.value) : 0,
    })
    .select()
    .single();

  uploadConfirm.disabled = false;
  uploadConfirm.textContent = "Добавить в галерею";

  if (insertError) {
    showToast("Файл загружен, но не удалось сохранить запись: " + insertError.message);
    return;
  }

  uploadModal.classList.remove("active");
  fileInput.value = "";
  currentPickedFile = null;
  if (isNewPendingCategory) {
    showToast("Фото загружено, раздел на рассмотрении у админа 🕓");
  } else {
    showToast("Бурундук добавлен в галерею 🐿️");
  }
  creditGigersForPublish("photo");
  notifyFollowersOfNewPost("photo", insertedPhoto);
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
  if (uploadFollowersOnly) uploadFollowersOnly.checked = !!currentPhotoRecord.followers_only;
  const photoKurymdykPrice = currentPhotoRecord.kurymdyk_price || 0;
  if (uploadKurymdykEnabled) uploadKurymdykEnabled.checked = photoKurymdykPrice > 0;
  if (uploadKurymdykWrap) uploadKurymdykWrap.classList.toggle("hidden", photoKurymdykPrice <= 0);
  if (uploadKurymdykPrice) uploadKurymdykPrice.value = photoKurymdykPrice > 0 ? photoKurymdykPrice : 1;
  if (uploadKurymdykPriceLabel) uploadKurymdykPriceLabel.textContent = uploadKurymdykPrice.value;
  uploadModal.classList.add("active");
});

deleteBtn.addEventListener("click", () => {
  if (!currentPhotoRecord) return;
  deleteModal.dataset.kind = "photo";
  deleteModal.classList.add("active");
});

pinBtn.addEventListener("click", () => togglePin("photo", currentPhotoRecord));

// Закрепить/открепить публикацию в профиле владельца. Закреплённые
// посты всегда показываются первыми на странице профиля.
async function togglePin(kind, record) {
  if (!record || !isOwner(record)) return;
  const table = kind === "photo" ? PHOTO_TABLE : VIDEO_TABLE;
  const nextPinned = !record.pinned;

  const { error } = await db.from(table).update({ pinned: nextPinned }).eq("id", record.id);
  if (error) {
    showToast("Не удалось изменить закрепление: " + error.message);
    return;
  }

  record.pinned = nextPinned;
  showToast(nextPinned ? "Закреплено в профиле 📌" : "Откреплено");

  if (kind === "photo") {
    pinBtn.textContent = nextPinned ? "📌 Открепить" : "📌 Закрепить";
    pinBtn.title = nextPinned ? "Убрать из закреплённых" : "Закрепить в профиле";
  } else {
    videoPinBtn.textContent = nextPinned ? "📌 Открепить" : "📌 Закрепить";
    videoPinBtn.title = nextPinned ? "Убрать из закреплённых" : "Закрепить в профиле";
  }

  if (kind === "photo") loadPhotos();
  else loadVideos();

  if (viewingProfileCode === record.owner_code) {
    renderProfileGallery(kind);
  }
}

/* ---------- Лайтбокс фото ---------- */
let currentMode = "loupe";

function openLightbox(record, src, index) {
  currentPhotoRecord = record;
  currentPhotoSrc = src;
  currentPhotoIndex = typeof index === "number" ? index : currentPhotoList.indexOf(record);
  if (record.owner_code) fetchProfile(record.owner_code);

  const locked = isKurymdykLocked("photo", record);
  photoKurymdykPaywall.classList.toggle("hidden", !locked);
  if (locked) photoKurymdykPriceLabel.textContent = record.kurymdyk_price;

  const displayName = locked ? KURYMDYK_NAME_TEXT : record.name;
  const displaySrc = locked ? KURYMDYK_IMAGE : src;

  lightboxImg.src = displaySrc;
  lightboxImg.style.transform = "";
  lightboxName.innerHTML = locked ? KURYMDYK_NAME_HTML : escapeHtml(record.name);
  lightboxDescription.textContent = locked ? "" : (record.description || "");
  lightboxDescription.style.display = !locked && record.description ? "block" : "none";
  lightboxDate.textContent = locked ? "" : formatPublishDate(record.created_at);
  if (record.owner_name && !locked) {
    lightboxAuthor.innerHTML = `<span class="online-dot" data-online-for="${record.owner_code || ""}"></span>от ${escapeHtml(displayNameFor(record.owner_code, record.owner_name))}`;
    lightboxAuthor.dataset.owner = record.owner_code || "";
    lightboxAuthor.style.display = record.owner_code ? "block" : "none";
  } else {
    lightboxAuthor.textContent = "";
    lightboxAuthor.style.display = "none";
  }
  magnifier.style.backgroundImage = `url('${displaySrc}')`;
  setMode("loupe");

  const owner = isOwner(record);
  editBtn.classList.toggle("hidden", !owner);
  deleteBtn.classList.toggle("hidden", !owner);
  pinBtn.classList.toggle("hidden", !owner);
  pinBtn.textContent = record.pinned ? "📌 Открепить" : "📌 Закрепить";
  pinBtn.title = record.pinned ? "Убрать из закреплённых" : "Закрепить в профиле";

  updateLightboxNavButtons();

  lightbox.classList.add("active");
  lightbox.classList.toggle("kurymdyk-active", locked);

  if (locked) return;

  loadRatings("photo", record.id);
  loadComments("photo", record.id);
  setReplyTarget("photo", null);
  loadGiftState("photo", record);
  registerView("photo", record).then(() => showViewCount("photo", record.id, photoViewCounter));
  showViewCount("photo", record.id, photoViewCounter);
  applyOnlinePresence();
  joinViewingPresence("photo", record.id);
}

if (photoKurymdykUnlockBtn) {
  photoKurymdykUnlockBtn.addEventListener("click", async () => {
    if (!currentPhotoRecord) return;
    photoKurymdykUnlockBtn.disabled = true;
    const ok = await unlockKurymdyk("photo", currentPhotoRecord);
    photoKurymdykUnlockBtn.disabled = false;
    if (ok) {
      const src = publicUrlFor(currentPhotoRecord.storage_path);
      openLightbox(currentPhotoRecord, src, currentPhotoIndex);
    }
  });
}

function updateLightboxNavButtons() {
  if (!lightboxPrevBtn || !lightboxNextBtn) return;
  const hasMultiple = currentPhotoList.length > 1;
  lightboxPrevBtn.classList.toggle("hidden", !hasMultiple);
  lightboxNextBtn.classList.toggle("hidden", !hasMultiple);
}

function showPhotoAtIndex(index) {
  if (!currentPhotoList.length) return;
  const len = currentPhotoList.length;
  const newIndex = ((index % len) + len) % len;
  const record = currentPhotoList[newIndex];
  const locked = isKurymdykLocked("photo", record);
  const src = locked ? KURYMDYK_IMAGE : publicUrlFor(record.storage_path);
  openLightbox(record, src, newIndex);
}

function showPrevPhoto() {
  if (currentPhotoIndex === -1) return;
  showPhotoAtIndex(currentPhotoIndex - 1);
}

function showNextPhoto() {
  if (currentPhotoIndex === -1) return;
  showPhotoAtIndex(currentPhotoIndex + 1);
}

if (lightboxPrevBtn) lightboxPrevBtn.addEventListener("click", (e) => { e.stopPropagation(); showPrevPhoto(); });
if (lightboxNextBtn) lightboxNextBtn.addEventListener("click", (e) => { e.stopPropagation(); showNextPhoto(); });

document.addEventListener("keydown", (e) => {
  if (lightbox.classList.contains("active")) {
    if (e.key === "ArrowLeft") showPrevPhoto();
    else if (e.key === "ArrowRight") showNextPhoto();
    else if (e.key === "Escape") closeLightbox();
  } else if (videoLightbox.classList.contains("active")) {
    if (e.key === "ArrowLeft") showPrevVideo();
    else if (e.key === "ArrowRight") showNextVideo();
    else if (e.key === "Escape") closeVideoLightbox();
  }
});

function closeLightbox() {
  lightbox.classList.remove("active");
  magnifier.style.display = "none";
  currentPhotoRecord = null;
  currentPhotoIndex = -1;
  leaveViewingPresence();
}

lightboxClose.addEventListener("click", closeLightbox);
lightboxAuthor.addEventListener("click", () => {
  if (lightboxAuthor.dataset.owner) {
    closeLightbox();
    openProfile(lightboxAuthor.dataset.owner);
  }
});
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

  if (e.target.closest && e.target.closest(".lightbox-nav")) {
    magnifier.style.display = "none";
    return;
  }

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

if (lightboxPrevBtn) {
  lightboxPrevBtn.addEventListener("mouseenter", () => { magnifier.style.display = "none"; });
}
if (lightboxNextBtn) {
  lightboxNextBtn.addEventListener("mouseenter", () => { magnifier.style.display = "none"; });
}

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

  if (!mySubscriptions) await loadMySubscriptions();
  await loadUnlockedKurymdyk();
  allVideoRecords = (data || []).filter(canSeeRecord);
  fillAuthorFilter();
  await preloadProfilesFor(allVideoRecords);

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

let currentVideoList = [];
let currentVideoIndex = -1;

function renderVideoGallery(records) {
  currentVideoList = records;
  galleryVideo.innerHTML = "";
  records.forEach((record, idx) => {
    const locked = isKurymdykLocked("video", record);
    const displayName = locked ? KURYMDYK_NAME_TEXT : record.name;
    const displayNameHtml = locked ? KURYMDYK_NAME_HTML : escapeHtml(record.name);
    const card = document.createElement("div");
    card.className = "card" + (locked ? " kurymdyk-locked" : "");
    card.innerHTML = `
      <div class="video-thumb">
        <img src="${locked ? KURYMDYK_IMAGE : "assets/video-cover.png"}" alt="${displayName}" loading="lazy">
      </div>
      ${locked ? `<div class="kurymdyk-badge" title="Платный просмотр"><img src="assets/giperzadka.png" style="width:14px;height:14px;object-fit:contain;"> ${record.kurymdyk_price}</div>` : ""}
      ${record.followers_only ? `<div class="followers-only-badge" title="Только для подписчиков">🔒</div>` : ""}
      ${!locked ? `<div class="video-badge">${SOURCE_LABELS[record.source] || "Видео"}</div>` : ""}
      <div class="name">${displayNameHtml}</div>
      ${record.owner_name && !locked ? `<div class="owner-tag owner-tag-link" data-owner="${record.owner_code}"><span class="online-dot" data-online-for="${record.owner_code}"></span>от ${displayNameFor(record.owner_code, record.owner_name)}</div>` : ""}
    `;
    card.addEventListener("click", () => openVideoLightbox(record, idx));
    const ownerTag = card.querySelector(".owner-tag-link");
    if (ownerTag) {
      ownerTag.addEventListener("click", (e) => {
        e.stopPropagation();
        openProfile(record.owner_code);
      });
    }
    galleryVideo.appendChild(card);
  });
  applyOnlinePresence();
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

function openVideoLightbox(record, index) {
  currentVideoRecord = record;
  currentVideoIndex = typeof index === "number" ? index : currentVideoList.indexOf(record);
  if (record.owner_code) fetchProfile(record.owner_code);

  const locked = isKurymdykLocked("video", record);
  videoKurymdykPaywall.classList.toggle("hidden", !locked);
  if (locked) videoKurymdykPriceLabel2.textContent = record.kurymdyk_price;

  videoLightboxName.innerHTML = locked ? KURYMDYK_NAME_HTML : escapeHtml(record.name);
  videoLightboxDescription.textContent = locked ? "" : (record.description || "");
  videoLightboxDescription.style.display = !locked && record.description ? "block" : "none";
  videoLightboxDate.textContent = locked ? "" : formatPublishDate(record.created_at);
  if (record.owner_name && !locked) {
    videoLightboxAuthor.innerHTML = `<span class="online-dot" data-online-for="${record.owner_code || ""}"></span>от ${escapeHtml(displayNameFor(record.owner_code, record.owner_name))}`;
    videoLightboxAuthor.dataset.owner = record.owner_code || "";
    videoLightboxAuthor.style.display = record.owner_code ? "block" : "none";
  } else {
    videoLightboxAuthor.textContent = "";
    videoLightboxAuthor.style.display = "none";
  }

  if (locked) {
    videoContainer.innerHTML = `<img src="${KURYMDYK_IMAGE}" alt="курымдык" style="width:100%;height:100%;object-fit:contain;">`;
    videoContainer.classList.remove("landscape");
  } else {
    const { html, landscape } = buildEmbedHtml(record);
    videoContainer.innerHTML = html;
    videoContainer.classList.toggle("landscape", !!landscape);
  }

  const owner = isOwner(record);
  videoEditBtn.classList.toggle("hidden", !owner);
  videoDeleteBtn.classList.toggle("hidden", !owner);
  videoPinBtn.classList.toggle("hidden", !owner);
  videoPinBtn.textContent = record.pinned ? "📌 Открепить" : "📌 Закрепить";
  videoPinBtn.title = record.pinned ? "Убрать из закреплённых" : "Закрепить в профиле";

  updateVideoNavButtons();

  videoLightbox.classList.add("active");
  videoLightbox.classList.toggle("kurymdyk-active", locked);

  if (locked) return;

  loadRatings("video", record.id);
  loadComments("video", record.id);
  setReplyTarget("video", null);
  loadGiftState("video", record);
  registerView("video", record).then(() => showViewCount("video", record.id, videoViewCounter));
  showViewCount("video", record.id, videoViewCounter);
  applyOnlinePresence();
  joinViewingPresence("video", record.id);
}

if (videoKurymdykUnlockBtn) {
  videoKurymdykUnlockBtn.addEventListener("click", async () => {
    if (!currentVideoRecord) return;
    videoKurymdykUnlockBtn.disabled = true;
    const ok = await unlockKurymdyk("video", currentVideoRecord);
    videoKurymdykUnlockBtn.disabled = false;
    if (ok) openVideoLightbox(currentVideoRecord, currentVideoIndex);
  });
}

function updateVideoNavButtons() {
  if (!videoLightboxPrevBtn || !videoLightboxNextBtn) return;
  const hasMultiple = currentVideoList.length > 1;
  videoLightboxPrevBtn.classList.toggle("hidden", !hasMultiple);
  videoLightboxNextBtn.classList.toggle("hidden", !hasMultiple);
}

function showVideoAtIndex(index) {
  if (!currentVideoList.length) return;
  const len = currentVideoList.length;
  const newIndex = ((index % len) + len) % len;
  openVideoLightbox(currentVideoList[newIndex], newIndex);
}

function showPrevVideo() {
  if (currentVideoIndex === -1) return;
  showVideoAtIndex(currentVideoIndex - 1);
}

function showNextVideo() {
  if (currentVideoIndex === -1) return;
  showVideoAtIndex(currentVideoIndex + 1);
}

if (videoLightboxPrevBtn) videoLightboxPrevBtn.addEventListener("click", (e) => { e.stopPropagation(); showPrevVideo(); });
if (videoLightboxNextBtn) videoLightboxNextBtn.addEventListener("click", (e) => { e.stopPropagation(); showNextVideo(); });

function closeVideoLightbox() {
  videoLightbox.classList.remove("active");
  videoContainer.innerHTML = ""; // остановить воспроизведение
  currentVideoRecord = null;
  currentVideoIndex = -1;
  leaveViewingPresence();
}

videoLightboxClose.addEventListener("click", closeVideoLightbox);
videoLightboxAuthor.addEventListener("click", () => {
  if (videoLightboxAuthor.dataset.owner) {
    closeVideoLightbox();
    openProfile(videoLightboxAuthor.dataset.owner);
  }
});
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
  if (videoCategory) videoCategory.value = allCategories[0] ? allCategories[0].id : NEW_CATEGORY_VALUE;
  if (newVideoCategoryWrap) newVideoCategoryWrap.classList.add("hidden");
  if (newVideoCategoryName) newVideoCategoryName.value = "";
  if (videoFollowersOnly) videoFollowersOnly.checked = false;
  if (videoKurymdykEnabled) videoKurymdykEnabled.checked = false;
  if (videoKurymdykWrap) videoKurymdykWrap.classList.add("hidden");
  if (videoKurymdykPrice) videoKurymdykPrice.value = 1;
  if (videoKurymdykPriceLabel) videoKurymdykPriceLabel.textContent = "1";
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
      .update({
        video_url: url,
        source: selectedSource,
        name: displayName,
        description: description || null,
        followers_only: videoFollowersOnly.checked,
        kurymdyk_price: videoKurymdykEnabled && videoKurymdykEnabled.checked ? Number(videoKurymdykPrice.value) : 0,
      })
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

  let categoryId = videoCategory ? videoCategory.value : null;
  let isNewPendingCategory = false;

  if (categoryId === NEW_CATEGORY_VALUE) {
    const newName = (newVideoCategoryName.value || "").trim();
    if (!newName) {
      showToast("Введи название нового раздела");
      videoConfirm.disabled = false;
      videoConfirm.textContent = "Добавить в галерею";
      return;
    }
    const created = await createPendingCategory(
      newName,
      currentIdentity ? currentIdentity.name : null,
      currentIdentity ? currentIdentity.code : null
    );
    if (!created) {
      showToast("Не удалось создать раздел, попробуй ещё раз");
      videoConfirm.disabled = false;
      videoConfirm.textContent = "Добавить в галерею";
      return;
    }
    categoryId = created.id;
    isNewPendingCategory = true;
  } else if (!categoryId) {
    showToast("Выбери раздел");
    videoConfirm.disabled = false;
    videoConfirm.textContent = "Добавить в галерею";
    return;
  }

  const { data: insertedVideo, error } = await db
    .from(VIDEO_TABLE)
    .insert({
      video_url: url,
      source: selectedSource,
      name: displayName,
      description: description || null,
      owner_name: currentIdentity ? currentIdentity.name : null,
      owner_code: currentIdentity ? currentIdentity.code : null,
      category_id: categoryId,
      followers_only: videoFollowersOnly.checked,
      kurymdyk_price: videoKurymdykEnabled && videoKurymdykEnabled.checked ? Number(videoKurymdykPrice.value) : 0,
    })
    .select()
    .single();

  videoConfirm.disabled = false;
  videoConfirm.textContent = "Добавить в галерею";

  if (error) {
    showToast("Не удалось добавить: " + error.message);
    return;
  }

  videoModal.classList.remove("active");
  if (isNewPendingCategory) {
    showToast("Видео добавлено, раздел на рассмотрении у админа 🕓");
  } else {
    showToast("Видео добавлено в галерею 🎬");
  }
  creditGigersForPublish("video");
  notifyFollowersOfNewPost("video", insertedVideo);
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
  if (videoFollowersOnly) videoFollowersOnly.checked = !!currentVideoRecord.followers_only;
  const videoKurymdykPriceVal = currentVideoRecord.kurymdyk_price || 0;
  if (videoKurymdykEnabled) videoKurymdykEnabled.checked = videoKurymdykPriceVal > 0;
  if (videoKurymdykWrap) videoKurymdykWrap.classList.toggle("hidden", videoKurymdykPriceVal <= 0);
  if (videoKurymdykPrice) videoKurymdykPrice.value = videoKurymdykPriceVal > 0 ? videoKurymdykPriceVal : 1;
  if (videoKurymdykPriceLabel) videoKurymdykPriceLabel.textContent = videoKurymdykPrice.value;
  videoModal.classList.add("active");
});

videoPinBtn.addEventListener("click", () => togglePin("video", currentVideoRecord));

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
    btn.title = `${level.code} — ${level.label}`;
    btn.innerHTML = `<img src="${level.asset}" alt="${level.label}"><span>${level.code}</span>`;
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
  els.label.textContent = `${level.code} — ${level.label}`;
}

async function loadRatings(kind, targetId) {
  currentRatingTarget[kind] = targetId;
  selectedRank[kind] = null;
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
    return;
  }

  const ratings = data || [];
  renderRatingSummary(kind, ratings);
  applyOnlinePresence();

  if (currentIdentity) {
    const own = ratings.find((r) => r.rater_code === currentIdentity.code);
    if (own) {
      selectedRank[kind] = own.rank;
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
      rater_name: currentIdentity.name,
      rater_code: currentIdentity.code,
    },
    { onConflict: "target_type,target_id,rater_code" }
  );

  if (error) {
    btn.disabled = false;
    btn.textContent = "Оценить";
    showToast("Не удалось сохранить оценку: " + error.message);
    return;
  }

  showToast("Оценка сохранена 🐿️");

  btn.disabled = false;
  btn.textContent = "Оценить";

  loadRatings(kind, currentRatingTarget[kind]);
  loadAllRatings();
  loadComments(kind, currentRatingTarget[kind]);
}

ratingEls.photo.submit.addEventListener("click", () => submitRating("photo"));
ratingEls.video.submit.addEventListener("click", () => submitRating("video"));

/* ==================================================================
   КОММЕНТАРИИ — отдельная лента, независимая от оценки. Можно оставлять
   сколько угодно комментариев подряд, без обязательной оценки, отвечать
   на конкретный комментарий (reply_to_id) и дарить гиперзадку прямо
   вместе с комментарием (тоже без обязательной оценки).
   ================================================================== */
function setReplyTarget(kind, comment) {
  commentReplyTarget[kind] = comment ? { id: comment.id, name: comment.author_name || "аноним" } : null;
  const els = commentEls[kind];
  if (comment) {
    els.replyHintName.textContent = comment.author_name || "аноним";
    els.replyHint.classList.remove("hidden");
  } else {
    els.replyHint.classList.add("hidden");
  }
  els.input.focus();
}

function truncateName(name, maxLen) {
  const str = name || "аноним";
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}

function renderComments(kind, comments, rankByAuthor, giftedCommentIds) {
  const els = commentEls[kind];
  els.list.innerHTML = "";
  if (!comments.length) {
    els.list.innerHTML = `<div class="rating-comments-empty">Комментариев пока нет — стань первым!</div>`;
    return;
  }

  const byId = new Map(comments.map((c) => [c.id, c]));

  comments.forEach((c) => {
    const item = document.createElement("div");
    const gifted = giftedCommentIds && giftedCommentIds.has(c.id);
    item.className = "comment-item" + (c.reply_to_id ? " comment-item-reply" : "") + (gifted ? " comment-item-gifted" : "");

    const parent = c.reply_to_id ? byId.get(c.reply_to_id) : null;
    const replyTag = parent
      ? `<div class="comment-reply-tag">→ ${escapeHtml(truncateName(parent.author_name, 15))}</div>`
      : "";

    const rank = rankByAuthor && c.author_code ? rankByAuthor.get(c.author_code) : null;
    const rankLevel = rank ? RANK_LEVELS[rank - 1] : null;
    const rankBadge = rankLevel
      ? `<span class="comment-rank-badge" title="Оценка: ${escapeHtml(rankLevel.label)}"><img src="${rankLevel.asset}" alt=""> ${rankLevel.code}</span>`
      : "";
    const giftBadge = gifted
      ? `<span class="comment-gift-badge" title="Подарил гиперзадку"><img src="assets/giperzadka.png" alt=""></span>`
      : "";

    item.innerHTML = `
      <div class="comment-head">
        <span class="online-dot" data-online-for="${c.author_code || ""}"></span>
        <span class="comment-author" title="${escapeHtml(c.author_name || "аноним")}">${escapeHtml(truncateName(c.author_name, 15))}</span>
        ${rankBadge}
        ${giftBadge}
        <span class="comment-time">${timeAgo(c.created_at)}</span>
      </div>
      ${replyTag}
      <div class="comment-text">${escapeHtml(c.text || "").replace(/\n/g, "<br>")}</div>
      <button type="button" class="comment-reply-btn" data-comment-id="${c.id}">Ответить</button>
    `;

    const replyBtn = item.querySelector(".comment-reply-btn");
    replyBtn.addEventListener("click", () => setReplyTarget(kind, c));

    els.list.appendChild(item);
  });

  applyOnlinePresence();
}

async function loadComments(kind, targetId) {
  const [commentsRes, ratingsRes, giftsRes] = await Promise.all([
    db.from(COMMENTS_TABLE).select("*").eq("target_type", kind).eq("target_id", targetId).order("created_at", { ascending: true }),
    db.from(RATING_TABLE).select("rater_code, rank").eq("target_type", kind).eq("target_id", targetId),
    db.from(GIGER_GIFTS_TABLE).select("linked_comment_id").eq("target_type", kind).eq("target_id", targetId),
  ]);

  if (commentsRes.error) {
    commentEls[kind].list.innerHTML = `<div class="rating-comments-empty">Не удалось загрузить комментарии</div>`;
    return;
  }

  const rankByAuthor = new Map((ratingsRes.data || []).map((r) => [r.rater_code, r.rank]));
  const giftedCommentIds = new Set((giftsRes.data || []).map((g) => g.linked_comment_id).filter(Boolean));

  renderComments(kind, commentsRes.data || [], rankByAuthor, giftedCommentIds);
}

async function submitComment(kind) {
  const targetId = currentRatingTarget[kind];
  if (!targetId) return;

  if (!currentIdentity) {
    ensureIdentity();
    return;
  }

  const els = commentEls[kind];
  const text = els.input.value.trim();
  if (!text) {
    showToast("Напиши что-нибудь для комментария");
    return;
  }

  const record = kind === "photo" ? currentPhotoRecord : currentVideoRecord;
  if (!record) return;

  els.submit.disabled = true;
  els.submit.textContent = "Отправляю...";

  const { data: insertedComment, error } = await db
    .from(COMMENTS_TABLE)
    .insert({
      target_type: kind,
      target_id: targetId,
      owner_code: record.owner_code || null,
      author_code: currentIdentity.code,
      author_name: currentIdentity.name,
      text,
      reply_to_id: commentReplyTarget[kind] ? commentReplyTarget[kind].id : null,
    })
    .select()
    .single();

  if (error) {
    els.submit.disabled = false;
    els.submit.textContent = "Отправить";
    showToast("Не удалось отправить комментарий: " + error.message);
    return;
  }

  // Если отмечена галочка "подарить гиперзадку" и человек ещё не дарил
  // её этой карточке раньше — дарим вместе с комментарием (оценка не нужна).
  const gEls = gigerEls[kind];
  if (gEls.checkbox.checked && !alreadyGifted[kind]) {
    await sendGiger(kind, record, text, insertedComment ? insertedComment.id : null);
  } else {
    showToast("Комментарий отправлен 💬");
  }

  logActivity("comment", kind, record, text);

  els.input.value = "";
  setReplyTarget(kind, null);
  els.submit.disabled = false;
  els.submit.textContent = "Отправить";

  loadComments(kind, targetId);
  loadGiftState(kind, record);
}

commentEls.photo.submit.addEventListener("click", () => submitComment("photo"));
commentEls.video.submit.addEventListener("click", () => submitComment("video"));
commentEls.photo.replyCancel.addEventListener("click", () => setReplyTarget("photo", null));
commentEls.video.replyCancel.addEventListener("click", () => setReplyTarget("video", null));

// Если человек отметил "подарить гиперзадку", а потом передумал и снял
// галочку (ещё до нажатия "Оценить") — проигрываем звук отмены.
function bindGigerUncheckSound(kind) {
  gigerEls[kind].checkbox.addEventListener("change", (e) => {
    console.log("[giger] чекбокс изменился:", kind, "checked =", e.target.checked);
    if (!e.target.checked) {
      console.log("[giger] пробую играть звук, элемент audio:", gigerRemoveSound);
      gigerRemoveSound.currentTime = 0;
      gigerRemoveSound.play()
        .then(() => console.log("[giger] звук проигрался успешно"))
        .catch((err) => console.log("[giger] ОШИБКА проигрывания:", err));
    }
  });
}
bindGigerUncheckSound("photo");
bindGigerUncheckSound("video");

/* ==================================================================
   ГИПЕРЗАДКИ (валюта: +1 за фото, +2 за видео, можно дарить авторам)
   ================================================================== */
async function refreshMyGigerBalance() {
  if (!currentIdentity || !db) {
    whoAmIGigers.innerHTML = "";
    return;
  }
  const { data, error } = await db
    .from(GIGER_TABLE)
    .select("count")
    .eq("owner_code", currentIdentity.code)
    .maybeSingle();

  if (error) {
    whoAmIGigers.innerHTML = "";
    return;
  }
  const count = data ? data.count : 0;
  whoAmIGigers.innerHTML = `<img src="assets/giperzadka.png" alt="гиперзадка" style="width:15px;height:15px;object-fit:contain;flex-shrink:0;"> ${count}`;
}

async function creditGigersForPublish(kind) {
  if (!currentIdentity) return;
  const delta = kind === "video" ? 2 : 1;
  await db.rpc("giger_add", {
    p_code: currentIdentity.code,
    p_name: currentIdentity.name,
    p_delta: delta,
  });
  refreshMyGigerBalance();
}

// Уведомляет всех подписчиков автора о новой публикации — событие
// падает каждому в его центр активности (kind='new_post').
async function notifyFollowersOfNewPost(kind, record) {
  if (!currentIdentity || !record) return;
  try {
    await db.rpc("notify_followers_new_post", {
      p_owner_code: currentIdentity.code,
      p_owner_name: currentIdentity.name,
      p_target_type: kind,
      p_target_id: record.id,
      p_target_name: record.name,
    });
  } catch (err) {
    console.error("[follow] не удалось уведомить подписчиков:", err);
  }
}

async function loadGiftState(kind, record) {
  const els = gigerEls[kind];
  els.checkbox.checked = false;
  alreadyGifted[kind] = false;

  const noOwner = !record.owner_code;
  const isSelf = currentIdentity && record.owner_code === currentIdentity.code;

  if (noOwner || isSelf) {
    els.box.classList.add("hidden");
    return;
  }

  if (!currentIdentity) {
    els.box.classList.remove("hidden");
    return;
  }

  const { data, error } = await db
    .from(GIGER_GIFTS_TABLE)
    .select("*")
    .eq("target_type", kind)
    .eq("target_id", record.id)
    .eq("giver_code", currentIdentity.code)
    .maybeSingle();

  if (!error && data) {
    // Уже подарил раньше — прятать чекбокс совсем, дарить больше нечего
    alreadyGifted[kind] = true;
    els.box.classList.add("hidden");
  } else {
    els.box.classList.remove("hidden");
  }
}

// Отправляет подарок гиперзадки для карточки (вызывается только из submitRating,
// вместе с отправкой оценки/комментария — отдельно чекбокс ничего не шлёт).
async function sendGiger(kind, record, comment, linkedCommentId) {
  const { data, error } = await db.rpc("giger_gift", {
    p_giver_code: currentIdentity.code,
    p_giver_name: currentIdentity.name,
    p_owner_code: record.owner_code,
    p_owner_name: record.owner_name,
  });

  if (error || data === false) {
    showToast(data === false ? "У тебя нет гиперзадок, чтобы подарить 🐿️" : "Не удалось подарить: " + (error?.message || ""));
    return false;
  }

  const { error: insertErr } = await db.from(GIGER_GIFTS_TABLE).insert({
    target_type: kind,
    target_id: record.id,
    giver_code: currentIdentity.code,
    giver_name: currentIdentity.name,
    owner_code: record.owner_code,
    comment: comment || null,
    linked_comment_id: linkedCommentId || null,
  });

  if (insertErr) {
    await db.rpc("giger_ungift", { p_giver_code: currentIdentity.code, p_owner_code: record.owner_code });
    showToast("Не удалось сохранить подарок: " + insertErr.message);
    return false;
  }

  showToast("Оценка сохранена, гиперзадка подарена 🎁");
  refreshMyGigerBalance();
  logActivity("gift", kind, record);
  return true;
}

/* ==================================================================
   ССЫЛКИ НА КАРТОЧКУ (поделиться конкретным фото/видео)
   ================================================================== */
const CYR_TO_LAT = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  і: "i", ї: "i", є: "e", ґ: "g",
};

function slugify(text) {
  let out = "";
  for (const ch of String(text || "").toLowerCase()) {
    out += CYR_TO_LAT.hasOwnProperty(ch) ? CYR_TO_LAT[ch] : ch;
  }
  out = out.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return out || "burunduk";
}

function buildShareUrl(kind, record) {
  const slug = slugify(record.name);
  const shortId = record.id.replace(/-/g, "").slice(0, 8);
  return `${location.origin}${location.pathname}#${kind}-${slug}--${shortId}`;
}

async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Ссылка скопирована 🔗");
  } catch (err) {
    showToast("Не удалось скопировать (нужен HTTPS, на GitHub Pages сработает)");
    console.error(err);
  }
}

shareBtn.addEventListener("click", () => {
  if (!currentPhotoRecord) return;
  copyTextToClipboard(buildShareUrl("photo", currentPhotoRecord));
});

videoShareBtn.addEventListener("click", () => {
  if (!currentVideoRecord) return;
  copyTextToClipboard(buildShareUrl("video", currentVideoRecord));
});

function parseShareHash() {
  const hash = decodeURIComponent(location.hash.slice(1));
  const m = hash.match(/^(photo|video)-.*--([0-9a-f]{4,32})$/i);
  if (!m) return null;
  return { kind: m[1], idFrag: m[2].toLowerCase() };
}

function findRecordByIdFrag(list, idFrag) {
  return list.find((r) => r.id.replace(/-/g, "").toLowerCase().startsWith(idFrag));
}

function openSharedFromHash() {
  const shared = parseShareHash();
  if (!shared) return;
  const list = shared.kind === "photo" ? allPhotoRecords : allVideoRecords;
  const record = findRecordByIdFrag(list, shared.idFrag);
  if (!record) {
    showToast("Не нашёл бурундука по этой ссылке 🐿️");
    return;
  }
  if (shared.kind === "photo") {
    openLightbox(record, publicUrlFor(record.storage_path));
  } else {
    openVideoLightbox(record);
  }
}

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
    activityPanel.classList.add("hidden");
  }
});

/* ==================================================================
   ЦЕНТР АКТИВНОСТИ (кто посмотрел / прокомментировал / подарил гиперзадку)
   ================================================================== */
const ACTIVITY_SEEN_KEY = "burunduk-activity-seen-at";

function getActivitySeenAt() {
  return localStorage.getItem(ACTIVITY_SEEN_KEY) || null;
}

function setActivitySeenNow() {
  localStorage.setItem(ACTIVITY_SEEN_KEY, new Date().toISOString());
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} ч назад`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} дн назад`;
  return new Date(dateStr).toLocaleDateString("ru-RU");
}

// Отмечаем просмотр карточки (не своей), не блокируя интерфейс —
// ошибки тут не критичны и не показываются пользователю.
async function registerView(kind, record) {
  if (!currentIdentity || !record.owner_code) return;
  if (record.owner_code === currentIdentity.code) return;
  try {
    await db.rpc("register_view", {
      p_target_type: kind,
      p_target_id: record.id,
      p_target_name: record.name,
      p_owner_code: record.owner_code,
      p_viewer_code: currentIdentity.code,
      p_viewer_name: currentIdentity.name,
    });
    refreshActivityBadge();
  } catch (err) {
    console.error("[activity] не удалось зарегистрировать просмотр:", err);
  }
}

// Считает уникальных зрителей карточки и тихонько показывает число
// под комментариями (например "👁 12 просмотров"). Если счёт не
// удалось получить, просто ничего не показываем — не критично.
function formatViewCount(count) {
  if (!count) return "👁 пока никто не смотрел";
  const mod10 = count % 10;
  const mod100 = count % 100;
  let word = "просмотров";
  if (mod100 < 11 || mod100 > 14) {
    if (mod10 === 1) word = "просмотр";
    else if (mod10 >= 2 && mod10 <= 4) word = "просмотра";
  }
  return `👁 ${count} ${word}`;
}

async function showViewCount(kind, targetId, el) {
  if (!el) return;
  el.textContent = "";
  if (!db) return;
  try {
    const { count, error } = await db
      .from(VIEWS_TABLE)
      .select("id", { count: "exact", head: true })
      .eq("target_type", kind)
      .eq("target_id", targetId);
    if (error) return;
    el.textContent = formatViewCount(count || 0);
  } catch (err) {
    console.error("[views] не удалось получить счётчик просмотров:", err);
  }
}


// Пишем событие в ленту активности напрямую (для комментариев и подарков,
// у которых уже есть отдельная запись в своей таблице — здесь только
// уведомление в ленте).
async function logActivity(kindEvent, targetType, record, extra) {
  if (!currentIdentity || !record.owner_code) return;
  if (record.owner_code === currentIdentity.code) return;
  try {
    await db.from(ACTIVITY_TABLE).insert({
      kind: kindEvent,
      target_type: targetType,
      target_id: record.id,
      target_name: record.name,
      owner_code: record.owner_code,
      actor_code: currentIdentity.code,
      actor_name: currentIdentity.name,
      extra: extra || null,
    });
    refreshActivityBadge();
  } catch (err) {
    console.error("[activity] не удалось записать событие:", err);
  }
}

// Кладём в центр активности того, на кого подписались, событие "follow" —
// у события нет привязки к конкретному фото/видео (target_type='profile').
async function notifyFollow(targetOwnerCode) {
  if (!currentIdentity || !targetOwnerCode) return;
  if (targetOwnerCode === currentIdentity.code) return;
  try {
    await db.from(ACTIVITY_TABLE).insert({
      kind: "follow",
      target_type: "profile",
      target_id: null,
      target_name: null,
      owner_code: targetOwnerCode,
      actor_code: currentIdentity.code,
      actor_name: currentIdentity.name,
    });
  } catch (err) {
    console.error("[activity] не удалось записать событие подписки:", err);
  }
}

async function refreshActivityBadge() {
  if (!currentIdentity || !db) {
    activityBadge.classList.add("hidden");
    return;
  }
  const seenAt = getActivitySeenAt();
  let query = db
    .from(ACTIVITY_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("owner_code", currentIdentity.code);
  if (seenAt) query = query.gt("created_at", seenAt);

  const { count, error } = await query;
  if (error) return;

  if (count && count > 0) {
    activityBadge.textContent = count > 99 ? "99+" : String(count);
    activityBadge.classList.remove("hidden");
  } else {
    activityBadge.classList.add("hidden");
  }
}

function activityIcon(kind) {
  if (kind === "view") return "👀";
  if (kind === "comment") return "💬";
  if (kind === "gift") return "🎁";
  if (kind === "new_post") return "🐿️";
  if (kind === "follow") return "➕";
  return "🔔";
}

function activityText(item) {
  const who = `<b class="activity-item-actor" data-actor="${item.actor_code}">${item.actor_name || "Кто-то"}</b>`;
  const what = item.target_name ? `«${item.target_name}»` : "публикацию";
  if (item.kind === "view") return `${who} посмотрел(а) твою публикацию ${what}`;
  if (item.kind === "comment") return `${who} написал(а) комментарий под ${what}`;
  if (item.kind === "gift") return `${who} отправил(а) тебе гиперзадку за ${what}`;
  if (item.kind === "new_post") return `${who} выложил(а) новую публикацию ${what}`;
  if (item.kind === "follow") return `${who} подписался(лась) на тебя`;
  return `${who}: событие по ${what}`;
}

async function loadActivityFeed() {
  if (!currentIdentity || !db) {
    activityList.innerHTML = `<div class="activity-empty">Сначала введи своё имя 🐿️</div>`;
    return;
  }

  const { data, error } = await db
    .from(ACTIVITY_TABLE)
    .select("*")
    .eq("owner_code", currentIdentity.code)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    activityList.innerHTML = `<div class="activity-empty">Не удалось загрузить активность</div>`;
    return;
  }

  const items = data || [];
  if (!items.length) {
    activityList.innerHTML = `<div class="activity-empty">Пока тихо 🐿️</div>`;
    return;
  }

  activityList.innerHTML = items
    .map(
      (item, idx) => `
        <div class="activity-item" data-idx="${idx}">
          <div class="activity-item-icon">${activityIcon(item.kind)}</div>
          <div class="activity-item-body">
            <div class="activity-item-text">${activityText(item)}</div>
            <div class="activity-item-time">${timeAgo(item.created_at)}</div>
          </div>
        </div>
      `
    )
    .join("");

  // Клик по никнейму автора события — переход в его профиль, отдельно
  // от клика по остальной части элемента (который ведёт к публикации).
  [...activityList.querySelectorAll(".activity-item-actor")].forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      activityPanel.classList.add("hidden");
      openProfile(el.dataset.actor);
    });
  });

  [...activityList.querySelectorAll(".activity-item")].forEach((el) => {
    el.addEventListener("click", async () => {
      const item = items[Number(el.dataset.idx)];
      activityPanel.classList.add("hidden");
      if (item.kind === "follow") {
        openProfile(item.actor_code);
        return;
      }
      await goToPublication(item.target_type, item.target_id);
    });
  });
}

async function goToPublication(kind, targetId) {
  if (kind === "photo") {
    let record = allPhotoRecords.find((r) => r.id === targetId);
    if (!record) {
      switchTab("photo");
      await loadPhotos();
      record = allPhotoRecords.find((r) => r.id === targetId);
    }
    if (!record) {
      showToast("Эта публикация больше не найдена 🐿️");
      return;
    }
    switchTab("photo");
    const idx = currentPhotoList.indexOf(record);
    openLightbox(record, publicUrlFor(record.storage_path), idx === -1 ? undefined : idx);
  } else {
    let record = allVideoRecords.find((r) => r.id === targetId);
    if (!record) {
      switchTab("video");
      await loadVideos();
      record = allVideoRecords.find((r) => r.id === targetId);
    }
    if (!record) {
      showToast("Эта публикация больше не найдена 🐿️");
      return;
    }
    switchTab("video");
    openVideoLightbox(record);
  }
}

activityBellBtn.addEventListener("click", async () => {
  const willOpen = activityPanel.classList.contains("hidden");
  activityPanel.classList.toggle("hidden");
  if (willOpen) {
    await loadActivityFeed();
    setActivitySeenNow();
    activityBadge.classList.add("hidden");
  }
});

activityCloseBtn.addEventListener("click", () => {
  activityPanel.classList.add("hidden");
});

/* ==================================================================
   ПРОФИЛЬ АВТОРА
   ================================================================== */
let viewingProfileCode = null;
let profileCache = {}; // owner_code -> profile row (кэш на время сессии)

async function fetchProfile(ownerCode) {
  if (profileCache[ownerCode]) return profileCache[ownerCode];
  if (!db) return null;
  const { data, error } = await db
    .from(PROFILES_TABLE)
    .select("*")
    .eq("owner_code", ownerCode)
    .maybeSingle();
  if (error) {
    console.error("[profile] не удалось загрузить профиль:", error);
    return null;
  }
  profileCache[ownerCode] = data;
  return data;
}

function displayNameFor(ownerCode, fallbackName) {
  const p = profileCache[ownerCode];
  return (p && p.display_name) || fallbackName || "Без имени";
}

async function preloadProfilesFor(records) {
  if (!db) return;
  const codes = [...new Set(records.map((r) => r.owner_code).filter(Boolean))];
  const missing = codes.filter((c) => !(c in profileCache));
  if (!missing.length) return;

  const { data, error } = await db.from(PROFILES_TABLE).select("*").in("owner_code", missing);
  if (error) {
    console.error("[profile] не удалось пакетно загрузить профили:", error);
    return;
  }
  const found = new Set();
  (data || []).forEach((p) => {
    profileCache[p.owner_code] = p;
    found.add(p.owner_code);
  });
  missing.forEach((c) => {
    if (!found.has(c)) profileCache[c] = null;
  });
}

function applyNameColor(el, nameColor) {
  el.classList.remove("gradient-name-text");
  el.style.color = "";
  el.style.background = "";
  if (!nameColor) return;
  if (nameColor.includes("gradient")) {
    el.style.background = nameColor;
    el.style.webkitBackgroundClip = "text";
    el.style.backgroundClip = "text";
    el.style.webkitTextFillColor = "transparent";
    el.style.color = "transparent";
    el.classList.add("gradient-name-text");
  } else {
    el.style.color = nameColor;
  }
}

async function openProfile(ownerCode) {
  if (!ownerCode) return;
  viewingProfileCode = ownerCode;

  mainEl.classList.add("hidden");
  profileView.classList.remove("hidden");
  window.scrollTo(0, 0);

  const profile = await fetchProfile(ownerCode);

  const fallbackName =
    (allPhotoRecords.find((r) => r.owner_code === ownerCode) || {}).owner_name ||
    (allVideoRecords.find((r) => r.owner_code === ownerCode) || {}).owner_name ||
    "Без имени";

  profileName.textContent = (profile && profile.display_name) || fallbackName;
  applyNameColor(profileName, profile && profile.name_color);
  profileBio.textContent = (profile && profile.bio) || "";
  profileBio.style.display = profile && profile.bio ? "block" : "none";
  profileAvatar.src = profile && profile.avatar_path ? publicUrlFor(profile.avatar_path) : "assets/mtn.png";
  profileBanner.src = profile && profile.banner_path ? publicUrlFor(profile.banner_path) : "";
  if (profile && profile.equipped_frame) {
    const frameDef = FRAME_DEFS.find((f) => f.id === profile.equipped_frame);
    if (frameDef) {
      profileAvatarFrame.src = frameDef.asset;
      profileAvatarFrame.classList.remove("hidden");
    } else {
      profileAvatarFrame.classList.add("hidden");
    }
  } else {
    profileAvatarFrame.classList.add("hidden");
  }
  if (profileOnlineDot) profileOnlineDot.setAttribute("data-online-for", ownerCode);
  applyOnlinePresence();

  const isMe = currentIdentity && currentIdentity.code === ownerCode;
  profileEditBtn.classList.toggle("hidden", !isMe);
  profileEditAvatarBtn.classList.toggle("hidden", !isMe);
  profileEditBannerBtn.classList.toggle("hidden", !isMe);
  profileFramesBtn.classList.toggle("hidden", !isMe);
  profileNameColorBtn.classList.toggle("hidden", !isMe);
  profileFollowBtn.classList.toggle("hidden", !currentIdentity || isMe);

  await refreshFollowButton(ownerCode);
  await refreshProfileStats(ownerCode);
  await loadUnlockedKurymdyk();

  switchProfileTab("photo");
}

profileBackBtn.addEventListener("click", () => {
  profileView.classList.add("hidden");
  mainEl.classList.remove("hidden");
  viewingProfileCode = null;
  history.replaceState(null, "", location.pathname + location.search);
});

function switchProfileTab(kind) {
  profileTabPhoto.classList.toggle("active", kind === "photo");
  profileTabVideo.classList.toggle("active", kind === "video");
  profileGalleryPhoto.classList.toggle("hidden", kind !== "photo");
  profileGalleryVideo.classList.toggle("hidden", kind !== "video");
  renderProfileGallery(kind);
}

profileTabPhoto.addEventListener("click", () => switchProfileTab("photo"));
profileTabVideo.addEventListener("click", () => switchProfileTab("video"));

function renderProfileGallery(kind) {
  if (!viewingProfileCode) return;
  const source = kind === "photo" ? allPhotoRecords : allVideoRecords;
  const records = source
    .filter((r) => r.owner_code === viewingProfileCode)
    .slice()
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  const el = kind === "photo" ? profileGalleryPhoto : profileGalleryVideo;

  profileEmpty.classList.toggle("hidden", records.length > 0);
  el.innerHTML = "";

  records.forEach((record, idx) => {
    const locked = isKurymdykLocked(kind, record);
    const displayName = locked ? KURYMDYK_NAME_TEXT : record.name;
    const displayNameHtml = locked ? KURYMDYK_NAME_HTML : escapeHtml(record.name);
    const card = document.createElement("div");
    card.className = "card" + (locked ? " kurymdyk-locked" : "");
    if (kind === "photo") {
      const src = locked ? KURYMDYK_IMAGE : publicUrlFor(record.storage_path);
      card.innerHTML = `
        <img src="${src}" alt="${displayName}" loading="lazy">
        ${record.pinned && !locked ? `<div class="pinned-badge" title="Закреплено">📌</div>` : ""}
        ${locked ? `<div class="kurymdyk-badge" title="Платный просмотр"><img src="assets/giperzadka.png" style="width:14px;height:14px;object-fit:contain;"> ${record.kurymdyk_price}</div>` : ""}
        ${record.followers_only && !locked ? `<div class="followers-only-badge" title="Только для подписчиков">🔒</div>` : ""}
        <div class="name">${displayNameHtml}</div>
      `;
      card.addEventListener("click", () => {
        const galleryIdx = currentPhotoList.indexOf(record);
        openLightbox(record, locked ? KURYMDYK_IMAGE : src, galleryIdx === -1 ? undefined : galleryIdx);
      });
    } else {
      card.innerHTML = `
        <div class="video-thumb"><img src="${locked ? KURYMDYK_IMAGE : "assets/video-cover.png"}" alt="${displayName}" loading="lazy"></div>
        ${record.pinned && !locked ? `<div class="pinned-badge" title="Закреплено">📌</div>` : ""}
        ${locked ? `<div class="kurymdyk-badge" title="Платный просмотр"><img src="assets/giperzadka.png" style="width:14px;height:14px;object-fit:contain;"> ${record.kurymdyk_price}</div>` : ""}
        ${record.followers_only && !locked ? `<div class="followers-only-badge" title="Только для подписчиков">🔒</div>` : ""}
        ${!locked ? `<div class="video-badge">${SOURCE_LABELS[record.source] || "Видео"}</div>` : ""}
        <div class="name">${displayNameHtml}</div>
      `;
      card.addEventListener("click", () => {
        const galleryIdx = currentVideoList.indexOf(record);
        openVideoLightbox(record, galleryIdx === -1 ? undefined : galleryIdx);
      });
    }
    el.appendChild(card);
  });
}

async function refreshProfileStats(ownerCode) {
  profileFollowersCount.textContent = "…";
  profileViewsCount.textContent = "…";
  profilePostsCount.textContent = "…";

  const [followersRes, photoViewsRes, videoViewsRes] = await Promise.all([
    db.from(FOLLOWS_TABLE).select("id", { count: "exact", head: true }).eq("target_code", ownerCode),
    db.from(VIEWS_TABLE).select("id", { count: "exact", head: true }).eq("target_type", "photo").in(
      "target_id",
      allPhotoRecords.filter((r) => r.owner_code === ownerCode).map((r) => r.id).length
        ? allPhotoRecords.filter((r) => r.owner_code === ownerCode).map((r) => r.id)
        : ["00000000-0000-0000-0000-000000000000"]
    ),
    db.from(VIEWS_TABLE).select("id", { count: "exact", head: true }).eq("target_type", "video").in(
      "target_id",
      allVideoRecords.filter((r) => r.owner_code === ownerCode).map((r) => r.id).length
        ? allVideoRecords.filter((r) => r.owner_code === ownerCode).map((r) => r.id)
        : ["00000000-0000-0000-0000-000000000000"]
    ),
  ]);

  profileFollowersCount.textContent = followersRes.count || 0;
  const totalViews = (photoViewsRes.count || 0) + (videoViewsRes.count || 0);
  profileViewsCount.textContent = totalViews;

  const postsCount =
    allPhotoRecords.filter((r) => r.owner_code === ownerCode).length +
    allVideoRecords.filter((r) => r.owner_code === ownerCode).length;
  profilePostsCount.textContent = postsCount;
}

async function getGigerBalance(ownerCode) {
  const { data } = await db.from(GIGER_TABLE).select("count").eq("owner_code", ownerCode).maybeSingle();
  return (data && data.count) || 0;
}

async function getOwnedFrames(ownerCode) {
  const { data } = await db.from(FRAMES_TABLE).select("frame_id").eq("owner_code", ownerCode);
  return (data || []).map((r) => r.frame_id);
}

// Суммарные просмотры всех публикаций пользователя (по ленте активности,
// там уже есть owner_code и kind='view' на каждый уникальный просмотр).
async function getTotalViewsForOwner(ownerCode) {
  const { count, error } = await db
    .from("burunduk_activity")
    .select("id", { count: "exact", head: true })
    .eq("owner_code", ownerCode)
    .eq("kind", "view");
  if (error) return 0;
  return count || 0;
}

async function openFramesModal() {
  if (!currentIdentity || !viewingProfileCode) return;
  framesModal.classList.add("active");
  framesShopList.innerHTML = "Загружаю рамки...";

  const postsCount =
    allPhotoRecords.filter((r) => r.owner_code === currentIdentity.code).length +
    allVideoRecords.filter((r) => r.owner_code === currentIdentity.code).length;

  const totalViews = await getTotalViewsForOwner(currentIdentity.code);

  let ownedIds = await getOwnedFrames(currentIdentity.code);

  const toUnlock = FRAME_DEFS.filter(
    (f) =>
      (f.type === "posts" && postsCount >= f.postsRequired && !ownedIds.includes(f.id)) ||
      (f.type === "views" && totalViews >= f.viewsRequired && !ownedIds.includes(f.id))
  );
  if (toUnlock.length) {
    await db.from(FRAMES_TABLE).insert(
      toUnlock.map((f) => ({ owner_code: currentIdentity.code, frame_id: f.id }))
    );
    ownedIds = await getOwnedFrames(currentIdentity.code);
  }

  const [balance, profile] = await Promise.all([
    getGigerBalance(currentIdentity.code),
    fetchProfile(currentIdentity.code),
  ]);

  const equippedFrame = profile && profile.equipped_frame;
  const avatarUrl = profile && profile.avatar_path ? publicUrlFor(profile.avatar_path) : "assets/mtn.png";

  framesShopList.innerHTML = "";
  FRAME_DEFS.forEach((frame) => {
    const owned = ownedIds.includes(frame.id);
    const isEquipped = equippedFrame === frame.id;

    const card = document.createElement("div");
    card.className = "frame-card" + (isEquipped ? " equipped" : "");

    const preview = document.createElement("div");
    preview.className = "frame-card-preview";
    preview.innerHTML = `<img class="frame-base" src="${avatarUrl}" alt=""><img class="frame-overlay" src="${frame.asset}" alt="">`;
    card.appendChild(preview);

    const nameEl = document.createElement("div");
    nameEl.className = "frame-card-name";
    nameEl.textContent = frame.name;
    card.appendChild(nameEl);

    if (frame.type === "buy") {
      const priceEl = document.createElement("div");
      priceEl.className = "frame-card-price";
      priceEl.innerHTML = `<img src="assets/giperzadka.png" style="width:14px;height:14px;object-fit:contain;"> ${frame.price}`;
      card.appendChild(priceEl);
    } else if (frame.type === "views") {
      const statusEl = document.createElement("div");
      statusEl.className = "frame-card-status";
      statusEl.textContent = owned
        ? "Разблокировано"
        : `Нужно ${frame.viewsRequired} просмотров (сейчас ${totalViews})`;
      card.appendChild(statusEl);
    } else {
      const statusEl = document.createElement("div");
      statusEl.className = "frame-card-status";
      statusEl.textContent = owned
        ? "Разблокировано"
        : `Нужно ${frame.postsRequired} публикаций (сейчас ${postsCount})`;
      card.appendChild(statusEl);
    }

    const btn = document.createElement("button");
    btn.className = "frame-card-btn";

    if (owned) {
      if (isEquipped) {
        btn.textContent = "Снять";
        btn.classList.add("equip-btn");
        btn.addEventListener("click", async () => {
          await db.from(PROFILES_TABLE).update({ equipped_frame: null }).eq("owner_code", currentIdentity.code);
          profileCache[currentIdentity.code] = null;
          await openFramesModal();
          await openProfile(currentIdentity.code);
        });
      } else {
        btn.textContent = "Надеть";
        btn.classList.add("equip-btn");
        btn.addEventListener("click", async () => {
          await db
            .from(PROFILES_TABLE)
            .upsert({ owner_code: currentIdentity.code, equipped_frame: frame.id }, { onConflict: "owner_code" });
          profileCache[currentIdentity.code] = null;
          await openFramesModal();
          await openProfile(currentIdentity.code);
        });
      }
    } else if (frame.type === "buy") {
      btn.textContent = "Купить";
      btn.disabled = balance < frame.price;
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        const { data, error } = await db.rpc("frame_buy", {
          p_owner_code: currentIdentity.code,
          p_owner_name: currentIdentity.name,
          p_frame_id: frame.id,
          p_price: frame.price,
        });
        if (error || !data) {
          showToast("Не хватает гиперзадок 😔");
          await openFramesModal();
          return;
        }
        showToast("Рамка куплена 🐿️");
        await refreshMyGigerBalance();
        await openFramesModal();
      });
    } else {
      btn.textContent = "Заблокировано";
      btn.disabled = true;
    }

    card.appendChild(btn);
    framesShopList.appendChild(card);
  });

  if (framesModalClose && !framesModal.dataset.bound) {
    framesModal.dataset.bound = "1";
    framesModalClose.addEventListener("click", () => framesModal.classList.remove("active"));
  }
}

if (profileFramesBtn) {
  profileFramesBtn.addEventListener("click", () => openFramesModal());
}

/* ---------- Цвет / градиент ника ---------- */
let nameColorSelected = null;
let nameColorMode = "solid";

function renderNameColorSwatches() {
  nameColorSwatches.innerHTML = "";
  NAME_COLOR_PRESETS.forEach((color) => {
    const sw = document.createElement("div");
    sw.className = "name-color-swatch";
    sw.style.background = color;
    sw.addEventListener("click", () => {
      nameColorSelected = color;
      nameColorPicker.value = color;
      updateNameColorPreview();
      markSelectedSwatch(nameColorSwatches, sw);
    });
    nameColorSwatches.appendChild(sw);
  });

  nameGradientSwatches.innerHTML = "";
  NAME_GRADIENT_PRESETS.forEach((grad) => {
    const sw = document.createElement("div");
    sw.className = "name-color-swatch";
    sw.style.background = grad;
    sw.addEventListener("click", () => {
      nameColorSelected = grad;
      updateNameColorPreview();
      markSelectedSwatch(nameGradientSwatches, sw);
    });
    nameGradientSwatches.appendChild(sw);
  });
}

function markSelectedSwatch(container, activeEl) {
  [...container.children].forEach((c) => c.classList.remove("selected"));
  activeEl.classList.add("selected");
}

function updateNameColorPreview() {
  applyNameColor(nameColorPreview, nameColorSelected);
}

renderNameColorSwatches();

nameColorModeSolid.addEventListener("click", () => {
  nameColorMode = "solid";
  nameColorModeSolid.classList.add("active");
  nameColorModeGradient.classList.remove("active");
  nameColorSolidPanel.classList.remove("hidden");
  nameColorGradientPanel.classList.add("hidden");
});

nameColorModeGradient.addEventListener("click", () => {
  nameColorMode = "gradient";
  nameColorModeGradient.classList.add("active");
  nameColorModeSolid.classList.remove("active");
  nameColorGradientPanel.classList.remove("hidden");
  nameColorSolidPanel.classList.add("hidden");
});

nameColorPicker.addEventListener("input", () => {
  nameColorSelected = nameColorPicker.value;
  updateNameColorPreview();
  [...nameColorSwatches.children].forEach((c) => c.classList.remove("selected"));
});

function updateCustomGradient() {
  nameColorSelected = `linear-gradient(90deg, ${nameGradientFrom.value}, ${nameGradientTo.value})`;
  updateNameColorPreview();
  [...nameGradientSwatches.children].forEach((c) => c.classList.remove("selected"));
}

nameGradientFrom.addEventListener("input", updateCustomGradient);
nameGradientTo.addEventListener("input", updateCustomGradient);

async function openNameColorModal() {
  if (!currentIdentity) return;
  const profile = await fetchProfile(currentIdentity.code);
  nameColorSelected = (profile && profile.name_color) || null;
  nameColorMode = nameColorSelected && nameColorSelected.includes("gradient") ? "gradient" : "solid";

  nameColorModeSolid.classList.toggle("active", nameColorMode === "solid");
  nameColorModeGradient.classList.toggle("active", nameColorMode === "gradient");
  nameColorSolidPanel.classList.toggle("hidden", nameColorMode !== "solid");
  nameColorGradientPanel.classList.toggle("hidden", nameColorMode !== "gradient");

  updateNameColorPreview();
  nameColorModal.classList.add("active");
}

if (profileNameColorBtn) {
  profileNameColorBtn.addEventListener("click", () => openNameColorModal());
}

nameColorCancel.addEventListener("click", () => nameColorModal.classList.remove("active"));

nameColorReset.addEventListener("click", async () => {
  if (!currentIdentity) return;
  await db.from(PROFILES_TABLE).upsert({ owner_code: currentIdentity.code, name_color: null }, { onConflict: "owner_code" });
  profileCache[currentIdentity.code] = null;
  nameColorModal.classList.remove("active");
  showToast("Цвет ника сброшен 🐿️");
  await openProfile(currentIdentity.code);
});

nameColorApply.addEventListener("click", async () => {
  if (!currentIdentity) return;
  await db
    .from(PROFILES_TABLE)
    .upsert({ owner_code: currentIdentity.code, name_color: nameColorSelected }, { onConflict: "owner_code" });
  profileCache[currentIdentity.code] = null;
  nameColorModal.classList.remove("active");
  showToast("Цвет ника сохранён 🐿️");
  await openProfile(currentIdentity.code);
});

async function refreshFollowButton(ownerCode) {
  if (!currentIdentity || currentIdentity.code === ownerCode) return;
  const { data } = await db
    .from(FOLLOWS_TABLE)
    .select("id")
    .eq("follower_code", currentIdentity.code)
    .eq("target_code", ownerCode)
    .maybeSingle();

  const isFollowing = !!data;
  profileFollowBtn.textContent = isFollowing ? "✓ Подписан" : "Подписаться";
  profileFollowBtn.classList.toggle("following", isFollowing);
}

profileFollowBtn.addEventListener("click", async () => {
  if (!currentIdentity || !viewingProfileCode) return;
  const isFollowing = profileFollowBtn.classList.contains("following");

  if (isFollowing) {
    await db
      .from(FOLLOWS_TABLE)
      .delete()
      .eq("follower_code", currentIdentity.code)
      .eq("target_code", viewingProfileCode);
  } else {
    await db.from(FOLLOWS_TABLE).insert({
      follower_code: currentIdentity.code,
      follower_name: currentIdentity.name,
      target_code: viewingProfileCode,
    });
    showToast("Подписка оформлена 🐿️");
    notifyFollow(viewingProfileCode);
  }

  // Подписка меняет, какие "только для подписчиков" посты видны —
  // сбрасываем кэш и тихо перезагружаем данные в фоне.
  mySubscriptions = null;
  await loadMySubscriptions();
  await Promise.all([loadPhotos(), loadVideos()]);

  await refreshFollowButton(viewingProfileCode);
  await refreshProfileStats(viewingProfileCode);
  renderProfileGallery(profileTabPhoto.classList.contains("active") ? "photo" : "video");
});

/* ---------- Редактирование профиля (имя/описание) ---------- */
profileEditBtn.addEventListener("click", async () => {
  const profile = await fetchProfile(currentIdentity.code);
  editProfileName.value = (profile && profile.display_name) || currentIdentity.name || "";
  editProfileBio.value = (profile && profile.bio) || "";
  editProfileModal.classList.add("active");
});

editProfileCancel.addEventListener("click", () => {
  editProfileModal.classList.remove("active");
});

editProfileSave.addEventListener("click", async () => {
  if (!currentIdentity) return;
  const displayName = editProfileName.value.trim() || currentIdentity.name;
  const bio = editProfileBio.value.trim() || null;

  const { error } = await db.from(PROFILES_TABLE).upsert({
    owner_code: currentIdentity.code,
    display_name: displayName,
    bio,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    showToast("Не удалось сохранить профиль: " + error.message);
    return;
  }

  delete profileCache[currentIdentity.code];
  editProfileModal.classList.remove("active");
  showToast("Профиль обновлён ✏️");
  await openProfile(currentIdentity.code);
});

/* ---------- Загрузка аватара / шапки профиля ---------- */
async function uploadProfileImage(file, field) {
  if (!currentIdentity) return;
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `profiles/${currentIdentity.code}-${field}-${Date.now()}.${ext}`;

  const { error: uploadError } = await db.storage.from(BUCKET_NAME).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (uploadError) {
    showToast("Не удалось загрузить картинку: " + uploadError.message);
    return;
  }

  const updatePayload = { owner_code: currentIdentity.code, updated_at: new Date().toISOString() };
  updatePayload[field] = path;

  const { error: dbError } = await db.from(PROFILES_TABLE).upsert(updatePayload);
  if (dbError) {
    showToast("Не удалось сохранить: " + dbError.message);
    return;
  }

  delete profileCache[currentIdentity.code];
  showToast(field === "avatar_path" ? "Аватар обновлён 🐿️" : "Шапка профиля обновлена 🐿️");
  await openProfile(currentIdentity.code);
}

profileEditAvatarBtn.addEventListener("click", () => avatarFileInput.click());
profileEditBannerBtn.addEventListener("click", () => bannerFileInput.click());

avatarFileInput.addEventListener("change", () => {
  const file = avatarFileInput.files[0];
  avatarFileInput.value = "";
  if (file) uploadProfileImage(file, "avatar_path");
});

bannerFileInput.addEventListener("change", () => {
  const file = bannerFileInput.files[0];
  bannerFileInput.value = "";
  if (file) uploadProfileImage(file, "banner_path");
});

/* ---------- Старт ---------- */
async function boot() {
  refreshWhoAmI();
  ensureIdentity();
  if (!initSupabase()) return;

  videoUrlHint.textContent = SOURCE_HINTS.google_drive;
  refreshMyGigerBalance();
  refreshActivityBadge();
  await loadCategories();
  await loadAllRatings();

  const shared = parseShareHash();
  const wantVideo = shared && shared.kind === "video";

  switchTab(wantVideo ? "video" : "photo");
  if (wantVideo) await loadVideos();
  else await loadPhotos();

  if (shared) openSharedFromHash();

  initRealtime();
}

boot();

/* ==================================================================
   REALTIME (Supabase Realtime) — живые уведомления без перезагрузки:
   - бейдж колокольчика обновляется сам, как только кто-то оставил
     комментарий/просмотр/подарил гиперзадку;
   - если центр активности открыт — новое событие само добавляется в список;
   - новые фото/видео и новые комментарии под открытой карточкой
     подтягиваются сами, без обновления страницы.
   ================================================================== */
let activityChannel = null;
let postsChannel = null;
let ratingsChannel = null;

// Небольшая "тряска" колокольчика, чтобы было заметно, что пришло новое событие.
function bumpActivityBell() {
  if (!activityBellBtn) return;
  activityBellBtn.classList.remove("bell-bump");
  void activityBellBtn.offsetWidth; // форсируем reflow, чтобы анимацию можно было перезапустить
  activityBellBtn.classList.add("bell-bump");
}

// Подписка на события активности (просмотры/комментарии/подарки/новые посты),
// адресованные текущему пользователю. Как только приходит новая запись —
// сразу обновляем бейдж и (если панель открыта) список, без перезагрузки.
function subscribeActivityRealtime() {
  if (!db || !currentIdentity) return;

  if (activityChannel) {
    db.removeChannel(activityChannel);
    activityChannel = null;
  }

  activityChannel = db
    .channel(`activity-${currentIdentity.code}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: ACTIVITY_TABLE,
        filter: `owner_code=eq.${currentIdentity.code}`,
      },
      (payload) => {
        const item = payload.new;
        // Свои собственные действия (если owner_code == actor_code) не бампаем.
        if (item.actor_code === currentIdentity.code) return;
        refreshActivityBadge();
        bumpActivityBell();
        if (activityPanel && !activityPanel.classList.contains("hidden")) {
          loadActivityFeed();
        }
      }
    )
    .subscribe();
}

// Подписка на новые фото/видео — как только кто-то опубликовал пост,
// открытая сейчас лента сама подтягивает свежие данные без перезагрузки.
function subscribePostsRealtime() {
  if (!db) return;

  if (postsChannel) {
    db.removeChannel(postsChannel);
    postsChannel = null;
  }

  postsChannel = db
    .channel("posts-live")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: PHOTO_TABLE },
      () => {
        if (currentTab === "photo") loadPhotos();
      }
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: VIDEO_TABLE },
      () => {
        if (currentTab === "video") loadVideos();
      }
    )
    .subscribe();
}

// Подписка на новые оценки/комментарии — если сейчас открыта карточка,
// под которой кто-то только что оставил комментарий, он появится сам.
function subscribeRatingsRealtime() {
  if (!db) return;

  if (ratingsChannel) {
    db.removeChannel(ratingsChannel);
    ratingsChannel = null;
  }

  ratingsChannel = db
    .channel("ratings-live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: RATING_TABLE },
      (payload) => {
        const row = payload.new || payload.old;
        if (!row) return;
        const kind = row.target_type;
        if ((kind === "photo" || kind === "video") && currentRatingTarget[kind] === row.target_id) {
          loadRatings(kind, row.target_id);
        }
        // Общий рейтинг (звёздочки на карточках) тоже пересчитываем в фоне.
        loadAllRatings();
      }
    )
    .subscribe();
}

let commentsChannel = null;

// Подписка на новые/изменённые комментарии — если сейчас открыта карточка,
// под которой кто-то только что оставил или ответил на комментарий, он
// появится сам, без перезагрузки.
function subscribeCommentsRealtime() {
  if (!db) return;

  if (commentsChannel) {
    db.removeChannel(commentsChannel);
    commentsChannel = null;
  }

  commentsChannel = db
    .channel("comments-live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: COMMENTS_TABLE },
      (payload) => {
        const row = payload.new || payload.old;
        if (!row) return;
        const kind = row.target_type;
        if ((kind === "photo" || kind === "video") && currentRatingTarget[kind] === row.target_id) {
          loadComments(kind, row.target_id);
        }
      }
    )
    .subscribe();
}

/* ==================================================================
   ОНЛАЙН-СТАТУС (Supabase Realtime Presence)
   Зелёная точка у аватара/имени, если человек прямо сейчас на сайте.
   ================================================================== */
let sitePresenceChannel = null;
let onlineCodes = new Set();

// Проходит по всем местам на странице, где может быть индикатор
// "сейчас на сайте" (аватар в профиле, имя автора на карточке/в
// лайтбоксе, автор комментария) и включает/выключает точку.
function applyOnlinePresence() {
  document.querySelectorAll("[data-online-for]").forEach((el) => {
    const code = el.getAttribute("data-online-for");
    el.classList.toggle("is-online", !!code && onlineCodes.has(code));
  });
}

function subscribeSitePresence() {
  if (!db) return;

  if (sitePresenceChannel) {
    db.removeChannel(sitePresenceChannel);
    sitePresenceChannel = null;
  }

  // Гостям (без имени) свой онлайн-статус не показываем — присоединяемся
  // к общему каналу присутствия только под своим кодом.
  const myKey = currentIdentity ? currentIdentity.code : `guest-${Math.random().toString(36).slice(2, 10)}`;

  sitePresenceChannel = db.channel("site-presence", {
    config: { presence: { key: myKey } },
  });

  sitePresenceChannel
    .on("presence", { event: "sync" }, () => {
      const state = sitePresenceChannel.presenceState();
      onlineCodes = new Set(
        Object.values(state)
          .flat()
          .map((meta) => meta.code)
          .filter(Boolean)
      );
      applyOnlinePresence();
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED" && currentIdentity) {
        await sitePresenceChannel.track({ code: currentIdentity.code, name: currentIdentity.name });
      }
    });
}

/* ==================================================================
   ЖИВОЙ СЧЁТЧИК "СЕЙЧАС СМОТРЯТ" ДЛЯ ОТКРЫТОЙ КАРТОЧКИ В ЛАЙТБОКСЕ
   ================================================================== */
let viewingChannel = null;

function pluralPeople(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "человек";
  if (mod10 === 1) return "человек";
  return "человека";
}

function updateLiveViewersUI(kind, count) {
  const el = kind === "photo" ? photoLiveViewers : videoLiveViewers;
  if (!el) return;
  if (!count || count <= 1) {
    el.classList.add("hidden");
    el.innerHTML = "";
    return;
  }
  el.classList.remove("hidden");
  el.innerHTML = `<span class="live-dot"></span>${count} ${pluralPeople(count)} смотрят сейчас`;
}

// Подключаемся к отдельному presence-каналу для конкретной карточки —
// как только кто-то ещё открывает тот же лайтбокс, счётчик у всех
// обновляется сам, без перезагрузки.
function joinViewingPresence(kind, targetId) {
  if (!db) return;
  leaveViewingPresence();

  const myKey = currentIdentity ? currentIdentity.code : `guest-${Math.random().toString(36).slice(2, 10)}`;
  viewingChannel = db.channel(`viewing-${kind}-${targetId}`, {
    config: { presence: { key: myKey } },
  });

  viewingChannel
    .on("presence", { event: "sync" }, () => {
      const state = viewingChannel.presenceState();
      const count = Object.values(state).reduce((sum, metas) => sum + metas.length, 0);
      updateLiveViewersUI(kind, count);
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await viewingChannel.track({
          code: currentIdentity ? currentIdentity.code : null,
          name: currentIdentity ? currentIdentity.name : "Гость",
        });
      }
    });
}

function leaveViewingPresence() {
  if (viewingChannel) {
    db.removeChannel(viewingChannel);
    viewingChannel = null;
  }
  updateLiveViewersUI("photo", 0);
  updateLiveViewersUI("video", 0);
}

function initRealtime() {
  if (!db || !window.supabase) return;
  subscribePostsRealtime();
  subscribeRatingsRealtime();
  subscribeCommentsRealtime();
  subscribeSitePresence();
  if (currentIdentity) subscribeActivityRealtime();
}
