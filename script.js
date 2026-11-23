/* ==================================================================
   ТЁМНАЯ ТЕМА — инициализация (сразу, до рендера)
   ================================================================== */
(function() {
  const saved = localStorage.getItem("burunduki_theme");
  if (saved === "dark") document.documentElement.setAttribute("data-theme", "dark");
})();

function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  localStorage.setItem("burunduki_theme", theme);
  const btn = document.getElementById("themeSwitchBtn");
  if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
}

function initThemeButton() {
  const btn = document.getElementById("themeSwitchBtn");
  if (!btn) return;
  // Устанавливаем правильную иконку при загрузке
  const current = localStorage.getItem("burunduki_theme") || "light";
  btn.textContent = current === "dark" ? "☀️" : "🌙";
  btn.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    applyTheme(isDark ? "light" : "dark");
  });
}

const PHOTO_TABLE = "burunduki";
const VIDEO_TABLE = "burunduki_videos";
const TEXT_TABLE = "burunduk_texts";
const AUDIO_TABLE = "burunduk_audio";
const CATEGORY_TABLE = "burunduk_categories";

let allCategories = [];
let currentCategoryFilter = "all";
let currentAuthorFilter = "all";
let currentSort = "date_desc";
let allRatingsMap = {}; // "photo:<id>" / "video:<id>" -> { avg, count }
let allGames = [];
let allGameTags = [];
let gameSearchQuery = [];
let gameAuthorFilter = "all";
let gameSortMode = "date_desc";
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
const tabText = document.getElementById("tabText");
const tabGames = document.getElementById("tabGames");
const galleryPhoto = document.getElementById("galleryPhoto");
const galleryVideo = document.getElementById("galleryVideo");
const galleryText = document.getElementById("galleryText");
const galleryGames = document.getElementById("galleryGames");
const tabAudio         = document.getElementById("tabAudio");
const galleryAudio     = document.getElementById("galleryAudio");
const uploadAudioBtn   = document.getElementById("uploadAudioBtn");
const uploadPlaylistBtn = document.getElementById("uploadPlaylistBtn");
const galleryPlaylists = document.getElementById("galleryPlaylists");
const uploadPhotoBtn = document.getElementById("uploadPhotoBtn");
const uploadVideoBtn = document.getElementById("uploadVideoBtn");
const uploadTextBtn = document.getElementById("uploadTextBtn");
const uploadGameBtn = document.getElementById("uploadGameBtn");
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

// Экраны модалки входа
const authScreen0 = document.getElementById("authScreen0");
const authScreen1 = document.getElementById("authScreen1");
const authScreen2 = document.getElementById("authScreen2");
const authScreen3 = document.getElementById("authScreen3");
const authScreen4 = document.getElementById("authScreen4");
const authGoRegister = document.getElementById("authGoRegister");
const authGoLogin = document.getElementById("authGoLogin");
const authGoCode = document.getElementById("authGoCode");
const authBack0from1 = document.getElementById("authBack0from1");
const authBack0from2 = document.getElementById("authBack0from2");
const authBack2from3 = document.getElementById("authBack2from3");
const regEmailInput = document.getElementById("regEmailInput");
const regError = document.getElementById("regError");
const loginEmailInput = document.getElementById("loginEmailInput");
const loginError = document.getElementById("loginError");
const loginConfirm = document.getElementById("loginConfirm");
const codeError = document.getElementById("codeError");
const restoreCodeInput = document.getElementById("restoreCodeInput");
const restoreCodeBtn = document.getElementById("restoreCodeBtn");

const welcomeCodeModal = document.getElementById("welcomeCodeModal");
const welcomeCodeValue = document.getElementById("welcomeCodeValue");
const welcomeCodeCopy = document.getElementById("welcomeCodeCopy");
const welcomeCodeClose = document.getElementById("welcomeCodeClose");
const welcomeEmailNote = document.getElementById("welcomeEmailNote");
const welcomeNoEmailNote = document.getElementById("welcomeNoEmailNote");
const welcomeCodeBox = document.getElementById("welcomeCodeBox");

const myCodeBtn = document.getElementById("myCodeBtn");
const myCodeModal = document.getElementById("myCodeModal");
const myCodeClose = document.getElementById("myCodeClose");
const showMyCodeBtn = document.getElementById("showMyCodeBtn");
const myCodeHidden = document.getElementById("myCodeHidden");
const myCodeVisible = document.getElementById("myCodeVisible");
const myCodeValue = document.getElementById("myCodeValue");
const myCodeCopy = document.getElementById("myCodeCopy");
const emailBindInput = document.getElementById("emailBindInput");
const emailBindSave = document.getElementById("emailBindSave");
const emailBindStatus = document.getElementById("emailBindStatus");

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
const audioCategory = document.getElementById("audioCategory");
const newAudioCategoryWrap = document.getElementById("newAudioCategoryWrap");
const newAudioCategoryName = document.getElementById("newAudioCategoryName");
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
const profileTabText = document.getElementById("profileTabText");
const profileGalleryPhoto = document.getElementById("profileGalleryPhoto");
const profileGalleryVideo = document.getElementById("profileGalleryVideo");
const profileGalleryText = document.getElementById("profileGalleryText");
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
const videoPreviewImage = document.getElementById("videoPreviewImage");
const videoPreviewFileBtn = document.getElementById("videoPreviewFileBtn");
const videoPreviewGalleryBtn = document.getElementById("videoPreviewGalleryBtn");
const videoPreviewFileInput = document.getElementById("videoPreviewFileInput");
let pickedVideoPreviewFile = null;
let selectedVideoPreviewUrl = null;
let selectedVideoPreviewKey = null;

function showVideoPreview(url) {
  if (!videoPreviewImage) return;
  if (url) { videoPreviewImage.src = url; videoPreviewImage.classList.remove("hidden"); }
  else { videoPreviewImage.removeAttribute("src"); videoPreviewImage.classList.add("hidden"); }
}
function resetVideoPreview(url = null, key = null) {
  pickedVideoPreviewFile = null;
  selectedVideoPreviewUrl = url;
  selectedVideoPreviewKey = key;
  if (videoPreviewFileInput) videoPreviewFileInput.value = "";
  showVideoPreview(url);
}
if (videoPreviewFileBtn) videoPreviewFileBtn.addEventListener("click", () => videoPreviewFileInput?.click());
if (videoPreviewFileInput) videoPreviewFileInput.addEventListener("change", () => {
  const file = videoPreviewFileInput.files?.[0];
  videoPreviewFileInput.value = "";
  if (!file) return;
  if (!file.type.startsWith("image/")) { showToast("Выбери файл изображения"); return; }
  pickedVideoPreviewFile = file;
  selectedVideoPreviewUrl = null;
  selectedVideoPreviewKey = null;
  showVideoPreview(URL.createObjectURL(file));
});
if (videoPreviewGalleryBtn) videoPreviewGalleryBtn.addEventListener("click", () => openPhotoPicker(url => {
  pickedVideoPreviewFile = null;
  selectedVideoPreviewUrl = url;
  selectedVideoPreviewKey = null;
  showVideoPreview(url);
}));

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
  text: {
    summaryImg: document.getElementById("textRatingSummaryImg"),
    score: document.getElementById("textRatingScore"),
    label: document.getElementById("textRatingLabel"),
    picker: document.getElementById("textRatingPicker"),
    submit: document.getElementById("textRatingSubmit"),
  },
};

let selectedRank = { photo: null, video: null, text: null, audio: null };
let currentRatingTarget = { photo: null, video: null, text: null, audio: null };

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
let commentReplyTarget = { photo: null, video: null, audio: null, game: {} };

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
  text: {
    box: document.getElementById("textGigerBox"),
    checkbox: document.getElementById("textGigerCheckbox"),
  },
};

// true, если текущий пользователь уже подарил гиперзадку текущей карточке
// (в таком случае чекбокс вообще не показываем — дарить больше нечего)
let alreadyGifted = { photo: false, video: false, text: false, audio: false };

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

function showAuthScreen(n) {
  [authScreen0, authScreen1, authScreen2, authScreen3, authScreen4].forEach((s, i) => {
    if (s) s.style.display = i === n ? "" : "none";
  });
}

function ensureIdentity() {
  if (currentIdentity) {
    refreshWhoAmI();
    return;
  }
  showAuthScreen(0);
  nameModal.classList.add("active");
}

const authGoogleBtn = document.getElementById("authGoogleBtn");

// Навигация по экранам
if (authGoRegister) authGoRegister.addEventListener("click", () => showAuthScreen(1));
if (authGoLogin) authGoLogin.addEventListener("click", () => showAuthScreen(2));
if (authGoCode) authGoCode.addEventListener("click", () => showAuthScreen(3));
if (authBack0from1) authBack0from1.addEventListener("click", () => showAuthScreen(0));
if (authBack0from2) authBack0from2.addEventListener("click", () => showAuthScreen(0));
if (authBack2from3) authBack2from3.addEventListener("click", () => showAuthScreen(2));

// Войти через Google
if (authGoogleBtn) {
  authGoogleBtn.addEventListener("click", async () => {
    if (!db) return;
    await db.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.href }
    });
  });
}

// Регистрация
nameConfirm.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  if (!name) {
    if (regError) { regError.textContent = "Введи имя"; regError.style.display = ""; }
    return;
  }
  if (regError) regError.style.display = "none";

  const emailVal = regEmailInput ? regEmailInput.value.trim().toLowerCase() : "";

  // Если email введён — проверяем не занят ли он уже
  if (emailVal && db) {
    const { data: exists } = await db.from(PROFILES_TABLE).select("owner_code").eq("email", emailVal).maybeSingle();
    if (exists) {
      if (regError) { regError.textContent = "Этот email уже привязан к другому аккаунту. Войди через него."; regError.style.display = ""; }
      return;
    }
  }

  currentIdentity = saveIdentity(name);
  if (regEmailInput) regEmailInput.value = "";
  nameInput.value = "";
  nameModal.classList.remove("active");

  if (db && currentIdentity) {
    const payload = { owner_code: currentIdentity.code, display_name: name };
    if (emailVal) payload.email = emailVal;
    delete profileCache[currentIdentity.code];
    await db.from(PROFILES_TABLE).upsert(payload, { onConflict: "owner_code" });
    delete profileCache[currentIdentity.code];
  }

  refreshWhoAmI();
  refreshMyGigerBalance();
  refreshActivityBadge();
  subscribeActivityRealtime();
  subscribeSitePresence();
  unlockedKurymdykSet = null;
  unlockedKurymdykForCode = null;
  await Promise.all([loadPhotos(), loadVideos()]);

  // Welcome-модалка
  if (welcomeCodeModal) {
    welcomeCodeValue.textContent = currentIdentity.code;
    if (emailVal) {
      if (welcomeEmailNote) welcomeEmailNote.style.display = "";
      if (welcomeNoEmailNote) welcomeNoEmailNote.style.display = "none";
      if (welcomeCodeBox) welcomeCodeBox.style.display = "none";
    } else {
      if (welcomeEmailNote) welcomeEmailNote.style.display = "none";
      if (welcomeNoEmailNote) welcomeNoEmailNote.style.display = "";
      if (welcomeCodeBox) welcomeCodeBox.style.display = "";
    }
    welcomeCodeModal.classList.add("active");
  }
});

// Вход по email
if (loginConfirm) {
  loginConfirm.addEventListener("click", async () => {
    const email = loginEmailInput ? loginEmailInput.value.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) {
      if (loginError) { loginError.textContent = "Введи корректный email"; loginError.style.display = ""; }
      return;
    }
    if (!db) return;
    const { data } = await db.from(PROFILES_TABLE).select("owner_code, display_name").eq("email", email).maybeSingle();
    if (!data) {
      if (loginError) { loginError.textContent = "Аккаунт с таким email не найден"; loginError.style.display = ""; }
      return;
    }
    if (loginError) loginError.style.display = "none";
    const restored = { name: data.display_name || "—", code: data.owner_code };
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(restored));
    currentIdentity = restored;
    if (loginEmailInput) loginEmailInput.value = "";
    nameModal.classList.remove("active");
    showToast("✅ Вошёл в аккаунт!");
    refreshWhoAmI();
    refreshMyGigerBalance();
    refreshActivityBadge();
    subscribeActivityRealtime();
    subscribeSitePresence();
    unlockedKurymdykSet = null;
    unlockedKurymdykForCode = null;
    await Promise.all([loadPhotos(), loadVideos()]);
  });
}

changeNameBtn.addEventListener("click", () => {
  if (currentIdentity) {
    // Уже вошёл — показываем экран смены имени
    const renameInput = document.getElementById("renameInput");
    if (renameInput) renameInput.value = currentIdentity.name;
    const renameError = document.getElementById("renameError");
    if (renameError) renameError.style.display = "none";
    showAuthScreen(4);
    nameModal.classList.add("active");
  } else {
    // Не вошёл — показываем обычный экран входа
    showAuthScreen(0);
    nameModal.classList.add("active");
  }
});

// Экран смены имени
const renameConfirmBtn = document.getElementById("renameConfirm");
const renameCancelBtn  = document.getElementById("renameCancel");
const renameInputEl    = document.getElementById("renameInput");
const renameErrorEl    = document.getElementById("renameError");

if (renameCancelBtn) {
  renameCancelBtn.addEventListener("click", () => {
    nameModal.classList.remove("active");
  });
}

if (renameConfirmBtn) {
  renameConfirmBtn.addEventListener("click", async () => {
    const newName = renameInputEl ? renameInputEl.value.trim() : "";
    if (!newName) {
      if (renameErrorEl) { renameErrorEl.textContent = "Введи имя"; renameErrorEl.style.display = ""; }
      return;
    }
    if (renameErrorEl) renameErrorEl.style.display = "none";

    currentIdentity.name = newName;
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(currentIdentity));

    if (db && currentIdentity) {
      delete profileCache[currentIdentity.code];
      await db.from(PROFILES_TABLE).upsert(
        { owner_code: currentIdentity.code, display_name: newName },
        { onConflict: "owner_code" }
      );
      delete profileCache[currentIdentity.code];
    }

    nameModal.classList.remove("active");
    refreshWhoAmI();
    showToast("Имя изменено ✅");
  });
}

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
let currentAudioSectionMode = "audio";
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

// Не закрывать модалку если пользователь выделял текст мышкой
function isTextSelected() {
  const sel = window.getSelection();
  return sel && sel.toString().length > 0;
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2500);
}

