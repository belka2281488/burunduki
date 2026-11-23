/**
 * Burunduki unified Cloudflare Worker.
 * Reuses the existing Worker hostname: mute-grass-7ad4.popatuka0488.workers.dev
 * Routes:
 *   GET  /?id=<Google-Drive-file-id>  - existing game ZIP proxy
 *   POST /audio/upload?folder=audio|audio-covers|audio-voices - upload audio to R2
 *   DELETE /audio/object?key=<R2-key> - delete an audio object from R2
 *   POST /admin/migrate-audio - migrate Supabase audio objects to R2, then delete source objects
 *
 * Bindings: R2_BUCKET (existing R2 bucket)
 * Vars: R2_PUBLIC_BASE_URL, SUPABASE_URL, ALLOWED_ORIGIN
 * Secrets: SUPABASE_SERVICE_ROLE_KEY, AUDIO_MIGRATION_SECRET
 */
const AUDIO_FOLDERS = new Set(["audio", "audio-covers", "audio-voices"]);
const SUPABASE_BUCKET = "burunduki";

function cors(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = env.ALLOWED_ORIGIN || "https://belka2281488.github.io";
  const permitted = allowed === "*" || origin === allowed;
  return {
    "Access-Control-Allow-Origin": permitted ? (allowed === "*" ? "*" : origin) : allowed,
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}
function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...headers } });
}
function publicUrl(env, key) {
  const base = String(env.R2_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  return `${base}/${String(key).split("/").map(encodeURIComponent).join("/")}`;
}
function safeAudioKey(key) {
  return typeof key === "string" && /^(audio|audio-covers|audio-voices)\/[A-Za-z0-9._/-]+$/.test(key) && !key.includes("..") && !key.startsWith("/");
}

function supabaseHeaders(env, extra = {}) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  return { apikey: key, Authorization: `Bearer ${key}`, ...extra };
}
async function listSupabaseFolder(env, prefix) {
  const all = [];
  for (let offset = 0; ; offset += 1000) {
    const response = await fetch(`${env.SUPABASE_URL}/storage/v1/object/list/${SUPABASE_BUCKET}`, {
      method: "POST", headers: supabaseHeaders(env, { "Content-Type": "application/json" }),
      body: JSON.stringify({ prefix, limit: 1000, offset, sortBy: { column: "name", order: "asc" } })
    });
    if (!response.ok) throw new Error(`Supabase list ${prefix} failed (${response.status}): ${(await response.text()).slice(0, 400)}`);
    const rows = await response.json();
    const files = (Array.isArray(rows) ? rows : []).filter(item => item && item.name && (item.id || item.metadata || item.updated_at || item.created_at));
    all.push(...files.map(item => `${prefix}/${item.name}`));
    if (!Array.isArray(rows) || rows.length < 1000) break;
  }
  return all;
}
async function updateAudioMetadata(env, key) {
  const root = env.SUPABASE_URL.replace(/\/$/, "");
  const headers = supabaseHeaders(env, { "Content-Type": "application/json", Prefer: "return=representation" });
  const url = publicUrl(env, key);
  let endpoint = null, field = null;
  if (key.startsWith("audio/")) { endpoint = "burunduk_audio"; field = "r2_key"; }
  else if (key.startsWith("audio-covers/")) { endpoint = "burunduk_audio"; field = "cover_r2_key"; }
  else if (key.startsWith("audio-voices/")) { endpoint = "burunduk_audio_voices"; field = "storage_key"; }
  else return false;
  const patch = new URL(`${root}/rest/v1/${endpoint}`);
  patch.searchParams.set(field, `eq.${key}`);
  const payload = endpoint === "burunduk_audio_voices" ? { storage_url: url } : (field === "r2_key" ? { r2_url: url } : { cover_r2_url: url });
  const response = await fetch(patch, { method: "PATCH", headers, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(`Supabase metadata update failed for ${key} (${response.status}): ${(await response.text()).slice(0, 300)}`);
  const updated = await response.json();
  return Array.isArray(updated) && updated.length > 0;
}
async function migrateAudio(env, execute) {
  if (!env.R2_BUCKET || !env.R2_PUBLIC_BASE_URL) throw new Error("R2_BUCKET / R2_PUBLIC_BASE_URL are not configured");
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured");
  const keys = [];
  for (const folder of AUDIO_FOLDERS) keys.push(...await listSupabaseFolder(env, folder));
  const uniqueKeys = [...new Set(keys)].filter(safeAudioKey);
  if (!execute) return { mode: "preview", total: uniqueKeys.length, byFolder: Object.fromEntries([...AUDIO_FOLDERS].map(f => [f, uniqueKeys.filter(k => k.startsWith(`${f}/`)).length])), keys: uniqueKeys };

  const moved = [];
  for (const key of uniqueKeys) {
    const source = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${key}`, { headers: supabaseHeaders(env) });
    if (!source.ok) throw new Error(`Cannot read Supabase object ${key} (${source.status}); nothing has been deleted from Supabase`);
    const contentType = source.headers.get("Content-Type") || "application/octet-stream";
    await env.R2_BUCKET.put(key, source.body, { httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" } });
    const head = await env.R2_BUCKET.head(key);
    if (!head || (source.headers.get("Content-Length") && Number(source.headers.get("Content-Length")) !== head.size)) {
      throw new Error(`R2 verification failed for ${key}; Supabase originals are preserved`);
    }
    const metadataUpdated = await updateAudioMetadata(env, key);
    if (!metadataUpdated) {
      // Preserve source if this object is not linked to a known audio record.
      continue;
    }
    moved.push(key);
  }

  // Delete source objects only after every copy and corresponding metadata update succeeded.
  for (let i = 0; i < moved.length; i += 100) {
    const batch = moved.slice(i, i + 100);
    const response = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}`, {
      method: "DELETE", headers: supabaseHeaders(env, { "Content-Type": "application/json" }),
      body: JSON.stringify({ prefixes: batch })
    });
    if (!response.ok) throw new Error(`R2 copy completed, but Supabase source deletion failed (${response.status}): ${(await response.text()).slice(0, 400)}`);
  }
  return { mode: "migrated", total: moved.length, deletedFromSupabase: moved.length, preservedUnlinked: uniqueKeys.length - moved.length, byFolder: Object.fromEntries([...AUDIO_FOLDERS].map(f => [f, moved.filter(k => k.startsWith(`${f}/`)).length])) };
}

export default {
  async fetch(request, env) {
    const headers = cors(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    const url = new URL(request.url);
    try {
      // Existing game ZIP proxy remains on the same Worker URL and same ?id= interface.
      if (url.pathname === "/" && request.method === "GET" && url.searchParams.has("id")) {
        const id = url.searchParams.get("id");
        if (!/^[A-Za-z0-9_-]+$/.test(id)) return json({ error: "Invalid Google Drive file ID" }, 400, headers);
        const upstream = await fetch(`https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`, {
          redirect: "follow", headers: { "User-Agent": "Mozilla/5.0" }
        });
        const out = new Headers(headers);
        out.set("Content-Type", upstream.headers.get("Content-Type") || "application/octet-stream");
        out.set("Cache-Control", "no-store");
        const disposition = upstream.headers.get("Content-Disposition");
        if (disposition) out.set("Content-Disposition", disposition);
        return new Response(upstream.body, { status: upstream.status, headers: out });
      }

      if (url.pathname === "/audio/upload" && request.method === "POST") {
        if (!env.R2_BUCKET || !env.R2_PUBLIC_BASE_URL) return json({ error: "R2 binding or public URL is not configured" }, 500, headers);
        const folder = url.searchParams.get("folder") || "";
        if (!AUDIO_FOLDERS.has(folder)) return json({ error: "Invalid audio folder" }, 400, headers);
        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File)) return json({ error: "Upload field 'file' is required" }, 400, headers);
        if (!file.size) return json({ error: "The selected file is empty" }, 400, headers);
        if (file.size > 500 * 1024 * 1024) return json({ error: "Audio file exceeds 500 MB" }, 413, headers);
        const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10) || "bin";
        const key = `${folder}/${crypto.randomUUID()}.${ext}`;
        await env.R2_BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type || "application/octet-stream", cacheControl: "public, max-age=31536000, immutable" } });
        return json({ key, url: publicUrl(env, key), size: file.size }, 201, headers);
      }

      if (url.pathname === "/audio/object" && request.method === "DELETE") {
        const key = url.searchParams.get("key") || "";
        if (!safeAudioKey(key)) return json({ error: "Invalid R2 key" }, 400, headers);
        await env.R2_BUCKET.delete(key);
        return json({ ok: true }, 200, headers);
      }


      if (url.pathname === "/admin/migrate-audio" && request.method === "POST") {
        if (!env.AUDIO_MIGRATION_SECRET || request.headers.get("Authorization") !== `Bearer ${env.AUDIO_MIGRATION_SECRET}`) return json({ error: "Unauthorized" }, 401, headers);
        const body = await request.json().catch(() => ({}));
        const execute = body.confirmMoveAndDelete === true;
        const result = await migrateAudio(env, execute);
        return json({ ok: true, ...result }, 200, headers);
      }

      return json({ error: "Not found" }, 404, headers);
    } catch (error) {
      return json({ error: error?.message || String(error) }, 500, headers);
    }
  }
};
