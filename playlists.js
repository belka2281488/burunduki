/* ================================================================
   ПЛЕЙЛИСТЫ АУДИО
   Приватные плейлисты хранятся в localStorage. Публичные — в Supabase.
   ================================================================ */
const PLAYLISTS_STORAGE_KEY = "burunduki_audio_playlists_v1";
const PLAYLISTS_TABLE = "burunduk_playlists";
const PLAYLIST_ITEMS_TABLE = "burunduk_playlist_items";

let audioPlaylists = [];
let selectedAudioPlaylist = null;
let activePlaylistPlayback = null;
let playlistVoiceTracksByAudio = new Map();
let playlistPickerQuery = "";

const playlistEls = {
  modal: document.getElementById("playlistsModal"),
  detailView: document.getElementById("playlistDetailView"),
  pickerView: document.getElementById("playlistTrackPickerView"),
  create: document.getElementById("uploadPlaylistBtn"),
  back: document.getElementById("playlistBackBtn"),
  title: document.getElementById("playlistDetailTitle"),
  owner: document.getElementById("playlistDetailOwner"),
  privacy: document.getElementById("playlistPrivacyNote"),
  play: document.getElementById("playlistPlayBtn"),
  add: document.getElementById("playlistAddTracksBtn"),
  publish: document.getElementById("playlistPublishBtn"),
  rename: document.getElementById("playlistRenameBtn"),
  remove: document.getElementById("playlistDeleteBtn"),
  entriesHeading: document.getElementById("playlistEntriesHeading"),
  entries: document.getElementById("playlistEntries"),
  pickerBack: document.getElementById("playlistPickerBackBtn"),
  pickerSearch: document.getElementById("playlistTrackSearch"),
  pickerList: document.getElementById("playlistTrackPickerList"),
  audioLibrary: document.getElementById("audioLibraryBtn"),
  audioPlaylists: document.getElementById("audioPlaylistsBtn"),
  createModal: document.getElementById("playlistCreateModal"),
  createTitle: document.getElementById("playlistCreateTitle"),
  createCancel: document.getElementById("playlistCreateCancel"),
  createSave: document.getElementById("playlistCreateSave"),
  publishModal: document.getElementById("playlistPublishModal"),
  publishCategory: document.getElementById("playlistPublishCategory"),
  publishNewCategoryWrap: document.getElementById("playlistPublishNewCategoryWrap"),
  publishNewCategoryName: document.getElementById("playlistPublishNewCategoryName"),
  publishCancel: document.getElementById("playlistPublishCancel"),
  publishConfirm: document.getElementById("playlistPublishConfirm"),
};

function readLocalPlaylists() {
  try {
    const value = JSON.parse(localStorage.getItem(PLAYLISTS_STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.filter(p => p && Array.isArray(p.items)) : [];
  } catch (error) {
    console.warn("[playlists] Не удалось прочитать локальные плейлисты:", error);
    return [];
  }
}

function writeLocalPlaylists() {
  const mine = audioPlaylists.filter(p => p.owner_code === currentIdentity?.code);
  localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(mine));
}

function playlistIsMine(playlist) {
  return !!currentIdentity && playlist?.owner_code === currentIdentity.code;
}

function playlistCanEdit(playlist) {
  return playlistIsMine(playlist);
}

function playlistEntryCountLabel(count) {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return `${count} треков`;
  if (n1 > 1 && n1 < 5) return `${count} трека`;
  if (n1 === 1) return `${count} трек`;
  return `${count} треков`;
}

function playlistSetView(view) {
  if (view === "list") {
    playlistEls.modal?.classList.add("hidden");
    playlistEls.detailView?.classList.add("hidden");
    playlistEls.pickerView?.classList.add("hidden");
    document.getElementById("galleryPlaylists")?.classList.remove("hidden");
    return;
  }
  document.getElementById("galleryPlaylists")?.classList.add("hidden");
  playlistEls.modal?.classList.remove("hidden");
  playlistEls.detailView?.classList.toggle("hidden", view !== "detail");
  playlistEls.pickerView?.classList.toggle("hidden", view !== "picker");
}
async function loadAudioPlaylists() {
  const local = readLocalPlaylists();
  let remote = [];
  if (db) {
    const { data, error } = await db.from(PLAYLISTS_TABLE)
      .select("id,title,owner_code,owner_name,created_at,updated_at,is_public,category_id")
      .eq("is_public", true)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) {
      console.warn("[playlists] Не удалось загрузить публичные плейлисты. Проверь migration_add_playlists.sql и migration_add_audio_playlist_categories.sql:", error);
      if (typeof showToast === "function") showToast("Публичные плейлисты недоступны: проверь SQL-миграции в Supabase");
    } else {
      const rows = data || [];
      const ids = rows.map(p => p.id);
      let items = [];
      if (ids.length) {
        const result = await db.from(PLAYLIST_ITEMS_TABLE)
          .select("id,playlist_id,audio_id,voice_track_id,position")
          .in("playlist_id", ids)
          .order("position", { ascending: true });
        if (result.error) {
          console.warn("[playlists] Не удалось загрузить состав публичных плейлистов:", result.error);
        } else {
          items = result.data || [];
        }
      }
      remote = rows.map(row => ({
        id: `remote-${row.id}`,
        remote_id: row.id,
        title: row.title,
        owner_code: row.owner_code,
        owner_name: row.owner_name,
        is_public: true,
        category_id: row.category_id || null,
        created_at: row.created_at,
        updated_at: row.updated_at,
        items: items.filter(item => item.playlist_id === row.id).map(item => ({
          entry_id: item.id,
          audio_id: item.audio_id,
          voice_id: item.voice_track_id || "original",
        })),
      }));
    }
  }

  const remoteIds = new Set(remote.map(p => p.remote_id));
  const localOnly = local.filter(p => !p.remote_id || !remoteIds.has(p.remote_id));
  audioPlaylists = [...localOnly, ...remote];
  renderAudioPlaylistLists();
}