/* ---------- Инициализация Supabase ---------- */
function initSupabase() {
  const statusElement = document.getElementById("status");
  if (!window.supabase || SUPABASE_URL.includes("ВСТАВЬ") || SUPABASE_ANON_KEY.includes("ВСТАВЬ")) {
    if (statusElement) {
      statusElement.innerHTML = "Настрой config.js — вставь свои SUPABASE_URL и SUPABASE_ANON_KEY (инструкция в README.txt)";
    }
    if (uploadPhotoBtn) uploadPhotoBtn.disabled = true;
    if (uploadVideoBtn) uploadVideoBtn.disabled = true;
    if (uploadTextBtn) uploadTextBtn.disabled = true;
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
  gameSearchQuery = [];
  // Меняем плейсхолдер под вкладку
  if (tab === "games") {
    searchInput.placeholder = "🔍 Поиск по названию, #тегу...";
  } else if (tab === "text") {
    searchInput.placeholder = "🔍 Поиск по имени...";
  } else {
    searchInput.placeholder = "🔍 Поиск по имени...";
  }
  tabVideo.classList.toggle("active", tab === "video");
  tabPhoto.classList.toggle("active", tab === "photo");
  if (tabText) tabText.classList.toggle("active", tab === "text");
  if (tabGames) tabGames.classList.toggle("active", tab === "games");
  if (tabAudio) tabAudio.classList.toggle("active", tab === "audio");
  if (tab !== "audio") {
    document.getElementById("playlistsModal")?.classList.add("hidden");
  }
  if (tab === "audio") {
    currentAudioSectionMode = "audio";
    document.getElementById("audioLibraryBtn")?.classList.add("active");
    document.getElementById("audioPlaylistsBtn")?.classList.remove("active");
    document.getElementById("playlistsModal")?.classList.add("hidden");
  }
  uploadVideoBtn.classList.toggle("hidden", tab !== "video");
  uploadPhotoBtn.classList.toggle("hidden", tab !== "photo");
  if (uploadTextBtn) uploadTextBtn.classList.toggle("hidden", tab !== "text");
  if (uploadAudioBtn) uploadAudioBtn.classList.toggle("hidden", tab !== "audio" || currentAudioSectionMode !== "audio");
  if (uploadPlaylistBtn) uploadPlaylistBtn.classList.toggle("hidden", tab !== "audio" || currentAudioSectionMode !== "playlists");

  document.getElementById("audioLibraryBtn")?.classList.toggle("active", tab === "audio" && currentAudioSectionMode === "audio");
  document.getElementById("audioPlaylistsBtn")?.classList.toggle("active", tab === "audio" && currentAudioSectionMode === "playlists");
  const audioSectionActions = document.getElementById("audioSectionActions");
  if (audioSectionActions) audioSectionActions.classList.toggle("hidden", tab !== "audio");
  if (uploadGameBtn) uploadGameBtn.classList.toggle("hidden", tab !== "games");
  galleryVideo.classList.toggle("hidden", tab !== "video");
  galleryPhoto.classList.toggle("hidden", tab !== "photo");
  if (galleryText) galleryText.classList.toggle("hidden", tab !== "text");
  if (galleryAudio) galleryAudio.classList.toggle("hidden", tab !== "audio" || currentAudioSectionMode !== "audio");
  if (galleryPlaylists) galleryPlaylists.classList.toggle("hidden", tab !== "audio" || currentAudioSectionMode !== "playlists");

  if (galleryGames) galleryGames.classList.toggle("hidden", tab !== "games");

  const isGames = tab === "games";
  // filterPanel всегда закрываем при смене вкладки
  const filterPanelEl = document.getElementById("filterPanel");
  if (filterPanelEl) filterPanelEl.classList.add("hidden");
  if (filterToggleBtn) filterToggleBtn.classList.remove("active");

  // Переключаем строки фильтр-панели: обычные vs игровые
  const filterRowAuthor     = document.getElementById("filterRowAuthor");
  const filterRowSort       = document.getElementById("filterRowSort");
  const filterRowGameAuthor = document.getElementById("filterRowGameAuthor");
  const filterRowGameSort   = document.getElementById("filterRowGameSort");
  if (filterRowAuthor)     filterRowAuthor.classList.toggle("hidden", isGames);
  if (filterRowSort)       filterRowSort.classList.toggle("hidden", isGames);
  if (filterRowGameAuthor) filterRowGameAuthor.classList.toggle("hidden", !isGames);
  if (filterRowGameSort)   filterRowGameSort.classList.toggle("hidden", !isGames);

  // categoryTabs скрываем для игр (у игр нет разделов — только теги, которые НЕ показываем в разделах)
  const categoryTabsEl = document.getElementById("categoryTabs");
  if (categoryTabsEl) categoryTabsEl.classList.toggle("hidden", isGames);

  if (!isGames) renderCategoryTabs();
  if (tab === "video") loadVideos();
  else if (tab === "text") loadTexts();
  else if (tab === "audio") loadAudio();
  else if (tab === "games") loadGames();
  else loadPhotos();
}

tabVideo.addEventListener("click", () => switchTab("video"));
tabPhoto.addEventListener("click", () => switchTab("photo"));
if (tabText) tabText.addEventListener("click", () => switchTab("text"));
if (tabAudio) tabAudio.addEventListener("click", () => switchTab("audio"));
if (tabGames) tabGames.addEventListener("click", () => switchTab("games"));

/* ==================================================================
   ПОИСК ПО ИМЕНИ
   ================================================================== */
function applySearch() {
  const query = searchInput.value.trim().toLowerCase();

  if (currentTab === "text") {
    applyTextSearch();
    return;
  }

  if (currentTab === "audio") {
    if (currentAudioSectionMode === "playlists" && typeof applyAudioPlaylistSearch === "function") applyAudioPlaylistSearch();

    else applyAudioSearch();
    return;
  }

  if (currentTab === "games") {
    // Для игр показываем именно количество игр, а не фотографий.
    const rawTokens = query ? query.split(",").map(t => t.trim().replace(/^#/, "")).filter(Boolean) : [];
    gameSearchQuery = rawTokens;
    renderGames();
    return;
  }

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
  [uploadCategory, videoCategory, audioCategory, document.getElementById("playlistPublishCategory")].forEach((selectEl) => {
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
if (audioCategory) {
  audioCategory.addEventListener("change", () => {
    newAudioCategoryWrap?.classList.toggle("hidden", audioCategory.value !== NEW_CATEGORY_VALUE);
  });
}
const playlistPublishCategory = document.getElementById("playlistPublishCategory");
const playlistPublishNewCategoryWrap = document.getElementById("playlistPublishNewCategoryWrap");
if (playlistPublishCategory) {
  playlistPublishCategory.addEventListener("change", () => {
    playlistPublishNewCategoryWrap?.classList.toggle("hidden", playlistPublishCategory.value !== NEW_CATEGORY_VALUE);
  });
}

function renderCategoryTabs() {
  if (!categoryTabsEl) return;
  categoryTabsEl.innerHTML = "";

  // Показываем только разделы, разрешённые для текущей вкладки
  const visibleCats = allCategories.filter((cat) => {
    // Аудио и плейлисты используют те же разделы, что и фотогалерея.
    if (currentTab === "audio") return true;
    if (!cat.allowed_tabs || cat.allowed_tabs.length === 0) return true;
    return cat.allowed_tabs.includes(currentTab);
  });

  // Если для текущей вкладки нет ни одного раздела — скрываем блок категорий
  categoryTabsEl.style.display = visibleCats.length === 0 ? "none" : "";

  // Если текущий фильтр не подходит для новой вкладки — сброс
  if (currentCategoryFilter !== "all" && !visibleCats.find(c => c.id === currentCategoryFilter)) {
    currentCategoryFilter = "all";
  }

  const allBtn = document.createElement("button");
  allBtn.className = "category-tab" + (currentCategoryFilter === "all" ? " active" : "");
  allBtn.textContent = "Все разделы";
  allBtn.addEventListener("click", () => {
    currentCategoryFilter = "all";
    renderCategoryTabs();
    applySearch();
  });
  categoryTabsEl.appendChild(allBtn);

  visibleCats.forEach((cat) => {
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
  allAudioRecords.forEach((r) => { if (r.owner_code && r.owner_name) names.set(r.owner_code, r.owner_name); });

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
      sorted.sort((a, b) => (a.name||a.title||"").localeCompare((b.name||b.title||""), "ru"));
      break;
    case "name_desc":
      sorted.sort((a, b) => (b.name||b.title||"").localeCompare((a.name||a.title||""), "ru"));
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

// Единое окно выбора превью из доступных пользователю фото.
let photoPickerOnSelect = null;
const photoPickerModal = document.getElementById("photoPickerModal");
const photoPickerSearch = document.getElementById("photoPickerSearch");
const photoPickerGrid = document.getElementById("photoPickerGrid");
const photoPickerStatus = document.getElementById("photoPickerStatus");
const photoPickerClose = document.getElementById("photoPickerClose");
const photoPickerCancel = document.getElementById("photoPickerCancel");

function openPhotoPicker(onSelect) {
  if (typeof onSelect !== "function") return;
  photoPickerOnSelect = onSelect;
  if (photoPickerSearch) photoPickerSearch.value = "";
  renderPhotoPickerItems();
  photoPickerModal?.classList.add("active");
  photoPickerSearch?.focus();
}

function closePhotoPicker() {
  photoPickerModal?.classList.remove("active");
  photoPickerOnSelect = null;
}

function renderPhotoPickerItems() {
  if (!photoPickerGrid) return;
  const query = (photoPickerSearch?.value || "").trim().toLocaleLowerCase("ru");
  const available = (allPhotoRecords || []).filter(record => {
    if (!record?.storage_path) return false;
    // Не позволяем выбирать фотографии, закрытые платным просмотром.
    if (typeof isKurymdykLocked === "function" && isKurymdykLocked("photo", record)) return false;
    const filename = String(record.storage_path).split("/").pop() || "";
    const title = String(record.name || nameFromFilename(filename));
    return !query || `${title} ${filename}`.toLocaleLowerCase("ru").includes(query);
  });
  photoPickerGrid.innerHTML = "";
  if (photoPickerStatus) photoPickerStatus.textContent = available.length
    ? `Доступно фотографий: ${available.length}`
    : (query ? "По этому запросу ничего не найдено" : "В галерее пока нет доступных фотографий");
  if (!available.length) {
    const empty = document.createElement("div");
    empty.className = "photo-picker-empty";
    empty.textContent = query ? "Ничего не найдено. Попробуй другое имя." : "Сначала добавь фотографии в основную галерею.";
    photoPickerGrid.appendChild(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  available.forEach(record => {
    const filename = String(record.storage_path).split("/").pop() || "";
    const displayName = String(record.name || nameFromFilename(filename) || "Без названия");
    const item = document.createElement("button");
    item.type = "button";
    item.className = "photo-picker-item";
    const image = document.createElement("img");
    image.src = publicUrlFor(record.storage_path);
    image.alt = displayName;
    image.loading = "lazy";
    const caption = document.createElement("span");
    caption.className = "photo-picker-item-name";
    caption.textContent = displayName;
    caption.title = `${displayName} · ${filename}`;
    item.append(image, caption);
    item.addEventListener("click", () => {
      const chosenUrl = publicUrlFor(record.storage_path);
      const callback = photoPickerOnSelect;
      closePhotoPicker();
      if (callback) callback(chosenUrl, displayName, record);
    });
    fragment.appendChild(item);
  });
  photoPickerGrid.appendChild(fragment);
}

if (photoPickerSearch) photoPickerSearch.addEventListener("input", renderPhotoPickerItems);
if (photoPickerClose) photoPickerClose.addEventListener("click", closePhotoPicker);
if (photoPickerCancel) photoPickerCancel.addEventListener("click", closePhotoPicker);
if (photoPickerModal) photoPickerModal.addEventListener("click", e => { if (e.target === photoPickerModal && !isTextSelected()) closePhotoPicker(); });
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
  if (e.target === lightbox && !isTextSelected()) closeLightbox();
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
    // Рисуем через canvas чтобы обойти CORS на fetch
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = currentPhotoSrc + (currentPhotoSrc.includes("?") ? "&" : "?") + "_cb=" + Date.now();
    });
    const canvas = document.createElement("canvas");
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d").drawImage(img, 0, 0);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    showToast("Скопировано в буфер обмена 📋");
  } catch (err) {
    // Финальный fallback — просто копируем прямую ссылку
    try {
      await navigator.clipboard.writeText(currentPhotoSrc);
      showToast("Ссылка скопирована (картинку не удалось, скопировали ссылку) 🔗");
    } catch {
      showToast("Не удалось скопировать (нужен HTTPS, на GitHub Pages сработает)");
    }
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
        <img src="${locked ? KURYMDYK_IMAGE : (record.preview_r2_url || "assets/video-cover.png")}" alt="${displayName}" loading="lazy">
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
  if (e.target === videoLightbox && !isTextSelected()) closeVideoLightbox();
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
  resetVideoPreview();
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

  let previewUrl = selectedVideoPreviewUrl || null;
  let previewKey = selectedVideoPreviewKey || null;
  if (pickedVideoPreviewFile) {
    try {
      videoConfirm.textContent = "Загружаю превью...";
      const previewUpload = await uploadFileXHR(pickedVideoPreviewFile, "video-covers", () => {});
      previewUrl = previewUpload.url;
      previewKey = previewUpload.key;
    } catch (uploadError) {
      videoConfirm.disabled = false;
      videoConfirm.textContent = editingVideoRecord ? "Сохранить" : "Добавить в галерею";
      showToast("Не удалось загрузить превью: " + uploadError.message);
      return;
    }
  }

  if (editingVideoRecord) {
    videoConfirm.textContent = "Сохраняю...";
    const { error } = await db
      .from(VIDEO_TABLE)
      .update({
        video_url: url,
        source: selectedSource,
        name: displayName,
        description: description || null,
        preview_r2_url: previewUrl,
        preview_r2_key: previewKey,
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

    if (editingVideoRecord.preview_r2_key && editingVideoRecord.preview_r2_key !== previewKey) {
      await db.storage.from(BUCKET_NAME).remove([editingVideoRecord.preview_r2_key]);
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
      preview_r2_url: previewUrl,
      preview_r2_key: previewKey,
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
  resetVideoPreview(currentVideoRecord.preview_r2_url || null, currentVideoRecord.preview_r2_key || null);
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
   ТЕКСТОВЫЕ ПОСТЫ
   ================================================================== */

let allTextRecords = [];
let currentTextRecord = null;
let currentTextList = [];
let currentTextIndex = -1;
let editingTextRecord = null;

const NEW_TEXT_CATEGORY_VALUE = "__new__";

// DOM-ссылки для текстов
const textModal = document.getElementById("textModal");
const textModalTitle = document.getElementById("textModalTitle");
const textTitle = document.getElementById("textTitle");
const textContent = document.getElementById("textContent");
const textGdocUrl = document.getElementById("textGdocUrl");
const textCategory = document.getElementById("textCategory");
const textFollowersOnly = document.getElementById("textFollowersOnly");
const textCancel = document.getElementById("textCancel");
const textConfirm = document.getElementById("textConfirm");
const newTextCategoryWrap = document.getElementById("newTextCategoryWrap");
const newTextCategoryName = document.getElementById("newTextCategoryName");

const textLightbox = document.getElementById("textLightbox");
const textLightboxTitle = document.getElementById("textLightboxTitle");
const textLightboxAuthor = document.getElementById("textLightboxAuthor");
const textLightboxDate = document.getElementById("textLightboxDate");
const textLightboxBody = document.getElementById("textLightboxBody");
const textLightboxClose = document.getElementById("textLightboxClose");
const textLightboxPrevBtn = document.getElementById("textLightboxPrevBtn");
const textLightboxNextBtn = document.getElementById("textLightboxNextBtn");
const textLightboxTools = document.getElementById("textLightboxTools");
const textLightboxEditBtn = document.getElementById("textLightboxEditBtn");
const textLightboxDeleteBtn = document.getElementById("textLightboxDeleteBtn");
const textLightboxGdocBanner = document.getElementById("textLightboxGdocBanner");
const textLightboxGdocLink = document.getElementById("textLightboxGdocLink");
const textLightboxGdocUpdated = document.getElementById("textLightboxGdocUpdated");

// Editor toolbar
if (textContent) {
  document.querySelectorAll(".text-tool-btn").forEach(btn => {
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const cmd = btn.dataset.cmd;
      document.execCommand(cmd, false, null);
      textContent.focus();
    });
  });
}

// Populate category select for text modal
function fillTextCategorySelect() {
  if (!textCategory) return;
  textCategory.innerHTML = `<option value="">— без раздела —</option>`;
  allCategories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name;
    textCategory.appendChild(opt);
  });
  const newOpt = document.createElement("option");
  newOpt.value = NEW_TEXT_CATEGORY_VALUE;
  newOpt.textContent = "➕ Создать новый раздел";
  textCategory.appendChild(newOpt);
}

if (textCategory) {
  textCategory.addEventListener("change", () => {
    if (newTextCategoryWrap) newTextCategoryWrap.classList.toggle("hidden", textCategory.value !== NEW_TEXT_CATEGORY_VALUE);
  });
}

async function loadTexts() {
  statusEl.textContent = "Загружаю тексты...";
  const { data, error } = await db
    .from(TEXT_TABLE)
    .select("id, title, owner_code, owner_name, category_id, followers_only, gdoc_url, gdoc_refreshed_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    statusEl.textContent = "Ошибка загрузки текстов: " + error.message +
      (error.message.includes("does not exist") ? " (выполни migration_add_texts.sql в Supabase)" : "");
    return;
  }

  if (!mySubscriptions) await loadMySubscriptions();
  allTextRecords = (data || []).filter(canSeeRecord);
  fillAuthorFilter();
  await preloadProfilesFor(allTextRecords);
  applyTextSearch();
}

function applyTextSearch() {
  const query = searchInput.value.trim().toLowerCase();
  const approvedCategoryIds = new Set(allCategories.map(c => c.id));
  let base = allTextRecords.filter(r => !r.category_id || approvedCategoryIds.has(r.category_id));
  if (currentCategoryFilter !== "all") base = base.filter(r => r.category_id === currentCategoryFilter);
  if (currentAuthorFilter !== "all") base = base.filter(r => r.owner_code === currentAuthorFilter);
  if (query) base = base.filter(r => {
    const title = (r.title || "").toLowerCase();
    const name = displayNameFor(r.owner_code, r.owner_name).toLowerCase();
    return title.includes(query) || name.includes(query);
  });
  base = applySort(base, "text");
  renderTextGallery(base);
}

function renderTextGallery(records) {
  currentTextList = records;
  galleryText.innerHTML = "";
  if (!records.length) {
    statusEl.textContent = "Пока нет текстовых постов — добавь первый!";
    return;
  }
  statusEl.textContent = "";
  records.forEach((record, idx) => {
    const card = document.createElement("div");
    card.className = "text-card";

    const previewText = record.body ? record.body.replace(/<[^>]*>/g, "").trim().slice(0, 120) : "";
    const hasGdoc = !!record.gdoc_url;
    const hasMore = record.body ? record.body.replace(/<[^>]*>/g, "").trim().length > 120 : true;
    const authorName = displayNameFor(record.owner_code, record.owner_name);

    card.innerHTML = `
      <div class="text-card-cover">
        <div class="text-card-cover-title">${escapeHtml(record.title || "Без названия")}</div>
        ${record.followers_only ? `<span class="followers-only-badge" title="Только для подписчиков">🔒</span>` : ""}
      </div>
      <div class="text-card-body">
        ${previewText ? `<div class="text-card-preview">${escapeHtml(previewText)}</div>` : ""}
        ${(previewText || hasGdoc) ? `<div class="text-card-ellipsis">читать далее...</div>` : ""}
        <div class="text-card-meta">
          <span class="owner-tag owner-tag-link" data-owner="${record.owner_code || ""}">от ${escapeHtml(authorName)}</span>
          <span>${formatPublishDate(record.created_at)}</span>
          ${hasGdoc ? `<span class="text-card-gdoc-badge">📄 Google Doc</span>` : ""}
        </div>
      </div>
    `;

    card.addEventListener("click", () => openTextLightbox(record, idx));
    const ownerTag = card.querySelector(".owner-tag-link");
    if (ownerTag) {
      ownerTag.addEventListener("click", (e) => {
        e.stopPropagation();
        openProfile(record.owner_code);
      });
    }
    galleryText.appendChild(card);
  });
}

// Fetch Google Doc content via published export URL
async function fetchGdocContent(gdocUrl) {
  try {
    // Extract doc ID and build export URL
    const match = gdocUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) return null;
    const docId = match[1];
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=html`;
    const resp = await fetch(exportUrl, { cache: "no-cache" });
    if (!resp.ok) return null;
    const html = await resp.text();
    // Parse and sanitize
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const body = doc.querySelector("body");
    if (!body) return null;
    // Remove Google's style/script noise, keep just content
    body.querySelectorAll("script,style,link,meta").forEach(el => el.remove());
    return body.innerHTML;
  } catch { return null; }
}

async function openTextLightbox(record, index) {
  try {
  currentTextRecord = record;
  currentTextIndex = index;

  if (!textLightbox) return;
  if (textLightboxTitle) textLightboxTitle.innerHTML = escapeHtml(record.title || "Без названия");
  if (textLightboxDate) textLightboxDate.textContent = formatPublishDate(record.created_at);

  if (record.owner_code) {
    textLightboxAuthor.innerHTML = `<span class="online-dot" data-online-for="${record.owner_code}"></span>от ${escapeHtml(displayNameFor(record.owner_code, record.owner_name))}`;
    textLightboxAuthor.dataset.owner = record.owner_code;
    textLightboxAuthor.style.display = "block";
    textLightboxAuthor.addEventListener("click", () => openProfile(record.owner_code));
  } else {
    textLightboxAuthor.style.display = "none";
  }

  // Load body on demand if not yet fetched (list query omits body for speed)
  if (record.body === undefined) {
    textLightboxBody.innerHTML = "<div style='color:#bbb;font-size:0.9em;'>Загружаю...</div>";
    const { data: full } = await db.from(TEXT_TABLE).select("body, gdoc_refreshed_at").eq("id", record.id).single();
    if (full) {
      record.body = full.body || "";
      record.gdoc_refreshed_at = full.gdoc_refreshed_at;
    } else {
      record.body = "";
    }
  }

  // Show body — prefer cached body immediately, refresh from gdoc if >1 hour old
  let bodyHtml = record.body || "";

  if (record.gdoc_url) {
    textLightboxGdocBanner.classList.remove("hidden");
    textLightboxGdocLink.href = record.gdoc_url;

    const lastRefresh = record.gdoc_refreshed_at ? new Date(record.gdoc_refreshed_at) : null;
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const needsRefresh = !lastRefresh || lastRefresh < hourAgo;

    if (needsRefresh) {
      textLightboxGdocUpdated.textContent = "Обновляю из Google Doc...";
      // Show cached body first, then update asynchronously
      textLightboxBody.innerHTML = bodyHtml;
      fetchGdocContent(record.gdoc_url).then(async gdocHtml => {
        if (gdocHtml) {
          textLightboxBody.innerHTML = gdocHtml;
          textLightboxGdocUpdated.textContent = "Обновлено только что";
          await db.from(TEXT_TABLE).update({ body: gdocHtml, gdoc_refreshed_at: new Date().toISOString() }).eq("id", record.id);
          // update local record so next open uses fresh cache
          record.body = gdocHtml;
          record.gdoc_refreshed_at = new Date().toISOString();
        } else {
          textLightboxGdocUpdated.textContent = lastRefresh ? `Обновлено: ${formatPublishDate(record.gdoc_refreshed_at)}` : "Не удалось загрузить из Google Doc";
        }
      });
      // Don't overwrite below — early return from the async block is handled above
    } else {
      textLightboxGdocUpdated.textContent = `Обновлено: ${formatPublishDate(record.gdoc_refreshed_at)}`;
    }
  } else {
    textLightboxGdocBanner.classList.add("hidden");
  }

  textLightboxBody.innerHTML = bodyHtml;

  // Navigation
  const hasMultiple = currentTextList.length > 1;
  textLightboxPrevBtn.classList.toggle("hidden", !hasMultiple || index === 0);
  textLightboxNextBtn.classList.toggle("hidden", !hasMultiple || index === currentTextList.length - 1);

  // Edit/delete tools
  const canEdit = isOwner(record);
  if (textLightboxTools) textLightboxTools.classList.toggle("hidden", !canEdit);

  textLightbox.classList.add("open");
  textLightbox.scrollTop = 0;
  document.body.style.overflow = "hidden";

  // Load comments and ratings for text
  loadTextComments(record.id);
  } catch(e) { console.error("openTextLightbox error:", e); }
}

function closeTextLightbox() {
  textLightbox.classList.remove("open");
  document.body.style.overflow = "";
  currentTextRecord = null;
}

if (textLightboxClose) textLightboxClose.addEventListener("click", closeTextLightbox);
if (textLightbox) textLightbox.addEventListener("click", (e) => {
  if (e.target === textLightbox && !isTextSelected()) closeTextLightbox();
});

if (textLightboxPrevBtn) textLightboxPrevBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (currentTextIndex > 0) openTextLightbox(currentTextList[currentTextIndex - 1], currentTextIndex - 1);
});
if (textLightboxNextBtn) textLightboxNextBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (currentTextIndex < currentTextList.length - 1) openTextLightbox(currentTextList[currentTextIndex + 1], currentTextIndex + 1);
});

// --- Зум текста ---
let textZoomLevel = 1.0; // множитель em
const TEXT_ZOOM_STEP = 0.1;
const TEXT_ZOOM_MIN = 0.7;
const TEXT_ZOOM_MAX = 2.0;

function applyTextZoom() {
  if (textLightboxBody) {
    textLightboxBody.style.fontSize = textZoomLevel.toFixed(1) + "em";
  }
}

const textZoomInBtn = document.getElementById("textZoomInBtn");
const textZoomOutBtn = document.getElementById("textZoomOutBtn");

if (textZoomInBtn) textZoomInBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (textZoomLevel < TEXT_ZOOM_MAX) { textZoomLevel = Math.min(TEXT_ZOOM_MAX, textZoomLevel + TEXT_ZOOM_STEP); applyTextZoom(); }
});
if (textZoomOutBtn) textZoomOutBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (textZoomLevel > TEXT_ZOOM_MIN) { textZoomLevel = Math.max(TEXT_ZOOM_MIN, textZoomLevel - TEXT_ZOOM_STEP); applyTextZoom(); }
});

// --- Поделиться текстом ---
function getTextPlainContent(record) {
  if (!record) return "";
  const title = record.title || "Без названия";
  const body = record.body ? record.body.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]*>/g, "") : "";
  const author = displayNameFor(record.owner_code, record.owner_name);
  const date = formatPublishDate(record.created_at);
  return `${title}\n${author} · ${date}\n\n${body.trim()}`;
}

const textShareBtn = document.getElementById("textShareBtn");
if (textShareBtn) textShareBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!currentTextRecord) return;
  const slug = slugify(currentTextRecord.title || "текст");
  const shortId = currentTextRecord.id.replace(/-/g, "").slice(0, 8);
  const url = `${location.origin}${location.pathname}#text-${slug}--${shortId}`;
  copyTextToClipboard(url);
});

const textCopyBtn = document.getElementById("textCopyBtn");
if (textCopyBtn) textCopyBtn.addEventListener("click", async (e) => {
  e.stopPropagation();
  if (!currentTextRecord) return;
  const text = getTextPlainContent(currentTextRecord);
  try {
    await navigator.clipboard.writeText(text);
    showToast("Скопировано!");
  } catch { showToast("Не удалось скопировать"); }
});

const textDownloadBtn = document.getElementById("textDownloadBtn");
if (textDownloadBtn) textDownloadBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!currentTextRecord) return;
  const text = getTextPlainContent(currentTextRecord);
  const filename = (currentTextRecord.title || "текст").replace(/[^а-яёa-z0-9_\- ]/gi, "_").slice(0, 60) + ".txt";
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
});

// Open upload text modal
function openTextModal(record = null) {
  editingTextRecord = record;
  fillTextCategorySelect();

  if (record) {
    textModalTitle.textContent = "Редактировать текст ✏️";
    textTitle.value = record.title || "";
    textContent.innerHTML = record.body || "";
    textGdocUrl.value = record.gdoc_url || "";
    textFollowersOnly.checked = !!record.followers_only;
    textCategory.value = record.category_id || "";
    if (newTextCategoryWrap) newTextCategoryWrap.classList.add("hidden");
    textConfirm.textContent = "Сохранить";
  } else {
    textModalTitle.textContent = "Новый текст 📝";
    textTitle.value = "";
    textContent.innerHTML = "";
    textGdocUrl.value = "";
    textFollowersOnly.checked = false;
    textCategory.value = "";
    if (newTextCategoryWrap) newTextCategoryWrap.classList.add("hidden");
    textConfirm.textContent = "Добавить";
  }

  textModal.classList.add("active");
}

if (uploadTextBtn) uploadTextBtn.addEventListener("click", () => openTextModal());

if (textCancel) textCancel.addEventListener("click", () => {
  textModal.classList.remove("active");
  editingTextRecord = null;
});

if (textLightboxEditBtn) textLightboxEditBtn.addEventListener("click", () => {
  const recordToEdit = currentTextRecord;
  closeTextLightbox();
  openTextModal(recordToEdit);
});

if (textLightboxDeleteBtn) textLightboxDeleteBtn.addEventListener("click", async () => {
  if (!currentTextRecord) return;
  if (!confirm("Удалить этот текст?")) return;
  const { error } = await db.from(TEXT_TABLE).delete().eq("id", currentTextRecord.id);
  if (error) { showToast("Ошибка: " + error.message); return; }
  closeTextLightbox();
  loadTexts();
  showToast("Текст удалён");
});

if (textConfirm) textConfirm.addEventListener("click", async () => {
  const title = textTitle ? textTitle.value.trim() : "";
  if (!title) { showToast("Введи заголовок"); return; }

  const bodyHtml = textContent ? textContent.innerHTML : "";
  const gdocUrl = textGdocUrl ? textGdocUrl.value.trim() : "";

  let categoryId = textCategory ? textCategory.value : null;
  if (categoryId === NEW_TEXT_CATEGORY_VALUE) {
    const catName = newTextCategoryName ? newTextCategoryName.value.trim() : "";
    if (!catName) { showToast("Введи название раздела"); return; }
    const { data: created, error: catErr } = await db.from(CATEGORY_TABLE).insert({ name: catName, approved: false }).select().single();
    if (catErr) { showToast("Ошибка создания раздела: " + catErr.message); return; }
    categoryId = created.id;
  } else if (!categoryId) {
    categoryId = null;
  }

  const identity = currentIdentity || getIdentity();
  const payload = {
    title,
    body: bodyHtml,
    gdoc_url: gdocUrl || null,
    owner_name: identity ? identity.name : null,
    owner_code: identity ? identity.code : null,
    followers_only: textFollowersOnly ? textFollowersOnly.checked : false,
    category_id: categoryId,
  };

  if (editingTextRecord) {
    const { error } = await db.from(TEXT_TABLE).update(payload).eq("id", editingTextRecord.id);
    if (error) { showToast("Ошибка сохранения: " + error.message); return; }
    showToast("Текст сохранён!");
  } else {
    const { error } = await db.from(TEXT_TABLE).insert(payload);
    if (error) { showToast("Ошибка: " + error.message); return; }
    showToast("Текст добавлен! +3 гиперзадки 🐿️");
    creditGigersForPublish("text");
  }

  textModal.classList.remove("active");
  editingTextRecord = null;
  loadTexts();
});

// Comments for text posts (simple, reuse the pattern)
async function loadTextComments(textId) {
  const listEl = document.getElementById("textCommentList");
  if (!listEl) return;
  listEl.innerHTML = "<div style='color:#bbb;font-size:0.9em;'>Загружаю комментарии...</div>";

  const { data, error } = await db.from(COMMENTS_TABLE)
    .select("*").eq("target_type", "text").eq("target_id", textId).order("created_at", { ascending: true });

  if (error) { listEl.innerHTML = "Ошибка загрузки комментариев"; return; }
  if (!data || !data.length) {
    listEl.innerHTML = "<div style='color:#bbb;font-size:0.9em;'>Пока нет комментариев</div>";
    return;
  }

  const { data: gifts } = await db.from(GIGER_GIFTS_TABLE).select("linked_comment_id").eq("target_type", "text").eq("target_id", textId);
  const gifted = new Set((gifts || []).map(x => x.linked_comment_id).filter(Boolean));
  listEl.innerHTML = "";
  data.forEach(comment => {
    const div = document.createElement("div");
    div.className = "comment-item" + (gifted.has(comment.id) ? " comment-item-gifted" : "");
    div.innerHTML = `
      <div class="comment-head"><span class="comment-author">${escapeHtml(comment.author_name || "аноним")}</span>
      ${gifted.has(comment.id) ? `<span class="comment-gift-badge" title="Подарил гиперзадку"><img src="assets/giperzadka.png" alt=""></span>` : ""}
      <span class="comment-time">${timeAgo(comment.created_at)}</span></div>
      <div class="comment-text">${escapeHtml(comment.text || "").replace(/\n/g,"<br>")}</div>
      ${comment.edited_at ? `<span class="comment-edited">(изменено)</span>` : ""}
      ${currentIdentity && comment.author_code === currentIdentity.code ? `<div class="comment-actions"><button type="button" class="comment-edit-btn">✏️</button><button type="button" class="comment-delete-btn">🗑️</button></div>` : ""}`;
    const eb = div.querySelector(".comment-edit-btn");
    if (eb) eb.addEventListener("click", () => editComment("text", comment));
    const dbtn = div.querySelector(".comment-delete-btn");
    if (dbtn) dbtn.addEventListener("click", () => deleteComment("text", comment));
    listEl.appendChild(div);
  });
}

  // После рендера комментариев возвращаемся наверх — иначе браузер прыгает вниз
  if (textLightbox) textLightbox.scrollTop = 0;

const textCommentSubmit = document.getElementById("textCommentSubmit");
const textCommentInput = document.getElementById("textCommentInput");
const textGigerCheckbox = document.getElementById("textGigerCheckbox");
const textGigerBox = document.getElementById("textGigerBox");

if (textCommentSubmit) textCommentSubmit.addEventListener("click", async () => {
  if (!currentTextRecord) return;
  const text = textCommentInput ? textCommentInput.value.trim() : "";
  if (!text) return;
  const identity = currentIdentity || getIdentity();
  const { data: insertedComment, error } = await db.from(COMMENTS_TABLE).insert({
    target_type: "text",
    target_id: currentTextRecord.id,
    text,
    author_name: identity ? identity.name : "аноним",
    author_code: identity ? identity.code : null,
  }).select().single();
  if (error) { showToast("Ошибка: " + error.message); return; }
  if (textGigerCheckbox && textGigerCheckbox.checked && !alreadyGifted.text) {
    await sendGiger("text", currentTextRecord, text, insertedComment?.id || null);
  } else {
    showToast("Комментарий отправлен 💬");
  }
  if (textCommentInput) textCommentInput.value = "";
  if (textGigerCheckbox) textGigerCheckbox.checked = false;
  loadTextComments(currentTextRecord.id);
  loadGiftState("text", currentTextRecord);
});

// Состояние подарка для текста обновляется при открытии текста.

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
  const el = ratingEls[kind]?.picker;
  if (!el) return; // Если элемента нет на странице, просто выходим
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
buildRatingPicker("text");

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

if (ratingEls.photo?.submit) ratingEls.photo.submit.addEventListener("click", () => submitRating("photo"));
if (ratingEls.video?.submit) ratingEls.video.submit.addEventListener("click", () => submitRating("video"));
if (ratingEls.text?.submit) ratingEls.text.submit.addEventListener("click", () => submitRating("text"));

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
      ${c.edited_at ? `<span class="comment-edited">(изменено)</span>` : ""}
      <div class="comment-actions">
        <button type="button" class="comment-reply-btn" data-comment-id="${c.id}">Ответить</button>
        ${currentIdentity && c.author_code === currentIdentity.code ? `<button type="button" class="comment-edit-btn" data-comment-id="${c.id}">✏️</button><button type="button" class="comment-delete-btn" data-comment-id="${c.id}">🗑️</button>` : ""}
      </div>
    `;

    const replyBtn = item.querySelector(".comment-reply-btn");
    replyBtn.addEventListener("click", () => setReplyTarget(kind, c));

    const editBtn = item.querySelector(".comment-edit-btn");
    if (editBtn) editBtn.addEventListener("click", () => editComment(kind, c));
    const deleteBtn = item.querySelector(".comment-delete-btn");
    if (deleteBtn) deleteBtn.addEventListener("click", () => deleteComment(kind, c));

    els.list.appendChild(item);
  });

  applyOnlinePresence();
}

let activeCommentEdit = null;
const commentEditModal = document.getElementById("commentEditModal");
const commentEditInput = document.getElementById("commentEditInput");
const commentEditCancel = document.getElementById("commentEditCancel");
const commentEditSave = document.getElementById("commentEditSave");
const commentEditStatus = document.getElementById("commentEditStatus");

function updateCommentEditState() {
  if (!commentEditInput || !commentEditSave || !activeCommentEdit) return;
  const current = commentEditInput.value.trim();
  const original = String(activeCommentEdit.text || "").trim();
  const changed = current.length > 0 && current !== original;
  commentEditSave.disabled = !changed;
  if (commentEditStatus) {
    commentEditStatus.textContent = !current
      ? "Комментарий не может быть пустым."
      : (changed ? "Изменения готовы к сохранению." : "Измените текст, чтобы сохранить изменения.");
  }
}

function closeCommentEditModal() {
  if (!commentEditModal) return;
  commentEditModal.classList.remove("active");
  commentEditModal.setAttribute("aria-hidden", "true");
  activeCommentEdit = null;
  if (commentEditInput) commentEditInput.value = "";
  if (commentEditSave) commentEditSave.disabled = true;
}

function openCommentEditModal(kind, comment) {
  if (!currentIdentity || comment.author_code !== currentIdentity.code || !commentEditModal || !commentEditInput) return;
  activeCommentEdit = { kind, comment };
  commentEditInput.value = comment.text || "";
  commentEditModal.classList.add("active");
  commentEditModal.setAttribute("aria-hidden", "false");
  updateCommentEditState();
  requestAnimationFrame(() => {
    commentEditInput.focus();
    commentEditInput.setSelectionRange(commentEditInput.value.length, commentEditInput.value.length);
  });
}

if (commentEditInput) commentEditInput.addEventListener("input", updateCommentEditState);
if (commentEditCancel) commentEditCancel.addEventListener("click", closeCommentEditModal);
if (commentEditModal) commentEditModal.addEventListener("click", (e) => {
  if (e.target === commentEditModal && !isTextSelected()) closeCommentEditModal();
});

async function saveEditedComment() {
  if (!activeCommentEdit || !currentIdentity || !commentEditInput) return;
  const { kind, comment } = activeCommentEdit;
  const text = commentEditInput.value.trim();
  const original = String(comment.text || "").trim();

  if (!text || text === original) {
    updateCommentEditState();
    return;
  }

  commentEditSave.disabled = true;
  commentEditSave.textContent = "Сохраняю...";

  const table = kind === "game" ? GAME_COMMENTS_TABLE : COMMENTS_TABLE;
  const { error } = await db.from(table)
    .update({ text, edited_at: new Date().toISOString() })
    .eq("id", comment.id)
    .eq("author_code", currentIdentity.code);

  commentEditSave.textContent = "Изменить";
  if (error) {
    commentEditSave.disabled = false;
    (kind === "game" ? showGameToast : showToast)("Не удалось изменить комментарий: " + error.message);
    return;
  }

  closeCommentEditModal();
  if (kind === "text") loadTextComments(comment.target_id);
  else if (kind === "game") loadGameComments(comment.game_id);
  else loadComments(kind, comment.target_id);
}

if (commentEditSave) commentEditSave.addEventListener("click", saveEditedComment);

async function editComment(kind, comment) {
  openCommentEditModal(kind, comment);
}

async function deleteComment(kind, comment) {
  if (!currentIdentity || comment.author_code !== currentIdentity.code) return;
  if (!confirm("Удалить этот комментарий?")) return;
  // ВАЖНО: подарок гиперзадки НЕ удаляем и НЕ возвращаем дарителю.
  // У подарка linked_comment_id станет NULL по ON DELETE SET NULL,
  // а сама гиперзадка останется у автора публикации.
  const { error } = await db.from(COMMENTS_TABLE).delete().eq("id", comment.id).eq("author_code", currentIdentity.code);
  if (error) { showToast("Не удалось удалить комментарий: " + error.message); return; }
  if (kind === "text") loadTextComments(comment.target_id); else loadComments(kind, comment.target_id);
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

  const record = kind === "photo" ? currentPhotoRecord
    : kind === "video" ? currentVideoRecord
    : kind === "audio" ? currentAudioRecord
    : currentTextRecord;
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

  // Для аудио можно выбрать несколько участников озвучки и подарить
  // каждому по одной гиперзадке. Для остальных публикаций логика прежняя.
  const gEls = gigerEls[kind];
  if (kind === "audio") {
    const selectedRecipients = [...document.querySelectorAll("#audioGigerChoices input[data-recipient]:checked")]
      .map((el) => el.dataset.recipient);
    if (selectedRecipients.length) {
      await sendAudioGigers(record, text, insertedComment ? insertedComment.id : null, selectedRecipients);
    } else {
      showToast("Комментарий отправлен 💬");
    }
  } else if (gEls.checkbox.checked && !alreadyGifted[kind]) {
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
  if (!gigerEls[kind]?.checkbox) return;
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
bindGigerUncheckSound("text");

/* ==================================================================
   ГИПЕРЗАДКИ (фото +1, видео +2, текст/аудио +3; можно дарить авторам)
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
  if (!currentIdentity) return false;
  const delta = kind === "video" ? 2 : kind === "text" ? 3 : kind === "audio" ? 3 : 1;
  const { error } = await db.rpc("giger_add", {
    p_code: currentIdentity.code,
    p_name: currentIdentity.name,
    p_delta: delta,
  });
  if (error) {
    console.error("[gigers] не удалось начислить награду за публикацию:", error);
    return false;
  }
  refreshMyGigerBalance();
  return true;
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
  if (!els?.box || !record) return;

  // У аудио получателями могут быть автор книги и авторы одобренных
  // дополнительных дорожек. Один и тот же человек учитывается один раз.
  if (kind === "audio") {
    const host = els.choices || document.getElementById("audioGigerChoices");
    if (!host) return;
    host.innerHTML = "";
    const participants = [];
    const addParticipant = (code, fallbackName, label) => {
      if (!code || participants.some((p) => p.code === code)) return;
      participants.push({ code, name: displayNameFor(code, fallbackName), label });
    };
    addParticipant(record.owner_code, record.owner_name, "Автор");
    (currentAudioVoiceTracks || []).forEach((track) => {
      addParticipant(track.owner_code, track.owner_name, track.voice_name || "Дополнительная озвучка");
    });

    if (!participants.length) {
      host.innerHTML = '<div class="audio-giger-choice-note">У этой аудиозаписи не указан автор — подарки недоступны</div>';
      return;
    }

    let giftedCodes = new Set();
    if (currentIdentity) {
      const { data, error } = await db.from(GIGER_GIFTS_TABLE)
        .select("owner_code")
        .eq("target_type", "audio")
        .eq("target_id", record.id)
        .eq("giver_code", currentIdentity.code);
      if (!error) giftedCodes = new Set((data || []).map((row) => row.owner_code));
    }

    const canChoose = participants.filter((p) => p.code !== currentIdentity?.code);
    if (!canChoose.length) {
      host.innerHTML = '<div class="audio-giger-choice-note">Себе гиперзадку подарить нельзя 🐿️</div>';
      return;
    }

    const isMulti = participants.length > 1;
    host.innerHTML = (isMulti
      ? '<div class="audio-giger-choice-note">Выбери, кому отправить гиперзадку. Можно отметить нескольких участников.</div>'
      : '') + canChoose.map((p) => {
        const gifted = giftedCodes.has(p.code);
        const caption = isMulti
          ? `${p.label} — ${p.name}`
          : "Подарить гиперзадку автору";
        return `<label class="audio-giger-choice${gifted ? ' disabled' : ''}">
          <input type="checkbox" data-recipient="${escapeHtml(p.code)}" ${gifted ? 'disabled' : ''}>
          <img src="assets/giperzadka.png" alt="">
          <span>${escapeHtml(caption)}${gifted ? ' · уже подарено' : ''}</span>
        </label>`;
      }).join("");
    els.box.classList.remove("hidden", "audio-giger-info");
    return;
  }

  if (!els.checkbox) return;
  els.checkbox.checked = false;
  els.checkbox.disabled = false;
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

  const { data, error } = await db.from(GIGER_GIFTS_TABLE).select("id")
    .eq("target_type", kind).eq("target_id", record.id)
    .eq("giver_code", currentIdentity.code).maybeSingle();
  if (!error && data) {
    alreadyGifted[kind] = true;
    els.box.classList.add("hidden");
  } else {
    els.box.classList.remove("hidden");
  }
}

// Подарок отправляется вместе с комментарием, когда отмечен соответствующий чекбокс.
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

  showToast("Гиперзадка подарена 🎁");
  refreshMyGigerBalance();
  logActivity("gift", kind, record);
  return true;
}

// Для аудиокниг подарок атомарно переводит одну гиперзадку выбранному
// участнику и сохраняет отдельную запись для каждого получателя.
async function sendAudioGigers(record, comment, linkedCommentId, recipientCodes) {
  let sent = 0;
  let failed = 0;
  for (const recipientCode of [...new Set(recipientCodes)]) {
    const participant = [
      { code: record.owner_code, name: displayNameFor(record.owner_code, record.owner_name) },
      ...(currentAudioVoiceTracks || []).map((track) => ({
        code: track.owner_code,
        name: displayNameFor(track.owner_code, track.owner_name),
      })),
    ].find((p) => p.code === recipientCode);
    if (!participant || participant.code === currentIdentity.code) continue;

    const { data, error } = await db.rpc("audio_giger_gift", {
      p_audio_id: record.id,
      p_giver_code: currentIdentity.code,
      p_giver_name: currentIdentity.name,
      p_recipient_code: participant.code,
      p_recipient_name: participant.name,
      p_comment: comment || null,
      p_linked_comment_id: linkedCommentId || null,
    });
    if (error || data !== true) failed++;
    else sent++;
  }
  if (sent) {
    showToast(sent === 1 ? "Гиперзадка подарена 🎁" : `Подарено гиперзадок: ${sent} 🎁`);
    refreshMyGigerBalance();
  }
  if (failed) showToast(failed === 1 ? "Один подарок не отправлен: проверь баланс или не дарил ли ты уже этому участнику" : `Не отправлено подарков: ${failed}. Проверь баланс и получателей.`);
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
  const m = hash.match(/^(photo|video|text|audio)-.*--([0-9a-f]{4,32})$/i);
  if (!m) return null;
  return { kind: m[1], idFrag: m[2].toLowerCase() };
}

function findRecordByIdFrag(list, idFrag) {
  return list.find((r) => r.id.replace(/-/g, "").toLowerCase().startsWith(idFrag));
}

function openSharedFromHash() {
  const shared = parseShareHash();
  if (!shared) return;
  const list = shared.kind === "photo" ? allPhotoRecords : shared.kind === "video" ? allVideoRecords : shared.kind === "audio" ? allAudioRecords : allTextRecords;
  const record = findRecordByIdFrag(list, shared.idFrag);
  if (!record) {
    showToast("Не нашёл запись по этой ссылке 🐿️");
    return;
  }
  if (shared.kind === "photo") {
    openLightbox(record, publicUrlFor(record.storage_path));
  } else if (shared.kind === "video") {
    openVideoLightbox(record);
  } else if (shared.kind === "audio") {
    switchTab("audio");
    openAudioLightbox(record, allAudioRecords.indexOf(record));
  } else {
    switchTab("text");
    openTextLightbox(record, allTextRecords.indexOf(record));
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
    if (currentVideoRecord.preview_r2_key) {
      await db.storage.from(BUCKET_NAME).remove([currentVideoRecord.preview_r2_key]);
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
      target_name: record.name || record.title || null,
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
    .eq("owner_code", currentIdentity.code)
    .is("resolved_at", null);
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
  if (kind === "audio_voice_request") return "🎙️";
  if (kind === "audio_voice_approved") return "✅";
  if (kind === "audio_voice_rejected") return "❌";
  return "🔔";
}

function activityText(item) {
  const who = `<b class="activity-item-actor" data-actor="${escapeHtml(item.actor_code || "")}">${escapeHtml(item.actor_name || "Кто-то")}</b>`;
  const what = item.target_name ? `«${escapeHtml(item.target_name)}»` : "публикацию";
  if (item.kind === "view") return `${who} посмотрел(а) твою публикацию ${what}`;
  if (item.kind === "comment") return `${who} написал(а) комментарий под ${what}`;
  if (item.kind === "gift") return `${who} отправил(а) тебе гиперзадку за ${what}`;
  if (item.kind === "new_post") return `${who} выложил(а) новую публикацию ${what}`;
  if (item.kind === "follow") return `${who} подписался(лась) на тебя`;
  if (item.kind === "audio_voice_request") return `${who} предлагает добавить озвучку «${escapeHtml(item.extra || "Дополнительная озвучка")}» к аудио ${what}`;
  if (item.kind === "audio_voice_approved") return `${who} одобрил(а) твою озвучку «${escapeHtml(item.extra || "Дополнительная озвучка")}» для ${what}`;
  if (item.kind === "audio_voice_rejected") return `${who} отклонил(а) добавление озвучки «${escapeHtml(item.extra || "Дополнительная озвучка")}» к ${what}`;
  return `${who}: событие по ${what}`;
}

async function loadActivityFeed() {
  if (!currentIdentity || !db) {
    activityList.innerHTML = `<div class="activity-empty">Сначала введи своё имя 🐿️</div>`;
    return;
  }

  const { data, error } = await db.from(ACTIVITY_TABLE)
    .select("*")
    .eq("owner_code", currentIdentity.code)
    .is("resolved_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    activityList.innerHTML = `<div class="activity-empty">Не удалось загрузить активность</div>`;
    return;
  }

  // Заявки на озвучку всегда закрепляем выше обычных уведомлений.
  const items = (data || []).sort((a, b) => {
    const priority = (item) => item.kind === "audio_voice_request" ? 0 : 1;
    return priority(a) - priority(b) || new Date(b.created_at) - new Date(a.created_at);
  });
  if (!items.length) {
    activityList.innerHTML = `<div class="activity-empty">Пока тихо 🐿️</div>`;
    return;
  }

  activityList.innerHTML = items.map((item, idx) => {
    const isVoiceRequest = item.kind === "audio_voice_request";
    return `
      <div class="activity-item${isVoiceRequest ? " audio-request-item" : ""}" data-idx="${idx}">
        <div class="activity-item-icon">${activityIcon(item.kind)}</div>
        <div class="activity-item-body">
          <div class="activity-item-text">${activityText(item)}</div>
          <div class="activity-item-time">${timeAgo(item.created_at)}</div>
          ${isVoiceRequest ? `<div class="audio-request-actions">
            <button type="button" class="audio-request-approve" data-voice-review="approve">Принять озвучку</button>
            <button type="button" class="audio-request-reject" data-voice-review="reject">Отказать</button>
          </div>` : ""}
        </div>
      </div>`;
  }).join("");

  [...activityList.querySelectorAll(".activity-item-actor")].forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      activityPanel.classList.add("hidden");
      openProfile(el.dataset.actor);
    });
  });

  [...activityList.querySelectorAll("[data-voice-review]")].forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.stopPropagation();
      const item = items[Number(button.closest(".activity-item")?.dataset.idx)];
      if (item) await resolveAudioVoiceRequest(item, button.dataset.voiceReview === "approve");
    });
  });

  [...activityList.querySelectorAll(".activity-item")].forEach((el) => {
    el.addEventListener("click", async () => {
      const item = items[Number(el.dataset.idx)];
      if (item.kind === "follow") {
        activityPanel.classList.add("hidden");
        openProfile(item.actor_code);
        return;
      }
      activityPanel.classList.add("hidden");
      await goToPublication(item.target_type, item.target_id);
    });
  });
}

async function goToPublication(kind, targetId) {
  if (kind === "audio") {
    let record = allAudioRecords.find((r) => r.id === targetId);
    if (!record) {
      switchTab("audio");
      await loadAudio();
      record = allAudioRecords.find((r) => r.id === targetId);
    }
    if (!record) {
      showToast("Эта аудиозапись больше не найдена 🐿️");
      return;
    }
    switchTab("audio");
    openAudioLightbox(record, currentAudioList.indexOf(record));
    return;
  }
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

async function resolveAudioVoiceRequest(activityItem, approve) {
  if (!currentIdentity || !activityItem.related_id) {
    showToast("Не удалось определить заявку на озвучку");
    return;
  }
  const { data, error } = await db.rpc("review_audio_voice_track", {
    p_track_id: activityItem.related_id,
    p_owner_code: currentIdentity.code,
    p_approve: approve,
    p_owner_name: currentIdentity.name,
  });
  if (error) {
    showToast("Не удалось обработать заявку: " + error.message);
    return;
  }
  if (!data?.ok) {
    showToast("Эта заявка уже обработана или у тебя нет прав");
    await loadActivityFeed();
    await refreshActivityBadge();
    return;
  }
  if (!approve && data.storage_key) { try { await deleteAudioR2Object(data.storage_key); } catch (cleanupError) { console.warn("Не удалось удалить R2-дорожку", cleanupError); } }
  showToast(approve ? "Озвучка добавлена к аудиокниге ✅" : "Заявка отклонена");
  await loadActivityFeed();
  await refreshActivityBadge();
  if (currentAudioRecord?.id === activityItem.target_id) {
    await loadAudioVoiceTracks(currentAudioRecord);
    await loadGiftState("audio", currentAudioRecord);
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
  if (profileTabText) profileTabText.classList.toggle("active", kind === "text");
  profileGalleryPhoto.classList.toggle("hidden", kind !== "photo");
  profileGalleryVideo.classList.toggle("hidden", kind !== "video");
  if (profileGalleryText) profileGalleryText.classList.toggle("hidden", kind !== "text");
  renderProfileGallery(kind);
}

profileTabPhoto.addEventListener("click", () => switchProfileTab("photo"));
profileTabVideo.addEventListener("click", () => switchProfileTab("video"));
if (profileTabText) profileTabText.addEventListener("click", () => switchProfileTab("text"));

function renderProfileGallery(kind) {
  if (!viewingProfileCode) return;

  if (kind === "text") {
    const el = profileGalleryText;
    if (!el) return;
    const records = allTextRecords
      .filter(r => r.owner_code === viewingProfileCode)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    profileEmpty.classList.toggle("hidden", records.length > 0);
    el.innerHTML = "";
    records.forEach((record, idx) => {
      const card = document.createElement("div");
      card.className = "text-card";
      const previewText = record.body ? record.body.replace(/<[^>]*>/g, "").trim().slice(0, 120) : "";
      card.innerHTML = `
        <div class="text-card-cover">
          <div class="text-card-cover-title">${escapeHtml(record.title || "Без названия")}</div>
          ${record.followers_only ? `<span class="followers-only-badge" title="Только для подписчиков">🔒</span>` : ""}
        </div>
        <div class="text-card-body">
          ${previewText ? `<div class="text-card-preview">${escapeHtml(previewText)}</div>` : ""}
          <div class="text-card-ellipsis">читать далее...</div>
          <div class="text-card-meta">
            <span>${formatPublishDate(record.created_at)}</span>
            ${record.gdoc_url ? `<span class="text-card-gdoc-badge">📄 Google Doc</span>` : ""}
          </div>
        </div>
      `;
      card.addEventListener("click", () => {
        const galleryIdx = allTextRecords.indexOf(record);
        openTextLightbox(record, galleryIdx === -1 ? idx : galleryIdx);
      });
      el.appendChild(card);
    });
    return;
  }

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
        <div class="video-thumb"><img src="${locked ? KURYMDYK_IMAGE : (record.preview_r2_url || "assets/video-cover.png")}" alt="${displayName}" loading="lazy"></div>
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
    allVideoRecords.filter((r) => r.owner_code === ownerCode).length +
    allTextRecords.filter((r) => r.owner_code === ownerCode).length;
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
    allVideoRecords.filter((r) => r.owner_code === currentIdentity.code).length +
    allTextRecords.filter((r) => r.owner_code === currentIdentity.code).length;

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
  initThemeButton();
  refreshWhoAmI();
  if (!initSupabase()) return;

  // Обработка возврата после Google OAuth
  const { data: { session } } = await db.auth.getSession();
  if (session && session.user) {
    const googleUser = session.user;
    const email = googleUser.email;
    const googleName = googleUser.user_metadata?.full_name || googleUser.user_metadata?.name || email.split("@")[0];

    // Ищем существующий профиль по email
    const { data: existing } = await db.from(PROFILES_TABLE).select("owner_code, display_name").eq("email", email).maybeSingle();

    if (existing) {
      // Уже есть аккаунт — входим
      const identity = { name: existing.display_name || googleName, code: existing.owner_code };
      localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
      currentIdentity = identity;
    } else {
      // Новый пользователь — создаём аккаунт
      const newIdentity = saveIdentity(googleName);
      currentIdentity = newIdentity;
      await db.from(PROFILES_TABLE).upsert({
        owner_code: newIdentity.code,
        display_name: googleName,
        email: email
      }, { onConflict: "owner_code" });
    }
    refreshWhoAmI();
  }

  ensureIdentity();

  videoUrlHint.textContent = SOURCE_HINTS.google_drive;
  refreshMyGigerBalance();
  refreshActivityBadge();
  await loadCategories();
  await loadAllRatings();

  const shared = parseShareHash();
  const wantVideo = shared && shared.kind === "video";
  const wantText = shared && shared.kind === "text";

  switchTab(wantText ? "text" : wantVideo ? "video" : "photo");
  if (wantText) await loadTexts();
  else if (wantVideo) await loadVideos();
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
        if ((kind === "photo" || kind === "video" || kind === "audio") && currentRatingTarget[kind] === row.target_id) {
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
        if ((kind === "photo" || kind === "video" || kind === "audio") && currentRatingTarget[kind] === row.target_id) {
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

/* ==================================================================
   POLLING — обновление галереи каждую минуту
   ================================================================== */
function startPolling() {
  setInterval(async () => {
    if (!db) return;
    // Тихо обновляем текущий таб без сброса UI
    try {
      if (currentTab === "photo") {
        const { data, error } = await db
          .from(PHOTO_TABLE)
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) {
          if (!mySubscriptions) await loadMySubscriptions();
          allPhotoRecords = (data || []).filter(canSeeRecord);
          await preloadProfilesFor(allPhotoRecords);
          applySearch();
        }
      } else if (currentTab === "video") {
        const { data, error } = await db
          .from(VIDEO_TABLE)
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) {
          if (!mySubscriptions) await loadMySubscriptions();
          allVideoRecords = (data || []).filter(canSeeRecord);
          await preloadProfilesFor(allVideoRecords);
          applySearch(); // В твоем основном коде поиск для видео вызывается через applySearch
        }
      } else if (currentTab === "text") {
        const { data, error } = await db
          .from(TEXT_TABLE)
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) {
          if (!mySubscriptions) await loadMySubscriptions();
          allTextRecords = (data || []).filter(canSeeRecord);
          fillAuthorFilter();
          await preloadProfilesFor(allTextRecords);
          applyTextSearch();
        }
      }
    } catch (e) { /* тихо игнорируем ошибки поллинга */ }
  }, 60 * 1000);
}

// Запускаем всё при старте
initRealtime();
startPolling();



/* ==================================================================
   РАЗДЕЛ ИГР
   ================================================================== */

const GAMES_TABLE        = "burunduk_games";
const GAME_VERSIONS_TABLE = "burunduk_game_versions";
const GAME_COMMENTS_TABLE = "burunduk_game_comments";
const GAME_DOWNLOADS_TABLE = "burunduk_game_downloads";
const GAME_TAGS_TABLE    = "burunduk_game_tags";


/* --- Drive URL → прямая ссылка --- */
function parseDriveUrl(url) {
  if (!url) return null;
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return `https://drive.google.com/uc?export=download&id=${m[1]}`;
  return url;
}

/* --- Извлечь file ID из Drive ссылки --- */
function parseDriveFileId(url) {
  if (!url) return null;
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

/* --- Плеер игры: скачиваем zip через CF Worker, распаковываем JSZip, запускаем в iframe --- */
const GAME_PLAYER_WORKER_URL = "https://mute-grass-7ad4.popatuka0487.workers.dev";

async function openGamePlayer(driveUrl, gameTitle) {
  const fileId = parseDriveFileId(driveUrl);
  if (!fileId) { alert("Не удалось определить файл Google Drive"); return; }

  // Создаём оверлей-плеер
  let overlay = document.getElementById("gamePlayerOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "gamePlayerOverlay";
    overlay.innerHTML = `
      <div class="game-player-box">
        <div class="game-player-topbar">
          <span class="game-player-title"></span>
          <button class="game-player-close" title="Закрыть">✕</button>
        </div>
        <div class="game-player-status"></div>
        <iframe class="game-player-frame" sandbox="allow-scripts allow-forms allow-pointer-lock allow-popups allow-modals" allowfullscreen></iframe>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector(".game-player-close").addEventListener("click", () => {
      overlay.classList.remove("active");
      overlay.querySelector(".game-player-frame").src = "";
      URL.revokeObjectURL(overlay._blobUrl || "");
    });
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.querySelector(".game-player-close").click(); });
  }

  const statusEl = overlay.querySelector(".game-player-status");
  const frameEl  = overlay.querySelector(".game-player-frame");
  const titleEl  = overlay.querySelector(".game-player-title");

  titleEl.textContent = gameTitle || "Играть";
  statusEl.textContent = "Загружаю игру...";
  statusEl.style.display = "block";
  frameEl.style.display = "none";
  frameEl.src = "";
  overlay.classList.add("active");

  try {
    // Скачиваем zip через Cloudflare Worker (обходим CORS)
    const proxyUrl = `${GAME_PLAYER_WORKER_URL}/?id=${fileId}`;
    statusEl.textContent = "Загружаю игру...";
    const resp = await fetch(proxyUrl);
    if (!resp.ok) throw new Error(`Ошибка загрузки: ${resp.status}`);
    const arrayBuffer = await resp.arrayBuffer();

    // Проверяем magic bytes: ZIP начинается с PK (0x50 0x4B)
    const magic = new Uint8Array(arrayBuffer, 0, 2);
    const isZip = magic[0] === 0x50 && magic[1] === 0x4B;

    if (!isZip) {
      // Одиночный HTML-файл — грузим напрямую как blob
      statusEl.style.display = "none";
      frameEl.style.display = "block";
      const htmlBlob = new Blob([arrayBuffer], { type: "text/html" });
      const htmlUrl = URL.createObjectURL(htmlBlob);
      overlay._blobUrl = htmlUrl;
      frameEl.src = htmlUrl;
      return;
    }

    statusEl.textContent = "Распаковываю...";

    // Подключаем JSZip — сначала пробуем cdnjs, потом jsdelivr
    if (!window.JSZip) {
      await new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        s.onload = res;
        s.onerror = () => {
          // fallback на jsdelivr
          const s2 = document.createElement("script");
          s2.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
          s2.onload = res; s2.onerror = rej;
          document.head.appendChild(s2);
        };
        document.head.appendChild(s);
      });
    }

    const zip = await JSZip.loadAsync(arrayBuffer);

    // Ищем index.html (в любой вложенности), затем любой .html
    let indexEntry = zip.file("index.html");
    if (!indexEntry) {
      const all = Object.keys(zip.files);
      const found = all.find(p => p.endsWith("/index.html") || p === "index.html")
        || all.find(p => !zip.files[p].dir && (p.endsWith(".html") || p.endsWith(".htm")));
      if (found) indexEntry = zip.file(found);
    }
    if (!indexEntry) throw new Error("В архиве нет HTML-файла — игра не поддерживает браузерный запуск");

    // Определяем базовую папку (если index.html лежит в подпапке)
    const indexPath = indexEntry.name;
    const baseDir = indexPath.includes("/") ? indexPath.substring(0, indexPath.lastIndexOf("/") + 1) : "";

    // Строим data: URLs для каждого файла — работают из любого контекста
    const blobUrls = {};
    const fileEntries = Object.values(zip.files).filter(f => !f.dir);

    await Promise.all(fileEntries.map(async entry => {
      const relativePath = baseDir ? entry.name.replace(baseDir, "") : entry.name;
      const buf = await entry.async("uint8array");
      const mime = guessMime(entry.name);
      let binary = "";
      const chunk = 8192;
      for (let i = 0; i < buf.length; i += chunk) {
        binary += String.fromCharCode(...buf.subarray(i, i + chunk));
      }
      blobUrls[relativePath] = `data:${mime};base64,${btoa(binary)}`;
    }));

    // Патчим index.html — заменяем статические пути на blob URLs
    let html = await indexEntry.async("string");
    html = html.replace(/(src|href)=["']([^"'#]+)["']/g, (match, attr, path) => {
      const clean = path.replace(/^\.\//, "");
      return blobUrls[clean] ? `${attr}="${blobUrls[clean]}"` : match;
    });
    html = html.replace(/url\(['"']?([^'")\s]+)['"']?\)/g, (match, path) => {
      const clean = path.replace(/^\.\//, "");
      return blobUrls[clean] ? `url("${blobUrls[clean]}")` : match;
    });

    // Инжектируем перехватчик динамических .src = "assets/..."
    const blobMapJson = JSON.stringify(blobUrls);
    const interceptScript = `<meta name="referrer" content="no-referrer"><script>
(function(){
  var __blobMap = ${blobMapJson};
  function __resolve(p){
    if(!p||p.startsWith('blob:')||p.startsWith('data:')||p.startsWith('http')||p.startsWith('/')) return p;
    var c = p.replace(/^\.\//, '');
    return __blobMap[c] || __blobMap[c.split('/').pop()] || p;
  }

  // Патчим HTMLImageElement.prototype.src напрямую
  var imgProto = HTMLImageElement.prototype;
  var origSrcDesc = Object.getOwnPropertyDescriptor(imgProto, 'src');
  if(!origSrcDesc) origSrcDesc = Object.getOwnPropertyDescriptor(Element.prototype, 'src');
  if(origSrcDesc){
    Object.defineProperty(imgProto, 'src', {
      configurable: true, enumerable: true,
      get: function(){ return origSrcDesc.get ? origSrcDesc.get.call(this) : this.getAttribute('src')||''; },
      set: function(v){
        var r = __resolve(v);
        if(origSrcDesc.set) origSrcDesc.set.call(this, r); else this.setAttribute('src', r);
      }
    });
  }

  // Патчим audio/video
  ['HTMLAudioElement','HTMLVideoElement'].forEach(function(name){
    var proto = window[name] && window[name].prototype;
    if(!proto) return;
    var d = Object.getOwnPropertyDescriptor(proto, 'src') ||
            Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
    if(!d) return;
    Object.defineProperty(proto, 'src', {
      configurable: true, enumerable: true,
      get: function(){ return d.get ? d.get.call(this) : this.getAttribute('src')||''; },
      set: function(v){ var r=__resolve(v); if(d.set) d.set.call(this,r); else this.setAttribute('src',r); }
    });
  });

  // Патчим new Audio()
  var _NAudio = window.Audio;
  if(_NAudio) window.Audio = function(src){ return new _NAudio(__resolve(src||'')); };

  // Патчим fetch для относительных путей
  var _fetch = window.fetch;
  window.fetch = function(input, init){
    if(typeof input === 'string' && !input.startsWith('http') && !input.startsWith('blob:') && !input.startsWith('data:')){
      var r = __resolve(input);
      if(r !== input) return _fetch(r, init);
    }
    return _fetch(input, init);
  };

  // Патчим XMLHttpRequest
  var _XHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url){
    if(typeof url === 'string' && !url.startsWith('http') && !url.startsWith('blob:') && !url.startsWith('data:')){
      var r = __resolve(url);
      if(r !== url) return _XHROpen.call(this, method, r);
    }
    return _XHROpen.apply(this, arguments);
  };
})();
<\/script>`;
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head([^>]*)>/i, '<head$1>' + interceptScript);
    } else {
      html = interceptScript + html;
    }

    // Финальный HTML тоже data URL — iframe с null origin не читает blob:
    const encoder = new TextEncoder();
    const htmlBytes = encoder.encode(html);
    let htmlBinary = "";
    for (let i = 0; i < htmlBytes.length; i++) htmlBinary += String.fromCharCode(htmlBytes[i]);
    const htmlUrl = "data:text/html;base64," + btoa(htmlBinary);
    overlay._blobUrl = null;

    statusEl.style.display = "none";
    frameEl.style.display  = "block";
    frameEl.src = htmlUrl;

  } catch (err) {
    statusEl.textContent = "❌ " + err.message;
  }
}

function guessMime(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  const map = {
    html:"text/html", htm:"text/html",
    js:"application/javascript", mjs:"application/javascript",
    css:"text/css",
    png:"image/png", jpg:"image/jpeg", jpeg:"image/jpeg",
    gif:"image/gif", webp:"image/webp", svg:"image/svg+xml",
    mp3:"audio/mpeg", ogg:"audio/ogg", wav:"audio/wav",
    mp4:"video/mp4", webm:"video/webm",
    woff:"font/woff", woff2:"font/woff2", ttf:"font/ttf",
    json:"application/json", xml:"application/xml",
  };
  return map[ext] || "application/octet-stream";
}

function esc(str) {
  if (!str) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function formatGameDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ru-RU", { day:"numeric", month:"long", year:"numeric" });
}

function checkIsGiger() {
  const badge = document.getElementById("whoAmIGigers");
  return badge && badge.textContent.trim() !== "";
}

function showGameToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}

/* ------------------------------------------------------------------ */
/* ЗАГРУЗКА                                                             */
/* ------------------------------------------------------------------ */
async function resolveGameOwners(games) {
  if (!db || !games.length) return;
  const names = [...new Set(games.flatMap(g => [g.owner_name, g.author]).map(v => String(v || '').trim()).filter(Boolean))];
  if (!names.length) return;
  const { data, error } = await db.from(PROFILES_TABLE).select('owner_code, display_name').in('display_name', names);
  if (error || !data) return;
  const byName = new Map();
  for (const profile of data) {
    const name = String(profile.display_name || '').trim();
    if (!name) continue;
    const list = byName.get(name) || [];
    list.push(profile);
    byName.set(name, list);
  }
  for (const game of games) {
    if (game.owner_code) continue; // уже есть из БД — не перезаписываем
    for (const name of [game.owner_name, game.author].map(v => String(v || '').trim()).filter(Boolean)) {
      const matches = byName.get(name) || [];
      if (matches.length === 1) {
        game.owner_code = matches[0].owner_code;
        game.owner_name = matches[0].display_name;
        break;
      }
    }
  }
}

async function loadGames() {
  if (!db) return;
  galleryGames.innerHTML = "<div class='games-empty'>Загружаю игры...</div>";
  try {
    const gamesRes = await db.from(GAMES_TABLE)
      .select(`*, ${GAME_VERSIONS_TABLE}(*), ${GAME_TAGS_TABLE}(*), ${GAME_DOWNLOADS_TABLE}(count)`)
      .order("created_at", { ascending: false });
    if (gamesRes.error) throw gamesRes.error;

    allGames = (gamesRes.data || []).map(g => ({
      ...g,
      versions: (g[GAME_VERSIONS_TABLE] || [])
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
      tags: (g[GAME_TAGS_TABLE] || []).map(t => t.tag),
      downloadCount: Array.isArray(g[GAME_DOWNLOADS_TABLE])
        ? g[GAME_DOWNLOADS_TABLE].length
        : (g[GAME_DOWNLOADS_TABLE]?.count ?? 0),
    }));

    await resolveGameOwners(allGames);
    fillGameAuthorFilter();
    renderGames();
  } catch (e) {
    galleryGames.innerHTML = `<div class='games-empty'>Ошибка: ${e.message}</div>`;
  }
}

function fillGameAuthorFilter() {
  const sel = document.getElementById("gameAuthorFilter");
  if (!sel) return;
  const prev = sel.value || "all";
  const authors = new Map();
  allGames.forEach(g => { if (g.author) authors.set(g.author, g.author); });
  sel.innerHTML = `<option value="all">Все авторы</option>`;
  [...authors.keys()].sort((a, b) => a.localeCompare(b, "ru")).forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    sel.appendChild(opt);
  });
  sel.value = [...authors.keys()].includes(prev) || prev === "all" ? prev : "all";
}

/* ------------------------------------------------------------------ */
/* ТЕГ-ФИЛЬТР УБРАН — теги игр больше не показываются как разделы      */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* ПОИСК / ФИЛЬТР ИГРЫ                                                 */
/* ------------------------------------------------------------------ */
function applyGameFilters() {
  const raw = (searchInput?.value || "").trim().toLowerCase();
  gameSearchQuery = raw ? raw.split(",").map(t => t.trim().replace(/^#/, "")).filter(Boolean) : [];
  gameAuthorFilter = document.getElementById("gameAuthorFilter")?.value || "all";
  gameSortMode = document.getElementById("gameSortSelect")?.value || "date_desc";
  renderGames();
}

// Слушатели для фильтров игр в панели
(function() {
  const gaf = document.getElementById("gameAuthorFilter");
  const gss = document.getElementById("gameSortSelect");
  if (gaf) gaf.addEventListener("change", applyGameFilters);
  if (gss) gss.addEventListener("change", applyGameFilters);
})();

/* ------------------------------------------------------------------ */
/* РЕНДЕР КАРТОЧЕК                                                      */
/* ------------------------------------------------------------------ */
function autoVersionLabel(i) { return `v1.${i}`; }

function renderGames() {
  let games = allGames;

  // каждый токен из поисковой строки должен совпасть с названием, описанием ИЛИ каким-либо тегом
  if (gameSearchQuery.length) {
    games = games.filter(g =>
      gameSearchQuery.every(qt =>
        (g.title || "").toLowerCase().includes(qt) ||
        (g.description || "").toLowerCase().includes(qt) ||
        g.tags.some(t => t.toLowerCase().includes(qt))
      )
    );
  }

  // фильтр по автору
  if (gameAuthorFilter && gameAuthorFilter !== "all") {
    games = games.filter(g => g.author === gameAuthorFilter);
  }

  // сортировка
  switch (gameSortMode) {
    case "date_asc":
      games = [...games].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      break;
    case "name_asc":
      games = [...games].sort((a, b) => (a.title || "").localeCompare(b.title || "", "ru"));
      break;
    case "name_desc":
      games = [...games].sort((a, b) => (b.title || "").localeCompare(a.title || "", "ru"));
      break;
    case "downloads_desc":
      games = [...games].sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
      break;
    default: // date_desc
      games = [...games].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  if (typeof statusEl !== "undefined" && statusEl) {
    statusEl.textContent = gameSearchQuery.length || gameAuthorFilter !== "all"
      ? `Найдено игр: ${games.length}`
      : `Игр в галерее: ${games.length}`;
  }

  if (!games.length) {
    galleryGames.innerHTML = "<div class='games-empty'>🎮 " + (gameSearchQuery.length || gameAuthorFilter !== "all" ? "Ничего не найдено" : "Пока игр нет. Добавь первую!") + "</div>";
    return;
  }
  galleryGames.innerHTML = "";
  const isGiger = checkIsGiger();

  games.forEach(game => {
    const card = document.createElement("div");
    card.className = "game-card";

    const iconHtml = game.icon_url
      ? `<img class="game-icon" src="${esc(game.icon_url)}" alt="icon"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="game-icon-placeholder" style="display:none">🎮</div>`
      : `<div class="game-icon-placeholder">🎮</div>`;

    const tagsHtml = game.tags.length
      ? game.tags.map(t => `<span class="game-tag">#${esc(t)}</span>`).join("")
      : "";

    const isGameOwner = currentIdentity && (
      (game.owner_code && game.owner_code === currentIdentity.code) ||
      (!game.owner_code && (
        (game.owner_name && game.owner_name === currentIdentity.name) ||
        (game.author && game.author === currentIdentity.name)
      ))
    );

    const versionsHtml = game.versions.length
      ? game.versions.map((v, i) => {
          const dl = parseDriveUrl(v.drive_url);
          const delBtn = isGameOwner
            ? `<button class="game-ver-del" data-vid="${v.id}" title="Удалить версию">✕</button>`
            : "";
          const downloadBtn = game.no_remix
            ? ""
            : `<a class="game-download-btn" href="${dl}" data-game-id="${game.id}"
               download target="_blank">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 1v9M8 10l-3-3M8 10l3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 13h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Скачать
            </a>`;
          const playBtn = `<button class="game-play-btn" data-drive="${esc(v.drive_url)}" data-title="${esc(game.title)}">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <polygon points="3,1 15,8 3,15" fill="currentColor"/>
              </svg>
              Играть
            </button>`;
          return `<div class="game-version-row">
            <span class="game-ver-label">${autoVersionLabel(i)}</span>
            ${v.note ? `<span class="game-ver-note">${esc(v.note)}</span>` : ""}
            ${playBtn}
            ${downloadBtn}
            ${delBtn}
          </div>`;
        }).join("")
      : `<div class="game-no-versions">Нет версий</div>`;

    const addVerBtn = isGameOwner
      ? `<button class="game-add-ver-btn" data-gid="${game.id}">+ Добавить версию</button>`
      : "";

    const delGameBtn = isGameOwner
      ? `<button class="game-delete-btn" data-id="${game.id}" title="Удалить">🗑️</button>`
      : "";
    const editGameBtn = isGameOwner
      ? `<button class="game-edit-btn" data-id="${game.id}" title="Редактировать">✏️</button>`
      : "";

    card.innerHTML = `
      <div class="game-card-header">
        ${iconHtml}
        <div class="game-card-meta">
          <div class="game-title">${esc(game.title)}</div>
          <div class="game-author">by ${esc(game.author || "Бурундук")}</div>
          <div class="game-meta-row">
            <span class="game-meta-date">📅 ${formatGameDate(game.created_at)}</span>
            <span class="game-meta-downloads">⬇️ ${game.downloadCount}</span>
            ${game.no_remix ? `<span class="game-no-remix-badge" title="Автор запретил скачивание">🔒 без ремиксов</span>` : ""}
          </div>
        </div>
        <div class="game-card-actions">
          ${editGameBtn}
          ${delGameBtn}
        </div>
      </div>
      ${game.description ? `<div class="game-desc">${esc(game.description)}</div>` : ""}
      ${tagsHtml ? `<div class="game-tags-row">${tagsHtml}</div>` : ""}
      <div class="game-versions-block">
        <div class="game-versions-title">Версии</div>
        ${versionsHtml}
        ${addVerBtn}
      </div>
      <div class="game-comments-block" id="gameComments_${game.id}">
        <button class="game-comments-toggle" data-gid="${game.id}">
          💬 Комментарии <span class="game-comments-count" id="gameComCount_${game.id}"></span>
        </button>
        <div class="game-comments-body hidden" id="gameCommentsBody_${game.id}">
          <div class="game-comments-list" id="gameComList_${game.id}"></div>
          <div class="comment-reply-hint hidden" id="gameReplyHint_${game.id}">
            Ответ для <b id="gameReplyHintName_${game.id}"></b>
            <button type="button" class="comment-reply-cancel game-reply-cancel" data-gid="${game.id}" title="Отменить ответ">✕</button>
          </div>
          <div class="game-comment-form">
            <textarea class="modal-input modal-textarea rating-comment-input game-comment-input"
              id="gameComInput_${game.id}" placeholder="Написать комментарий..."></textarea>

            <div class="giger-gift-box game-giger-box" id="gameGigerBox_${game.id}">
              <label class="giger-gift-toggle game-giger-toggle">
                <input type="checkbox" id="gameGigerCheckbox_${game.id}">
                <img src="assets/giperzadka.png" class="giger-gift-icon" alt="гиперзадка">
                <span>Подарить гиперзадку автору</span>
              </label>
            </div>

            <button class="pick-btn small game-comment-submit" data-gid="${game.id}">Отправить</button>
          </div>
        </div>
      </div>
    `;

    // события
    card.querySelectorAll(".game-ver-del").forEach(btn =>
      btn.addEventListener("click", () => deleteGameVersion(btn.dataset.vid)));
    card.querySelectorAll(".game-add-ver-btn").forEach(btn =>
      btn.addEventListener("click", () => openAddVersionModal(btn.dataset.gid, game.title)));
    const dgb = card.querySelector(".game-delete-btn");
    if (dgb) dgb.addEventListener("click", () => deleteGame(game.id));
    const egb = card.querySelector(".game-edit-btn");
    if (egb) egb.addEventListener("click", () => openEditGameModal(game));

    // счётчик скачиваний
    card.querySelectorAll(".game-play-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        openGamePlayer(btn.dataset.drive, btn.dataset.title);
      });
    });

    card.querySelectorAll(".game-download-btn").forEach(a => {
      a.addEventListener("click", () => registerGameDownload(a.dataset.gameId));
    });

    // комментарии
    const toggleBtn = card.querySelector(".game-comments-toggle");
    toggleBtn.addEventListener("click", () => toggleGameComments(game.id));

    const submitBtn = card.querySelector(".game-comment-submit");
    submitBtn.addEventListener("click", () => submitGameComment(game.id));

    const replyCancelBtn = card.querySelector(".game-reply-cancel");
    if (replyCancelBtn) {
      replyCancelBtn.addEventListener("click", () => setGameReplyTarget(game.id, null));
    }

    const gameGigerCheckbox = card.querySelector(`#gameGigerCheckbox_${game.id}`);
    if (gameGigerCheckbox) {
      gameGigerCheckbox.addEventListener("change", (e) => {
        if (!e.target.checked && gigerRemoveSound) {
          gigerRemoveSound.currentTime = 0;
          gigerRemoveSound.play().catch(() => {});
        }
      });
    }

    galleryGames.appendChild(card);

    // рейтинг — строим после добавления в DOM
    // загружаем счётчик комментов и состояние гиперзадки
    loadGameCommentsCount(game.id);
    loadGameGigerState(game);
  });
}

/* ------------------------------------------------------------------ */
/* СКАЧИВАНИЯ                                                           */
/* ------------------------------------------------------------------ */
async function registerGameDownload(gameId) {
  if (!gameId || !db) return;
  try {
    await db.from(GAME_DOWNLOADS_TABLE).insert({ game_id: gameId });
    // обновляем счётчик на карточке
    const el = document.querySelector(`.game-meta-downloads[data-gid="${gameId}"]`);
    // проще — перезагрузим тихо
    const { data } = await db.from(GAME_DOWNLOADS_TABLE).select("count").eq("game_id", gameId).single();
    const countEl = document.querySelector(`[data-game-id="${gameId}"]`)?.closest(".game-card")
      ?.querySelector(".game-meta-downloads");
    if (countEl && data) countEl.textContent = "⬇️ " + (data.count ?? "");
  } catch {}
}

/* ------------------------------------------------------------------ */
/* КОММЕНТАРИИ                                                          */
/* ------------------------------------------------------------------ */
async function loadGameCommentsCount(gameId) {
  if (!db) return;
  const { count } = await db.from(GAME_COMMENTS_TABLE)
    .select("*", { count: "exact", head: true })
    .eq("game_id", gameId);
  const el = document.getElementById(`gameComCount_${gameId}`);
  if (el) el.textContent = count ? `(${count})` : "";
}

async function toggleGameComments(gameId) {
  const body = document.getElementById(`gameCommentsBody_${gameId}`);
  if (!body) return;
  const opening = body.classList.contains("hidden");
  body.classList.toggle("hidden", !opening);
  if (opening) await loadGameComments(gameId);
}

function setGameReplyTarget(gameId, comment) {
  commentReplyTarget.game[gameId] = comment
    ? { id: comment.id, name: comment.author_name || "аноним" }
    : null;

  const hint = document.getElementById(`gameReplyHint_${gameId}`);
  const hintName = document.getElementById(`gameReplyHintName_${gameId}`);
  const input = document.getElementById(`gameComInput_${gameId}`);

  if (comment) {
    if (hintName) hintName.textContent = comment.author_name || "аноним";
    if (hint) hint.classList.remove("hidden");
  } else {
    if (hint) hint.classList.add("hidden");
  }
  if (input) input.focus();
}

async function loadGameComments(gameId) {
  const list = document.getElementById(`gameComList_${gameId}`);
  if (!list || !db) return;

  list.innerHTML = "<div class='game-comments-loading'>Загружаю...</div>";
  const { data, error } = await db.from(GAME_COMMENTS_TABLE)
    .select("*")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    list.innerHTML = "";
    return;
  }
  if (!data.length) {
    list.innerHTML = "<div class='game-comments-empty'>Комментариев пока нет</div>";
    return;
  }

  const { data: gifts } = await db
    .from("burunduk_game_giger_gifts")
    .select("game_comment_id")
    .eq("game_id", gameId);

  const gifted = new Set((gifts || []).map(g => g.game_comment_id).filter(Boolean));
  const byId = new Map(data.map(c => [c.id, c]));

  list.innerHTML = data.map(c => {
    const isGifted = gifted.has(c.id);
    const parent = c.reply_to_id ? byId.get(c.reply_to_id) : null;
    const replyTag = parent
      ? `<div class="comment-reply-tag">→ ${escapeHtml(truncateName(parent.author_name, 15))}</div>`
      : "";

    return `
      <div class="game-comment-item${c.reply_to_id ? " comment-item-reply" : ""}${isGifted ? " comment-item-gifted" : ""}">
        <div class="game-comment-head">
          <span class="online-dot" data-online-for="${c.author_code || ""}"></span>
          <span class="game-comment-author comment-author" title="${escapeHtml(c.author_name || "аноним")}">${escapeHtml(truncateName(c.author_name, 15))}</span>
          ${isGifted ? `<span class="comment-gift-badge" title="Подарил гиперзадку"><img src="assets/giperzadka.png" alt=""></span>` : ""}
          <span class="game-comment-time comment-time">${timeAgo(c.created_at)}</span>
        </div>
        ${replyTag}
        <div class="game-comment-text comment-text">${escapeHtml(c.text || "").replace(/\n/g,"<br>")}</div>
        ${c.edited_at ? `<span class="comment-edited">(изменено)</span>` : ""}
        <div class="comment-actions">
          <button type="button" class="comment-reply-btn game-comment-reply" data-cid="${c.id}" data-gid="${gameId}">Ответить</button>
          ${currentIdentity && c.author_code === currentIdentity.code
            ? `<button type="button" class="game-comment-edit" data-cid="${c.id}" data-gid="${gameId}">✏️</button><button type="button" class="game-comment-del" data-cid="${c.id}" data-gid="${gameId}">🗑️</button>`
            : ""}
        </div>
      </div>
    `;
  }).join("");

  list.querySelectorAll(".game-comment-reply").forEach(btn => {
    btn.addEventListener("click", () => {
      const c = data.find(x => String(x.id) === String(btn.dataset.cid));
      if (c) setGameReplyTarget(gameId, c);
    });
  });

  list.querySelectorAll(".game-comment-edit").forEach(btn => btn.addEventListener("click", () => {
    const c = data.find(x => String(x.id) === String(btn.dataset.cid));
    if (!c || !currentIdentity || c.author_code !== currentIdentity.code) return;
    openCommentEditModal("game", c);
  }));

  list.querySelectorAll(".game-comment-del").forEach(btn => btn.addEventListener("click", async () => {
    if (!currentIdentity || !confirm("Удалить этот комментарий?")) return;
    const { error: deleteError } = await db.from(GAME_COMMENTS_TABLE)
      .delete()
      .eq("id", btn.dataset.cid)
      .eq("author_code", currentIdentity.code);

    if (deleteError) showGameToast("Ошибка: " + deleteError.message);

    // Если удаляли комментарий, на который кто-то отвечал, reply_to_id
    // у ответов автоматически станет NULL благодаря ON DELETE SET NULL.
    if (commentReplyTarget.game[btn.dataset.gid]?.id === Number(btn.dataset.cid)) {
      setGameReplyTarget(btn.dataset.gid, null);
    }
    loadGameComments(btn.dataset.gid);
    loadGameCommentsCount(btn.dataset.gid);
  }));

  applyOnlinePresence();
}

