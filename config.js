// Р”Р°РЅРЅС‹Рµ РёР· С‚РІРѕРµРіРѕ РїСЂРѕРµРєС‚Р° Supabase (Settings -> API)
// SUPABASE_URL РІС‹РіР»СЏРґРёС‚ РєР°Рє https://xxxxxxxx.supabase.co
// SUPABASE_ANON_KEY вЂ” РґР»РёРЅРЅС‹Р№ РїСѓР±Р»РёС‡РЅС‹Р№ РєР»СЋС‡ "anon public"
// Р­С‚Рѕ РќР• СЃРµРєСЂРµС‚РЅС‹Рµ РґР°РЅРЅС‹Рµ вЂ” РёС… РјРѕР¶РЅРѕ СЃРїРѕРєРѕР№РЅРѕ РєР»Р°СЃС‚СЊ РІ РїСѓР±Р»РёС‡РЅС‹Р№ СЂРµРїРѕР·РёС‚РѕСЂРёР№,
// РґРѕСЃС‚СѓРї РЅР° Р·Р°РїРёСЃСЊ РѕРіСЂР°РЅРёС‡РёРІР°РµС‚СЃСЏ РїСЂР°РІРёР»Р°РјРё (RLS) РІ СЃР°РјРѕРј Supabase.

const SUPABASE_URL = "https://hsohgexbhznvmxbotjpp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Kk6XOHgc6T1m9thx6ga33g_VAQj-xxk";
const BUCKET_NAME = "burunduki";

// РўРѕС‚ Р¶Рµ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёР№ Cloudflare Worker РѕР±СЃР»СѓР¶РёРІР°РµС‚ РёРіСЂРѕРІРѕР№ РїСЂРѕРєСЃРё, R2-Р°СѓРґРёРѕ Рё РР-РѕР·РІСѓС‡РєСѓ.
// РЎРµРєСЂРµС‚ HF_TOKEN С…СЂР°РЅРёС‚СЃСЏ С‚РѕР»СЊРєРѕ РІ РЅР°СЃС‚СЂРѕР№РєР°С… Worker, РЅРµ РІ РїСѓР±Р»РёС‡РЅРѕРј JavaScript.
const CLOUDFLARE_WORKER_URL = "https://burunduki-audio-ai.kubvkube9.workers.dev";
const AI_VOICE_WORKER_URL = CLOUDFLARE_WORKER_URL;
const AUDIO_R2_PUBLIC_BASE_URL = "https://pub-37df58c1c5c44cc797e3ba6cb6266d12.r2.dev";