function applyAudioPlaylistSearch() {
  renderAudioPlaylistLists();
}

function renderAudioPlaylistLists() {
  const gallery = document.getElementById("galleryPlaylists");
  if (!gallery) return;
  gallery.innerHTML = "";
  const query = (typeof searchInput !== "undefined" ? searchInput.value : "").trim().toLowerCase();
  const approvedCategoryIds = new Set((typeof allCategories !== "undefined" ? allCategories : []).map(c => c.id));
  const matchesQuery = p => !query ||
    String(p.title || "").toLowerCase().includes(query) ||
    String(displayNameFor(p.owner_code, p.owner_name) || "").toLowerCase().includes(query);
  const mineLocal = audioPlaylists.filter(p => playlistIsMine(p) && !p.is_public && matchesQuery(p))
    .sort((a, b) => String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || "")));
  let publicFeed = audioPlaylists.filter(p => p.is_public && matchesQuery(p));
  publicFeed = publicFeed.filter(p => !p.category_id || approvedCategoryIds.has(p.category_id));
  if (typeof currentCategoryFilter !== "undefined" && currentCategoryFilter !== "all") {
    publicFeed = publicFeed.filter(p => p.category_id === currentCategoryFilter);
  }
  if (typeof currentAuthorFilter !== "undefined" && currentAuthorFilter !== "all") {
    publicFeed = publicFeed.filter(p => p.owner_code === currentAuthorFilter);
  }
  publicFeed.sort((a, b) => String(b.created_at || b.updated_at || "").localeCompare(String(a.created_at || a.updated_at || "")));

  const ordered = [...mineLocal, ...publicFeed];
  if (!ordered.length) {
    const empty = document.createElement("div");
    empty.className = "playlist-empty playlist-feed-empty";
    empty.textContent = mineLocal.length || publicFeed.length
      ? "В этом разделе пока нет плейлистов."
      : "Пока нет плейлистов. Нажми «Добавить плейлист», чтобы создать первый.";
    gallery.appendChild(empty);
  } else {
    ordered.forEach(p => gallery.appendChild(createPlaylistCard(p)));
  }
  if (typeof statusEl !== "undefined" && statusEl) {
    statusEl.textContent = ordered.length ? `Плейлистов: ${ordered.length}` : "";
  }
}