async function loadGameGigerState(game) {
  const box = document.getElementById(`gameGigerBox_${game.id}`);
  const checkbox = document.getElementById(`gameGigerCheckbox_${game.id}`);
  if (!box || !checkbox) return;
  checkbox.checked = false;
  box.classList.remove("hidden");
  if (!currentIdentity) return;
  if (game.owner_code && game.owner_code === currentIdentity.code) {
    box.classList.add("hidden");
    return;
  }
  const { data } = await db.from("burunduk_game_giger_gifts").select("id").eq("game_id", game.id).eq("giver_code", currentIdentity.code).maybeSingle();
  if (data) box.classList.add("hidden");
}

async function submitGameComment(gameId) {
  const input = document.getElementById(`gameComInput_${gameId}`);
  const checkbox = document.getElementById(`gameGigerCheckbox_${gameId}`);
  if (!input) return;

  const text = input.value.trim();
  if (!text) {
    showGameToast("Напиши что-нибудь для комментария");
    return;
  }

  const identity = currentIdentity || getIdentity();
  if (!identity) {
    ensureIdentity();
    return;
  }

  const game = allGames.find(g => String(g.id) === String(gameId));
  if (!game) return;

  const replyTarget = commentReplyTarget.game[gameId] || null;

  const { data: insertedComment, error } = await db
    .from(GAME_COMMENTS_TABLE)
    .insert({
      game_id: gameId,
      text,
      author_name: identity.name,
      author_code: identity.code,
      reply_to_id: replyTarget ? replyTarget.id : null,
    })
    .select()
    .single();

  if (error) {
    showGameToast("Ошибка: " + error.message);
    return;
  }

  if (checkbox && checkbox.checked && game.owner_code && game.owner_code !== identity.code) {
    const { data: gifted, error: giftErr } = await db.rpc("game_giger_gift", {
      p_game_id: gameId,
      p_game_comment_id: insertedComment.id,
      p_giver_code: identity.code,
      p_giver_name: identity.name,
      p_owner_code: game.owner_code,
      p_owner_name: game.owner_name || game.author || "Бурундук"
    });

    if (giftErr || gifted === false) {
      showGameToast(
        giftErr
          ? "Комментарий отправлен, но гиперзадку подарить не удалось"
          : "У тебя нет гиперзадок 😔"
      );
    } else {
      showGameToast("Комментарий отправлен, гиперзадка подарена 🎁");
    }
  } else {
    showGameToast("Комментарий отправлен 💬");
  }

  input.value = "";
  if (checkbox) checkbox.checked = false;
  setGameReplyTarget(gameId, null);
  loadGameComments(gameId);
  loadGameCommentsCount(gameId);
  loadGameGigerState(game);
}

