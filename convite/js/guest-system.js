(() => {
  const demoKey = "wedding_guest_manager_demo_v1";
  const demoRsvpKey = "wedding_guest_rsvp_demo_v1";
  const params = new URLSearchParams(location.search);

  function token(config) { return (params.get(config?.tokenQueryParam || "convite") || "").trim(); }
  function normalizeMembers(inv) {
    if (Array.isArray(inv?.members)) return inv.members.map(v => typeof v === "string" ? v : v?.name).filter(Boolean);
    if (Array.isArray(inv?.invitation_members)) return [...inv.invitation_members].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(v=>v.name).filter(Boolean);
    return [];
  }
  function demoLookup(config, value) {
    const staticInvite = config?.demoInvites?.[value];
    if (staticInvite) {
      let stored = null; let members = staticInvite.members || [];
      try { const d = JSON.parse(localStorage.getItem(demoKey)); const inv = d?.invitations?.find(i => i.token === value); stored = Array.isArray(inv?.rsvps) ? inv.rsvps[0] : inv?.rsvps || null; if (inv) members = normalizeMembers(inv); } catch {}
      try { const own = JSON.parse(localStorage.getItem(demoRsvpKey) || "{}"); stored = own[value] || stored; } catch {}
      return { token:value, displayName:staticInvite.displayName, seats:Number(staticInvite.seats||1), members, rsvp:stored };
    }
    try {
      const d = JSON.parse(localStorage.getItem(demoKey));
      const inv = d?.invitations?.find(i => i.token === value);
      if (!inv) return null;
      return { token:value, displayName:inv.display_name, seats:Number(inv.seats||1), members:normalizeMembers(inv), rsvp:Array.isArray(inv.rsvps)?inv.rsvps[0]||null:inv.rsvps||null };
    } catch { return null; }
  }
  async function apiCall(config, body) {
    const response = await fetch(config.endpoint, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    const data = await response.json().catch(()=>({}));
    if (!response.ok) throw new Error(data.error || "Não foi possível acessar o convite.");
    return data;
  }
  async function resolve(config) {
    if (!config?.enabled) return null;
    const value = token(config); if (!value) return null;
    if (config.mode === "demo") return demoLookup(config, value);
    const data = await apiCall(config, { action:"lookup", token:value });
    return { token:value, displayName:data.invitation.displayName, seats:Number(data.invitation.seats||1), members:data.invitation.members || [], rsvp:data.invitation.rsvp, customization:data.customization || {}, media:data.media || {}, weddingName:data.invitation.weddingName || "", eventDate:data.invitation.eventDate || null };
  }
  async function submit(config, context, payload) {
    if (!config?.enabled || !context?.token) throw new Error("Convite individual não identificado.");
    if (config.mode === "demo") {
      const record = { attending:payload.attending, guest_count:payload.guestCount, submitted_name:payload.submittedName, guest_names:payload.guestNames || [], message:payload.message, responded_at:new Date().toISOString(), updated_at:new Date().toISOString() };
      const r = JSON.parse(localStorage.getItem(demoRsvpKey) || "{}"); r[context.token] = record; localStorage.setItem(demoRsvpKey, JSON.stringify(r));
      try { const d=JSON.parse(localStorage.getItem(demoKey)); const inv=d?.invitations?.find(i=>i.token===context.token); if(inv){inv.rsvps=[record];localStorage.setItem(demoKey,JSON.stringify(d));} } catch {}
      return { ok:true, message:"Confirmação salva no modo demonstração." };
    }
    return apiCall(config, { action:"rsvp", token:context.token, ...payload });
  }
  window.GuestSystem = { resolve, submit };
})();