function createPlaylistCard(playlist) {
  const card = document.createElement("div");
  card.className = "audio-card playlist-feed-card";
  const own = playlistIsMine(playlist);
  const ownerName = own ? "Ты" : (typeof displayNameFor === "function" ? displayNameFor(playlist.owner_code, playlist.owner_name) : playlist.owner_name || "Автор");
  const firstAudio = playlist.items.map(item => getPlaylistAudioRecord(item.audio_id)).find(Boolean);
  const cover = firstAudio?.cover_r2_url
    ? `<img src="${escapeHtml(firstAudio.cover_r2_url)}" alt="" loading="lazy">`
    : `<div class="audio-card-cover-fallback">♫</div>`;
  const privacy = own && !playlist.is_public ? "🔒 Только вы видите этот плейлист" : "🌐 Публичный плейлист";
  const categoryName = (typeof allCategories !== "undefined" ? allCategories : []).find(c => c.id === playlist.category_id)?.name || "";
  card.innerHTML = `
    <div class="audio-card-cover playlist-card-cover">
      ${cover}
      <div class="audio-card-play-overlay"><div class="audio-card-play-icon"><span>▶</span></div></div>
    </div>
    <div class="audio-card-body">
      <div class="audio-card-title">${escapeHtml(playlist.title || "Без названия")}</div>
      <div class="audio-card-meta"><span class="audio-card-author">${escapeHtml(ownerName)}</span><span class="audio-card-duration">${playlistEntryCountLabel(playlist.items.length)}</span></div>
      <div class="audio-card-date">${escapeHtml(privacy)}${categoryName ? ` · ${escapeHtml(categoryName)}` : ""}</div>
    </div>`;
  card.addEventListener("click", () => openAudioPlaylist(playlist.id));
  return card;
}

function folderPreviewItemsOrFallback(itemsHtml) {
  return itemsHtml || `<div class="playlist-folder-empty"><span>♫</span><small>Плейлист пуст</small></div>`;
}

function showAudioPlaylists() {
  currentAudioSectionMode = "playlists";
  playlistEls.audioPlaylists?.classList.add("active");
  playlistEls.audioLibrary?.classList.remove("active");
  document.getElementById("uploadAudioBtn")?.classList.add("hidden");
  playlistEls.create?.classList.remove("hidden");
  document.getElementById("galleryAudio")?.classList.add("hidden");
  playlistSetView("list");
  loadAudioPlaylists();
}

function createLocalAudioPlaylist() {
  if (!currentIdentity) {
    showToast("Сначала выбери имя");
    return;
  }
  if (playlistEls.createTitle) playlistEls.createTitle.value = "";
  playlistEls.createModal?.classList.add("active");
  setTimeout(() => playlistEls.createTitle?.focus(), 0);
}

function saveNewLocalAudioPlaylist() {
  if (!currentIdentity) {
    showToast("Сначала выбери имя");
    return;
  }
  const title = playlistEls.createTitle?.value.trim();
  if (!title) { showToast("Введи название плейлиста"); return; }
  const now = new Date().toISOString();
  const playlist = {
    id: `local-${(crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)}`,
    title: title.slice(0, 80),
    owner_code: currentIdentity.code,
    owner_name: currentIdentity.name,
    is_public: false,
    category_id: null,
    remote_id: null,
    created_at: now,
    updated_at: now,
    items: [],
  };
  audioPlaylists.unshift(playlist);
  writeLocalPlaylists();
  playlistEls.createModal?.classList.remove("active");
  renderAudioPlaylistLists();
  openAudioPlaylist(playlist.id);
}
function getAudioPlaylist(id) {
  return audioPlaylists.find(p => p.id === id || p.remote_id === id) || null;
}

async function openAudioPlaylist(id) {
  selectedAudioPlaylist = getAudioPlaylist(id);
  if (!selectedAudioPlaylist) return;
  currentAudioSectionMode = "playlists";
  playlistSetView("detail");
  await renderAudioPlaylistDetail();
}

async function renderAudioPlaylistDetail() {
  const playlist = selectedAudioPlaylist;
  if (!playlist) return;
  const own = playlistCanEdit(playlist);
  if (playlistEls.title) playlistEls.title.textContent = playlist.title || "Без названия";
  if (playlistEls.owner) {
    const owner = own ? "Твой плейлист" : `Плейлист пользователя ${typeof displayNameFor === "function" ? displayNameFor(playlist.owner_code, playlist.owner_name) : playlist.owner_name || ""}`;
    playlistEls.owner.textContent = `${owner} · ${playlistEntryCountLabel(playlist.items.length)}`;
  }
  if (playlistEls.privacy) {
    playlistEls.privacy.textContent = own
      ? (playlist.is_public ? "🌐 Этот плейлист виден всем" : "🔒 Только вы видите этот плейлист")
      : "🌐 Публичный плейлист";
  }
  if (playlistEls.play) playlistEls.play.disabled = !playlist.items.length;
  if (playlistEls.add) playlistEls.add.classList.toggle("hidden", !own);
  if (playlistEls.publish) {
    playlistEls.publish.classList.toggle("hidden", !own);
    playlistEls.publish.textContent = playlist.is_public ? "🔒 Сделать приватным" : "🌐 Сделать публичным";
  }
  if (playlistEls.rename) playlistEls.rename.classList.toggle("hidden", !own);
  if (playlistEls.remove) playlistEls.remove.classList.toggle("hidden", !own);
  if (playlistEls.entriesHeading) playlistEls.entriesHeading.textContent = playlistEntryCountLabel(playlist.items.length);

  const ids = [...new Set(playlist.items.map(item => item.audio_id).filter(Boolean))];
  await loadPlaylistVoiceOptions(ids);
  renderAudioPlaylistEntries();
}