/* ------------------------------------------------------------------ */
/* УДАЛЕНИЕ                                                             */
/* ------------------------------------------------------------------ */
async function deleteGame(id) {
  if (!currentIdentity) { showGameToast("Нужно войти"); return; }
  const { data: g } = await db.from(GAMES_TABLE).select("owner_code").eq("id", id).maybeSingle();
  if (g && g.owner_code && g.owner_code !== currentIdentity.code) { showGameToast("Только автор может удалить игру"); return; }
  if (!confirm("Удалить игру и все её данные?")) return;
  await db.from(GAME_VERSIONS_TABLE).delete().eq("game_id", id);
  await db.from(GAME_COMMENTS_TABLE).delete().eq("game_id", id);
  await db.from(GAME_TAGS_TABLE).delete().eq("game_id", id);
  await db.from(GAME_DOWNLOADS_TABLE).delete().eq("game_id", id);
  const { error } = await db.from(GAMES_TABLE).delete().eq("id", id);
  if (!error) loadGames(); else showGameToast("Ошибка: " + error.message);
}

async function deleteGameVersion(vid) {
  if (!confirm("Удалить версию?")) return;
  const { error } = await db.from(GAME_VERSIONS_TABLE).delete().eq("id", vid);
  if (!error) loadGames(); else showGameToast("Ошибка: " + error.message);
}

