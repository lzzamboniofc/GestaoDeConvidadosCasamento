const CONFIG = window.GUEST_ADMIN_CONFIG || {};
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const state = { weddings: [], invitations: [], weddingId: null, editId: null, user: null, profile: null, isAdmin: false, accessMembers: [], importRows: [], customization: {}, media: [], coupleCanEditMedia: true };
const DEMO_KEY = "wedding_guest_manager_demo_v1";

const sample = {
  weddings: [
    { id: "demo-wedding", name: "Liliane & Igor", slug: "liliane-igor", event_date: "2027-04-03", invite_base_url: "../convite/" },
    { id: "demo-wedding-2", name: "Amanda & Lucas", slug: "amanda-lucas", event_date: "2027-09-18", invite_base_url: "../convite/" }
  ],
  accessMembers: [
    { id: "access-demo-1", wedding_id: "demo-wedding", user_id: "demo-couple", email: "casal@demo.local", display_name: "Liliane e Igor", access_role: "couple" }
  ],
  invitations: [
    { id: "i1", wedding_id: "demo-wedding", token: "DEMO-FAMILIA-SILVA", display_name: "Família Silva", contact_name: "João Silva", phone: "5515991111111", seats: 4, category: "Família", notes: "", active: true, members: ["João Silva", "Maria Silva", "Pedro Silva", "Ana Silva"], rsvps: [] },
    { id: "i2", wedding_id: "demo-wedding", token: "DEMO-MARIA-SOUZA", display_name: "Maria Souza", contact_name: "Maria Souza", phone: "5515992222222", seats: 1, category: "Amigos", notes: "", active: true, members: ["Maria Souza"], rsvps: [{ attending: true, guest_count: 1, submitted_name: "Maria Souza", guest_names: ["Maria Souza"], message: "", responded_at: new Date().toISOString(), updated_at: new Date().toISOString() }] },
    { id: "i3", wedding_id: "demo-wedding", token: "DEMO-PEDRO-ANA", display_name: "Pedro & Ana", contact_name: "Pedro Costa", phone: "5515993333333", seats: 2, category: "Amigos", notes: "", active: true, members: ["Pedro Costa", "Ana Costa"], rsvps: [{ attending: false, guest_count: 0, submitted_name: "Pedro Costa", guest_names: [], message: "", responded_at: new Date().toISOString(), updated_at: new Date().toISOString() }] }
  ]
};

const clone = value => JSON.parse(JSON.stringify(value));
const loadDemo = () => {
  try {
    const data = JSON.parse(localStorage.getItem(DEMO_KEY)) || clone(sample);
    if (!Array.isArray(data.weddings)) data.weddings = [];
    if (!Array.isArray(data.invitations)) data.invitations = [];
    if (!Array.isArray(data.accessMembers)) data.accessMembers = clone(sample.accessMembers);
    sample.weddings.forEach(w => { if (!data.weddings.some(item => item.id === w.id)) data.weddings.push(clone(w)); });
    return data;
  } catch { return clone(sample); }
};
const saveDemo = data => localStorage.setItem(DEMO_KEY, JSON.stringify(data));
const generateToken = (bytes = 24) => {
  const arr = new Uint8Array(bytes); crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};
const slugify = text => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// Rota pública única: não lê o link antigo do banco nem permite escolher outro modelo.
// Resolve a URL corretamente tanto na Vercel (/admin/) quanto no GitHub Pages (/repo/admin/).
const inviteBaseUrl = () => {
  const url = new URL(CONFIG.defaultInviteBaseUrl || "../convite/", location.href);
  url.search = "";
  url.hash = "";
  return url.href;
};
const buildLink = (invite) => {
  const url = new URL(inviteBaseUrl());
  url.searchParams.set("convite", invite.token);
  return url.href;
};
const rsvpOf = inv => Array.isArray(inv.rsvps) ? inv.rsvps[0] : inv.rsvps || null;
const statusOf = inv => { const r = rsvpOf(inv); return !r ? "pending" : r.attending ? "confirmed" : "declined"; };
const statusLabel = s => ({ pending: "Pendente", confirmed: "Confirmado", declined: "Não irá" }[s]);
const escapeHtml = value => String(value ?? "").replace(/[&<>\"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const toast = text => { const el = $("#toast"); el.textContent = text; el.classList.add("is-visible"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("is-visible"), 2600); };
const parseMembersValue = value => [...new Set(String(value ?? "").split(/[\n;|]+/).map(v => v.trim()).filter(Boolean))].slice(0, 50);
const membersOf = inv => {
  if (Array.isArray(inv?.members)) return inv.members.map(v => typeof v === "string" ? v : v?.name).filter(Boolean);
  if (Array.isArray(inv?.invitation_members)) return [...inv.invitation_members].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map(v => v.name).filter(Boolean);
  return [];
};
const formatDateTime = value => {
  if (!value) return "";
  try { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); } catch { return String(value); }
};

const IMPORT_ALIASES = {
  nome_exibido: "display_name", nome: "display_name", convidado: "display_name", familia: "display_name", display_name: "display_name",
  responsavel: "contact_name", contato: "contact_name", contact_name: "contact_name",
  whatsapp: "phone", telefone: "phone", celular: "phone", phone: "phone",
  lugares: "seats", numero_de_lugares: "seats", quantidade: "seats", seats: "seats",
  membros: "members", integrantes: "members", pessoas: "members", members: "members",
  categoria: "category", category: "category",
  observacao: "notes", observacoes: "notes", notes: "notes"
};
const normalizeHeader = value => String(value ?? "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const maxImportRows = () => Math.max(1, Number(CONFIG.maxImportRows || 500));

async function parseGuestWorkbook(file) {
  if (!window.XLSX) throw new Error("Leitor de Excel não carregado. Verifique sua conexão e tente novamente.");
  const workbook = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
  const preferred = workbook.SheetNames.find(name => normalizeHeader(name) === "convidados");
  const sheetName = preferred || workbook.SheetNames[0];
  if (!sheetName) throw new Error("A planilha não possui nenhuma aba legível.");
  const matrix = window.XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "", raw: false });
  const headerIndex = matrix.findIndex(row => row.some(cell => String(cell ?? "").trim()));
  if (headerIndex < 0) throw new Error("A planilha está vazia.");

  const headerMap = {};
  matrix[headerIndex].forEach((cell, index) => { const key = IMPORT_ALIASES[normalizeHeader(cell)]; if (key && headerMap[key] == null) headerMap[key] = index; });
  if (headerMap.display_name == null || headerMap.seats == null) throw new Error("Cabeçalho inválido. Use o modelo e mantenha pelo menos as colunas nome_exibido e lugares.");

  const valid = []; const errors = []; let ignored = 0; let considered = 0;
  for (let i = headerIndex + 1; i < matrix.length; i++) {
    const row = matrix[i];
    if (!row || !row.some(cell => String(cell ?? "").trim())) continue;
    const get = key => headerMap[key] == null ? "" : String(row[headerMap[key]] ?? "").trim();
    const displayName = get("display_name");
    if (/^exemplo\b/i.test(displayName)) { ignored++; continue; }
    considered++;
    if (considered > maxImportRows()) { errors.push(`Limite excedido: o máximo é ${maxImportRows()} convidados por importação.`); break; }

    const rowNumber = i + 1;
    const seatsText = get("seats").replace(",", ".");
    const seats = Number(seatsText);
    const phoneRaw = get("phone");
    const phone = phoneRaw.replace(/\D/g, "");
    const members = parseMembersValue(get("members"));
    const rowErrors = [];
    if (!displayName) rowErrors.push("nome_exibido é obrigatório");
    if (!Number.isInteger(seats) || seats < 1 || seats > 50) rowErrors.push("lugares deve ser um número inteiro entre 1 e 50");
    if (members.length > seats) rowErrors.push(`há ${members.length} membros, mas o convite possui apenas ${seats} lugares`);
    if (phoneRaw && /e[+-]?\d+/i.test(phoneRaw)) rowErrors.push("WhatsApp está em notação científica; use a coluna do modelo, que já está formatada como texto");
    else if (phoneRaw && (phone.length < 10 || phone.length > 15)) rowErrors.push("WhatsApp deve ter entre 10 e 15 dígitos");
    if (rowErrors.length) { errors.push(`Linha ${rowNumber}: ${rowErrors.join("; ")}.`); continue; }

    valid.push({
      display_name: displayName,
      contact_name: get("contact_name"),
      phone,
      seats,
      members,
      category: get("category"),
      notes: get("notes")
    });
  }
  return { valid, errors, ignored, sheetName };
}

let supabase = null;
if (CONFIG.mode === "supabase") {
  if (!CONFIG.supabaseUrl || !CONFIG.publishableKey || CONFIG.supabaseUrl.includes("SEU-PROJETO")) throw new Error("Preencha supabaseUrl e publishableKey em js/config.js");
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.116.0");
  supabase = createClient(CONFIG.supabaseUrl, CONFIG.publishableKey);
}

async function syncSupabaseMembers(invitationId, members) {
  const { error: deleteError } = await supabase.from("invitation_members").delete().eq("invitation_id", invitationId);
  if (deleteError) throw deleteError;
  if (!members.length) return;
  const payload = members.map((name, index) => ({ invitation_id: invitationId, name, sort_order: index }));
  const { error } = await supabase.from("invitation_members").insert(payload);
  if (error) throw error;
}