async function loadPlaylistVoiceOptions(audioIds) {
  const missing = audioIds.filter(id => !playlistVoiceTracksByAudio.has(id));
  if (!missing.length || !db) return;
  const { data, error } = await db.from("burunduk_audio_voices")
    .select("id,audio_id,voice_name,owner_code,owner_name,status")
    .in("audio_id", missing)
    .eq("status", "approved")
    .order("created_at", { ascending: true });
  if (error) {
    console.warn("[playlists] Не удалось получить список дорожек:", error);
    missing.forEach(id => playlistVoiceTracksByAudio.set(id, []));
    return;
  }
  missing.forEach(id => playlistVoiceTracksByAudio.set(id, []));
  (data || []).forEach(track => {
    const list = playlistVoiceTracksByAudio.get(track.audio_id) || [];
    list.push(track);
    playlistVoiceTracksByAudio.set(track.audio_id, list);
  });
}

function playlistVoiceOptionsHtml(audioId, selectedVoiceId) {
  const tracks = playlistVoiceTracksByAudio.get(audioId) || [];
  const options = [{ value: "original", label: "Авторская дорожка" }, ...tracks.map(t => ({
    value: t.id,
    label: t.voice_name || "Дополнительная озвучка",
  }))];
  return options.map(option => `<option value="${escapeHtml(option.value)}"${option.value === (selectedVoiceId || "original") ? " selected" : ""}>${escapeHtml(option.label)}</option>`).join("");
}

function renderAudioPlaylistEntries() {
  if (!playlistEls.entries || !selectedAudioPlaylist) return;
  const playlist = selectedAudioPlaylist;
  const editable = playlistCanEdit(playlist);
  playlistEls.entries.innerHTML = "";
  if (!playlist.items.length) {
    playlistEls.entries.innerHTML = '<div class="playlist-empty playlist-empty-large">Здесь пока пусто. Нажми «Добавить треки», чтобы собрать свою очередь.</div>';
    return;
  }
  playlist.items.forEach((entry, index) => {
    const record = allAudioRecords.find(r => r.id === entry.audio_id);
    const row = document.createElement("div");
    row.className = "playlist-entry";
    const title = record?.title || "Аудио недоступно";
    const author = record ? displayNameFor(record.owner_code, record.owner_name) : "Возможно, удалено или скрыто";
    const cover = record?.cover_r2_url
      ? `<img src="${escapeHtml(record.cover_r2_url)}" alt="" loading="lazy">`
      : '<span>♫</span>';
    row.innerHTML = `
      <span class="playlist-entry-number">${index + 1}</span>
      <span class="playlist-entry-cover">${cover}</span>
      <span class="playlist-entry-main">
        <span class="playlist-entry-title">${escapeHtml(title)}</span>
        <span class="playlist-entry-author">${escapeHtml(author)}</span>
        <select class="playlist-entry-voice" data-entry-voice="${index}" aria-label="Дорожка аудио" ${editable && record ? "" : "disabled"}>
          ${playlistVoiceOptionsHtml(entry.audio_id, entry.voice_id)}
        </select>
      </span>
      ${editable ? `<span class="playlist-entry-actions">
        <button type="button" data-entry-move="-1" data-entry-index="${index}" title="Выше" ${index === 0 ? "disabled" : ""}>↑</button>
        <button type="button" data-entry-move="1" data-entry-index="${index}" title="Ниже" ${index === playlist.items.length - 1 ? "disabled" : ""}>↓</button>
        <button type="button" data-entry-remove="${index}" title="Убрать из плейлиста">×</button>
      </span>` : ""}`;
    playlistEls.entries.appendChild(row);
  });

  playlistEls.entries.querySelectorAll("[data-entry-move]").forEach(button => {
    button.addEventListener("click", async () => {
      const from = Number(button.dataset.entryIndex);
      const to = from + Number(button.dataset.entryMove);
      if (to < 0 || to >= selectedAudioPlaylist.items.length) return;
      const [item] = selectedAudioPlaylist.items.splice(from, 1);
      selectedAudioPlaylist.items.splice(to, 0, item);
      await saveAudioPlaylist(selectedAudioPlaylist);
      renderAudioPlaylistEntries();
    });
  });
  playlistEls.entries.querySelectorAll("[data-entry-remove]").forEach(button => {
    button.addEventListener("click", async () => {
      selectedAudioPlaylist.items.splice(Number(button.dataset.entryRemove), 1);
      await saveAudioPlaylist(selectedAudioPlaylist);
      renderAudioPlaylistDetail();
    });
  });
  playlistEls.entries.querySelectorAll("[data-entry-voice]").forEach(select => {
    select.addEventListener("change", async () => {
      const entry = selectedAudioPlaylist.items[Number(select.dataset.entryVoice)];
      if (!entry) return;
      entry.voice_id = select.value;
      await saveAudioPlaylist(selectedAudioPlaylist);
    });
  });
}