/* ------------------------------------------------------------------ */
/* МОДАЛ: ДОБАВЛЕНИЕ ИГРЫ                                              */
/* ------------------------------------------------------------------ */
let pickedGameIcon = null;
let pickedGameIconGalleryUrl = null;

const gameModal       = document.getElementById("gameModal");
const gameModalCancel = document.getElementById("gameModalCancel");
const gameModalSave   = document.getElementById("gameModalSave");
const gameIconFileInput = document.getElementById("gameIconFileInput");
const gameIconPreview   = document.getElementById("gameIconPreview");
const gameIconPickBtn   = document.getElementById("gameIconPickBtn");
const gameIconGalleryBtn = document.getElementById("gameIconGalleryBtn");

if (uploadGameBtn) {
  uploadGameBtn.addEventListener("click", () => {
    ["gameTitle","gameDesc","gameAuthor","gameFirstVerUrl","gameFirstVerNote","gameTags"]
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
    pickedGameIcon = null;
    pickedGameIconGalleryUrl = null;
    if (gameIconPreview) { gameIconPreview.src = ""; gameIconPreview.classList.add("hidden"); }
    if (gameIconPickBtn) gameIconPickBtn.textContent = "📁 Из файлов";
    gameModal.classList.add("active");
  });
}

if (gameIconPickBtn) gameIconPickBtn.addEventListener("click", () => gameIconFileInput && gameIconFileInput.click());

if (gameIconFileInput) {
  gameIconFileInput.addEventListener("change", () => {
    const file = gameIconFileInput.files[0];
    if (!file) return;
    pickedGameIcon = file;
    pickedGameIconGalleryUrl = null;
    if (gameIconPreview) { gameIconPreview.src = URL.createObjectURL(file); gameIconPreview.classList.remove("hidden"); }
    if (gameIconPickBtn) gameIconPickBtn.textContent = "✅ " + file.name;
    gameIconFileInput.value = "";
  });
}

if (gameIconGalleryBtn) gameIconGalleryBtn.addEventListener("click", () => openPhotoPicker(url => {
  pickedGameIcon = null;
  pickedGameIconGalleryUrl = url;
  if (gameIconPreview) { gameIconPreview.src = url; gameIconPreview.classList.remove("hidden"); }
  if (gameIconPickBtn) gameIconPickBtn.textContent = "📁 Из файлов";
}));

if (gameModalCancel) gameModalCancel.addEventListener("click", () => gameModal.classList.remove("active"));
if (gameModal) gameModal.addEventListener("click", e => { if (e.target === gameModal && !isTextSelected()) gameModal.classList.remove("active"); });

