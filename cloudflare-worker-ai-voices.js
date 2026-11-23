/**
 * Burunduki AI Voice Worker
 * Bindings/secrets:
 *   R2_BUCKET (R2 bucket binding)
 *   HF_TOKEN (secret)
 *   R2_PUBLIC_BASE_URL (public R2 custom domain, e.g. https://media.example.com)
 *   ALLOWED_ORIGIN (optional; your Pages/site origin)
 */
const SPACE = "https://hasanbasbunar-voice-cloning-xtts-v2.hf.space";

function cors(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = env.ALLOWED_ORIGIN || "*";
  return {
    "Access-Control-Allow-Origin": allowed === "*" ? "*" : (origin === allowed ? origin : allowed),
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}
function json(data, status, headers) {
  return new Response(JSON.stringify(data), {status, headers:{"Content-Type":"application/json; charset=utf-8", ...headers}});
}
function detectLanguage(text) {
  if (/[\u3040-\u30ff]/.test(text)) return "Japanese";
  if (/[\uac00-\ud7af]/.test(text)) return "Korean";
  if (/[\u4e00-\u9fff]/.test(text)) return "Chinese";
  if (/[\u0600-\u06ff]/.test(text)) return "Arabic";
  if (/[\u0900-\u097f]/.test(text)) return "Hindi";
  if (/[ąćęłńóśźż]/i.test(text)) return "Polish";
  if (/[ăâîșț]/i.test(text)) return "Romanian"; // XTTS has no Romanian; handled below.
  if (/[ğışİ]/.test(text)) return "Turkish";
  if (/[äöüß]/i.test(text)) return "German";
  if (/[àâçéèêëîïôûùüÿœæ]/i.test(text)) return "French";
  if (/[ñ¿¡]/i.test(text)) return "Spanish";
  if (/[ãõ]/i.test(text)) return "Portuguese";
  if (/[іїєґІЇЄҐ]/.test(text)) return "Russian"; // Ukrainian is not in XTTS-v2 language list.
  if (/[а-яёА-ЯЁ]/.test(text)) return "Russian";
  if (/[ěščřžýáíéůďťň]/i.test(text)) return "Czech";
  if (/[őű]/i.test(text)) return "Hungarian";
  if (/[a-z]/i.test(text)) return "English";
  return "English";
}
async function readGradioResult(response) {
  if (!response.ok) throw new Error(`Hugging Face returned HTTP ${response.status}: ${(await response.text()).slice(0,700)}`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const {value, done} = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, {stream:true});
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || "";
    for (const block of blocks) {
      const event = (block.match(/^event:\s*(.+)$/m) || [])[1] || "";
      const dataLine = block.split(/\r?\n/).find(line => line.startsWith("data:"));
      if (!dataLine) continue;
      const payload = dataLine.slice(5).trim();
      if (event === "error") throw new Error(payload || "Hugging Face synthesis failed");
      if (event === "complete") return JSON.parse(payload);
    }
  }
  throw new Error("Hugging Face closed the generation stream without a completed result");
}
function getAudioUrl(result) {
  const item = Array.isArray(result) ? result[0] : result;
  if (typeof item === "string") return item;
  if (item && typeof item === "object") {
    if (item.url) return item.url;
    if (item.path) return item.path.startsWith("http") ? item.path : `${SPACE}/gradio_api/file=${encodeURIComponent(item.path)}`;
  }
  throw new Error("Hugging Face response did not contain an audio file");
}
export default {
  async fetch(request, env) {
    const headers = cors(request, env);
    if (request.method === "OPTIONS") return new Response(null, {status:204, headers});
    const url = new URL(request.url);
    try {
      if (url.pathname === "/upload" && request.method === "POST") {
        if (!env.R2_BUCKET || !env.R2_PUBLIC_BASE_URL) return json({error:"R2_BUCKET binding or R2_PUBLIC_BASE_URL is not configured"},500,headers);
        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File)) return json({error:"Upload field 'file' is required"},400,headers);
        const ext = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g,"");
        if (!["mp3","wav"].includes(ext) || (file.type && !file.type.startsWith("audio/") && file.type !== "application/octet-stream")) return json({error:"XTTS voice samples must be MP3 or WAV"},415,headers);
        if (file.size > 20 * 1024 * 1024) return json({error:"Audio sample must be 20 MB or smaller"},413,headers);
        const key = `ai-voice-samples/${crypto.randomUUID()}.${ext}`;
        await env.R2_BUCKET.put(key, file.stream(), {
          httpMetadata:{contentType:file.type || "application/octet-stream", cacheControl:"public, max-age=31536000, immutable"}
        });
        return json({key, url:`${env.R2_PUBLIC_BASE_URL.replace(/\/$/,"")}/${key}`},201,headers);
      }

      if (url.pathname === "/import" && request.method === "POST") {
        if (!env.R2_BUCKET || !env.R2_PUBLIC_BASE_URL) return json({error:"R2_BUCKET binding or R2_PUBLIC_BASE_URL is not configured"},500,headers);
        const body = await request.json();
        const source = new URL(String(body.url || ""));
        const allowedHosts = [env.SUPABASE_URL ? new URL(env.SUPABASE_URL).host : "", new URL(env.R2_PUBLIC_BASE_URL).host].filter(Boolean);
        if (source.protocol !== "https:" || !allowedHosts.includes(source.host)) return json({error:"Audio import is allowed only from this site's Supabase or configured R2 domain"},400,headers);
        const fetched = await fetch(source.toString());
        if (!fetched.ok) return json({error:`Could not read selected audio (${fetched.status})`},502,headers);
        const contentType = (fetched.headers.get("Content-Type") || "").split(";")[0].toLowerCase();
        const sourceExt = (source.pathname.split(".").pop() || "").toLowerCase();
        const ext = contentType.includes("wav") || sourceExt === "wav" ? "wav" : (contentType.includes("mpeg") || contentType.includes("mp3") || sourceExt === "mp3" ? "mp3" : "");
        if (!ext) return json({error:"The selected gallery audio is not MP3 or WAV. Choose an MP3/WAV track or upload a WAV sample."},415,headers);
        const bytes = await fetched.arrayBuffer();
        if (bytes.byteLength > 20 * 1024 * 1024) return json({error:"Audio sample must be 20 MB or smaller"},413,headers);
        const key = `ai-voice-samples/${crypto.randomUUID()}.${ext}`;
        await env.R2_BUCKET.put(key, bytes, {httpMetadata:{contentType:ext === "wav" ? "audio/wav" : "audio/mpeg", cacheControl:"public, max-age=31536000, immutable"}});
        return json({key, url:`${env.R2_PUBLIC_BASE_URL.replace(/\\/$/,"")}/${key}`},201,headers);
      }

      if (url.pathname === "/generate" && request.method === "POST") {
        if (!env.HF_TOKEN) return json({error:"HF_TOKEN secret is not configured in this Worker"},500,headers);
        const body = await request.json();
        const text = String(body.text || "").trim();
        const referenceAudioUrl = String(body.referenceAudioUrl || "").trim();
        if (!text) return json({error:"Text is required"},400,headers);
        if (text.length > 5000) return json({error:"Text must be 5000 characters or fewer"},413,headers);
        if (!/^https:\/\//i.test(referenceAudioUrl)) return json({error:"Voice sample must be a public HTTPS URL"},400,headers);
        const language = detectLanguage(text);
        const args = [
          text, referenceAudioUrl, null, language,
          0.75, 1.0, true, 5.0, 1.0, 30, 50, 0.85,
          true, -45, 300, 100, "Native XTTS splitting", 250, false
        ];
        const auth = {Authorization:`Bearer ${env.HF_TOKEN}`,"Content-Type":"application/json"};
        const start = await fetch(`${SPACE}/gradio_api/call/voice_clone_synthesis`, {
          method:"POST", headers:auth, body:JSON.stringify({data:args})
        });
        if (!start.ok) return json({error:`Could not start Hugging Face job (${start.status}): ${(await start.text()).slice(0,500)}`},502,headers);
        const started = await start.json();
        if (!started.event_id) return json({error:"Hugging Face did not return a job ID"},502,headers);
        const stream = await fetch(`${SPACE}/gradio_api/call/voice_clone_synthesis/${started.event_id}`, {
          headers:{Authorization:`Bearer ${env.HF_TOKEN}`, Accept:"text/event-stream"}
        });
        const result = await readGradioResult(stream);
        const audioUrl = getAudioUrl(result);
        const absoluteAudioUrl = audioUrl.startsWith("http") ? audioUrl : `${SPACE}${audioUrl.startsWith("/") ? "" : "/"}${audioUrl}`;
        const audioResponse = await fetch(absoluteAudioUrl, {headers:{Authorization:`Bearer ${env.HF_TOKEN}`}});
        if (!audioResponse.ok) throw new Error(`Could not download generated audio (${audioResponse.status})`);
        const contentType = audioResponse.headers.get("Content-Type") || "audio/mpeg";
        return new Response(audioResponse.body, {status:200, headers:{
          ...headers, "Content-Type":contentType, "Content-Disposition":'attachment; filename="burunduki-generated.mp3"',
          "Cache-Control":"no-store"
        }});
      }
      return json({error:"Not found. Use POST /upload or POST /generate."},404,headers);
    } catch (error) {
      return json({error:error?.message || String(error)},500,headers);
    }
  }
};