async function saveAudioPlaylist(playlist) {
  playlist.updated_at = new Date().toISOString();
  writeLocalPlaylists();
  renderAudioPlaylistLists();
  if (playlist.is_public && playlistIsMine(playlist)) {
    try {
      await syncPublicAudioPlaylist(playlist);
    } catch (error) {
      console.error("[playlists] Не удалось синхронизировать публичный плейлист:", error);
      showToast("Изменения сохранены у тебя, но не удалось обновить публичный плейлист: " + error.message);
    }
  }
}

async function syncPublicAudioPlaylist(playlist) {
  if (!db) throw new Error("Supabase не настроен");
  const payload = {
    title: playlist.title,
    owner_code: currentIdentity.code,
    owner_name: currentIdentity.name,
    is_public: true,
    category_id: playlist.category_id || null,
    updated_at: new Date().toISOString(),
  };
  if (!playlist.remote_id) {
    const { data, error } = await db.from(PLAYLISTS_TABLE).insert(payload).select("id").single();
    if (error) throw error;
    playlist.remote_id = data.id;
    playlist.id = `remote-${data.id}`;
  } else {
    const { error } = await db.from(PLAYLISTS_TABLE).update(payload)
      .eq("id", playlist.remote_id).eq("owner_code", currentIdentity.code);
    if (error) throw error;
  }
  const { error: deleteError } = await db.from(PLAYLIST_ITEMS_TABLE).delete().eq("playlist_id", playlist.remote_id);
  if (deleteError) throw deleteError;
  if (playlist.items.length) {
    const rows = playlist.items.map((entry, position) => ({
      playlist_id: playlist.remote_id,
      audio_id: entry.audio_id,
      voice_track_id: entry.voice_id && entry.voice_id !== "original" ? entry.voice_id : null,
      position,
    }));
    const { error: insertError } = await db.from(PLAYLIST_ITEMS_TABLE).insert(rows);
    if (insertError) throw insertError;
  }
  writeLocalPlaylists();
}