if (gameModalSave) {
  gameModalSave.addEventListener("click", async () => {
    const title      = document.getElementById("gameTitle").value.trim();
    const firstVerUrl = document.getElementById("gameFirstVerUrl").value.trim();
    if (!title)       { showGameToast("Введи название"); return; }
    if (!firstVerUrl) { showGameToast("Добавь ссылку на первую версию"); return; }

    gameModalSave.disabled = true;
    gameModalSave.textContent = "Сохраняю...";

    // загрузка иконки
    let iconUrl = pickedGameIconGalleryUrl || null;
    if (pickedGameIcon) {
      const ext  = pickedGameIcon.name.split(".").pop();
      const path = `game-icons/${Date.now()}.${ext}`;
      const { error: upErr } = await db.storage.from(BUCKET_NAME).upload(path, pickedGameIcon, { cacheControl: "3600", upsert: false });
      if (!upErr) {
        const { data: pub } = db.storage.from(BUCKET_NAME).getPublicUrl(path);
        iconUrl = pub.publicUrl;
      }
    }

    const whoAmI     = document.getElementById("whoAmI");
    const authorInput = document.getElementById("gameAuthor").value.trim();
    const author     = authorInput || (whoAmI ? whoAmI.textContent.trim() : "Бурундук");

    const noRemix = document.getElementById("gameNoRemix")?.checked || false;

    const { data: newGame, error: gameErr } = await db.from(GAMES_TABLE).insert([{
      title,
      description: document.getElementById("gameDesc").value.trim() || null,
      author: author || "Бурундук",
      owner_code: currentIdentity ? currentIdentity.code : null,
      owner_name: currentIdentity ? currentIdentity.name : (author || "Бурундук"),
      icon_url: iconUrl,
      no_remix: noRemix,
    }]).select().single();

    if (gameErr) {
      showGameToast("Ошибка: " + gameErr.message);
      gameModalSave.disabled = false;
      gameModalSave.textContent = "Добавить";
      return;
    }

    // первая версия
    const note = document.getElementById("gameFirstVerNote").value.trim() || null;
    await db.from(GAME_VERSIONS_TABLE).insert([{ game_id: newGame.id, drive_url: firstVerUrl, note }]);

    // теги
    const rawTags = document.getElementById("gameTags").value.trim();
    if (rawTags) {
      const tags = rawTags.split(",").map(t => t.trim().replace(/^#/, "").toLowerCase()).filter(Boolean).slice(0, 8);
      if (tags.length) {
        await db.from(GAME_TAGS_TABLE).insert(tags.map(tag => ({ game_id: newGame.id, tag })));
      }
    }

    // гиперзадки
    if (currentIdentity) {
      await db.rpc("giger_add", { p_code: currentIdentity.code, p_name: currentIdentity.name, p_delta: 5 });
      refreshMyGigerBalance();
    }

    gameModal.classList.remove("active");
    gameModalSave.disabled = false;
    gameModalSave.textContent = "Добавить";
    showGameToast("Игра добавлена! +5 гиперзадок 🎮");
    loadGames();
  });
}

/* ------------------------------------------------------------------ */
/* МОДАЛ: ДОБАВЛЕНИЕ ВЕРСИИ                                            */
/* ------------------------------------------------------------------ */
const addVerModal       = document.getElementById("addVerModal");
const addVerModalCancel = document.getElementById("addVerModalCancel");
const addVerModalSave   = document.getElementById("addVerModalSave");
let addVerGameId = null;

function openAddVersionModal(gameId, gameTitle) {
  addVerGameId = gameId;
  const titleEl = document.getElementById("addVerModalTitle");
  if (titleEl) titleEl.textContent = "Новая версия: " + gameTitle;
  const urlEl = document.getElementById("addVerUrl"); if (urlEl) urlEl.value = "";
  const noteEl = document.getElementById("addVerNote"); if (noteEl) noteEl.value = "";
  addVerModal.classList.add("active");
}

if (addVerModalCancel) addVerModalCancel.addEventListener("click", () => addVerModal.classList.remove("active"));
if (addVerModal) addVerModal.addEventListener("click", e => { if (e.target === addVerModal && !isTextSelected()) addVerModal.classList.remove("active"); });

if (addVerModalSave) {
  addVerModalSave.addEventListener("click", async () => {
    const url = document.getElementById("addVerUrl").value.trim();
    if (!url) { showGameToast("Введи ссылку"); return; }
    addVerModalSave.disabled = true;
    const note = document.getElementById("addVerNote").value.trim() || null;
    const { error } = await db.from(GAME_VERSIONS_TABLE).insert([{ game_id: addVerGameId, drive_url: url, note }]);
    addVerModalSave.disabled = false;
    if (error) { showGameToast("Ошибка: " + error.message); return; }
    addVerModal.classList.remove("active");
    showGameToast("Версия добавлена!");
    loadGames();
  });
}

/* ------------------------------------------------------------------ */
/* ПОИСК ИГР — события                                                 */
/* ------------------------------------------------------------------ */
(function() {
  const gaf = document.getElementById("gameAuthorFilter");
  if (gaf) gaf.addEventListener("change", applyGameFilters);
})();

/* ------------------------------------------------------------------ */
/* МОДАЛ: РЕДАКТИРОВАНИЕ ИГРЫ                                          */
/* ------------------------------------------------------------------ */
let editGameId = null;
let editGameCurrentIconUrl = null;
let pickedEditGameIcon = null;
let pickedEditGameIconGalleryUrl = null;

const editGameModal       = document.getElementById("editGameModal");
const editGameModalCancel = document.getElementById("editGameModalCancel");
const editGameModalSave   = document.getElementById("editGameModalSave");
const editGameIconFileInput = document.getElementById("editGameIconFileInput");
const editGameIconPreview   = document.getElementById("editGameIconPreview");
const editGameIconPickBtn   = document.getElementById("editGameIconPickBtn");
const editGameIconGalleryBtn = document.getElementById("editGameIconGalleryBtn");

function openEditGameModal(game) {
  const codeMatch = currentIdentity && game.owner_code && game.owner_code === currentIdentity.code;
  const nameMatch = currentIdentity && !game.owner_code && (
    (game.owner_name && game.owner_name === currentIdentity.name) ||
    (game.author && game.author === currentIdentity.name)
  );
  if (!currentIdentity || (!codeMatch && !nameMatch)) {
    showGameToast("Только автор может редактировать игру");
    return;
  }
  editGameId = game.id;
  editGameCurrentIconUrl = game.icon_url || null;
  pickedEditGameIcon = null;
  pickedEditGameIconGalleryUrl = null;

  document.getElementById("editGameTitle").value = game.title || "";
  document.getElementById("editGameDesc").value = game.description || "";
  document.getElementById("editGameAuthor").value = game.author || "";
  document.getElementById("editGameTags").value = game.tags.join(", ");

  if (editGameIconPreview) {
    if (editGameCurrentIconUrl) {
      editGameIconPreview.src = editGameCurrentIconUrl;
      editGameIconPreview.classList.remove("hidden");
    } else {
      editGameIconPreview.src = "";
      editGameIconPreview.classList.add("hidden");
    }
  }
  if (editGameIconPickBtn) editGameIconPickBtn.textContent = "📁 Из файлов";
  if (editGameModal) editGameModal.classList.add("active");
}

if (editGameIconPickBtn) editGameIconPickBtn.addEventListener("click", () => editGameIconFileInput && editGameIconFileInput.click());

if (editGameIconFileInput) {
  editGameIconFileInput.addEventListener("change", () => {
    const file = editGameIconFileInput.files[0];
    if (!file) return;
    pickedEditGameIcon = file;
    pickedEditGameIconGalleryUrl = null;
    if (editGameIconPreview) { editGameIconPreview.src = URL.createObjectURL(file); editGameIconPreview.classList.remove("hidden"); }
    if (editGameIconPickBtn) editGameIconPickBtn.textContent = "✅ " + file.name;
    editGameIconFileInput.value = "";
  });
}

if (editGameIconGalleryBtn) editGameIconGalleryBtn.addEventListener("click", () => openPhotoPicker(url => {
  pickedEditGameIcon = null;
  pickedEditGameIconGalleryUrl = url;
  if (editGameIconPreview) { editGameIconPreview.src = url; editGameIconPreview.classList.remove("hidden"); }
  if (editGameIconPickBtn) editGameIconPickBtn.textContent = "📁 Из файлов";
}));

if (editGameModalCancel) editGameModalCancel.addEventListener("click", () => editGameModal.classList.remove("active"));
if (editGameModal) editGameModal.addEventListener("click", e => { if (e.target === editGameModal && !isTextSelected()) editGameModal.classList.remove("active"); });

if (editGameModalSave) {
  editGameModalSave.addEventListener("click", async () => {
    const title = document.getElementById("editGameTitle").value.trim();
    if (!title) { showGameToast("Введи название"); return; }

    editGameModalSave.disabled = true;
    editGameModalSave.textContent = "Сохраняю...";

    // загрузка новой иконки если выбрана
    let iconUrl = pickedEditGameIconGalleryUrl || editGameCurrentIconUrl;
    if (pickedEditGameIcon) {
      const ext = pickedEditGameIcon.name.split(".").pop();
      const path = `game-icons/${Date.now()}.${ext}`;
      const { error: upErr } = await db.storage.from(BUCKET_NAME).upload(path, pickedEditGameIcon, { cacheControl: "3600", upsert: false });
      if (!upErr) {
        const { data: pub } = db.storage.from(BUCKET_NAME).getPublicUrl(path);
        iconUrl = pub.publicUrl;
      }
    }

    // обновляем основные поля игры
    const { error: updateErr } = await db.from(GAMES_TABLE).update({
      title,
      description: document.getElementById("editGameDesc").value.trim() || null,
      author: document.getElementById("editGameAuthor").value.trim() || "Бурундук",
      icon_url: iconUrl,
    }).eq("id", editGameId);

    if (updateErr) {
      showGameToast("Ошибка: " + updateErr.message);
      editGameModalSave.disabled = false;
      editGameModalSave.textContent = "Сохранить";
      return;
    }

    // пересохраняем теги: удаляем старые, вставляем новые
    await db.from(GAME_TAGS_TABLE).delete().eq("game_id", editGameId);
    const rawTags = document.getElementById("editGameTags").value.trim();
    if (rawTags) {
      const tags = rawTags.split(",").map(t => t.trim().replace(/^#/, "").toLowerCase()).filter(Boolean).slice(0, 8);
      if (tags.length) {
        await db.from(GAME_TAGS_TABLE).insert(tags.map(tag => ({ game_id: editGameId, tag })));
      }
    }

    editGameModal.classList.remove("active");
    editGameModalSave.disabled = false;
    editGameModalSave.textContent = "Сохранить";
    showGameToast("Игра обновлена! ✅");
    loadGames();
  });
}

/* ==================================================================
   КОД ВХОДА — welcome модалка, кнопка 🔑, привязка email, вход по коду
   ================================================================== */

// Welcome-модалка
if (welcomeCodeCopy) {
  welcomeCodeCopy.addEventListener("click", () => {
    navigator.clipboard.writeText(welcomeCodeValue.textContent).then(() => showToast("Код скопирован!"));
  });
}
if (welcomeCodeClose) {
  welcomeCodeClose.addEventListener("click", () => welcomeCodeModal.classList.remove("active"));
}

// Кнопка 🔑
if (myCodeBtn) {
  myCodeBtn.addEventListener("click", () => {
    if (!currentIdentity) { showToast("Сначала войди в аккаунт"); return; }
    myCodeHidden.style.display = "";
    myCodeVisible.style.display = "none";
    emailBindStatus.textContent = "";
    if (db) {
      db.from(PROFILES_TABLE).select("email").eq("owner_code", currentIdentity.code).maybeSingle().then(({ data }) => {
        emailBindInput.value = data && data.email ? data.email : "";
        if (data && data.email) {
          emailBindStatus.textContent = `✅ Привязан: ${data.email}`;
          emailBindStatus.style.color = "var(--accent, #6fcf97)";
        }
      });
    }
    myCodeModal.classList.add("active");
  });
}

if (showMyCodeBtn) {
  showMyCodeBtn.addEventListener("click", () => {
    if (!confirm("Не показывай этот код другим — он даёт полный доступ к аккаунту. Показать?")) return;
    myCodeValue.textContent = currentIdentity.code;
    myCodeHidden.style.display = "none";
    myCodeVisible.style.display = "";
  });
}

if (myCodeCopy) {
  myCodeCopy.addEventListener("click", () => {
    navigator.clipboard.writeText(myCodeValue.textContent).then(() => showToast("Код скопирован!"));
  });
}

if (myCodeClose) {
  myCodeClose.addEventListener("click", () => myCodeModal.classList.remove("active"));
}

// Привязать email через кнопку 🔑
if (emailBindSave) {
  emailBindSave.addEventListener("click", async () => {
    if (!currentIdentity || !db) return;
    const email = emailBindInput.value.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      emailBindStatus.textContent = "Введи корректный email";
      emailBindStatus.style.color = "var(--danger, #eb5757)";
      return;
    }
    emailBindStatus.textContent = "Сохраняю...";
    emailBindStatus.style.color = "";
    const { error } = await db.from(PROFILES_TABLE).update({ email }).eq("owner_code", currentIdentity.code);
    if (error) {
      emailBindStatus.textContent = error.code === "23505"
        ? "❌ Этот email уже привязан к другому аккаунту"
        : "❌ Ошибка: " + error.message;
      emailBindStatus.style.color = "var(--danger, #eb5757)";
    } else {
      emailBindStatus.textContent = `✅ Привязан: ${email}`;
      emailBindStatus.style.color = "var(--accent, #6fcf97)";
      showToast("Email привязан!");
    }
  });
}

// Вход по коду (экран 4 в модалке входа)
if (restoreCodeBtn) {
  restoreCodeBtn.addEventListener("click", async () => {
    const code = restoreCodeInput.value.trim();
    if (!code) { if (codeError) { codeError.textContent = "Вставь свой код"; codeError.style.display = ""; } return; }
    if (!db) return;
    const { data } = await db.from(PROFILES_TABLE).select("owner_code, display_name").eq("owner_code", code).maybeSingle();
    if (!data) {
      if (codeError) { codeError.textContent = "Аккаунт с таким кодом не найден"; codeError.style.display = ""; }
      return;
    }
    if (codeError) codeError.style.display = "none";
    const restored = { name: data.display_name || "—", code: data.owner_code };
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(restored));
    currentIdentity = restored;
    if (restoreCodeInput) restoreCodeInput.value = "";
    nameModal.classList.remove("active");
    showToast("✅ Вошёл в аккаунт!");
    refreshWhoAmI();
    refreshMyGigerBalance();
    refreshActivityBadge();
    subscribeActivityRealtime();
    subscribeSitePresence();
    unlockedKurymdykSet = null;
    unlockedKurymdykForCode = null;
    await Promise.all([loadPhotos(), loadVideos()]);
  });
}
/* ════════════════════════════════════════════════════════════
   АУДИО РАЗДЕЛ
   ════════════════════════════════════════════════════════════ */

let allAudioRecords  = [];
let currentAudioList = [];
let currentAudioRecord = null;
let currentAudioIndex  = 0;
let currentAudioVoiceTracks = [];
let currentAudioVoiceId = "original";
let pickedAudioVoiceFile = null;

/* ── DOM refs ── */

const audioLightbox    = document.getElementById("audioLightbox");
const audioLbClose     = document.getElementById("audioLightboxClose");
const audioLbTitle     = document.getElementById("audioLbTitle");
const audioLbAuthor    = document.getElementById("audioLbAuthor");
const audioLbDate      = document.getElementById("audioLbDate");
const audioLbDesc      = document.getElementById("audioLbDesc");
const audioLbCover     = document.getElementById("audioLbCover");
const audioLbCoverFb   = document.getElementById("audioLbCoverFallback");
const audioLbPrevBtn   = document.getElementById("audioLbPrevBtn");
const audioLbNextBtn   = document.getElementById("audioLbNextBtn");
const audioLbTools     = document.getElementById("audioLbTools");
const audioLbEditBtn   = document.getElementById("audioLbEditBtn");
const audioLbDeleteBtn = document.getElementById("audioLbDeleteBtn");
const audioWaveCanvas  = document.getElementById("audioWaveCanvas");
const audioWaveProgress= document.getElementById("audioWaveProgress");
const audioWaveCursor  = document.getElementById("audioWaveCursor");
const audioWaveContainer=document.getElementById("audioWaveContainer");
const audioPlayBtn     = document.getElementById("audioPlayBtn");
const audioPlayIcon    = document.getElementById("audioPlayIcon");
const audioPauseIcon   = document.getElementById("audioPauseIcon");
const audioRewind10    = document.getElementById("audioRewind10");
const audioForward10   = document.getElementById("audioForward10");
const audioCurTime     = document.getElementById("audioCurTime");
const audioDurTime     = document.getElementById("audioDurTime");
const audioVolume      = document.getElementById("audioVolume");
const audioSpeedBtn    = document.getElementById("audioSpeedBtn");
const audioLoopBtn     = document.getElementById("audioLoopBtn");
const audioPipBtn      = document.getElementById("audioPipBtn");
let audioLoopEnabled = false;
const audioModal       = document.getElementById("audioModal");
const audioFileInput   = document.getElementById("audioFileInput");
const audioFileDrop    = document.getElementById("audioFileDrop");
const audioFilePickText= document.getElementById("audioFilePickText");
const audioCoverFileInput=document.getElementById("audioCoverFileInput");
const audioCoverPickBtn= document.getElementById("audioCoverPickBtn");
const audioCoverGalleryBtn = document.getElementById("audioCoverGalleryBtn");
const audioCoverPreview= document.getElementById("audioCoverPreview");
let selectedAudioCoverGalleryUrl = null;
const audioTitleInput  = document.getElementById("audioTitle");
const audioDescInput   = document.getElementById("audioDesc");
const audioModalCancel = document.getElementById("audioModalCancel");
const audioModalSave   = document.getElementById("audioModalSave");
const audioUploadProgress=document.getElementById("audioUploadProgress");
const audioProgressFill= document.getElementById("audioProgressFill");
const audioProgressLabel=document.getElementById("audioProgressLabel");
const editAudioModal   = document.getElementById("editAudioModal");
const editAudioTitle   = document.getElementById("editAudioTitle");
const editAudioDesc    = document.getElementById("editAudioDesc");
const editAudioCancel  = document.getElementById("editAudioCancel");
const editAudioSave    = document.getElementById("editAudioSave");
const editAudioCoverPreview = document.getElementById("editAudioCoverPreview");
const editAudioCoverFileBtn = document.getElementById("editAudioCoverFileBtn");
const editAudioCoverGalleryBtn = document.getElementById("editAudioCoverGalleryBtn");
const editAudioCoverFileInput = document.getElementById("editAudioCoverFileInput");
let pickedEditAudioCoverFile = null;
let selectedEditAudioCoverUrl = null;
let editAudioCoverChanged = false;
if (editAudioCoverFileBtn) editAudioCoverFileBtn.addEventListener("click", () => editAudioCoverFileInput?.click());
if (editAudioCoverFileInput) editAudioCoverFileInput.addEventListener("change", () => {
  const file = editAudioCoverFileInput.files?.[0];
  editAudioCoverFileInput.value = "";
  if (!file) return;
  if (!file.type.startsWith("image/")) { showToast("Выбери файл изображения"); return; }
  pickedEditAudioCoverFile = file;
  selectedEditAudioCoverUrl = null;
  editAudioCoverChanged = true;
  if (editAudioCoverPreview) { editAudioCoverPreview.src = URL.createObjectURL(file); editAudioCoverPreview.classList.remove("hidden"); }
});
if (editAudioCoverGalleryBtn) editAudioCoverGalleryBtn.addEventListener("click", () => openPhotoPicker(url => {
  pickedEditAudioCoverFile = null;
  selectedEditAudioCoverUrl = url;
  editAudioCoverChanged = true;
  if (editAudioCoverPreview) { editAudioCoverPreview.src = url; editAudioCoverPreview.classList.remove("hidden"); }
}));
const audioVoiceList = document.getElementById("audioVoiceList");
const audioAddVoiceBtn = document.getElementById("audioAddVoiceBtn");
const audioVoiceModal = document.getElementById("audioVoiceModal");
const audioVoiceFileDrop = document.getElementById("audioVoiceFileDrop");
const audioVoiceFileInput = document.getElementById("audioVoiceFileInput");
const audioVoiceFilePickText = document.getElementById("audioVoiceFilePickText");
const audioVoiceNameInput = document.getElementById("audioVoiceName");
const audioVoiceUploadProgress = document.getElementById("audioVoiceUploadProgress");
const audioVoiceProgressFill = document.getElementById("audioVoiceProgressFill");
const audioVoiceProgressLabel = document.getElementById("audioVoiceProgressLabel");
const audioVoiceCancel = document.getElementById("audioVoiceCancel");
const audioVoiceSave = document.getElementById("audioVoiceSave");

/* extend shared objects */
ratingEls.audio = {
  summaryImg: document.getElementById("audioRatingSummaryImg"),
  score:      document.getElementById("audioRatingScore"),
  label:      document.getElementById("audioRatingLabel"),
  picker:     document.getElementById("audioRatingPicker"),
  submit:     document.getElementById("audioRatingSubmit"),
};
commentEls.audio = {
  list:          document.getElementById("audioCommentList"),
  input:         document.getElementById("audioCommentInput"),
  submit:        document.getElementById("audioCommentSubmit"),
  replyHint:     document.getElementById("audioReplyHint"),
  replyHintName: document.getElementById("audioReplyHintName"),
  replyCancel:   document.getElementById("audioReplyCancelBtn"),
};
gigerEls.audio = {
  box:      document.getElementById("audioGigerBox"),
  checkbox: null,
  choices:  document.getElementById("audioGigerChoices"),
};
buildRatingPicker("audio");
bindGigerUncheckSound("audio");

/* ── Загрузка из Supabase ── */
async function loadAudio() {
  statusEl.textContent = "Загружаю аудио...";
  const { data, error } = await db
    .from(AUDIO_TABLE)
    .select("id, title, description, r2_key, r2_url, duration_sec, cover_r2_key, cover_r2_url, owner_code, owner_name, followers_only, category_id, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    statusEl.textContent = "Ошибка загрузки аудио: " + error.message +
      (error.message.includes("does not exist") ? " (выполни migration_add_audio.sql)" : "");
    return;
  }
  if (!mySubscriptions) await loadMySubscriptions();
  allAudioRecords = (data || []).filter(canSeeRecord);
  fillAuthorFilter();
  await preloadProfilesFor(allAudioRecords);
  applyAudioSearch();
}

function applyAudioSearch() {
  const query = searchInput.value.trim().toLowerCase();
  const approvedCategoryIds = new Set(allCategories.map(c => c.id));
  let base = allAudioRecords.filter(r => !r.category_id || approvedCategoryIds.has(r.category_id));
  if (currentCategoryFilter !== "all") base = base.filter(r => r.category_id === currentCategoryFilter);
  if (currentAuthorFilter !== "all") base = base.filter(r => r.owner_code === currentAuthorFilter);
  if (query) base = base.filter(r =>
    (r.title||"").toLowerCase().includes(query) ||
    displayNameFor(r.owner_code, r.owner_name).toLowerCase().includes(query)
  );
  base = applySort(base, "audio");
  renderAudioGallery(base);
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2,"0")}`;
}

function renderAudioGallery(records) {
  currentAudioList = records;
  galleryAudio.innerHTML = "";
  if (!records.length) {
    statusEl.textContent = "Аудио: 0 · Пока нет аудио треков — добавь первый! 🎵";
    return;
  }
  statusEl.textContent = `Аудио: ${records.length}`;
  records.forEach((record, idx) => {
    const card = document.createElement("div");
    card.className = "audio-card";
    const hasCover = !!record.cover_r2_url;
    const dur = record.duration_sec ? formatDuration(record.duration_sec) : "";
    const authorName = displayNameFor(record.owner_code, record.owner_name);
    card.innerHTML = `
      <div class="audio-card-cover">
        ${hasCover ? `<img src="${escapeHtml(record.cover_r2_url)}" alt="" loading="lazy">` : ""}
        <div class="audio-card-cover-fallback" ${hasCover ? 'style="display:none"' : ""}>🎵</div>
        <div class="audio-card-play-overlay">
          <div class="audio-card-play-icon">
            <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#a0522d" d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      </div>
      <div class="audio-card-body">
        <div class="audio-card-meta">
          <div class="audio-card-title">${escapeHtml(record.title||"Без названия")}</div>
          <div class="audio-card-meta-right">
            <span class="audio-card-author owner-tag-link" data-owner="${record.owner_code||""}">${escapeHtml(authorName)}</span>
            ${dur ? `<span class="audio-card-duration">${dur}</span>` : ""}
          </div>
        </div>
        <div class="audio-card-date">${formatPublishDate(record.created_at)}</div>
      </div>`;
    card.addEventListener("click", () => {
      if (typeof stopPlaylistPlayback === "function") stopPlaylistPlayback();
      openAudioLightbox(record, idx);
    });
    const ownerTag = card.querySelector(".owner-tag-link");
    if (ownerTag) ownerTag.addEventListener("click", (e) => { e.stopPropagation(); openProfile(record.owner_code); });
    galleryAudio.appendChild(card);
  });
}

/* ════ Плеер ════ */
let audioEl = null;
let waveformData = null;
let waveAnimFrame = null;
const SPEED_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2];
let currentSpeedIdx = 2;

function setPlayState(playing) {
  if (audioPlayIcon && audioPauseIcon) {
    audioPlayIcon.style.display  = playing ? "none" : "";
    audioPauseIcon.style.display = playing ? "" : "none";
  }
  updateAudioPipState();
}

function stopAudio() {
  if (audioEl) { audioEl.pause(); audioEl.src = ""; }
  if (waveAnimFrame) { cancelAnimationFrame(waveAnimFrame); waveAnimFrame = null; }
  waveformData = null;
  if (audioWaveCanvas) {
    const ctx = audioWaveCanvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, audioWaveCanvas.width, audioWaveCanvas.height);
  }
  if (audioWaveProgress) audioWaveProgress.style.width = "0%";
  if (audioWaveCursor)   audioWaveCursor.style.left   = "0%";
  if (audioCurTime) audioCurTime.textContent = "0:00";
  if (audioDurTime) audioDurTime.textContent = "0:00";
  setPlayState(false);
}

async function decodeWaveform(url) {
  try {
    const res = await fetch(url, { headers: { Range: "bytes=0-2097151" } });
    const buf = await res.arrayBuffer();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const decoded  = await audioCtx.decodeAudioData(buf);
    const ch = decoded.getChannelData(0);
    const BINS = 180, step = Math.floor(ch.length / BINS);
    const data = new Float32Array(BINS);
    for (let i = 0; i < BINS; i++) {
      let max = 0;
      for (let j = 0; j < step; j++) { const v = Math.abs(ch[i*step+j]||0); if (v>max) max=v; }
      data[i] = max;
    }
    const peak = Math.max(...data) || 1;
    for (let i = 0; i < BINS; i++) data[i] = data[i]/peak;
    audioCtx.close();
    return data;
  } catch {
    const data = new Float32Array(180);
    for (let i = 0; i < 180; i++) data[i] = 0.2 + Math.random()*0.8;
    return data;
  }
}

function drawWaveform(progress) {
  if (!audioWaveCanvas || !waveformData) return;
  const W = audioWaveCanvas.offsetWidth, H = audioWaveCanvas.offsetHeight;
  if (!W || !H) return;
  const dpr = devicePixelRatio || 1;
  audioWaveCanvas.width  = W * dpr;
  audioWaveCanvas.height = H * dpr;
  const ctx = audioWaveCanvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);
  const BINS = waveformData.length;
  const barW = Math.max(2, W/BINS - 1.5);
  const gap  = (W - barW*BINS) / BINS;
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const played   = isDark ? "#c47232" : "#a0522d";
  const unplayed = isDark ? "rgba(255,255,255,0.18)" : "rgba(160,82,45,0.25)";
  const radius = Math.min(barW/2, 3);
  for (let i = 0; i < BINS; i++) {
    const x = i*(barW+gap), amp = waveformData[i];
    const barH = Math.max(3, amp*H*0.85), y = (H-barH)/2;
    ctx.fillStyle = i/BINS <= progress ? played : unplayed;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, barW, barH, radius);
    else ctx.rect(x, y, barW, barH);
    ctx.fill();
  }
}

function animateWave() {
  if (!audioEl) return;
  const pct = audioEl.duration ? audioEl.currentTime/audioEl.duration : 0;
  drawWaveform(pct);
  if (audioWaveProgress) audioWaveProgress.style.width = (pct*100).toFixed(2)+"%";
  if (audioWaveCursor)   audioWaveCursor.style.left   = (pct*100).toFixed(2)+"%";
  if (audioCurTime) audioCurTime.textContent = formatDuration(audioEl.currentTime);
  waveAnimFrame = requestAnimationFrame(animateWave);
}

async function loadAndPlayAudio(record) {
  stopAudio();
  if (!record.r2_url) return;
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.crossOrigin = "anonymous";
    audioEl.addEventListener("timeupdate", updateAudioPipState);
    audioEl.addEventListener("loadedmetadata", updateAudioPipState);
    audioEl.addEventListener("play", updateAudioPipState);
    audioEl.addEventListener("pause", updateAudioPipState);
  }
  audioEl.src = record.r2_url;
  audioEl.loop = audioLoopEnabled;
  audioEl.playbackRate = SPEED_STEPS[currentSpeedIdx];
  if (audioVolume) audioEl.volume = parseFloat(audioVolume.value);
  waveformData = new Float32Array(180).fill(0.3);
  drawWaveform(0);
  decodeWaveform(record.r2_url).then(data => { waveformData = data; drawWaveform(audioEl?.duration ? audioEl.currentTime / audioEl.duration : 0); drawAudioPipWaveform(); });
  audioEl.onloadedmetadata = () => {
    if (audioDurTime) audioDurTime.textContent = formatDuration(audioEl.duration);
    if (!record.duration_sec && audioEl.duration && !record.isVoiceTrack) {
      db.from(AUDIO_TABLE).update({ duration_sec: Math.round(audioEl.duration) }).eq("id", record.id).then(() => {
        record.duration_sec = Math.round(audioEl.duration);
      });
    }
  };
  audioEl.onended = () => {
    if (typeof handlePlaylistTrackEnded === "function" && handlePlaylistTrackEnded()) return;
    setPlayState(false);
    if (waveAnimFrame) { cancelAnimationFrame(waveAnimFrame); waveAnimFrame = null; }
  };
  try {
    await audioEl.play();
    setPlayState(true);
    animateWave();
  } catch { setPlayState(false); }
}

/* Плавающий мини-плеер (Document Picture-in-Picture, Chrome/Edge) */
let audioPipWindow = null;
function updateAudioPipState() {
  if (!audioPipWindow || audioPipWindow.closed || !audioEl) return;
  const d = audioPipWindow.document;
  const play = d.getElementById("pipPlay");
  drawAudioPipWaveform();
  const cur = d.getElementById("pipCurrent");
  const dur = d.getElementById("pipDuration");
  const title = d.getElementById("pipTitle");
  const cover = d.getElementById("pipCover");
  if (play) play.innerHTML = audioEl.paused ? '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
  if (cur) cur.textContent = formatDuration(audioEl.currentTime || 0);
  if (dur) dur.textContent = formatDuration(audioEl.duration || 0);
  const loop = d.getElementById("pipLoop");
  const speed = d.getElementById("pipSpeed");
  const volume = d.getElementById("pipVolume");
  if (loop) loop.classList.toggle("active", audioLoopEnabled);
  if (speed) speed.textContent = (SPEED_STEPS[currentSpeedIdx] || 1) + "×";
  if (volume) volume.value = String(audioEl.volume);
  if (title) {
    const voice = selectedAudioVoiceTrack();
    title.textContent = currentAudioRecord?.title
      ? `${currentAudioRecord.title}${voice ? " · " + (voice.voice_name || "Доп. озвучка") : ""}`
      : "Аудио";
  }
  if (cover) {
    const url = currentAudioRecord?.cover_r2_url;
    if (url) { cover.src = url; cover.style.display = "block"; }
    else { cover.removeAttribute("src"); cover.style.display = "none"; }
  }
  if (typeof updatePlaylistPipControls === "function") updatePlaylistPipControls();
}

// Рисует в мини-плеере ту же waveformData, что и в основном аудиоплеере.
function drawAudioPipWaveform() {
  if (!audioPipWindow || audioPipWindow.closed || !audioEl) return;
  const canvas = audioPipWindow.document.getElementById("pipWaveCanvas");
  if (!canvas) return;
  const W = canvas.clientWidth, H = canvas.clientHeight;
  if (!W || !H) return;
  const dpr = audioPipWindow.devicePixelRatio || 1;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const data = waveformData || new Float32Array(180).fill(0.3);
  const bins = data.length;
  const barW = Math.max(1.5, W / bins - 1.2);
  const gap = (W - barW * bins) / bins;
  const progress = audioEl.duration ? audioEl.currentTime / audioEl.duration : 0;
  for (let i = 0; i < bins; i++) {
    const x = i * (barW + gap);
    const amp = data[i] || 0.15;
    const barH = Math.max(3, amp * H * 0.88);
    const y = (H - barH) / 2;
    ctx.fillStyle = i / bins <= progress ? "#c47b45" : "rgba(255,255,255,.23)";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, barW, barH, Math.min(barW / 2, 3));
    else ctx.rect(x, y, barW, barH);
    ctx.fill();
  }
  const cursorX = Math.max(0, Math.min(W - 1, progress * W));
  ctx.fillStyle = "#f0a36b";
  ctx.fillRect(cursorX, 0, 2, H);
}

async function openAudioPip() {
  if (!audioEl || !currentAudioRecord) {
    if (typeof showToast === "function") showToast("Сначала выбери аудио", "info");
    return;
  }
  if (!("documentPictureInPicture" in window)) {
    if (typeof showToast === "function") showToast("Мини-плеер поверх окон поддерживается в Chrome и Edge. Обнови браузер до актуальной версии.", "error");
    return;
  }
  try {
    if (audioPipWindow && !audioPipWindow.closed) {
      audioPipWindow.focus();
      return;
    }
    audioPipWindow = await window.documentPictureInPicture.requestWindow({ width: 550, height: 230 });
    const d = audioPipWindow.document;
    d.documentElement.style.cssText = "height:100%;";
    d.body.style.cssText = "margin:0;height:100%;font:14px Arial,sans-serif;background:#171717;color:#fff;overflow:hidden;";
    d.body.innerHTML = `
      <style>
        *{box-sizing:border-box}
        .pip{height:100%;padding:14px 16px;display:grid;grid-template-columns:88px minmax(0,1fr);gap:15px;align-items:center;background:linear-gradient(145deg,#292929,#141414)}
        #pipCover{width:88px;height:88px;object-fit:cover;border-radius:12px;background:#303030;display:none}
        .info{min-width:0;display:flex;flex-direction:column;gap:8px}
        .title{font-weight:700;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff}
        .seek-wrap{display:flex;flex-direction:column;gap:4px}
        .pip-wave{height:34px;width:100%;display:block;cursor:pointer;touch-action:pan-y;border-radius:5px}
        .times{display:flex;justify-content:space-between;color:#bdbdbd;font-size:11px;font-variant-numeric:tabular-nums}
        input[type=range]{appearance:none;width:100%;height:4px;border-radius:8px;background:#555;accent-color:#c47b45;cursor:pointer;margin:4px 0}
        input[type=range]::-webkit-slider-thumb{appearance:none;width:13px;height:13px;border-radius:50%;background:#c47b45}
        input[type=range]::-moz-range-thumb{width:13px;height:13px;border:0;border-radius:50%;background:#c47b45}
        .bottom{display:flex;align-items:center;justify-content:space-between;gap:8px}
        .transport,.tools{display:flex;align-items:center;gap:8px}
        button{border:0;color:#fff;background:#353535;border-radius:50%;width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
        button:hover{filter:brightness(1.22)}
        button svg{width:19px;height:19px;fill:currentColor}
        #pipPlay{width:44px;height:44px;background:#b66d3d}
        #pipPlay svg{width:24px;height:24px}
        .track-nav{font-size:25px;font-weight:700;line-height:1;background:#4a3a30;width:32px;height:36px}
        .track-nav:hover{background:#725039}
        .tool-btn{width:34px;height:34px;font-size:12px;font-weight:700}
        .tool-btn.active{background:#b66d3d;color:white}
        #pipSpeed{width:42px;border-radius:18px;font-size:12px}
        .volume{display:flex;align-items:center;gap:5px;min-width:86px}
        .volume svg{width:17px;height:17px;fill:#ddd;flex-shrink:0}
        #pipVolume{width:65px;margin:0}
        @media(max-width:370px){.pip{grid-template-columns:64px minmax(0,1fr);gap:10px;padding:10px}#pipCover{width:64px;height:64px}.volume{min-width:65px}#pipVolume{width:45px}.transport,.tools{gap:5px}}
      </style>
      <div class="pip">
        <img id="pipCover" alt="Обложка">
        <div class="info">
          <div class="title" id="pipTitle">Аудио</div>
          <div class="seek-wrap"><canvas id="pipWaveCanvas" class="pip-wave" aria-label="Перемотка по звуковой волне"></canvas><div class="times"><span id="pipCurrent">0:00</span><span id="pipDuration">0:00</span></div></div>
          <div class="bottom">
            <div class="transport">
              <button id="pipPrevTrack" class="track-nav" title="Предыдущий трек" style="display:none">‹</button>
              <button id="pipBack" title="Назад на 10 секунд"><svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/><text x="12" y="15.5" font-size="5.5" text-anchor="middle" fill="#fff">10</text></svg></button>
              <button id="pipPlay" title="Пуск / пауза"></button>
              <button id="pipForward" title="Вперёд на 10 секунд"><svg viewBox="0 0 24 24"><path d="M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v4l5-5-5-5v4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8h-2z"/><text x="12" y="15.5" font-size="5.5" text-anchor="middle" fill="#fff">10</text></svg></button>
              <button id="pipNextTrack" class="track-nav" title="Следующий трек" style="display:none">›</button>
            </div>
            <div class="tools">
              <button class="tool-btn" id="pipLoop" title="Повтор" aria-label="Повтор"><svg viewBox="0 0 24 24"><path d="M7 7h11l-2.5-2.5L17 3l5 5-5 5-1.5-1.5L18 9H7a3 3 0 0 0-3 3v1H2v-1a5 5 0 0 1 5-5zm10 10H6l2.5 2.5L7 21l-5-5 5-5 1.5 1.5L6 15h11a3 3 0 0 0 3-3v-1h2v1a5 5 0 0 1-5 5z"/></svg></button>
              <button class="tool-btn" id="pipSpeed" title="Скорость">1×</button>
              <div class="volume"><svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg><input id="pipVolume" type="range" min="0" max="1" step="0.02" value="1" title="Громкость"></div>
            </div>
          </div>
        </div>
      </div>`;
    const playIcon = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    const pauseIcon = '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
    d.getElementById("pipPlay").innerHTML = audioEl.paused ? playIcon : pauseIcon;
    d.getElementById("pipPlay").addEventListener("click", () => {
      if (!audioEl) return;
      if (audioEl.paused) audioEl.play().then(() => { setPlayState(true); animateWave(); updateAudioPipState(); }).catch(() => {});
      else { audioEl.pause(); setPlayState(false); if (waveAnimFrame) { cancelAnimationFrame(waveAnimFrame); waveAnimFrame = null; } updateAudioPipState(); }
    });
    d.getElementById("pipBack").addEventListener("click", () => { if (audioEl) audioEl.currentTime = Math.max(0, audioEl.currentTime - 10); });
    d.getElementById("pipForward").addEventListener("click", () => { if (audioEl) audioEl.currentTime = Math.min(audioEl.duration || 0, audioEl.currentTime + 10); });
    d.getElementById("pipPrevTrack").addEventListener("click", () => { if (typeof navigatePlaylistPlayback === "function") navigatePlaylistPlayback(-1); });
    d.getElementById("pipNextTrack").addEventListener("click", () => { if (typeof navigatePlaylistPlayback === "function") navigatePlaylistPlayback(1); });
    const pipWave = d.getElementById("pipWaveCanvas");
    const seekFromWave = e => {
      if (!audioEl?.duration || !pipWave) return;
      const rect = pipWave.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      audioEl.currentTime = audioEl.duration * (x / rect.width);
      drawAudioPipWaveform();
    };
    pipWave.addEventListener("pointerdown", e => {
      seekFromWave(e);
      pipWave.setPointerCapture?.(e.pointerId);
    });
    pipWave.addEventListener("pointermove", e => {
      if (e.buttons === 1) seekFromWave(e);
    });
    d.getElementById("pipLoop").addEventListener("click", () => {
      audioLoopEnabled = !audioLoopEnabled;
      if (audioEl) audioEl.loop = audioLoopEnabled;
      if (audioLoopBtn) { audioLoopBtn.classList.toggle("active", audioLoopEnabled); audioLoopBtn.setAttribute("aria-pressed", String(audioLoopEnabled)); audioLoopBtn.title = audioLoopEnabled ? "Повтор включён" : "Повтор выключен"; }
      updateAudioPipState();
    });
    d.getElementById("pipSpeed").addEventListener("click", () => {
      currentSpeedIdx = (currentSpeedIdx + 1) % SPEED_STEPS.length;
      const spd = SPEED_STEPS[currentSpeedIdx];
      if (audioEl) audioEl.playbackRate = spd;
      if (audioSpeedBtn) audioSpeedBtn.textContent = spd + "×";
      updateAudioPipState();
    });
    d.getElementById("pipVolume").addEventListener("input", e => {
      if (audioEl) audioEl.volume = Number(e.target.value);
      if (audioVolume) audioVolume.value = e.target.value;
    });
    audioPipWindow.addEventListener("pagehide", () => { audioPipWindow = null; });
    audioEl.addEventListener("timeupdate", updateAudioPipState);
    audioEl.addEventListener("loadedmetadata", updateAudioPipState);
    audioPipWindow.addEventListener("resize", drawAudioPipWaveform);
    updateAudioPipState();
  } catch (err) {
    console.error("Audio PiP error:", err);
    if (typeof showToast === "function") showToast("Не удалось открыть мини-плеер", "error");
  }
}
if (audioPipBtn) audioPipBtn.addEventListener("click", openAudioPip);
/* клик / скраб по волне */
if (audioWaveContainer) {
  let scrubbing = false;
  const scrub = (e) => {
    if (!audioEl || !audioEl.duration) return;
    const rect = audioWaveContainer.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left)/rect.width));
    audioEl.currentTime = audioEl.duration * pct;
    if (audioWaveProgress) audioWaveProgress.style.width = (pct*100).toFixed(2)+"%";
    if (audioWaveCursor)   audioWaveCursor.style.left   = (pct*100).toFixed(2)+"%";
  };
  audioWaveContainer.addEventListener("click", scrub);
  audioWaveContainer.addEventListener("mousedown", () => { scrubbing = true; });
  window.addEventListener("mousemove", (e) => { if (scrubbing) scrub(e); });
  window.addEventListener("mouseup",   () => { scrubbing = false; });
}

if (audioPlayBtn) {
  audioPlayBtn.addEventListener("click", () => {
    if (!audioEl) return;
    if (audioEl.paused) {
      audioEl.play().then(() => { setPlayState(true); animateWave(); }).catch(()=>{});
    } else {
      audioEl.pause(); setPlayState(false);
      if (waveAnimFrame) { cancelAnimationFrame(waveAnimFrame); waveAnimFrame = null; }
    }
  });
}
if (audioRewind10)  audioRewind10.addEventListener("click",  () => { if (audioEl) audioEl.currentTime = Math.max(0, audioEl.currentTime-10); });
if (audioForward10) audioForward10.addEventListener("click", () => { if (audioEl) audioEl.currentTime = Math.min(audioEl.duration||0, audioEl.currentTime+10); });
if (audioVolume)    audioVolume.addEventListener("input",    () => { if (audioEl) audioEl.volume = parseFloat(audioVolume.value); updateAudioPipState(); });
if (audioSpeedBtn)  audioSpeedBtn.addEventListener("click",  () => {
  currentSpeedIdx = (currentSpeedIdx+1) % SPEED_STEPS.length;
  const spd = SPEED_STEPS[currentSpeedIdx];
  audioSpeedBtn.textContent = spd + "×";
  if (audioEl) audioEl.playbackRate = spd;
  updateAudioPipState();
});

if (audioLoopBtn) audioLoopBtn.addEventListener("click", () => {
  audioLoopEnabled = !audioLoopEnabled;
  if (audioEl) audioEl.loop = audioLoopEnabled;
  audioLoopBtn.classList.toggle("active", audioLoopEnabled);
  audioLoopBtn.title = audioLoopEnabled ? "Повтор включён" : "Повтор выключен";
  audioLoopBtn.setAttribute("aria-label", audioLoopBtn.title);
  audioLoopBtn.setAttribute("aria-pressed", String(audioLoopEnabled));
  updateAudioPipState();
});

/* ════ Дополнительные дорожки озвучки ════ */
function selectedAudioVoiceTrack() {
  return currentAudioVoiceTracks.find((track) => track.id === currentAudioVoiceId) || null;
}

function selectedAudioSourceUrl() {
  const track = selectedAudioVoiceTrack();
  return track?.storage_url || currentAudioRecord?.r2_url || "";
}

function renderAudioVoiceList() {
  if (!audioVoiceList || !currentAudioRecord) return;
  const originalName = displayNameFor(currentAudioRecord.owner_code, currentAudioRecord.owner_name);
  const originalActive = currentAudioVoiceId === "original";
  let html = `<button type="button" class="audio-voice-option${originalActive ? " active" : ""}" data-voice-id="original">
    <span>🎧</span><span class="audio-voice-option-label">Автор · ${escapeHtml(originalName)}</span>
  </button>`;
  html += currentAudioVoiceTracks.map((track) => {
    const active = track.id === currentAudioVoiceId;
    const uploader = displayNameFor(track.owner_code, track.owner_name);
    return `<button type="button" class="audio-voice-option${active ? " active" : ""}" data-voice-id="${escapeHtml(track.id)}">
      <span>🎙️</span><span class="audio-voice-option-label">${escapeHtml(track.voice_name || "Дополнительная озвучка")}${track.owner_code && track.owner_code !== currentAudioRecord.owner_code ? ` · ${escapeHtml(uploader)}` : ""}</span>
      ${isOwner(currentAudioRecord) ? `<span class="audio-voice-delete" role="button" tabindex="0" data-delete-voice="${escapeHtml(track.id)}" title="Удалить эту озвучку">✕</span>` : ""}
    </button>`;
  }).join("");
  audioVoiceList.innerHTML = html;

  [...audioVoiceList.querySelectorAll(".audio-voice-option")].forEach((button) => {
    button.addEventListener("click", async (e) => {
      if (e.target.closest("[data-delete-voice]")) return;
      await selectAudioVoice(button.dataset.voiceId);
    });
  });
  [...audioVoiceList.querySelectorAll("[data-delete-voice]")].forEach((button) => {
    const remove = async (e) => {
      e.stopPropagation();
      await deleteAudioVoiceTrack(button.dataset.deleteVoice);
    };
    button.addEventListener("click", remove);
    button.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") remove(e); });
  });
}

async function loadAudioVoiceTracks(record) {
  if (!record) return;
  const { data, error } = await db.from("burunduk_audio_voices")
    .select("id,audio_id,voice_name,storage_key,storage_url,duration_sec,owner_code,owner_name,created_at")
    .eq("audio_id", record.id)
    .eq("status", "approved")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[audio voices] Не удалось загрузить дополнительные озвучки:", error);
    currentAudioVoiceTracks = [];
    if (audioVoiceList) audioVoiceList.innerHTML = '<div class="audio-giger-choice-note">Дополнительные озвучки пока недоступны — проверь миграцию Supabase</div>';
    return;
  }
  currentAudioVoiceTracks = data || [];
  if (currentAudioVoiceTracks.length) await preloadProfilesFor(currentAudioVoiceTracks);
  if (currentAudioVoiceId !== "original" && !currentAudioVoiceTracks.some((t) => t.id === currentAudioVoiceId)) {
    currentAudioVoiceId = "original";
  }
  renderAudioVoiceList();
}

async function selectAudioVoice(voiceId) {
  if (!currentAudioRecord) return;
  const track = currentAudioVoiceTracks.find((item) => item.id === voiceId);
  if (voiceId !== "original" && !track) return;
  if (currentAudioVoiceId === voiceId) return;
  const wasPlaying = !!audioEl && !audioEl.paused;
  const resumeAt = audioEl?.currentTime || 0;
  currentAudioVoiceId = voiceId;
  renderAudioVoiceList();
  const sourceRecord = track
    ? { ...currentAudioRecord, r2_url: track.storage_url, r2_key: track.storage_key, duration_sec: track.duration_sec, isVoiceTrack: true }
    : currentAudioRecord;
  await loadAndPlayAudio(sourceRecord);
  if (audioEl && Number.isFinite(resumeAt) && resumeAt > 0) {
    const seekAfterMetadata = () => {
      try { audioEl.currentTime = Math.min(resumeAt, Math.max(0, audioEl.duration - 0.2)); } catch (_) {}
      if (!wasPlaying) { audioEl.pause(); setPlayState(false); }
      audioEl.removeEventListener("loadedmetadata", seekAfterMetadata);
    };
    if (audioEl.readyState >= 1) seekAfterMetadata();
    else audioEl.addEventListener("loadedmetadata", seekAfterMetadata);
  } else if (!wasPlaying && audioEl) {
    audioEl.pause();
    setPlayState(false);
  }
}

async function deleteAudioVoiceTrack(trackId) {
  if (!currentAudioRecord || !isOwner(currentAudioRecord)) return;
  const track = currentAudioVoiceTracks.find((item) => item.id === trackId);
  if (!track) return;
  if (!confirm(`Удалить озвучку «${track.voice_name}»? Её дорожка перестанет быть доступна слушателям.`)) return;
  if (currentAudioVoiceId === trackId) {
    currentAudioVoiceId = "original";
    await loadAndPlayAudio(currentAudioRecord);
  }
  const { data: storageKey, error } = await db.rpc("delete_audio_voice_track", {
    p_track_id: trackId,
    p_owner_code: currentIdentity.code,
  });
  if (error) {
    showToast("Не удалось удалить озвучку: " + error.message);
    return;
  }
  if (storageKey) { try { await deleteAudioR2Object(storageKey); } catch (cleanupError) { console.warn("Не удалось удалить R2-дорожку", cleanupError); } }
  showToast("Дополнительная озвучка удалена 🗑️");
  await loadAudioVoiceTracks(currentAudioRecord);
  await loadGiftState("audio", currentAudioRecord);
}

function getAudioFileDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const probe = new Audio();
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      const duration = Number.isFinite(probe.duration) ? Math.round(probe.duration) : null;
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    probe.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    probe.src = url;
  });
}

/* ════ Лайтбокс ════ */
async function openAudioLightbox(record, index, fromPlaylist = false) {
  if (!fromPlaylist && typeof stopPlaylistPlayback === "function") stopPlaylistPlayback();
  currentAudioRecord = record;
  currentAudioIndex  = index;
  if (!audioLightbox) return;
  if (audioLbTitle)  audioLbTitle.textContent  = record.title || "Без названия";
  if (audioLbDate)   audioLbDate.textContent   = formatPublishDate(record.created_at);
  if (audioLbDesc) {
    audioLbDesc.textContent  = record.description || "";
    audioLbDesc.style.display = record.description ? "" : "none";
  }
  if (record.owner_code && audioLbAuthor) {
    audioLbAuthor.innerHTML = `<span class="online-dot" data-online-for="${record.owner_code}"></span>от ${escapeHtml(displayNameFor(record.owner_code, record.owner_name))}`;
    audioLbAuthor.dataset.owner = record.owner_code;
    audioLbAuthor.style.display = "";
    audioLbAuthor.onclick = () => openProfile(record.owner_code);
  } else if (audioLbAuthor) { audioLbAuthor.style.display = "none"; }

  if (record.cover_r2_url) {
    audioLbCover.src = record.cover_r2_url;
    audioLbCover.classList.remove("hidden");
    audioLbCoverFb.classList.add("hidden");
  } else {
    audioLbCover.src = "";
    audioLbCover.classList.add("hidden");
    audioLbCoverFb.classList.remove("hidden");
  }

  const playlistMode = typeof hasActivePlaylistPlayback === "function" && hasActivePlaylistPlayback();
  const playlistLength = playlistMode ? getActivePlaylistLength() : currentAudioList.length;
  const hasMultiple = playlistLength > 1;
  if (audioLbPrevBtn) audioLbPrevBtn.classList.toggle("hidden", !hasMultiple || (!playlistMode && index === 0));
  if (audioLbNextBtn) audioLbNextBtn.classList.toggle("hidden", !hasMultiple || (!playlistMode && index === currentAudioList.length-1));
  if (playlistMode && hasMultiple) {
    if (audioLbPrevBtn) audioLbPrevBtn.classList.remove("hidden");
    if (audioLbNextBtn) audioLbNextBtn.classList.remove("hidden");
  }

  if (audioLbTools) audioLbTools.classList.toggle("hidden", !isOwner(record));

  audioLightbox.classList.add("open");
  document.body.style.overflow = "hidden";

  currentAudioVoiceId = "original";
  await loadAudioVoiceTracks(record);
  await loadAndPlayAudio(record);

  currentRatingTarget["audio"] = record.id;
  loadRatings("audio", record.id);
  loadComments("audio", record.id);
  loadGiftState("audio", record);
}

function closeAudioLightbox() {
  if (!audioLightbox) return;
  audioLightbox.classList.remove("open");
  document.body.style.overflow = "";
  stopAudio();
  if (typeof stopPlaylistPlayback === "function") stopPlaylistPlayback();
  currentAudioRecord = null;
  currentAudioVoiceTracks = [];
  currentAudioVoiceId = "original";
  if (audioVoiceList) audioVoiceList.innerHTML = "";
}

if (audioLbClose) audioLbClose.addEventListener("click", closeAudioLightbox);
if (audioLightbox) audioLightbox.addEventListener("click", (e) => { if (e.target === audioLightbox) closeAudioLightbox(); });
if (audioLbPrevBtn) audioLbPrevBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (typeof navigatePlaylistPlayback === "function" && navigatePlaylistPlayback(-1)) return;
  if (currentAudioIndex > 0) openAudioLightbox(currentAudioList[currentAudioIndex-1], currentAudioIndex-1);
});
if (audioLbNextBtn) audioLbNextBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (typeof navigatePlaylistPlayback === "function" && navigatePlaylistPlayback(1)) return;
  if (currentAudioIndex < currentAudioList.length-1) openAudioLightbox(currentAudioList[currentAudioIndex+1], currentAudioIndex+1);
});

// Действия с аудиозаписью. Никаких дополнительных кнопок копирования описания.
const audioLbShareBtn = document.getElementById("audioLbShareBtn");
const audioLbDownloadBtn = document.getElementById("audioLbDownloadBtn");

function audioRecordUrl(record) {
  if (!record || location.protocol === "file:") return "";
  const slug = slugify(record.title || "audio");
  const shortId = String(record.id).replace(/-/g, "").slice(0, 8);
  return `${location.origin}${location.pathname}#audio-${slug}--${shortId}`;
}

async function copyAudioShareUrl(url) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
    } else {
      const field = document.createElement("textarea");
      field.value = url;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      if (!copied) throw new Error("clipboard unavailable");
    }
    showToast("Ссылка скопирована 🔗");
  } catch (err) {
    console.error("Не удалось скопировать ссылку на аудио:", err);
    showToast("Не удалось скопировать ссылку. Попробуй открыть сайт по HTTPS.");
  }
}

if (audioLbShareBtn) audioLbShareBtn.addEventListener("click", async (e) => {
  e.stopPropagation();
  if (!currentAudioRecord) return;
  const url = audioRecordUrl(currentAudioRecord);
  if (!url) {
    showToast("Ссылка file:/// работает только на твоём компьютере. Открой опубликованный сайт по HTTPS, чтобы поделиться аудио.");
    return;
  }
  if (navigator.share) {
    try {
      await navigator.share({ title: currentAudioRecord.title || "Аудио", url });
      return;
    } catch (err) {
      if (err?.name === "AbortError") return;
    }
  }
  await copyAudioShareUrl(url);
});

if (audioLbDownloadBtn) audioLbDownloadBtn.addEventListener("click", async (e) => {
  e.stopPropagation();
  const audioUrl = selectedAudioSourceUrl();
  if (!audioUrl) return;
  try {
    const response = await fetch(audioUrl);
    if (!response.ok) throw new Error("download failed");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    const activeVoice = selectedAudioVoiceTrack();
    const voiceSuffix = activeVoice ? "_" + (activeVoice.voice_name || "озвучка") : "";
    const activeStorageKey = activeVoice?.storage_key || currentAudioRecord.r2_key || "audio.mp3";
    const extension = (activeStorageKey.split(".").pop() || "mp3").toLowerCase().replace(/[^a-z0-9]/g, "") || "mp3";
    a.download = ((currentAudioRecord.title || "audio") + voiceSuffix).replace(/[^a-zа-яё0-9_-]/gi, "_") + "." + extension;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    showToast("Аудио скачивается ⬇️");
  } catch {
    window.open(audioUrl, "_blank", "noopener");
    showToast("Открыл аудиофайл — его можно сохранить");
  }
});

if (commentEls.audio?.submit)      commentEls.audio.submit.addEventListener("click",      () => submitComment("audio"));
if (commentEls.audio?.replyCancel) commentEls.audio.replyCancel.addEventListener("click", () => setReplyTarget("audio", null));
if (ratingEls.audio?.submit)       ratingEls.audio.submit.addEventListener("click",       () => submitRating("audio"));

/* ════ Загрузка файлов на Supabase Storage (с прогресс-баром) ════ */
let pickedAudioFile  = null;
let pickedAudioCover = null;

// Аудиофайлы и их загруженные обложки отправляются в Cloudflare R2 через существующий Worker.
// Общий uploadFileXHR ниже остаётся для остальных типов файлов сайта (например, превью видео).
function uploadAudioFileXHR(file, folder, onProgress) {
  return new Promise((resolve, reject) => {
    const workerBase = (typeof CLOUDFLARE_WORKER_URL === "string" ? CLOUDFLARE_WORKER_URL : "").replace(/\/$/, "");
    if (!workerBase) return reject(new Error("Не настроен Cloudflare Worker"));
    const form = new FormData();
    form.append("file", file, file.name || "audio.bin");
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${workerBase}/audio/upload?folder=${encodeURIComponent(folder)}`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round(e.loaded / e.total * 100)); };
    xhr.onload = () => {
      let result = {};
      try { result = JSON.parse(xhr.responseText || "{}"); } catch (_) {}
      if (xhr.status >= 200 && xhr.status < 300 && result.key && result.url) resolve(result);
      else reject(new Error(result.error || `Cloudflare R2: HTTP ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Сетевая ошибка при загрузке в Cloudflare R2"));
    xhr.send(form);
  });
}

async function deleteAudioR2Object(key) {
  if (!key) return;
  const workerBase = (typeof CLOUDFLARE_WORKER_URL === "string" ? CLOUDFLARE_WORKER_URL : "").replace(/\/$/, "");
  if (!workerBase) throw new Error("Не настроен Cloudflare Worker");
  const response = await fetch(`${workerBase}/audio/object?key=${encodeURIComponent(key)}`, { method: "DELETE" });
  if (!response.ok) {
    let message = `Cloudflare R2: HTTP ${response.status}`;
    try { message = (await response.json()).error || message; } catch (_) {}
    throw new Error(message);
  }
}

function uploadFileXHR(file, folder, onProgress) {
  return new Promise((resolve, reject) => {
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const key = `${folder}/${crypto.randomUUID()}.${ext}`;
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${key}`);
    xhr.setRequestHeader("Authorization", `Bearer ${SUPABASE_ANON_KEY}`);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round(e.loaded/e.total*100)); };
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        const { data } = db.storage.from(BUCKET_NAME).getPublicUrl(key);
        resolve({ key, url: data.publicUrl });
      } else reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText}`));
    };
    xhr.onerror = () => reject(new Error("Сетевая ошибка"));
    xhr.send(file);
  });
}

function setPickedAudioVoiceFile(file) {
  pickedAudioVoiceFile = file;
  if (audioVoiceFilePickText) audioVoiceFilePickText.textContent = `🎵 ${file.name}`;
}

function resetAudioVoiceModal() {
  pickedAudioVoiceFile = null;
  if (audioVoiceFilePickText) audioVoiceFilePickText.textContent = "📂 Выбрать MP3 / OGG / WAV";
  if (audioVoiceNameInput) audioVoiceNameInput.value = "";
  if (audioVoiceUploadProgress) audioVoiceUploadProgress.classList.add("hidden");
  if (audioVoiceProgressFill) audioVoiceProgressFill.style.width = "0%";
  if (audioVoiceProgressLabel) audioVoiceProgressLabel.textContent = "Загружаю...";
}

if (audioAddVoiceBtn) audioAddVoiceBtn.addEventListener("click", () => {
  if (!currentAudioRecord) return;
  if (!currentIdentity) { ensureIdentity(); return; }
  resetAudioVoiceModal();
  audioVoiceModal?.classList.add("active");
});
if (audioVoiceCancel) audioVoiceCancel.addEventListener("click", () => audioVoiceModal?.classList.remove("active"));
if (audioVoiceFileDrop) {
  audioVoiceFileDrop.addEventListener("click", () => audioVoiceFileInput?.click());
  audioVoiceFileDrop.addEventListener("dragover", (e) => { e.preventDefault(); audioVoiceFileDrop.classList.add("drag-over"); });
  audioVoiceFileDrop.addEventListener("dragleave", () => audioVoiceFileDrop.classList.remove("drag-over"));
  audioVoiceFileDrop.addEventListener("drop", (e) => {
    e.preventDefault(); audioVoiceFileDrop.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("audio/")) setPickedAudioVoiceFile(file);
  });
}
if (audioVoiceFileInput) audioVoiceFileInput.addEventListener("change", () => {
  const file = audioVoiceFileInput.files[0];
  audioVoiceFileInput.value = "";
  if (file) setPickedAudioVoiceFile(file);
});
if (audioVoiceSave) audioVoiceSave.addEventListener("click", async () => {
  if (!currentIdentity || !currentAudioRecord) { showToast("Сначала выбери аудиокнигу и имя"); return; }
  const voiceName = audioVoiceNameInput?.value.trim();
  if (!voiceName) { showToast("Укажи название озвучки"); return; }
  if (!pickedAudioVoiceFile) { showToast("Выбери аудиофайл"); return; }

  audioVoiceSave.disabled = true;
  audioVoiceUploadProgress?.classList.remove("hidden");
  if (audioVoiceProgressLabel) audioVoiceProgressLabel.textContent = "Определяю длительность...";
  let uploadResult = null;
  try {
    const duration = await getAudioFileDuration(pickedAudioVoiceFile);
    if (audioVoiceProgressLabel) audioVoiceProgressLabel.textContent = "Загружаю озвучку...";
    uploadResult = await uploadAudioFileXHR(pickedAudioVoiceFile, "audio-voices", (pct) => {
      if (audioVoiceProgressFill) audioVoiceProgressFill.style.width = pct + "%";
      if (audioVoiceProgressLabel) audioVoiceProgressLabel.textContent = `Озвучка: ${pct}%`;
    });
    const { data, error } = await db.rpc("add_audio_voice_track", {
      p_audio_id: currentAudioRecord.id,
      p_voice_name: voiceName,
      p_storage_key: uploadResult.key,
      p_storage_url: uploadResult.url,
      p_duration_sec: duration,
      p_uploader_code: currentIdentity.code,
      p_uploader_name: currentIdentity.name,
    });
    if (error) throw error;
    audioVoiceModal?.classList.remove("active");
    const status = data?.status || data?.[0]?.status;
    showToast(status === "approved" ? "Твоя дополнительная дорожка опубликована 🎙️" : "Запись отправлена автору на подтверждение 🔔");
    await loadAudioVoiceTracks(currentAudioRecord);
    await loadGiftState("audio", currentAudioRecord);
  } catch (err) {
    if (uploadResult?.key) { try { await deleteAudioR2Object(uploadResult.key); } catch (cleanupError) { console.warn("Не удалось удалить временный R2-файл", cleanupError); } }
    showToast("Не удалось добавить озвучку: " + (err?.message || err));
  } finally {
    audioVoiceSave.disabled = false;
  }
});

if (audioFileDrop) {
  audioFileDrop.addEventListener("click", () => audioFileInput.click());
  audioFileDrop.addEventListener("dragover",  (e) => { e.preventDefault(); audioFileDrop.classList.add("drag-over"); });
  audioFileDrop.addEventListener("dragleave", ()  => audioFileDrop.classList.remove("drag-over"));
  audioFileDrop.addEventListener("drop", (e) => {
    e.preventDefault(); audioFileDrop.classList.remove("drag-over");
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("audio/")) setPickedAudioFile(f);
  });
}
if (audioFileInput) audioFileInput.addEventListener("change", () => {
  const f = audioFileInput.files[0]; audioFileInput.value = "";
  if (f) setPickedAudioFile(f);
});
function setPickedAudioFile(f) {
  pickedAudioFile = f;
  if (audioFilePickText) audioFilePickText.textContent = `🎵 ${f.name}`;
}
if (audioCoverPickBtn) audioCoverPickBtn.addEventListener("click", () => audioCoverFileInput.click());
if (audioCoverFileInput) audioCoverFileInput.addEventListener("change", () => {
  const f = audioCoverFileInput.files[0]; audioCoverFileInput.value = "";
  if (f) {
    pickedAudioCover = f;
    selectedAudioCoverGalleryUrl = null;
    audioCoverPreview.src = URL.createObjectURL(f);
    audioCoverPreview.classList.remove("hidden");
  }
});
if (audioCoverGalleryBtn) audioCoverGalleryBtn.addEventListener("click", () => openPhotoPicker(url => {
  pickedAudioCover = null;
  selectedAudioCoverGalleryUrl = url;
  audioCoverPreview.src = url;
  audioCoverPreview.classList.remove("hidden");
}));

function resetAudioModal() {
  pickedAudioFile = pickedAudioCover = null;
  selectedAudioCoverGalleryUrl = null;
  if (audioFilePickText) audioFilePickText.textContent = "📂 Нажми или перетащи MP3 / OGG / WAV";
  if (audioCoverPreview) { audioCoverPreview.src = ""; audioCoverPreview.classList.add("hidden"); }
  if (audioTitleInput) audioTitleInput.value = "";
  if (audioDescInput) audioDescInput.value = "";
  if (audioCategory) audioCategory.value = allCategories[0]?.id || "";
  newAudioCategoryWrap?.classList.add("hidden");
  if (newAudioCategoryName) newAudioCategoryName.value = "";
  if (audioUploadProgress) audioUploadProgress.classList.add("hidden");
  if (audioProgressFill)   audioProgressFill.style.width = "0%";
  if (audioProgressLabel)  audioProgressLabel.textContent = "Загружаю...";
}

if (uploadAudioBtn) uploadAudioBtn.addEventListener("click", () => { resetAudioModal(); audioModal?.classList.add("active"); });
if (audioModalCancel) audioModalCancel.addEventListener("click", () => audioModal?.classList.remove("active"));

if (audioModalSave) {
  audioModalSave.addEventListener("click", async () => {
    if (!currentIdentity) { showToast("Сначала выбери имя"); return; }
    if (!pickedAudioFile)  { showToast("Выбери аудио файл"); return; }
    const title = audioTitleInput?.value.trim();
    if (!title) { showToast("Введи название трека"); return; }

    let audioCategoryId = audioCategory?.value || "";
    if (audioCategoryId === NEW_CATEGORY_VALUE) {
      const categoryName = (newAudioCategoryName?.value || "").trim();
      if (!categoryName) { showToast("Введи название нового раздела"); return; }
      const created = await createPendingCategory(categoryName, currentIdentity.name, currentIdentity.code);
      if (!created) { showToast("Не удалось создать раздел"); return; }
      audioCategoryId = created.id;
    }
    if (!audioCategoryId) { showToast("Выбери раздел"); return; }

    audioModalSave.disabled = true;
    audioUploadProgress?.classList.remove("hidden");
    if (audioProgressLabel) audioProgressLabel.textContent = "Загружаю аудио...";

    try {
      const audioResult = await uploadAudioFileXHR(pickedAudioFile, "audio", (pct) => {
        if (audioProgressFill)  audioProgressFill.style.width = pct + "%";
        if (audioProgressLabel) audioProgressLabel.textContent = `Аудио: ${pct}%`;
      });

      let coverResult = null;
      let coverUrl = selectedAudioCoverGalleryUrl;
      if (pickedAudioCover) {
        if (audioProgressLabel) audioProgressLabel.textContent = "Загружаю обложку...";
        coverResult = await uploadAudioFileXHR(pickedAudioCover, "audio-covers", (pct) => {
          if (audioProgressFill) audioProgressFill.style.width = pct + "%";
        });
        coverUrl = coverResult.url;
      }

      const { data: newAudio, error } = await db.from(AUDIO_TABLE).insert({
        title,
        description:   audioDescInput?.value.trim() || null,
        r2_key:        audioResult.key,
        r2_url:        audioResult.url,
        cover_r2_key:  coverResult?.key  || null,
        cover_r2_url:  coverUrl || null,
        owner_name:    currentIdentity.name,
        owner_code:    currentIdentity.code,
        category_id:   audioCategoryId,
        created_at:    new Date().toISOString(),
      }).select().single();
      if (error) { showToast("Ошибка: " + error.message); return; }
      const rewardAdded = await creditGigersForPublish("audio");
      await notifyFollowersOfNewPost("audio", { id: newAudio.id, name: newAudio.title });
      audioModal?.classList.remove("active");
      showToast(rewardAdded ? "Аудио опубликовано! +3 гиперзадки 🎵" : "Аудио опубликовано, но награду начислить не удалось. Сообщи об этом администратору.");
      await loadAudio();
    } catch (e) {
      showToast("Ошибка загрузки: " + e.message);
    } finally {
      audioModalSave.disabled = false;
    }
  });
}

if (audioLbEditBtn) {
  audioLbEditBtn.addEventListener("click", () => {
    if (!currentAudioRecord) return;
    if (editAudioTitle) editAudioTitle.value = currentAudioRecord.title || "";
    if (editAudioDesc)  editAudioDesc.value  = currentAudioRecord.description || "";
    pickedEditAudioCoverFile = null;
    selectedEditAudioCoverUrl = currentAudioRecord.cover_r2_url || null;
    editAudioCoverChanged = false;
    if (editAudioCoverPreview) {
      if (selectedEditAudioCoverUrl) { editAudioCoverPreview.src = selectedEditAudioCoverUrl; editAudioCoverPreview.classList.remove("hidden"); }
      else { editAudioCoverPreview.removeAttribute("src"); editAudioCoverPreview.classList.add("hidden"); }
    }
    editAudioModal?.classList.add("active");
  });
}
if (editAudioCancel) editAudioCancel.addEventListener("click", () => editAudioModal?.classList.remove("active"));
if (editAudioSave) {
  editAudioSave.addEventListener("click", async () => {
    if (!currentAudioRecord) return;
    const title = editAudioTitle?.value.trim();
    if (!title) { showToast("Введи название"); return; }
    let coverUpdate = {};
    let uploadedEditCover = null;
    if (editAudioCoverChanged) {
      try {
        if (pickedEditAudioCoverFile) {
          uploadedEditCover = await uploadAudioFileXHR(pickedEditAudioCoverFile, "audio-covers", () => {});
          coverUpdate = { cover_r2_url: uploadedEditCover.url, cover_r2_key: uploadedEditCover.key };
        } else {
          coverUpdate = { cover_r2_url: selectedEditAudioCoverUrl || null, cover_r2_key: null };
        }
      } catch (uploadError) {
        showToast("Не удалось загрузить обложку: " + uploadError.message);
        return;
      }
    }
    const { error } = await db.from(AUDIO_TABLE).update({
      title,
      description: editAudioDesc?.value.trim() || null,
      ...coverUpdate,
    }).eq("id", currentAudioRecord.id);
    if (error) { showToast("Ошибка: " + error.message); return; }
    if (editAudioCoverChanged && currentAudioRecord.cover_r2_key && currentAudioRecord.cover_r2_key !== uploadedEditCover?.key) {
      await deleteAudioR2Object(currentAudioRecord.cover_r2_key).catch(err => console.warn("Не удалось удалить старую обложку из R2", err));
    }
    editAudioModal?.classList.remove("active");
    currentAudioRecord.title = title;
    currentAudioRecord.description = editAudioDesc?.value.trim() || null;
    if (editAudioCoverChanged) {
      currentAudioRecord.cover_r2_url = coverUpdate.cover_r2_url;
      currentAudioRecord.cover_r2_key = coverUpdate.cover_r2_key;
    }
    if (audioLbTitle) audioLbTitle.textContent = title;
    showToast("Трек обновлён ✏️");
    await loadAudio();
  });
}

if (audioLbDeleteBtn) {
  audioLbDeleteBtn.addEventListener("click", async () => {
    if (!currentAudioRecord) return;
    if (!confirm(`Удалить трек «${currentAudioRecord.title}»?`)) return;
    stopAudio();
    const { data: voiceFiles } = await db.rpc("audio_voice_storage_keys_for_delete", {
      p_audio_id: currentAudioRecord.id,
      p_owner_code: currentIdentity.code,
    });
    const { error } = await db.from(AUDIO_TABLE).delete().eq("id", currentAudioRecord.id);
    if (error) { showToast("Ошибка: " + error.message); return; }
    const storageKeys = [
      currentAudioRecord.r2_key,
      currentAudioRecord.cover_r2_key,
      ...(voiceFiles || []),
    ].filter(Boolean);
    for (const key of storageKeys) { try { await deleteAudioR2Object(key); } catch (cleanupError) { console.warn("Не удалось удалить R2-файл аудио", key, cleanupError); } }
    closeAudioLightbox();
    showToast("Трек удалён 🗑");
    await loadAudio();
  });
}