const backend = {
  async currentUser() {
    if (CONFIG.mode === "demo") {
      const requested = new URLSearchParams(location.search).get("perfil");
      const demoRole = requested === "casal" ? "couple" : (CONFIG.demoRole || "admin");
      return { id: demoRole === "admin" ? "demo-user" : "demo-couple", email: demoRole === "admin" ? "admin@demo.local" : "casal@demo.local", demoRole };
    }
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user || null;
  },
  async profile(user) {
    if (!user) return null;
    if (CONFIG.mode === "demo") return { user_id: user.id, email: user.email, display_name: user.demoRole === "couple" ? "Liliane e Igor" : "Administrador", role: user.demoRole || "admin" };
    const { data, error } = await supabase.from("profiles").select("user_id,email,display_name,role").eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    return data || { user_id: user.id, email: user.email, display_name: user.email, role: "couple" };
  },
  async logout() { if (CONFIG.mode === "supabase") await supabase.auth.signOut({ scope: "local" }); },
  async weddings() {
    if (CONFIG.mode === "demo") {
      const d = loadDemo();
      if (state.isAdmin) return d.weddings;
      const allowed = new Set((d.accessMembers || []).filter(m => m.user_id === state.user?.id).map(m => m.wedding_id));
      return d.weddings.filter(w => allowed.has(w.id));
    }
    const { data, error } = await supabase.from("weddings").select("*").order("created_at"); if (error) throw error; return data;
  },
  async saveWedding(item) {
    if (!item.id && !state.isAdmin) throw new Error("Somente o administrador pode criar novos casamentos.");
    if (CONFIG.mode === "demo") {
      const d = loadDemo(); const i = d.weddings.findIndex(w => w.id === item.id);
      if (i >= 0) d.weddings[i] = { ...d.weddings[i], ...item }; else d.weddings.push({ ...item, id: crypto.randomUUID() });
      saveDemo(d); return;
    }
    if (item.id) {
      const { error } = await supabase.from("weddings").update({ name: item.name, slug: item.slug, event_date: item.event_date || null, invite_base_url: item.invite_base_url }).eq("id", item.id); if (error) throw error;
    } else {
      const { error } = await supabase.from("weddings").insert({ name: item.name, slug: item.slug, event_date: item.event_date || null, invite_base_url: item.invite_base_url, owner_id: state.user.id }); if (error) throw error;
    }
  },
  async customization(weddingId) {
    if (CONFIG.mode === "demo") return loadDemo().customizations?.[weddingId] || {};
    const {data,error} = await supabase.from("wedding_customizations").select("settings").eq("wedding_id",weddingId).maybeSingle();
    if(error) throw new Error(error.code === '42P01' ? 'Execute a migration_v1_10_to_v1_11.sql no Supabase.' : error.message);
    return data?.settings || {};
  },
  async saveCustomization(weddingId,settings) {
    if(!weddingId || !state.weddings.some(w=>w.id===weddingId)) throw new Error('Escolha um casamento permitido.');
    if(CONFIG.mode === 'demo') {
      const d=loadDemo();d.customizations ||= {};d.customizations[weddingId]=settings;saveDemo(d);return;
    }
    const {error} = await supabase.from('wedding_customizations').upsert({wedding_id:weddingId,settings},{onConflict:'wedding_id'});
    if(error) throw error;
  },
  async mediaEditPermission(weddingId) {
    if (!weddingId) return false;
    if (CONFIG.mode === 'demo') return loadDemo().mediaEditPermissions?.[weddingId] ?? true;
    const {data,error}=await supabase.from('wedding_media_permissions').select('couple_can_edit').eq('wedding_id',weddingId).maybeSingle();
    if(error) throw new Error('Erro ao verificar permissões das fotos: '+error.message);
    return data?.couple_can_edit ?? true;
  },
  async saveMediaEditPermission(weddingId,allowed) {
    if(!state.isAdmin || !state.weddings.some(w=>w.id===weddingId)) throw new Error('Somente o administrador pode definir esta permissão.');
    if(CONFIG.mode==='demo') {
      const d=loadDemo();d.mediaEditPermissions ||= {};d.mediaEditPermissions[weddingId]=Boolean(allowed);saveDemo(d);return;
    }
    const {error}=await supabase.from('wedding_media_permissions').upsert({wedding_id:weddingId,couple_can_edit:Boolean(allowed),updated_at:new Date().toISOString()},{onConflict:'wedding_id'});
    if(error)throw error;
  },
  async weddingMedia(weddingId) {
    if (!weddingId || !state.weddings.some(w=>w.id===weddingId)) return [];
    if (CONFIG.mode === 'demo') return loadDemo().media?.[weddingId] || [];
    const {data,error}=await supabase.from('wedding_media').select('slot,path,previous_path,updated_at').eq('wedding_id',weddingId).order('slot');
    if(error) throw new Error('Não foi possível carregar as fotografias: '+error.message);
    return data || [];
  },
  async mediaUrls(rows) {
    if(CONFIG.mode==='demo' || !rows.length) return {};
    const {data,error}=await supabase.storage.from('wedding-private-media').createSignedUrls(rows.map(r=>r.path),3600);
    if(error) throw error;
    return Object.fromEntries((data || []).flatMap((v,i)=>v.signedUrl && rows[i] ? [[rows[i].slot,v.signedUrl]] : []));
  },
  async uploadMedia(weddingId,slot,prepared) {
    if(!canEditMedia()) throw new Error('O envio de fotos não está autorizado para este casamento.');
    if(!state.weddings.some(w=>w.id===weddingId)) throw new Error('Casamento não autorizado.');
    if(!MEDIA_SLOTS.some(([s])=>s===slot)) throw new Error('Posição inválida.');
    if(state.weddingId!==weddingId) throw new Error('O casamento selecionado mudou. Tente novamente.');
    if(!(prepared instanceof Blob) || prepared.type!=='image/webp' || prepared.size>5*1024*1024) throw new Error('Imagem inválida.');
    const path=`weddings/${weddingId}/${slot}/${crypto.randomUUID()}.webp`;
    if(CONFIG.mode==='demo') {
      const d=loadDemo();d.media ||= {};d.media[weddingId] ||= [];
      const old=d.media[weddingId].find(row=>row.slot===slot);
      d.media[weddingId]=[...d.media[weddingId].filter(row=>row.slot!==slot),{slot,path,previous_path:old?.path||null,updated_at:new Date().toISOString()}];saveDemo(d);return;
    }
    const {error:uploadError}=await supabase.storage.from('wedding-private-media').upload(path,prepared,{contentType:'image/webp',cacheControl:'3600',upsert:false});
    if(uploadError) throw uploadError;
    const existing=state.media.find(row=>row.slot===slot);
    const previous=existing?.path||null, staleBackup=existing?.previous_path||null;
    const {data:updated,error:dbError}=await supabase.from('wedding_media')
      .upsert({wedding_id:weddingId,slot,path,previous_path:previous},{onConflict:'wedding_id,slot'}).select('slot').maybeSingle();
    if(dbError || !updated) {
      await supabase.storage.from('wedding-private-media').remove([path]);
      throw dbError || new Error('Não foi possível registrar a imagem. Confira sua permissão.');
    }
    // Conserva a fotografia anterior para que o casal possa desfazer a troca.
    if(staleBackup && staleBackup!==previous && staleBackup!==path) {
      const {error:cleanup}=await supabase.storage.from('wedding-private-media').remove([staleBackup]);
      if(cleanup) console.warn('Backup antigo mantido no Storage:',cleanup.message);
    }
  },
  async removeMedia(weddingId,slot) {
    if(!canEditMedia() || state.weddingId!==weddingId) throw new Error('Operação não autorizada para este casamento.');
    const current=state.media.find(row=>row.slot===slot);
    if(!current) return;
    if(CONFIG.mode==='demo') {const d=loadDemo();d.media[weddingId]=(d.media[weddingId]||[]).filter(row=>row.slot!==slot);saveDemo(d);return;}
    const {data:deleted,error}=await supabase.from('wedding_media').delete().eq('wedding_id',weddingId).eq('slot',slot).select('slot').maybeSingle();
    if(error || !deleted) throw error || new Error('Não foi possível remover a foto.');
    const paths=[current.path,current.previous_path].filter(Boolean);
    const {error:storageError}=await supabase.storage.from('wedding-private-media').remove(paths);
    if(storageError) console.warn('Vínculo removido; arquivos antigos ainda precisam de limpeza:',storageError.message);
  },
  async restorePreviousMedia(weddingId,slot) {
    if(!canEditMedia() || state.weddingId!==weddingId) throw new Error('Operação não autorizada para este casamento.');
    const current=state.media.find(row=>row.slot===slot);
    if(!current?.previous_path) throw new Error('Esta foto não tem substituição anterior disponível.');
    if(CONFIG.mode==='demo') {
      const d=loadDemo(),row=d.media?.[weddingId]?.find(r=>r.slot===slot);
      if(row) [row.path,row.previous_path]=[row.previous_path,row.path];
      saveDemo(d);return;
    }
    const {data,error}=await supabase.from('wedding_media')
      .update({path:current.previous_path,previous_path:current.path,updated_at:new Date().toISOString()})
      .eq('wedding_id',weddingId).eq('slot',slot).eq('path',current.path).select('slot').maybeSingle();
    if(error || !data) throw error || new Error('A fotografia foi alterada em outro dispositivo; atualize o painel antes de desfazer.');
  },
  async invitations(weddingId) {
    if (CONFIG.mode === "demo") return loadDemo().invitations.filter(i => i.wedding_id === weddingId);
    const { data, error } = await supabase.from("invitations").select("*, rsvps(*), invitation_members(*)").eq("wedding_id", weddingId).order("created_at", { ascending: false });
    if (error) throw error; return data;
  },
  async saveInvitation(item) {
    const members = Array.isArray(item.members) ? item.members : parseMembersValue(item.members);
    if (members.length > Number(item.seats)) throw new Error("A quantidade de membros não pode ultrapassar o número de lugares.");
    if (CONFIG.mode === "demo") {
      const d = loadDemo(); const i = d.invitations.findIndex(x => x.id === item.id);
      if (i >= 0) d.invitations[i] = { ...d.invitations[i], ...item, seats: Number(item.seats), members };
      else d.invitations.unshift({ ...item, id: crypto.randomUUID(), wedding_id: state.weddingId, token: generateToken(), active: true, seats: Number(item.seats), members, rsvps: [] });
      saveDemo(d); return;
    }
    const payload = { wedding_id: state.weddingId, display_name: item.display_name, contact_name: item.contact_name || null, phone: item.phone || null, seats: Number(item.seats), category: item.category || null, notes: item.notes || null };
    let invitationId = item.id;
    if (item.id) {
      const { error } = await supabase.from("invitations").update(payload).eq("id", item.id); if (error) throw error;
    } else {
      payload.token = generateToken();
      const { data, error } = await supabase.from("invitations").insert(payload).select("id").single(); if (error) throw error; invitationId = data.id;
    }
    await syncSupabaseMembers(invitationId, members);
  },
  async deleteInvitation(id) {
    if (CONFIG.mode === "demo") { const d = loadDemo(); d.invitations = d.invitations.filter(i => i.id !== id); saveDemo(d); return; }
    const { error } = await supabase.from("invitations").delete().eq("id", id); if (error) throw error;
  },
  async regenerateToken(id) {
    const token = generateToken();
    if (CONFIG.mode === "demo") { const d = loadDemo(); const inv = d.invitations.find(i => i.id === id); if (!inv) throw new Error("Convite não encontrado."); inv.token = token; saveDemo(d); return token; }
    const { error } = await supabase.from("invitations").update({ token }).eq("id", id); if (error) throw error; return token;
  },
  async importInvitations(rows) {
    if (!rows.length) return;
    if (CONFIG.mode === "demo") {
      const d = loadDemo();
      const added = rows.map(item => ({ ...item, id: crypto.randomUUID(), wedding_id: state.weddingId, token: generateToken(), active: true, seats: Number(item.seats), members: item.members || [], rsvps: [] }));
      d.invitations = [...added.reverse(), ...d.invitations]; saveDemo(d); return;
    }
    const prepared = rows.map(item => ({ item, token: generateToken() }));
    const payload = prepared.map(({ item, token }) => ({ wedding_id: state.weddingId, token, display_name: item.display_name, contact_name: item.contact_name || null, phone: item.phone || null, seats: Number(item.seats), category: item.category || null, notes: item.notes || null }));
    const { data, error } = await supabase.from("invitations").insert(payload).select("id,token"); if (error) throw error;
    const idByToken = new Map((data || []).map(row => [row.token, row.id]));
    const membersPayload = [];
    prepared.forEach(({ item, token }) => (item.members || []).forEach((name, index) => membersPayload.push({ invitation_id: idByToken.get(token), name, sort_order: index })));
    if (membersPayload.length) { const { error: memberError } = await supabase.from("invitation_members").insert(membersPayload); if (memberError) throw memberError; }
  },
  async weddingMembers(weddingId) {
    if (!state.isAdmin || !weddingId) return [];
    if (CONFIG.mode === "demo") return (loadDemo().accessMembers || []).filter(m => m.wedding_id === weddingId);
    const { data, error } = await supabase.from("wedding_members").select("id,wedding_id,user_id,email,display_name,access_role,created_at").eq("wedding_id", weddingId).order("created_at");
    if (error) throw error;
    return data || [];
  },
  async inviteCouple({ weddingId, email, displayName }) {
    if (!state.isAdmin) throw new Error("Somente o administrador pode gerenciar acessos.");
    if (CONFIG.mode === "demo") {
      const d = loadDemo(); d.accessMembers ||= [];
      const existing = d.accessMembers.find(m => m.wedding_id === weddingId && String(m.email).toLowerCase() === String(email).toLowerCase());
      if (existing) { existing.display_name = displayName || existing.display_name; }
      else d.accessMembers.push({ id: crypto.randomUUID(), wedding_id: weddingId, user_id: crypto.randomUUID(), email, display_name: displayName || email, access_role: "couple", created_at: new Date().toISOString() });
      saveDemo(d); return;
    }
    const redirectTo = new URL(CONFIG.inviteSetupPage || "../reset-password.html?convite_acesso=1", location.href).href;
    const { data, error } = await supabase.functions.invoke(CONFIG.accessFunctionName || "admin-access", { body: { action: "invite", weddingId, email, displayName, redirectTo } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
  },
  async removeWeddingMember(id) {
    if (!state.isAdmin) throw new Error("Somente o administrador pode remover acessos.");
    if (CONFIG.mode === "demo") { const d = loadDemo(); d.accessMembers = (d.accessMembers || []).filter(m => m.id !== id); saveDemo(d); return; }
    const { error } = await supabase.from("wedding_members").delete().eq("id", id);
    if (error) throw error;
  }
};

// Menu lateral acessível: abre apenas no mobile, fecha por X, fundo, Esc ou navegação.
const sidebarMobileMedia = window.matchMedia("(max-width: 980px)");
function setMobileMenuOpen(shouldOpen, returnFocus = false) {
  const open = Boolean(shouldOpen && sidebarMobileMedia.matches);
  const sidebar = $("#adminSidebar");
  const trigger = $("#mobileMenu");
  const backdrop = $("#sidebarBackdrop");
  sidebar?.classList.toggle("is-open", open);
  if (sidebar) sidebar.inert = sidebarMobileMedia.matches && !open;
  if (trigger) {
    trigger.setAttribute("aria-expanded", String(open));
    trigger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  }
  if (backdrop) backdrop.hidden = !open;
  document.body.classList.toggle("mobile-nav-open", open);
  if (!open && returnFocus) trigger?.focus();
}

function showView(name) {
  $$(".view").forEach(v => v.classList.toggle("is-active", v.id === `view-${name}`));
  $$(".nav-item").forEach(v => v.classList.toggle("is-active", v.dataset.view === name));
  setMobileMenuOpen(false);
}

async function refreshAll(preferredId = state.weddingId) {
  state.weddings = await backend.weddings();
  state.weddingId = state.weddings.some(w => w.id === preferredId) ? preferredId : state.weddings[0]?.id || null;
  renderWeddingSelect();
  if (state.weddingId) state.invitations = await backend.invitations(state.weddingId); else state.invitations = [];
  state.accessMembers = state.isAdmin && state.weddingId ? await backend.weddingMembers(state.weddingId) : [];
  state.customization = state.weddingId ? await backend.customization(state.weddingId) : {};
  state.coupleCanEditMedia = state.weddingId ? await backend.mediaEditPermission(state.weddingId) : false;
  state.media = state.weddingId ? await backend.weddingMedia(state.weddingId) : [];
  renderAll();
}

function currentWedding() { return state.weddings.find(w => w.id === state.weddingId); }
function canEditMedia() {return Boolean(state.weddingId && (state.isAdmin || state.coupleCanEditMedia));}
function renderWeddingSelect() {
  const el = $("#weddingSelect"); el.innerHTML = state.weddings.map(w => `<option value="${w.id}">${escapeHtml(w.name)}</option>`).join("");
  if (state.weddingId) el.value = state.weddingId;
}
function renderStats() {
  const invites = state.invitations;
  const responded = invites.filter(i => statusOf(i) !== "pending").length;
  $("#dashboardTitle").textContent = currentWedding()?.name || "Convidados";
  $("#statInvites").textContent = invites.length;
  $("#statSeats").textContent = invites.reduce((n, i) => n + Number(i.seats || 0), 0);
  $("#statConfirmed").textContent = invites.reduce((n, i) => n + (statusOf(i) === "confirmed" ? Number(rsvpOf(i)?.guest_count || 0) : 0), 0);
  $("#statPending").textContent = invites.filter(i => statusOf(i) === "pending").length;
  $("#statDeclined").textContent = invites.filter(i => statusOf(i) === "declined").length;
  $("#statResponseRate").textContent = invites.length ? `${Math.round((responded / invites.length) * 100)}%` : "0%";
}
function rowHtml(inv, compact = false) {
  const status = statusOf(inv); const r = rsvpOf(inv); const confirmed = status === "confirmed" ? r?.guest_count ?? 0 : "—";
  const memberCount = membersOf(inv).length;
  const memberMeta = memberCount ? `${memberCount} membro${memberCount === 1 ? "" : "s"}` : "sem membros individuais";
  const responseButton = status !== "pending" ? `<button class="mini-btn mini-btn--response" title="Ver resposta do RSVP" data-response="${inv.id}">Ver resposta</button>` : "";
  if (compact) return `<tr><td class="guest-name" data-label="Convite"><strong>${escapeHtml(inv.display_name)}</strong><small>${escapeHtml(inv.category || "Sem categoria")} · ${escapeHtml(memberMeta)}</small></td><td data-label="Lugares">${inv.seats}</td><td data-label="Resposta">${confirmed}</td><td data-label="Status"><span class="status status--${status}">${statusLabel(status)}</span></td><td data-label="Ações"><div class="row-actions row-actions--compact">${responseButton}<button class="mini-btn" data-copy="${inv.id}">Copiar link</button></div></td></tr>`;
  return `<tr><td class="guest-name" data-label="Convidado / família"><strong>${escapeHtml(inv.display_name)}</strong><small>${escapeHtml(inv.category || "Sem categoria")} · ${escapeHtml(memberMeta)}</small></td><td data-label="Contato"><span>${escapeHtml(inv.contact_name || "—")}</span><br><small class="muted">${escapeHtml(inv.phone || "")}</small></td><td data-label="Lugares">${inv.seats}</td><td data-label="Confirmados">${confirmed}</td><td data-label="Status"><span class="status status--${status}">${statusLabel(status)}</span></td><td data-label="Ações"><div class="row-actions">${responseButton}<button class="mini-btn" title="Copiar link" data-copy="${inv.id}">Link</button><button class="mini-btn" title="Enviar pelo WhatsApp" data-whatsapp="${inv.id}">WhatsApp</button><button class="mini-btn" title="Editar convite" data-edit="${inv.id}">Editar</button><button class="mini-btn" title="Invalidar o link antigo e gerar outro" data-regenerate="${inv.id}">Novo token</button><button class="mini-btn mini-btn--danger" title="Excluir" data-delete="${inv.id}">Excluir</button></div></td></tr>`;
}
function filteredInvitations() {
  const q = $("#searchInput").value.trim().toLowerCase(); const filter = $("#statusFilter").value;
  return state.invitations.filter(i => {
    const memberNames = membersOf(i).join(" ");
    const matches = !q || [i.display_name, i.contact_name, i.phone, i.category, memberNames].some(v => String(v || "").toLowerCase().includes(q));
    return matches && (filter === "all" || statusOf(i) === filter);
  });
}
function renderTables() {
  $("#dashboardRows").innerHTML = state.invitations.slice(0, 5).map(i => rowHtml(i, true)).join("") || `<tr><td colspan="5" class="muted">Nenhum convite cadastrado.</td></tr>`;
  const filtered = filteredInvitations();
  $("#guestRows").innerHTML = filtered.map(i => rowHtml(i)).join(""); $("#guestEmpty").hidden = filtered.length > 0;
}
function renderSettings() {
  const w = currentWedding(); const f = $("#weddingForm");
  for (const name of ["name", "slug", "event_date", "invite_base_url"]) f.elements[name].value = w?.[name] || "";
  f.elements.invite_base_url.value = inviteBaseUrl(); // Corrige visualmente a URL de casamentos antigos.
}
function renderAccess() {
  const list = $("#accessRows"); if (!list) return;
  if (!state.isAdmin) { list.innerHTML = ""; return; }
  list.innerHTML = state.accessMembers.map(member => `<article class="access-card"><div class="access-card__identity"><strong>${escapeHtml(member.display_name || member.email || "Casal")}</strong><small>${escapeHtml(member.email || "")}</small><span class="access-card__role">Casal</span></div><button class="mini-btn mini-btn--danger" type="button" data-remove-access="${member.id}">Remover acesso</button></article>`).join("");
  $("#accessEmpty").hidden = state.accessMembers.length > 0;
}
function applyPermissions() {
  $$('[data-admin-only]').forEach(el => el.hidden = !state.isAdmin);
  const roleText = state.isAdmin ? "Administrador" : "Casal";
  $("#userMode").textContent = `${roleText} · acesso autenticado`;
  $("#modeBadge").textContent = CONFIG.mode === "demo" ? `DEMO · ${roleText.toUpperCase()}` : roleText.toUpperCase();
  if (!state.isAdmin && $("#view-access")?.classList.contains("is-active")) showView("dashboard");
}

// Editores seguros: somente campos publicados pela lista branca da Edge Function.
const EDITOR_SECTIONS = [
 ['opening','Abertura personalizada'],['welcome','Boas-vindas e contagem'],['story','Nossa história'],
 ['details','Cerimônia e recepção'],['schedule','Programação'],['gallery','Galeria'],
 ['dressCode','Trajes'],['guestInfo','Informações úteis'],['faq','Perguntas frequentes'],
 ['rsvp','Confirmação RSVP'],['gifts','Lista de presentes'],['music','Música']
];
const EDITOR_TEXT_FIELDS = [
 ['O casal e a data',[
  ['couple.firstName','Nome 1'],['couple.secondName','Nome 2'],['couple.initials','Iniciais'],['couple.signature','Assinatura'],
  ['wedding.longDate','Data por extenso'],['wedding.shortDate','Data curta'],['wedding.weekday','Dia da semana'],
  ['wedding.day','Dia'],['wedding.month','Mês'],['wedding.year','Ano'],['wedding.time','Horário'],['wedding.city','Cidade / Estado']]],
 ['Abertura e capa',[
  ['opening.eyebrow','Chamada inicial'],['opening.title','Título da abertura','textarea'],
  ['opening.hint','Mensagem da abertura','textarea'],['opening.buttonLabel','Botão de abertura'],
  ['opening.guestPrefix','Texto para convidados'],['hero.eyebrow','Chamada da capa'],
  ['hero.subtitle','Subtítulo da capa','textarea'],['hero.primaryButton','Botão principal'],['hero.secondaryButton','Botão secundário']]],
 ['Boas-vindas e nossa história',[
  ['welcome.eyebrow','Chamada boas-vindas'],['welcome.title','Título boas-vindas'],['welcome.text','Texto de boas-vindas','textarea'],
  ['story.pretitle','Referência / destaque'],['story.phrase','Frase de destaque'],['story.eyebrow','Chamada história'],
  ['story.title','Título da história'],['story.year','Ano / legenda'],['story.paragraphs','Parágrafos da história (separe por linha em branco)','textarea'],
  ['story.quote','Citação da história','textarea']]],
 ['Cerimônia e recepção',[
  ['details.eyebrow','Chamada locais'],['details.title','Título locais'],
  ['events.0.label','Rótulo cerimônia'],['events.0.time','Horário cerimônia'],
  ['events.0.venue','Local cerimônia'],['events.0.address','Endereço cerimônia','textarea'],
  ['events.1.label','Rótulo recepção'],['events.1.time','Horário recepção'],
  ['events.1.venue','Local recepção'],['events.1.address','Endereço recepção','textarea']]],
 ['Informações e programação',[
  ['schedule.eyebrow','Chamada programação'],['schedule.title','Título programação'],['schedule.note','Observação','textarea'],
  ['gallery.eyebrow','Chamada galeria'],['gallery.title','Título galeria'],
  ['dressCode.eyebrow','Chamada traje'],['dressCode.title','Título traje'],
  ['dressCode.text','Orientação de traje','textarea'],['dressCode.note','Observação sobre traje','textarea'],
  ['guestInfo.eyebrow','Chamada informações'],['guestInfo.title','Título informações'],
  ['faq.eyebrow','Chamada dúvidas'],['faq.title','Título dúvidas']]],
 ['Confirmação e despedida',[
  ['rsvp.eyebrow','Chamada RSVP'],['rsvp.title','Título RSVP'],['rsvp.text','Descrição RSVP','textarea'],
  ['rsvp.deadline','Prazo para confirmação'],['rsvp.buttonLabel','Botão RSVP'],['footer.text','Mensagem de rodapé','textarea']]],
 ['Lista de presentes',[
  ['gifts.title','Título da página'],['gifts.eyebrow','Chamada presentes'],
  ['gifts.intro','Texto de apresentação','textarea'],['gifts.notice','Aviso sobre contribuições','textarea']]]
];
const EDITOR_COLOR_FIELDS = [
 ['background','Fundo'],['surface','Superfícies'],['surfaceAlt','Fundo alternativo'],['text','Texto'],
 ['muted','Texto secundário'],['accent','Destaque'],['accentDark','Destaque escuro'],
 ['accentSoft','Destaque suave'],['warm','Tom quente'],['line','Bordas'],['heroText','Texto sobre foto']
];
const EDITOR_FONTS = {classic:'Clássico · Cormorant + Manrope',editorial:'Editorial · Playfair + DM Sans',modern:'Contemporâneo · DM Serif + Inter',romantic:'Romântico · Great Vibes + Lora'};
const EDITOR_THEMES = {sage:'Sálvia',champagne:'Champanhe',dusk:'Crepúsculo',dustyBlue:'Azul acinzentado',navyBlue:'Azul-marinho',royalBlue:'Azul real',deepBlue:'Azul profundo'};
const editorEscape = value => String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
const editorGiftItems = () => window.GIFT_LIST_CONFIG?.items || [];
const editorMoney = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const editorPixInfo = (code,expectedPrice) => {
  const check=window.PixCodeUtils.inspect(code);
  if (check.empty) return {tone:'pending',text:'Código pendente — este presente não terá botão Copiar PIX até ser preenchido.'};
  if (!check.valid) return {tone:'error',text:check.message};
  if (check.amount == null) return {tone:'warning',text:'Não foi possível identificar o valor dentro do código. Confirme no banco que a cobrança tem o valor deste presente.'};
  if (Math.round(check.amount*100)!==Math.round(expectedPrice*100)) return {tone:'error',text:`O PIX contém ${editorMoney.format(check.amount)}, mas o presente custa ${editorMoney.format(expectedPrice)}. Gere o código com o valor correto.`};
  return {tone:'success',text:`Valor conferido no código PIX: ${editorMoney.format(check.amount)}.`};
};
const baseInvitationValue = path => {
  const v = path.split('.').reduce((a,b)=>a?.[b],window.WEDDING_CONFIG);
  return Array.isArray(v)?v.join('\n\n'):v == null ? '' : String(v);
};
function renderCustomization() {
  const root=$('#personalizationFields'); if(!root)return;
  const settings=state.customization || {};
  const wedding=currentWedding();
  if(!wedding) {root.innerHTML='<div class="editor-intro">Selecione um casamento para editar o convite.</div>';$('#savePersonalization').disabled=true;$('#previewInvitation').hidden=true;return;}
  $('#savePersonalization').disabled=false;
  const preview=$('#previewInvitation');
  if(state.invitations.length) {preview.href=buildLink(state.invitations[0],wedding);preview.hidden=false;}
  else {preview.hidden=true;}
  const themes=window.WEDDING_THEMES || {};
  const themeName = EDITOR_THEMES[settings.themePreset] ? settings.themePreset : window.WEDDING_CONFIG?.themePreset || 'deepBlue';
  const selectedTheme=themes[themeName] || themes.deepBlue || {};
  const swatches=EDITOR_COLOR_FIELDS.map(([key,label])=>`<label class="editor-field"><span>${label}</span><input data-editor-color="${key}" type="color" value="${editorEscape(settings.colors?.[key] || selectedTheme[key] || '#ffffff')}"></label>`).join('');
  const switches=EDITOR_SECTIONS.map(([key,label])=>`<label class="editor-switch"><span>${editorEscape(label)}</span><input type="checkbox" data-editor-section="${key}" ${settings.sections?.[key]===false?'':'checked'}></label>`).join('');
  const pixMode = settings.payment?.mode === 'perGift' ? 'perGift' : 'noAmount';
  const fixedCodes = settings.payment?.giftPixCodes || {};
  const fixedCount = editorGiftItems().filter(g => String(fixedCodes[g.id]||'').trim()).length;
  const giftRows = editorGiftItems().map((gift,i) => `
    <article class="editor-pix-gift">
      <div class="editor-pix-gift__head"><span class="editor-pix-gift__number">${String(i+1).padStart(2,'0')}</span><div><strong>${editorEscape(gift.title)}</strong><span>${editorMoney.format(gift.price)}</span></div></div>
      <label class="editor-field"><span>PIX copia e cola para ${editorMoney.format(gift.price)}</span><textarea data-editor-gift-pix="${editorEscape(gift.id)}" spellcheck="false" autocapitalize="off" maxlength="1500" rows="2" placeholder="Cole o código PIX gerado no banco especificamente para este valor">${editorEscape(fixedCodes[gift.id]||'')}</textarea></label>
      <p class="editor-pix-gift__status" data-pix-status="${editorEscape(gift.id)}" role="status"></p>
    </article>`).join('');
  const groupHtml=EDITOR_TEXT_FIELDS.map(([title,fields])=>`<details class="editor-group"><summary>${title}</summary><div class="editor-content editor-grid">${fields.map(([path,label,type])=>{
    const raw=settings.text?.[path] ?? baseInvitationValue(path);
    const val=editorEscape(raw);
    return `<label class="editor-field${type==='textarea'?' editor-field--long':''}"><span>${editorEscape(label)}</span>${type==='textarea'?`<textarea data-editor-text="${path}" rows="4" maxlength="${path==='story.paragraphs'?3000:700}">${val}</textarea>`:`<input data-editor-text="${path}" type="text" maxlength="700" value="${val}">`}</label>`;
  }).join('')}</div></details>`).join('');
  root.innerHTML=`
    <details class="editor-group" open><summary>1 · Mostrar ou ocultar seções</summary><div class="editor-content"><p class="editor-separator">Os botões de navegação para seções ocultas também desaparecem. As fotografias são gerenciadas na aba Fotos do convite, conforme as permissões do casamento.</p><div class="editor-switches">${switches}</div></div></details>
    <details class="editor-group" open><summary>2 · Cores e tipografia</summary><div class="editor-content"><div class="editor-grid">
      <label class="editor-field"><span>Tema</span><select id="editorThemePreset">${Object.entries(EDITOR_THEMES).map(([key,label])=>`<option value="${key}" ${key===themeName?'selected':''}>${label}</option>`).join('')}</select><small>Trocar o tema atualiza a paleta completa; os campos abaixo permitem retoques.</small></label>
      <label class="editor-field"><span>Fontes</span><select id="editorFontPreset">${Object.entries(EDITOR_FONTS).map(([key,label])=>`<option value="${key}" ${key===(settings.fontPreset||'classic')?'selected':''}>${label}</option>`).join('')}</select></label>
    </div><h3>Cores do tema</h3><div class="editor-colors">${swatches}</div><button type="button" id="editorResetColors" class="btn btn--secondary">Restaurar cores do tema</button></div></details>
    <details class="editor-group" open><summary>3 · Como receber presentes (PIX)</summary><div class="editor-content">
      <p class="editor-separator">Escolha como os códigos serão mostrados quando um convidado abrir um presente. O sistema não cria cobranças bancárias: os noivos precisam gerar os códigos no aplicativo do banco.</p>
      <fieldset class="editor-pix-options"><legend>Modalidade do PIX</legend>
        <label class="editor-pix-option"><input name="editorPixMode" type="radio" value="noAmount" ${pixMode==='noAmount'?'checked':''}><span><strong>PIX sem valor definido</strong><small>Um único código PIX reutilizado para todos os presentes. O convidado informa o valor no aplicativo bancário, se o banco permitir.</small></span></label>
        <label class="editor-pix-option"><input name="editorPixMode" type="radio" value="perGift" ${pixMode==='perGift'?'checked':''}><span><strong>PIX com valor fixo por presente</strong><small>Um código PIX diferente para cada presente, gerado pelo banco com o respectivo valor.</small></span></label>
      </fieldset>
      <div id="editorPixShared" class="editor-pix-mode-section" ${pixMode==='perGift'?'hidden':''}>
        <label class="editor-field"><span>Código PIX sem valor definido</span><textarea id="editorPixCode" maxlength="1500" rows="3" placeholder="Cole aqui o código PIX completo (BR Code) sem valor definido">${editorEscape(settings.payment?.pixCode||'')}</textarea><small>Confirme no banco que este código permite informar o valor. Um código com valor embutido não se torna livre por escolher esta opção.</small></label>
        <p id="editorPixSharedStatus" class="editor-pix-gift__status" role="status" aria-live="polite"></p>
      </div>
      <div id="editorPixFixed" class="editor-pix-mode-section" ${pixMode==='perGift'?'':'hidden'}>
        <div class="editor-pix-progress"><div><strong>Códigos individuais</strong><small>Gere no banco um PIX para o valor indicado em cada presente. Campos vazios permanecem sem pagamento habilitado.</small></div><span id="editorPixProgress" aria-live="polite">${fixedCount} de ${editorGiftItems().length} preenchidos</span></div>
        <div class="editor-pix-gift-list">${giftRows}</div>
      </div>
      <div class="editor-grid editor-pix-common">
        <label class="editor-field"><span>Nome do favorecido (opcional)</span><input id="editorPixReceiver" type="text" maxlength="120" value="${editorEscape(settings.payment?.receiverName||'')}"></label>
        <label class="editor-field editor-field--long"><span>Link HTTPS de pagamento (opcional)</span><input id="editorPixLink" type="url" inputmode="url" placeholder="https://seu-banco-ou-provedor/pagamento" maxlength="600" value="${editorEscape(settings.payment?.pixLink||'')}"><small>Usado como alternativa apenas no modo sem valor. Para valor fixo, o modal usa exclusivamente o código individual correspondente ao presente.</small></label>
      </div>
    </div></details>
    ${groupHtml}`;
  function updateColors() {
    const newTheme=themes[$('#editorThemePreset').value] || {};
    $$('#personalizationFields [data-editor-color]').forEach(input=>{input.value=newTheme[input.dataset.editorColor]||'#ffffff'});
  }
  $('#editorThemePreset').addEventListener('change',updateColors);
  $('#editorResetColors').addEventListener('click',updateColors);
  const updatePixMode=()=>{
    const fixed=$('input[name="editorPixMode"]:checked',root)?.value==='perGift';
    $('#editorPixShared').hidden=fixed;
    $('#editorPixFixed').hidden=!fixed;
  };
  $$('input[name="editorPixMode"]',root).forEach(input=>input.addEventListener('change',updatePixMode));
  const updatePixRows=()=>{
    const all=editorGiftItems();let complete=0;
    $$('[data-editor-gift-pix]',root).forEach(field=>{
      const gift=all.find(g=>g.id===field.dataset.editorGiftPix);if(!gift)return;
      const val=field.value.trim();if(val)complete++;
      const result=editorPixInfo(val,gift.price),note=$(`[data-pix-status="${gift.id}"]`,root);
      note.textContent=result.text;note.dataset.tone=result.tone;
      field.setAttribute('aria-invalid',String(result.tone==='error'));
    });
    $('#editorPixProgress').textContent=`${complete} de ${all.length} preenchidos`;
  };
  $$('[data-editor-gift-pix]',root).forEach(field=>field.addEventListener('input',updatePixRows));
  const updateSharedPix=()=>{
    const field=$('#editorPixCode'),note=$('#editorPixSharedStatus');
    const value=field.value.trim(),check=window.PixCodeUtils.inspect(value);
    if(!value) {note.dataset.tone='pending';note.textContent='PIX sem valor ainda não cadastrado.';return;}
    if(!check.valid) {note.dataset.tone='error';note.textContent=check.message;return;}
    if(check.amount!==null) {note.dataset.tone='error';note.textContent=`Atenção: este PIX já contém ${editorMoney.format(check.amount)}; use um código sem valor.`;return;}
    note.dataset.tone='success';note.textContent='O código foi validado e não apresenta valor no campo 54. Confira no banco se permite informar a quantia.';
  };
  $('#editorPixCode').addEventListener('input',updateSharedPix);
  updateSharedPix();
  updatePixRows();updatePixMode();
  $('#editorStatus').textContent='';
}
function collectCustomization(){
  const r=$('#personalizationFields');
  const sections={}, colors={}, text={};
  $$('[data-editor-section]',r).forEach(input=>sections[input.dataset.editorSection]=input.checked);
  $$('[data-editor-color]',r).forEach(input=>colors[input.dataset.editorColor]=input.value);
  $$('[data-editor-text]',r).forEach(input=>{text[input.dataset.editorText]=input.value.trim()});
  const pixLink=$('#editorPixLink').value.trim();
  if(pixLink && !/^https:\/\/[^\s]+$/i.test(pixLink)) throw new Error('O link PIX precisa começar com https:// e não pode conter espaços.');
  const mode=$('input[name="editorPixMode"]:checked',r)?.value==='perGift'?'perGift':'noAmount';
  const fixedCodes={};
  for(const gift of editorGiftItems()) {
    const field=$$('[data-editor-gift-pix]',r).find(el=>el.dataset.editorGiftPix===gift.id);
    const code=field?.value.trim()||'';
    if(code) {
      const info=editorPixInfo(code,gift.price);
      if(mode==='perGift' && info.tone==='error') {field?.focus();throw new Error(`Confira o PIX do presente “${gift.title}”: ${info.text}`);}
      fixedCodes[gift.id]=code;
    }
  }
  const sharedCode=$('#editorPixCode').value.trim();
  if(mode==='noAmount' && sharedCode) {
    const result=window.PixCodeUtils.inspect(sharedCode);
    if(!result.valid) throw new Error('O código PIX sem valor não parece válido. Confira e copie o BR Code completo do banco.');
    if(result.amount!==null) throw new Error(`O PIX geral contém valor fixo (${editorMoney.format(result.amount)}). Gere um código sem valor ou selecione “PIX com valor fixo por presente”.`);
  }
  return {sections,colors,text,themePreset:$('#editorThemePreset').value,fontPreset:$('#editorFontPreset').value,
    payment:{mode,pixLink,pixCode:sharedCode,giftPixCodes:fixedCodes,receiverName:$('#editorPixReceiver').value.trim()}};
}

function renderAll() { renderStats(); renderTables(); renderSettings(); renderAccess(); renderCustomization(); applyPermissions(); renderMedia().catch(err=>{const el=$("#mediaStatus");if(el)el.textContent=err.message;}); }

function openInvite(id = null) {
  if (!state.weddingId) return toast("Nenhum casamento disponível para esta conta.");
  state.editId = id; const form = $("#inviteForm"); form.reset(); form.elements.seats.value = 1; form.elements.id.value = id || "";
  $("#inviteDialogTitle").textContent = id ? "Editar convite" : "Adicionar convidado";
  if (id) {
    const item = state.invitations.find(i => i.id === id);
    ["display_name", "contact_name", "phone", "seats", "category", "notes"].forEach(k => form.elements[k].value = item?.[k] ?? "");
    form.elements.members.value = membersOf(item).join("\n");
  }
  $("#inviteDialog").showModal();
}
function closeInvite() { $("#inviteDialog").close(); }
function openWedding() { const f = $("#newWeddingForm"); f.reset(); f.elements.invite_base_url.value = inviteBaseUrl(); $("#weddingDialog").showModal(); }

function resetImportDialog() {
  state.importRows = [];
  $("#importFile").value = ""; $("#importResult").hidden = true; $("#importStatus").textContent = "";
  $("#importErrors").innerHTML = ""; $("#importPreviewRows").innerHTML = ""; $("#confirmImportButton").disabled = true;
}
function openImport() {
  if (!state.weddingId) return toast("Crie ou selecione um casamento antes de importar.");
  resetImportDialog();
  $("#downloadImportTemplate").href = CONFIG.importTemplateUrl || "../modelos/modelo-importacao-convidados.xlsx";
  $("#importMaxRowsLabel").textContent = maxImportRows();
  $("#importDialog").showModal();
}
function closeImport() { $("#importDialog").close(); resetImportDialog(); }
function renderImportReview(result) {
  state.importRows = result.valid; $("#importResult").hidden = false;
  $("#importValidCount").textContent = result.valid.length; $("#importIgnoredCount").textContent = result.ignored; $("#importErrorCount").textContent = result.errors.length;
  $("#importErrorsWrap").hidden = result.errors.length === 0;
  $("#importErrors").innerHTML = result.errors.slice(0, 20).map(e => `<li>${escapeHtml(e)}</li>`).join("") + (result.errors.length > 20 ? `<li>... e mais ${result.errors.length - 20} erro(s).</li>` : "");
  $("#importPreviewWrap").hidden = result.valid.length === 0;
  $("#importPreviewRows").innerHTML = result.valid.slice(0, 8).map(i => `<tr><td class="guest-name" data-label="Convite">${escapeHtml(i.display_name)}</td><td data-label="Responsável">${escapeHtml(i.contact_name || "—")}</td><td data-label="WhatsApp">${escapeHtml(i.phone || "—")}</td><td data-label="Lugares">${i.seats}</td><td data-label="Membros">${escapeHtml(i.members?.join("; ") || "—")}</td><td data-label="Categoria">${escapeHtml(i.category || "—")}</td></tr>`).join("");
  $("#confirmImportButton").disabled = result.valid.length === 0 || result.errors.length > 0;
  $("#importStatus").textContent = result.errors.length ? "Corrija os erros na planilha e selecione o arquivo novamente." : (result.valid.length ? `Planilha validada: ${result.valid.length} convite(s) pronto(s) para importar.` : "Nenhum convidado válido encontrado.");
}
async function handleImportFile(file) {
  if (!file) return;
  const status = $("#importStatus");
  try { status.textContent = "Lendo e validando a planilha..."; const result = await parseGuestWorkbook(file); renderImportReview(result); }
  catch (err) { state.importRows = []; $("#importResult").hidden = true; $("#confirmImportButton").disabled = true; status.textContent = err.message || "Não foi possível ler a planilha."; }
}
async function confirmImport() {
  if (!state.importRows.length) return;
  const button = $("#confirmImportButton"); const status = $("#importStatus"); const count = state.importRows.length;
  try { button.disabled = true; status.textContent = `Importando ${count} convite(s)...`; await backend.importInvitations(state.importRows); await refreshAll(state.weddingId); $("#importDialog").close(); resetImportDialog(); toast(`${count} convite(s) importado(s) com sucesso.`); }
  catch (err) { button.disabled = false; status.textContent = err.message || "Falha ao importar convidados."; }
}

function exportDataRows() {
  const w = currentWedding();
  return state.invitations.map(inv => {
    const r = rsvpOf(inv); const status = statusOf(inv);
    const guestNames = Array.isArray(r?.guest_names) ? r.guest_names : (Array.isArray(r?.guestNames) ? r.guestNames : []);
    return {
      "Convite / família": inv.display_name || "",
      "Responsável": inv.contact_name || "",
      "WhatsApp": inv.phone || "",
      "Lugares": Number(inv.seats || 0),
      "Membros cadastrados": membersOf(inv).join("; "),
      "Categoria": inv.category || "",
      "Status": statusLabel(status),
      "Confirmados": status === "confirmed" ? Number(r?.guest_count ?? r?.guestCount ?? 0) : 0,
      "Nomes confirmados": guestNames.join("; "),
      "Mensagem": r?.message || "",
      "Respondido em": formatDateTime(r?.responded_at ?? r?.respondedAt ?? ""),
      "Token": inv.token || "",
      "Link personalizado": buildLink(inv, w)
    };
  });
}
function exportFilename(ext) {
  const base = slugify(currentWedding()?.name || "convidados") || "convidados";
  return `${CONFIG.exportFilePrefix || "lista-convidados"}-${base}.${ext}`;
}
function exportExcel() {
  if (!state.invitations.length) return toast("Não há convidados para exportar.");
  if (!window.XLSX) return toast("Biblioteca de Excel não carregada.");
  const rows = exportDataRows();
  const ws = window.XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [26, 22, 18, 10, 34, 16, 14, 12, 34, 28, 36, 20, 34, 58].map(wch => ({ wch }));
  const wb = window.XLSX.utils.book_new(); window.XLSX.utils.book_append_sheet(wb, ws, "Convidados");
  window.XLSX.writeFile(wb, exportFilename("xlsx"));
  toast("Planilha exportada.");
}
function exportCsv() {
  if (!state.invitations.length) return toast("Não há convidados para exportar.");
  if (!window.XLSX) return toast("Biblioteca de exportação não carregada.");
  const ws = window.XLSX.utils.json_to_sheet(exportDataRows());
  const csv = "\ufeff" + window.XLSX.utils.sheet_to_csv(ws, { FS: ";" });
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = exportFilename("csv"); document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  toast("CSV exportado.");
}

function openResponse(id) {
  const inv = state.invitations.find(i => i.id === id);
  if (!inv) return;
  const r = rsvpOf(inv);
  if (!r) return toast("Este convite ainda não possui resposta.");

  const status = statusOf(inv);
  const attending = status === "confirmed";
  const guestNames = Array.isArray(r.guest_names) ? r.guest_names : (Array.isArray(r.guestNames) ? r.guestNames : []);
  const submittedName = r.submitted_name ?? r.submittedName ?? inv.contact_name ?? inv.display_name ?? "—";
  const guestCount = Number(r.guest_count ?? r.guestCount ?? 0);
  const message = String(r.message || "").trim();
  const respondedAt = r.responded_at ?? r.respondedAt ?? "";

  $("#responseDialogTitle").textContent = attending ? "Presença confirmada" : "Não poderá comparecer";
  $("#responseInviteName").textContent = inv.display_name || "—";
  $("#responseSubmittedName").textContent = submittedName || "—";
  $("#responseGuestCount").textContent = attending ? String(guestCount) : "0";
  $("#responseDate").textContent = respondedAt ? `Respondido em ${formatDateTime(respondedAt)}` : "";

  const badge = $("#responseStatusBadge");
  badge.className = `status status--${status}`;
  badge.textContent = statusLabel(status);

  const namesBlock = $("#responseNamesBlock");
  const names = $("#responseGuestNames");
  if (attending && guestNames.length) {
    namesBlock.hidden = false;
    names.innerHTML = guestNames.map(name => `<span>${escapeHtml(name)}</span>`).join("");
  } else if (attending && guestCount > 0) {
    namesBlock.hidden = false;
    names.innerHTML = `<span>${guestCount} ${guestCount === 1 ? "pessoa confirmada" : "pessoas confirmadas"}</span>`;
  } else {
    namesBlock.hidden = true;
    names.innerHTML = "";
  }

  const messageEl = $("#responseMessage");
  messageEl.textContent = message || "Nenhuma mensagem foi deixada neste RSVP.";
  messageEl.classList.toggle("is-empty", !message);

  $("#responseDialog").showModal();
}
function closeResponse() { $("#responseDialog")?.close(); }

async function copyLink(id) { const inv = state.invitations.find(i => i.id === id); const link = buildLink(inv, currentWedding()); await navigator.clipboard.writeText(link); toast("Link personalizado copiado."); }
function whatsapp(id) { const inv = state.invitations.find(i => i.id === id); const w = currentWedding(); const link = buildLink(inv, w); const text = `Olá, ${inv.display_name}! \u{1F48D}\n\nPreparamos um convite especial para você(s).\n\nAcesse o convite pelo link abaixo:\n${link}`; const phone = String(inv.phone || "").replace(/\D/g, ""); window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener"); }
async function regenerateToken(id) {
  const inv = state.invitations.find(i => i.id === id); if (!inv) return;
  const ok = confirm(`Gerar um novo token para “${inv.display_name}”?\n\nO link atual deixará de funcionar imediatamente.`);
  if (!ok) return;
  await backend.regenerateToken(id); await refreshAll(state.weddingId); toast("Novo token gerado. O link anterior foi invalidado.");
}

// Cada slot de fotografia pertence apenas ao casamento escolhido; tamanhos aproximados:
// desktop: até 1800px; mobile: até 1400px; todas as fotos vão em WebP otimizado.
const MEDIA_SLOTS = [
  ['hero.desktop','Capa — desktop','hero.jpg'],['hero.mobile','Capa — celular','hero.jpg'],
  ['story.desktop','Nossa história — desktop','story.jpg'],['story.mobile','Nossa história — celular','story.jpg'],
  ['event0.desktop','Cerimônia — desktop','paroquia.jpg'],['event0.mobile','Cerimônia — celular','paroquia.jpg'],
  ['event1.desktop','Recepção — desktop','buffet.png'],['event1.mobile','Recepção — celular','buffet.png'],
  ['schedule.desktop','Programação fundo — desktop','gallery-2.jpg'],['schedule.mobile','Programação fundo — celular','gallery-2.jpg'],
  ...['gallery-1.jpg','story.jpg','gallery-4.jpg','gallery-5.jpg','gallery-3.jpg'].flatMap((file,i)=>[
    [`timeline${i}.desktop`,`Programação ${i+1} — desktop`,file],[`timeline${i}.mobile`,`Programação ${i+1} — celular`,file]
  ]),
  ...[1,2,3,4,5].flatMap(i=>[
    [`gallery${i-1}.desktop`,`Galeria ${i} — desktop`,`gallery-${i}.jpg`],[`gallery${i-1}.mobile`,`Galeria ${i} — celular`,`gallery-${i}.jpg`]
  ]),
  ['dressCode.desktop','Trajes — desktop','dress-code.jpg'],['dressCode.mobile','Trajes — celular','dress-code.jpg'],
  ['rsvp.desktop','Confirmação — desktop','rsvp.jpg'],['rsvp.mobile','Confirmação — celular','rsvp.jpg']
];
const SAMPLE_IMAGE_FILES = ["buffet.png", "dress-code.jpg", "gallery-1.jpg", "gallery-2.jpg", "gallery-3.jpg", "gallery-4.jpg", "gallery-5.jpg", "gifts/air-fryer.jpg", "gifts/cafe-da-manha.jpg", "gifts/cama-mesa-banho.jpg", "gifts/cota-especial.jpg", "gifts/diaria-hotel.jpg", "gifts/experiencia-gastronomica.jpg", "gifts/fim-de-semana.jpg", "gifts/jantar-a-dois.jpg", "gifts/jantar-lua-de-mel.jpg", "gifts/jogo-de-tacas.jpg", "gifts/kit-fondue.jpg", "gifts/mala-de-viagem.jpg", "gifts/passeio-barco.jpg", "gifts/passeio-lua-de-mel.jpg", "gifts/upgrade-quarto.jpg", "hero.jpg", "paroquia.jpg", "rsvp.jpg", "story.jpg"];
async function prepareMediaPhoto(file,mobile) {
  if(!file || !['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Envie uma foto JPG, PNG ou WebP. Se estiver no formato HEIC (iPhone), exporte-a como JPG.');
  if(file.size > 12*1024*1024) throw new Error('Escolha um arquivo original de até 12 MB.');
  const url=URL.createObjectURL(file);
  try {
    const img=new Image();img.decoding='async';img.src=url;await img.decode();
    const max=mobile?1400:1800;
    const scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
    canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
    canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(result=>result?resolve(result):reject(new Error('Não foi possível otimizar a imagem.')),'image/webp',0.82));
    if(blob.size > 5*1024*1024) throw new Error('Imagem muito grande após otimização: limite de 5 MB.');
    return blob;
  } finally {URL.revokeObjectURL(url);}
}
async function renderMedia() {
  const area=$('#mediaSlots');
  if(!area)return;
  const status=$('#mediaStatus'),toggle=$('#allowCouplePhotos'),toggleStatus=$('#mediaAccessStatus');
  if(toggle)toggle.checked=state.coupleCanEditMedia;
  if(toggleStatus)toggleStatus.textContent=state.coupleCanEditMedia
    ? 'Os noivos deste casamento podem trocar suas próprias fotos.'
    : 'Somente o administrador pode trocar as fotos deste casamento.';
  if(!state.weddingId){area.textContent='Crie ou selecione um casamento primeiro.';return;}
  const weddingId=state.weddingId;
  const editable=canEditMedia();
  if(status)status.textContent=editable
    ? 'Escolha uma imagem para visualizar antes de confirmar o envio.'
    : 'O administrador bloqueou temporariamente a edição das fotos. Você ainda pode visualizar as imagens.';
  area.innerHTML='<p>Carregando prévias das fotos...</p>';
  const urls=await backend.mediaUrls(state.media);
  if(weddingId!==state.weddingId)return;
  const selected=new Map(state.media.map(row=>[row.slot,row]));
  area.innerHTML=MEDIA_SLOTS.map(([slot,label,fallback])=>{
    const saved=selected.get(slot),src=urls[slot] || `../convite/assets/images/${fallback}`;
    return `<article class="media-slot">
      <img class="media-slot__thumb" src="${escapeHtml(src)}" alt="Prévia de ${escapeHtml(label)}" loading="lazy">
      <div class="media-slot__body">
        <strong>${escapeHtml(label)}</strong>
        <span class="media-slot__status ${saved?'':'media-slot__status--demo'}">${saved?'Foto exclusiva deste casamento':'Foto de demonstração'}</span>
        ${editable?`<label><small>Selecionar nova fotografia</small><input type="file" data-media-upload="${slot}" accept="image/jpeg,image/png,image/webp" aria-label="Selecionar foto: ${escapeHtml(label)}"></label>
        <div class="media-slot__actions">${saved?.previous_path?`<button type="button" class="media-slot__remove" data-media-undo="${slot}">Desfazer última troca</button>`:''}
        ${saved?`<button type="button" class="media-slot__remove" data-media-remove="${slot}">Restaurar imagem de exemplo</button>`:''}</div>`:
          `<small class="muted">Edição desativada para este casamento</small>`}
      </div>
    </article>`;
  }).join('');
}
async function previewMediaUpload(blob,slot,originalName) {
  const dialog=$('#mediaPreviewDialog');
  if(!dialog || typeof dialog.showModal!=='function')throw new Error('Seu navegador não permite a prévia de imagens. Atualize-o para continuar.');
  const url=URL.createObjectURL(blob);
  const photo=$('#mediaPreviewImage');
  const label=MEDIA_SLOTS.find(item=>item[0]===slot)?.[1] || slot;
  photo.src=url;
  photo.classList.toggle('media-preview__photo--mobile',slot.endsWith('.mobile'));
  $('#mediaPreviewTitle').textContent=label;
  $('#mediaPreviewDetail').textContent=`${originalName} · WebP otimizado · ${(blob.size/1024).toFixed(0)} KB`;
  dialog.returnValue='cancel';
  try {
    dialog.showModal();
    return await new Promise(resolve=>dialog.addEventListener('close',()=>resolve(dialog.returnValue==='save'),{once:true}));
  } finally {photo.removeAttribute('src');URL.revokeObjectURL(url);}
}

async function importDemoImages() {
  if(!state.isAdmin || CONFIG.mode==='demo')throw new Error('Faça login como administrador no Supabase para importar.');
  const button=$('#importDemoImages'),status=$('#demoImagesStatus');
  button.disabled=true;
  let count=0;
  try {
    // Imagens ilustrativas são copiadas diretamente da pasta publicada; não acessa os arquivos dos noivos.
    for(const file of SAMPLE_IMAGE_FILES) {
      status.textContent=`Importando ${count+1} de ${SAMPLE_IMAGE_FILES.length}: ${file}`;
      const response=await fetch(`../convite/assets/images/${file}`,{cache:'no-store'});
      if(!response.ok) throw new Error(`Foto não encontrada: ${file}. Atualize a Vercel com todos os arquivos antes.`);
      const type=file.endsWith('.png')?'image/png':'image/jpeg';
      const blob=await response.blob();
      const {error}=await supabase.storage.from('wedding-demo-media').upload('nivel-3/'+file,blob,{contentType:type,cacheControl:'3600',upsert:true});
      if(error)throw new Error(`${file}: ${error.message}`);
      count++;
    }
    // Marcador de conclusão: só é gravado depois de TODAS as imagens estarem lá.
    const pixel=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/ObkAAAAASUVORK5CYII='),ch=>ch.charCodeAt(0));
    const {error}=await supabase.storage.from('wedding-demo-media').upload('nivel-3/_ready.png',new Blob([pixel],{type:'image/png'}),{contentType:'image/png',cacheControl:'60',upsert:true});
    if(error)throw error;
    status.textContent=`${count} imagens ilustrativas migradas. A demonstração já pode carregá-las do Supabase.`;
    toast('Biblioteca de fotos ilustrativas publicada.');
  } catch(error) {status.textContent=`Importação interrompida em ${count}/${SAMPLE_IMAGE_FILES.length}: ${error.message}`;throw error;}
  finally {button.disabled=false;}
}

function bindActions() {
  $$(".nav-item").forEach(b => b.addEventListener("click", () => showView(b.dataset.view)));
  setMobileMenuOpen(false);
  $("#mobileMenu")?.addEventListener("click", () => {
    setMobileMenuOpen(!$("#adminSidebar")?.classList.contains("is-open"));
    if ($("#adminSidebar")?.classList.contains("is-open")) $("#closeMobileMenu")?.focus();
  });
  $("#closeMobileMenu")?.addEventListener("click", () => setMobileMenuOpen(false, true));
  $("#sidebarBackdrop")?.addEventListener("click", () => setMobileMenuOpen(false, true));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && $("#adminSidebar")?.classList.contains("is-open")) {
      event.preventDefault();
      setMobileMenuOpen(false, true);
    }
  });
  sidebarMobileMedia.addEventListener("change", () => setMobileMenuOpen(false));
  $("#refreshButton")?.addEventListener("click", async () => {
    const button = $("#refreshButton");
    try {
      button.disabled = true; button.classList.add("is-loading");
      await refreshAll(state.weddingId);
      toast("Dados atualizados.");
    } catch (err) { toast(err.message || "Não foi possível atualizar os dados."); }
    finally { button.disabled = false; button.classList.remove("is-loading"); }
  });
  $$('[data-open-invite]').forEach(b => b.addEventListener("click", () => openInvite()));
  $("[data-go-guests]").addEventListener("click", () => showView("guests"));
  $("#newWeddingButton").addEventListener("click", openWedding);
  $("#importGuestsButton").addEventListener("click", openImport);
  $("#exportExcelButton").addEventListener("click", exportExcel);
  $("#exportCsvButton").addEventListener("click", exportCsv);
  $("#importFile").addEventListener("change", e => handleImportFile(e.target.files?.[0]));
  $("#confirmImportButton").addEventListener("click", confirmImport);
  $$('[data-close-import]').forEach(b => b.addEventListener("click", closeImport));
  $$('[data-close-dialog]').forEach(b => b.addEventListener("click", closeInvite));
  $$('[data-close-wedding]').forEach(b => b.addEventListener("click", () => $("#weddingDialog").close()));
  $$('[data-close-response]').forEach(b => b.addEventListener("click", closeResponse));
  $("#weddingSelect").addEventListener("change", async e => { await refreshAll(e.target.value) });
  $('#importDemoImages')?.addEventListener('click',()=>importDemoImages().catch(err=>toast(err.message||'Erro ao importar fotos.')));
  $$('[data-media-preview-close]').forEach(button=>button.addEventListener('click',()=>{
    $('#mediaPreviewDialog')?.close(button.dataset.mediaPreviewClose);
  }));
  $('#allowCouplePhotos')?.addEventListener('change',async e=>{
    if(!state.isAdmin)return;
    const input=e.target,id=state.weddingId,original=state.coupleCanEditMedia;
    input.disabled=true;
    try {await backend.saveMediaEditPermission(id,input.checked);await refreshAll(id);toast(input.checked?'Edição de fotos liberada para os noivos.':'Edição de fotos bloqueada para os noivos.');}
    catch(err){input.checked=original;toast(err.message||'Erro ao alterar a permissão.');}
    finally {input.disabled=false;}
  });
  $('#mediaSlots')?.addEventListener('change',async e=>{
    const input=e.target.closest('[data-media-upload]');if(!input||!input.files?.[0])return;
    const id=state.weddingId,slot=input.dataset.mediaUpload,status=$('#mediaStatus'),file=input.files[0];
    input.disabled=true;
    try {
      if(!canEditMedia())throw new Error('Edição de fotos não autorizada.');
      status.textContent='Otimizando a imagem para prévia...';
      const optimized=await prepareMediaPhoto(file,slot.endsWith('.mobile'));
      const confirmed=await previewMediaUpload(optimized,slot,file.name);
      if(!confirmed) {status.textContent='Envio cancelado; nenhuma alteração foi feita.';return;}
      if(state.weddingId!==id)throw new Error('Casamento alterado; selecione a foto novamente.');
      status.textContent='Enviando fotografia com segurança...';
      await backend.uploadMedia(id,slot,optimized);
      await refreshAll(id);
      toast('Foto publicada apenas para este casamento.');
    } catch(err) {status.textContent=err.message||'Erro no envio';toast(status.textContent);}
    finally {input.value='';input.disabled=false;}
  });
  $('#mediaSlots')?.addEventListener('click',async e=>{
    const button=e.target.closest('[data-media-remove],[data-media-undo]');if(!button)return;
    if(!canEditMedia())return toast('Edição de fotos não autorizada.');
    const undo=button.hasAttribute('data-media-undo'),slot=button.dataset.mediaUndo||button.dataset.mediaRemove,id=state.weddingId;
    if(!confirm(undo?'Restaurar a fotografia anterior deste espaço?':'Restaurar a imagem de demonstração neste espaço?'))return;
    button.disabled=true;
    try {
      if(undo)await backend.restorePreviousMedia(id,slot);
      else await backend.removeMedia(id,slot);
      await refreshAll(id);
      toast(undo?'Foto anterior restaurada.':'Imagem de demonstração restaurada.');
    } catch(err){toast(err.message||'Falha ao restaurar.');button.disabled=false;}
  });
  $("#searchInput").addEventListener("input", renderTables); $("#statusFilter").addEventListener("change", renderTables);
  $("#accessForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    if (!state.isAdmin || !state.weddingId) return;
    const form = e.currentTarget; const status = $("#accessStatus"); const button = $("#inviteCoupleButton");
    const data = Object.fromEntries(new FormData(form).entries());
    try { button.disabled = true; status.textContent = "Enviando convite..."; await backend.inviteCouple({ weddingId: state.weddingId, email: String(data.email || "").trim(), displayName: String(data.display_name || "").trim() }); form.reset(); await refreshAll(state.weddingId); status.textContent = "Acesso criado. Se for uma nova conta, o convite foi enviado por e-mail."; status.classList.add("form-status--success"); }
    catch (err) { status.classList.remove("form-status--success"); status.textContent = err.message || "Não foi possível criar o acesso."; }
    finally { button.disabled = false; }
  });
  document.addEventListener("click", async e => {
    const b = e.target.closest("button"); if (!b) return;
    try {
      if (b.dataset.response) openResponse(b.dataset.response);
      if (b.dataset.copy) await copyLink(b.dataset.copy);
      if (b.dataset.whatsapp) whatsapp(b.dataset.whatsapp);
      if (b.dataset.edit) openInvite(b.dataset.edit);
      if (b.dataset.regenerate) await regenerateToken(b.dataset.regenerate);
      if (b.dataset.removeAccess && confirm("Remover o acesso desta pessoa ao casamento?")) { await backend.removeWeddingMember(b.dataset.removeAccess); await refreshAll(state.weddingId); toast("Acesso removido."); }
      if (b.dataset.delete && confirm("Excluir este convite? Todos os membros e o RSVP vinculados também serão excluídos.")) { await backend.deleteInvitation(b.dataset.delete); await refreshAll(state.weddingId); toast("Convite excluído."); }
    } catch (err) { toast(err.message || "Ocorreu um erro."); }
  });
  $("#inviteForm").addEventListener("submit", async e => {
    e.preventDefault(); const f = new FormData(e.currentTarget); const item = Object.fromEntries(f.entries()); item.id = item.id || null; item.seats = Number(item.seats); item.members = parseMembersValue(item.members);
    if (item.members.length > item.seats) return toast(`Há ${item.members.length} membros cadastrados para apenas ${item.seats} lugares.`);
    try { await backend.saveInvitation(item); closeInvite(); await refreshAll(state.weddingId); toast(item.id ? "Convite atualizado." : "Convite criado."); } catch (err) { toast(err.message || "Não foi possível salvar o convite."); }
  });
  $('#personalizationForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const status=$('#editorStatus'), button=$('#savePersonalization');
    try {
      const settings=collectCustomization();button.disabled=true;status.textContent='Salvando...';
      await backend.saveCustomization(state.weddingId,settings);
      state.customization=settings;status.textContent='Personalização salva. Abra um convite atualizado para conferir.';
      toast('Personalização salva com sucesso.');
    } catch(err) {status.textContent=err.message || 'Não foi possível salvar a personalização.';toast('Erro ao salvar personalização.');}
    finally {button.disabled=false;}
  });
  $("#weddingForm").addEventListener("submit", async e => { e.preventDefault(); const item = Object.fromEntries(new FormData(e.currentTarget).entries()); item.id = state.weddingId; item.invite_base_url = inviteBaseUrl(); try { await backend.saveWedding(item); await refreshAll(state.weddingId); toast("Casamento atualizado.") } catch (err) { toast(err.message) } });
  $("#newWeddingForm").addEventListener("input", e => { if (e.target.name === "name" && !e.currentTarget.elements.slug.dataset.touched) e.currentTarget.elements.slug.value = slugify(e.target.value) }); $("#newWeddingForm").elements.slug.addEventListener("input", e => e.target.dataset.touched = "1");
  $("#newWeddingForm").addEventListener("submit", async e => { e.preventDefault(); const item = Object.fromEntries(new FormData(e.currentTarget).entries()); item.invite_base_url = inviteBaseUrl(); try { await backend.saveWedding(item); $("#weddingDialog").close(); await refreshAll(); state.weddingId = state.weddings.at(-1)?.id || state.weddingId; await refreshAll(state.weddingId); toast("Casamento criado.") } catch (err) { toast(err.message) } });
  $("#logoutButton").addEventListener("click", async () => { await backend.logout(); if (CONFIG.mode === "supabase") location.replace(CONFIG.loginPage || "../index.html"); else location.reload(); });
}

async function start() {
  $("#brandName").textContent = CONFIG.brandName || "Gestão de Convidados";
  $("#modeBadge").textContent = CONFIG.mode === "demo" ? "DEMO" : "SUPABASE";
  bindActions();
  state.user = await backend.currentUser();
  if (CONFIG.mode === "supabase" && !state.user) { location.replace(CONFIG.loginPage || "../index.html"); return; }
  state.profile = await backend.profile(state.user);
  state.isAdmin = state.profile?.role === "admin";
  const email = state.user?.email || state.profile?.email || "Usuário";
  $("#userEmail").textContent = state.profile?.display_name || email; $("#userInitial").textContent = (state.profile?.display_name || email).slice(0, 1).toUpperCase();
  applyPermissions();
  $("#authGuard").hidden = true; $("#app").hidden = false; await refreshAll();
  if (CONFIG.mode === "supabase") supabase.auth.onAuthStateChange((event) => { if (event === "SIGNED_OUT") location.replace(CONFIG.loginPage || "../index.html"); });
}
start().catch(err => { console.error(err); document.body.innerHTML = `<div style="padding:30px;font-family:sans-serif"><h1>Erro de configuração</h1><p>${escapeHtml(err.message)}</p></div>` });