async function setPlaylistPublic(shouldPublish, categoryId = null) {
  const playlist = selectedAudioPlaylist;
  if (!playlist || !playlistCanEdit(playlist)) return;
  if (shouldPublish) {
    if (!db) {
      showToast("Для публикации настрой Supabase. Локальный плейлист уже сохранён.");
      return;
    }
    if (!categoryId) {
      showToast("Выбери раздел для публикации");
      return;
    }
    const previous = playlist.is_public;
    const previousCategory = playlist.category_id;
    const previousId = playlist.id;
    const previousRemoteId = playlist.remote_id;
    playlist.category_id = categoryId;
    playlist.is_public = true;
    try {
      await syncPublicAudioPlaylist(playlist);
      showToast("Плейлист опубликован в ленте 🌐");
    } catch (error) {
      if (!previousRemoteId && playlist.remote_id) {
        await db.from(PLAYLISTS_TABLE).delete().eq("id", playlist.remote_id).eq("owner_code", currentIdentity.code);
        playlist.remote_id = null;
        playlist.id = previousId;
      }
      playlist.is_public = previous;
      playlist.category_id = previousCategory;
      writeLocalPlaylists();
      console.error("[playlists] Ошибка публикации:", error);
      showToast("Не удалось опубликовать плейлист: " + error.message);
    }
  } else {
    if (playlist.remote_id && !db) {
      showToast("Нужна связь с Supabase, чтобы убрать публичный плейлист из общего списка.");
      return;
    }
    if (playlist.remote_id && db) {
      const { error } = await db.from(PLAYLISTS_TABLE).delete()
        .eq("id", playlist.remote_id).eq("owner_code", currentIdentity.code);
      if (error) {
        showToast("Не удалось сделать плейлист приватным: " + error.message);
        return;
      }
    }
    playlist.is_public = false;
    playlist.remote_id = null;
    playlist.id = `local-${(crypto.randomUUID ? crypto.randomUUID() : Date.now())}`;
    showToast("Теперь плейлист виден только тебе 🔒");
  }
  writeLocalPlaylists();
  await loadAudioPlaylists();
  selectedAudioPlaylist = getAudioPlaylist(playlist.id) || playlist;
  renderAudioPlaylistLists();
  await renderAudioPlaylistDetail();
}

function openPlaylistPublishForm() {
  const playlist = selectedAudioPlaylist;
  if (!playlist || !playlistCanEdit(playlist)) return;
  if (!db) {
    showToast("Для публикации нужна подключённая Supabase");
    return;
  }
  if (playlistEls.publishCategory && typeof allCategories !== "undefined") {
    playlistEls.publishCategory.innerHTML = "";
    allCategories.forEach(category => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      playlistEls.publishCategory.appendChild(option);
    });
    const newOption = document.createElement("option");
    newOption.value = "__new__";
    newOption.textContent = "➕ Создать свой раздел...";
    playlistEls.publishCategory.appendChild(newOption);
    playlistEls.publishCategory.value = playlist.category_id || allCategories[0]?.id || "__new__";
  }
  playlistEls.publishNewCategoryName && (playlistEls.publishNewCategoryName.value = "");
  playlistEls.publishNewCategoryWrap?.classList.toggle("hidden", playlistEls.publishCategory?.value !== "__new__");
  playlistEls.publishModal?.classList.add("active");
}

async function confirmPlaylistPublish() {
  let categoryId = playlistEls.publishCategory?.value || "";
  if (categoryId === "__new__") {
    const name = playlistEls.publishNewCategoryName?.value.trim();
    if (!name) { showToast("Введи название нового раздела"); return; }
    const created = await createPendingCategory(name, currentIdentity?.name, currentIdentity?.code);
    if (!created) { showToast("Не удалось создать раздел"); return; }
    categoryId = created.id;
  }
  if (!categoryId) { showToast("Выбери раздел"); return; }
  playlistEls.publishConfirm && (playlistEls.publishConfirm.disabled = true);
  try {
    await setPlaylistPublic(true, categoryId);
    if (selectedAudioPlaylist?.is_public) playlistEls.publishModal?.classList.remove("active");
  } finally {
    if (playlistEls.publishConfirm) playlistEls.publishConfirm.disabled = false;
  }
}
async function renameAudioPlaylist() {
  const playlist = selectedAudioPlaylist;
  if (!playlist || !playlistCanEdit(playlist)) return;
  const value = prompt("Новое название плейлиста:", playlist.title || "");
  if (!value || !value.trim()) return;
  playlist.title = value.trim().slice(0, 80);
  await saveAudioPlaylist(playlist);
  await renderAudioPlaylistDetail();
}

async function deleteAudioPlaylist() {
  const playlist = selectedAudioPlaylist;
  if (!playlist || !playlistCanEdit(playlist)) return;
  if (!confirm(`Удалить плейлист «${playlist.title}»?`)) return;
  if (playlist.remote_id && !db) {
    showToast("Нужна связь с Supabase, чтобы удалить публичный плейлист.");
    return;
  }
  if (playlist.remote_id && db) {
    const { error } = await db.from(PLAYLISTS_TABLE).delete()
      .eq("id", playlist.remote_id).eq("owner_code", currentIdentity.code);
    if (error) {
      showToast("Не удалось удалить публичный плейлист: " + error.message);
      return;
    }
  }
  audioPlaylists = audioPlaylists.filter(p => p !== playlist && p.id !== playlist.id && (!playlist.remote_id || p.remote_id !== playlist.remote_id));
  if (activePlaylistPlayback?.playlistId === playlist.id || activePlaylistPlayback?.playlistId === playlist.remote_id) stopPlaylistPlayback();
  selectedAudioPlaylist = null;
  writeLocalPlaylists();
  renderAudioPlaylistLists();
  playlistSetView("list");
  loadAudioPlaylists();
  showToast("Плейлист удалён");
}

