import { createClient } from "npm:@supabase/supabase-js@2.116.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SECRET_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ALLOWED = (Deno.env.get("INVITE_ALLOWED_ORIGINS") || "*").split(",").map(v => v.trim()).filter(Boolean);
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

function cors(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allow = ALLOWED.includes("*") ? "*" : ALLOWED.includes(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8"
  };
}
function json(req: Request, body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: cors(req) }); }
function cleanText(v: unknown, max = 500) { return String(v ?? "").trim().slice(0, max); }

// Não expor configurações brutas: imagens, endpoints e código permanecem fixos no template.
const EDITABLE_TEXT_PATHS = new Set([
  "couple.firstName","couple.secondName","couple.initials","couple.signature",
  "wedding.longDate","wedding.shortDate","wedding.weekday","wedding.day","wedding.month","wedding.year","wedding.time","wedding.city",
  "opening.eyebrow","opening.title","opening.hint","opening.buttonLabel","opening.guestPrefix",
  "hero.eyebrow","hero.subtitle","hero.primaryButton","hero.secondaryButton",
  "welcome.eyebrow","welcome.title","welcome.text",
  "story.pretitle","story.phrase","story.eyebrow","story.title","story.year","story.paragraphs","story.quote",
  "schedule.eyebrow","schedule.title","schedule.note",
  "gallery.eyebrow","gallery.title",
  "dressCode.eyebrow","dressCode.title","dressCode.text","dressCode.note",
  "guestInfo.eyebrow","guestInfo.title","faq.eyebrow","faq.title",
  "rsvp.eyebrow","rsvp.title","rsvp.text","rsvp.deadline","rsvp.buttonLabel",
  "footer.text","details.eyebrow","details.title",
  "gifts.title","gifts.eyebrow","gifts.intro","gifts.notice",
  "events.0.label","events.0.time","events.0.venue","events.0.address",
  "events.1.label","events.1.time","events.1.venue","events.1.address"
]);
const SECTION_KEYS = new Set(["opening","welcome","story","details","schedule","gallery","dressCode","guestInfo","faq","rsvp","gifts","music"]);
const COLOR_KEYS = new Set(["background","surface","surfaceAlt","text","muted","accent","accentDark","accentSoft","warm","line","heroText"]);
const THEME_KEYS = new Set(["sage","champagne","dusk","dustyBlue","navyBlue","royalBlue","deepBlue"]);
const FONT_KEYS = new Set(["classic","editorial","modern","romantic"]);
// Apenas os códigos dos presentes previstos no catálogo podem ser publicados.
const GIFT_IDS = new Set([
  "cafe-da-manha", "jogo-de-tacas", "kit-fondue", "jantar-a-dois", "cama-mesa-banho",
  "air-fryer", "mala-de-viagem", "experiencia-gastronomica", "passeio-lua-de-mel",
  "jantar-lua-de-mel", "diaria-hotel", "passeio-barco", "upgrade-quarto",
  "fim-de-semana", "cota-especial"
]);
function publishedSettings(data: any) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const out: Record<string,unknown> = {};
  if (THEME_KEYS.has(data.themePreset)) out.themePreset = data.themePreset;
  if (FONT_KEYS.has(data.fontPreset)) out.fontPreset = data.fontPreset;
  if (data.sections && typeof data.sections === "object") {
    out.sections = Object.fromEntries(Object.entries(data.sections).filter(([key,value]) => SECTION_KEYS.has(key) && typeof value === "boolean"));
  }
  if (data.colors && typeof data.colors === "object") {
    out.colors = Object.fromEntries(Object.entries(data.colors).filter(([key,value]) => COLOR_KEYS.has(key) && typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)));
  }
  if (data.text && typeof data.text === "object") {
    out.text = Object.fromEntries(Object.entries(data.text).filter(([key,value]) => EDITABLE_TEXT_PATHS.has(key) && typeof value === "string" && value.length <= (key === "story.paragraphs" ? 3000 : 700)));
  }
  const pay = data.payment;
  if (pay && typeof pay === "object") {
    const codes = pay.giftPixCodes && typeof pay.giftPixCodes === "object" && !Array.isArray(pay.giftPixCodes) ? pay.giftPixCodes : {};
    out.payment = {
      mode: pay.mode === "perGift" ? "perGift" : "noAmount",
      pixLink: typeof pay.pixLink === "string" && /^https:\/\/[^\s]+$/i.test(pay.pixLink) ? pay.pixLink.slice(0,600) : "",
      pixCode: typeof pay.pixCode === "string" ? pay.pixCode.slice(0,1500) : "",
      giftPixCodes: Object.fromEntries(Object.entries(codes).filter(([id, code]) => GIFT_IDS.has(id) && typeof code === "string" && code.length <= 1500 && code.trim().length > 0)),
      receiverName: typeof pay.receiverName === "string" ? pay.receiverName.slice(0,120) : ""
    };
  }
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "Método não permitido" }, 405);
  if (!ALLOWED.includes("*") && !ALLOWED.includes(req.headers.get("origin") || "")) return json(req, { error: "Origem não permitida" }, 403);

  try {
    const body = await req.json();
    const action = cleanText(body.action, 20);
    const token = cleanText(body.token, 120);
    if (!token || token.length < 20) return json(req, { error: "Convite inválido" }, 400);

    const { data: invitation, error } = await db.from("invitations")
      .select("id,display_name,seats,active,wedding_id,weddings(name,event_date),invitation_members(name,sort_order),rsvps(attending,guest_count,submitted_name,guest_names,message,responded_at)")
      .eq("token", token).maybeSingle();
    if (error) throw error;
    if (!invitation || !invitation.active) return json(req, { error: "Convite não encontrado" }, 404);

    const existing = Array.isArray(invitation.rsvps) ? invitation.rsvps[0] || null : invitation.rsvps || null;
    const wedding = Array.isArray(invitation.weddings) ? invitation.weddings[0] : invitation.weddings;
    const members = Array.isArray(invitation.invitation_members)
      ? [...invitation.invitation_members].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)).map((m: any) => cleanText(m.name, 160)).filter(Boolean)
      : [];

    if (action === "lookup") {
      const { data: custom, error: customizationError } = await db.from("wedding_customizations")
        .select("settings").eq("wedding_id", invitation.wedding_id).maybeSingle();
      if (customizationError) throw customizationError;
      // O bucket é privado; um token de convite ativo autoriza URLs assinadas.
      const {data: mediaRows, error: mediaError} = await db.from("wedding_media")
        .select("slot,path").eq("wedding_id", invitation.wedding_id);
      if (mediaError) throw mediaError;
      const safeRows = (mediaRows || []).filter(row =>
        /^(hero|story|event[01]|schedule|timeline[0-4]|gallery[0-4]|dressCode|rsvp)\.(desktop|mobile)$/.test(row.slot) &&
        typeof row.path === "string" &&
        row.path.startsWith("weddings/" + invitation.wedding_id + "/" + row.slot + "/") &&
        /\.(webp|jpe?g|png)$/.test(row.path)
      );
      const media: Record<string,string> = {};
      if (safeRows.length) {
        const {data: links,error: signedError} = await db.storage.from("wedding-private-media")
          .createSignedUrls(safeRows.map(row => row.path), 86400);
        if (signedError) console.error("Falha ao gerar URL assinada:",signedError);
        else (links || []).forEach((item,i) => {
          if (item?.signedUrl && !item.error) media[safeRows[i].slot] = item.signedUrl;
        });
      }
      return json(req, {
        media,
        customization: publishedSettings(custom?.settings),
        invitation: {
          displayName: invitation.display_name,
          seats: invitation.seats,
          weddingName: wedding?.name || "",
          eventDate: wedding?.event_date || null,
          members,
          rsvp: existing ? {
            attending: existing.attending,
            guestCount: existing.guest_count,
            submittedName: existing.submitted_name || "",
            guestNames: existing.guest_names || [],
            message: existing.message || "",
            respondedAt: existing.responded_at
          } : null
        }
      });
    }

    if (action === "rsvp") {
      if (existing) return json(req, { error: "Este convite já possui uma confirmação registrada." }, 409);
      if (typeof body.attending !== "boolean") return json(req, { error: "Resposta de presença inválida" }, 400);
      const attending = body.attending;
      const count = attending ? Number(body.guestCount) : 0;
      if (!Number.isInteger(count) || count < 0 || count > invitation.seats) return json(req, { error: `Quantidade permitida: até ${invitation.seats}` }, 400);
      if (attending && count < 1) return json(req, { error: "Informe ao menos 1 pessoa" }, 400);
      const guestNames = Array.isArray(body.guestNames) ? body.guestNames.map((n: unknown) => cleanText(n, 120)).filter(Boolean).slice(0, invitation.seats) : [];
      if (members.length && guestNames.some((name: string) => !members.includes(name))) return json(req, { error: "Um ou mais nomes não pertencem a este convite." }, 400);
      if (members.length && attending && guestNames.length !== count) return json(req, { error: "Selecione exatamente quem estará presente." }, 400);
      const payload = {
        invitation_id: invitation.id,
        attending,
        guest_count: count,
        submitted_name: cleanText(body.submittedName, 160),
        guest_names: guestNames,
        message: cleanText(body.message, 1200),
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { error: insertError } = await db.from("rsvps").insert(payload);
      if (insertError) {
        if (insertError.code === "23505") return json(req, { error: "Este convite já possui uma confirmação registrada." }, 409);
        throw insertError;
      }
      return json(req, { ok: true, message: "Confirmação registrada com sucesso." });
    }

    return json(req, { error: "Ação inválida" }, 400);
  } catch (error) {
    console.error(error);
    return json(req, { error: "Não foi possível processar a solicitação." }, 500);
  }
});