async function openPlaylistTrackPicker() {
  if (!selectedAudioPlaylist || !playlistCanEdit(selectedAudioPlaylist)) return;
  if (!allAudioRecords.length && typeof loadAudio === "function") await loadAudio();
  playlistSetView("picker");
  playlistPickerQuery = "";
  if (playlistEls.pickerSearch) playlistEls.pickerSearch.value = "";
  const ids = allAudioRecords.map(r => r.id);
  await loadPlaylistVoiceOptions(ids);
  renderPlaylistTrackPicker();
}

function renderPlaylistTrackPicker() {
  if (!playlistEls.pickerList) return;
  const query = playlistPickerQuery.trim().toLowerCase();
  const records = allAudioRecords.filter(record => {
    if (!query) return true;
    const title = (record.title || "").toLowerCase();
    const author = displayNameFor(record.owner_code, record.owner_name).toLowerCase();
    return title.includes(query) || author.includes(query);
  });
  playlistEls.pickerList.innerHTML = "";
  if (!records.length) {
    playlistEls.pickerList.innerHTML = '<div class="playlist-empty">Ничего не найдено.</div>';
    return;
  }
  records.forEach(record => {
    const row = document.createElement("div");
    row.className = "playlist-track-pick";
    const cover = record.cover_r2_url
      ? `<img src="${escapeHtml(record.cover_r2_url)}" alt="" loading="lazy">`
      : '<span>♫</span>';
    row.innerHTML = `
      <span class="playlist-pick-cover">${cover}</span>
      <span class="playlist-pick-main">
        <span class="playlist-pick-name">${escapeHtml(record.title || "Без названия")}</span>
        <span class="playlist-pick-author">${escapeHtml(displayNameFor(record.owner_code, record.owner_name))}</span>
        <select class="playlist-pick-voice" aria-label="Выбрать звуковую дорожку">
          ${playlistVoiceOptionsHtml(record.id, "original")}
        </select>
      </span>
      <button class="pick-btn small playlist-add-one" type="button">Добавить</button>`;
    row.querySelector(".playlist-add-one").addEventListener("click", async () => {
      const voiceId = row.querySelector(".playlist-pick-voice")?.value || "original";
      selectedAudioPlaylist.items.push({ audio_id: record.id, voice_id: voiceId });
      await saveAudioPlaylist(selectedAudioPlaylist);
      showToast(`«${record.title || "Аудио"}» добавлено в плейлист`);
    });
    playlistEls.pickerList.appendChild(row);
  });
}

function getPlaylistAudioRecord(audioId) {
  return allAudioRecords.find(record => record.id === audioId) || null;
}

async function playPlaylistAt(index, skipped = 0) {
  const playback = activePlaylistPlayback;
  if (!playback || !playback.entries.length) return;
  if (skipped >= playback.entries.length) {
    showToast("В этом плейлисте нет доступных аудиозаписей");
    stopPlaylistPlayback();
    return;
  }
  const length = playback.entries.length;
  const safeIndex = ((index % length) + length) % length;
  const entry = playback.entries[safeIndex];
  let record = getPlaylistAudioRecord(entry.audio_id);
  if (!record && db) {
    const { data } = await db.from(AUDIO_TABLE)
      .select("id,title,description,r2_key,r2_url,duration_sec,cover_r2_key,cover_r2_url,owner_code,owner_name,followers_only,category_id,created_at")
      .eq("id", entry.audio_id).maybeSingle();
    if (data && canSeeRecord(data)) record = data;
  }
  if (!record || !record.r2_url || !canSeeRecord(record)) {
    showToast("Один из треков плейлиста недоступен — пропускаю его");
    return playPlaylistAt(safeIndex + 1, skipped + 1);
  }
  playback.index = safeIndex;
  await openAudioLightbox(record, safeIndex, true);
  const wantedVoice = entry.voice_id || "original";
  if (wantedVoice !== "original" && currentAudioVoiceTracks.some(track => track.id === wantedVoice)) {
    await selectAudioVoice(wantedVoice);
  }
  updateAudioPipState();
}

function startAudioPlaylist(playlist) {
  if (!playlist?.items?.length) {
    showToast("В этом плейлисте пока нет треков");
    return;
  }
  activePlaylistPlayback = {
    playlistId: playlist.id,
    title: playlist.title,
    entries: playlist.items.map(item => ({ ...item })),
    index: 0,
  };
  playPlaylistAt(0);
}

function navigatePlaylistPlayback(delta) {
  if (!activePlaylistPlayback?.entries?.length) return false;
  playPlaylistAt(activePlaylistPlayback.index + delta);
  return true;
}

function handlePlaylistTrackEnded() {
  if (!activePlaylistPlayback?.entries?.length) return false;
  playPlaylistAt(activePlaylistPlayback.index + 1);
  return true;
}

function stopPlaylistPlayback() {
  activePlaylistPlayback = null;
  updateAudioPipState();
}

function hasActivePlaylistPlayback() {
  return !!activePlaylistPlayback?.entries?.length;
}

function getActivePlaylistLength() {
  return activePlaylistPlayback?.entries?.length || 0;
}

function getActivePlaylistIndex() {
  return activePlaylistPlayback?.index || 0;
}

// Document Picture-in-Picture: дополнительные стрелки переключают треки плейлиста.
function updatePlaylistPipControls() {
  if (!audioPipWindow || audioPipWindow.closed) return;
  const previous = audioPipWindow.document.getElementById("pipPrevTrack");
  const next = audioPipWindow.document.getElementById("pipNextTrack");
  const show = hasActivePlaylistPlayback() && getActivePlaylistLength() > 1;
  if (previous) previous.style.display = show ? "inline-flex" : "none";
  if (next) next.style.display = show ? "inline-flex" : "none";
}

// Переключение между каталогом аудио и лентой плейлистов.
playlistEls.audioLibrary?.addEventListener("click", () => {
  currentAudioSectionMode = "audio";
  playlistEls.audioLibrary.classList.add("active");
  playlistEls.audioPlaylists?.classList.remove("active");
  playlistEls.modal?.classList.add("hidden");
  document.getElementById("uploadAudioBtn")?.classList.remove("hidden");
  playlistEls.create?.classList.add("hidden");
  document.getElementById("galleryPlaylists")?.classList.add("hidden");
  document.getElementById("galleryAudio")?.classList.remove("hidden");
  if (typeof applyAudioSearch === "function") applyAudioSearch();
});
playlistEls.audioPlaylists?.addEventListener("click", showAudioPlaylists);

playlistEls.create?.addEventListener("click", createLocalAudioPlaylist);
playlistEls.createCancel?.addEventListener("click", () => playlistEls.createModal?.classList.remove("active"));
playlistEls.createSave?.addEventListener("click", saveNewLocalAudioPlaylist);
playlistEls.createTitle?.addEventListener("keydown", event => {
  if (event.key === "Enter") saveNewLocalAudioPlaylist();
});
playlistEls.publishCancel?.addEventListener("click", () => playlistEls.publishModal?.classList.remove("active"));
playlistEls.publishConfirm?.addEventListener("click", confirmPlaylistPublish);
playlistEls.back?.addEventListener("click", () => {
  selectedAudioPlaylist = null;
  playlistSetView("list");
  loadAudioPlaylists();
});
playlistEls.pickerBack?.addEventListener("click", () => { playlistSetView("detail"); renderAudioPlaylistDetail(); });
playlistEls.play?.addEventListener("click", () => startAudioPlaylist(selectedAudioPlaylist));
playlistEls.add?.addEventListener("click", openPlaylistTrackPicker);
playlistEls.publish?.addEventListener("click", () => selectedAudioPlaylist?.is_public
  ? setPlaylistPublic(false)
  : openPlaylistPublishForm());
playlistEls.rename?.addEventListener("click", renameAudioPlaylist);
playlistEls.remove?.addEventListener("click", deleteAudioPlaylist);
playlistEls.pickerSearch?.addEventListener("input", () => {
  playlistPickerQuery = playlistEls.pickerSearch.value;
  renderPlaylistTrackPicker();
});
// Загружаем личные и публичные подборки по открытию окна; локальные данные
// доступны и без подключённой базы.
