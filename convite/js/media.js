/* Imagens demonstrativas compartilhadas + fotos privadas por casamento (token validado pela API).
   Os links assinados nunca são gravados no banco; somente o caminho do objeto é salvo. */
(() => {
  'use strict';
  const C = window.WEDDING_CONFIG || {};
  const G = window.GIFT_LIST_CONFIG || {};
  const origin = (() => { try { return new URL(C.guestSystem?.endpoint || '').origin; } catch { return ''; } })();
  const demoRoot = origin + '/storage/v1/object/public/wedding-demo-media/nivel-3/';
  const slotMatcher = /^(hero|story|event[01]|schedule|timeline[0-4]|gallery[0-4]|dressCode|rsvp)\.(desktop|mobile)$/;
  const safeRemote = url => typeof url === 'string' && /^https:\/\//i.test(url) && url.startsWith(origin + '/storage/v1/object/');
  const demoMode = new URLSearchParams(location.search).get('demo') === '1' && !new URLSearchParams(location.search).has('convite');
  const slots = {
    hero: () => C.hero?.image,
    story: () => C.story?.image,
    event0: () => C.events?.[0]?.image,
    event1: () => C.events?.[1]?.image,
    schedule: () => C.schedule?.backgroundImage,
    timeline0: () => C.schedule?.items?.[0]?.image,
    timeline1: () => C.schedule?.items?.[1]?.image,
    timeline2: () => C.schedule?.items?.[2]?.image,
    timeline3: () => C.schedule?.items?.[3]?.image,
    timeline4: () => C.schedule?.items?.[4]?.image,
    gallery0: () => C.gallery?.images?.[0]?.src,
    gallery1: () => C.gallery?.images?.[1]?.src,
    gallery2: () => C.gallery?.images?.[2]?.src,
    gallery3: () => C.gallery?.images?.[3]?.src,
    gallery4: () => C.gallery?.images?.[4]?.src,
    dressCode: () => C.dressCode?.image,
    rsvp: () => C.images?.rsvp
  };
  function replaceSamples(value) {
    if (typeof value === 'string' && value.startsWith('assets/images/')) return demoRoot + value.slice('assets/images/'.length);
    if (value && typeof value === 'object') {
      for (const key of ['desktop','mobile']) if (typeof value[key] === 'string') value[key] = replaceSamples(value[key]);
    }
    return value;
  }
  function applyPrivateOverrides(media) {
    for (const [slot, url] of Object.entries(media || {})) {
      if (!slotMatcher.test(slot) || !safeRemote(url)) continue;
      const [kind, variant] = slot.split('.');
      const asset = slots[kind]?.();
      if (asset && typeof asset === 'object') asset[variant] = url;
    }
  }
  function applyWeddingIdentity(context) {
    if (!context?.weddingName || demoMode) return;
    const fromTemplate = `${C.couple?.firstName || ''} & ${C.couple?.secondName || ''}`.toLowerCase().replace(/\s+/g,' ').trim();
    const current = String(context.weddingName).toLowerCase().replace(/\s+/g,' ').trim();
    if (current === fromTemplate) return; // preserva o conteúdo existente dos primeiros noivos.
    const [firstName,secondName] = String(context.weddingName).split(/\s+(?:&|e)\s+/i);
    if (firstName && secondName) Object.assign(C.couple, {
      firstName:firstName.trim(),secondName:secondName.trim(),
      initials:`${firstName.trim()[0]?.toUpperCase() || ''} · ${secondName.trim()[0]?.toUpperCase() || ''}`,
      signature:`Com carinho, ${firstName.trim()} & ${secondName.trim()}`
    });
    else C.couple.firstName = String(context.weddingName);
    const iso=context.eventDate;
    if (typeof iso==='string' && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const dt=new Date(iso+'T12:00:00');
      if(!Number.isNaN(dt.getTime())) {
        C.wedding.longDate=dt.toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'});
        C.wedding.shortDate=dt.toLocaleDateString('pt-BR');
        C.wedding.weekday=dt.toLocaleDateString('pt-BR',{weekday:'long'});
        C.wedding.day=dt.toLocaleDateString('pt-BR',{day:'2-digit'});
        C.wedding.month=dt.toLocaleDateString('pt-BR',{month:'long'});
        C.wedding.year=dt.toLocaleDateString('pt-BR',{year:'numeric'});
        C.wedding.dateISO=iso+'T17:00:00-03:00';
      }
    }
    C.wedding.city='Local a definir';
    C.wedding.calendarTitle='Casamento — '+context.weddingName;
    C.wedding.calendarDescription='Celebração do casamento de '+context.weddingName;
    C.wedding.calendarLocation='Local a definir';
    if(C.sharing)C.sharing.title='Convite de casamento — '+context.weddingName;
    if(C.rsvp)C.rsvp.baseMessage='Olá! Estou respondendo ao convite de '+context.weddingName;
    C.wedding.time='Horário a definir';
    C.story.title='Nossa história';
    C.story.pretitle='Nossa história';
    C.story.phrase='Um novo capítulo está começando.';
    C.story.paragraphs=['Este espaço será personalizado com a história do casal.'];
    C.story.quote='Uma história especial para contar.';
    if(C.rsvp) C.rsvp.deadline='Confirmação a combinar';
    if(C.dressCode) C.dressCode.note='Consulte o traje sugerido com os noivos.';
    (C.schedule?.items || []).forEach(item=>item.time='A definir');
    (C.events || []).forEach((event,index)=>{
      event.venue=index===0?'Local da cerimônia a definir':'Local da recepção a definir';
      event.address='Informe o endereço na aba Personalizar convite.';
      event.time='Horário a definir';
      event.mapsUrl='';
    });
    if(C.guestInfo?.items) C.guestInfo.items=C.guestInfo.items.map(row=>({...row,text:'Consulte os detalhes do evento com os noivos.'}));
  }
  function demoProfile() {
    if (!demoMode) return;
    C.couple = { firstName:'Camila',secondName:'Rafael',initials:'C · R',signature:'Com carinho, Camila & Rafael' };
    Object.assign(C.wedding,{longDate:'Uma data especial',shortDate:'Em breve',weekday:'Sábado',day:'12',month:'Setembro',year:'2027',time:'17h',city:'Sua cidade · Seu estado'});
    C.wedding.dateISO = '2027-09-12T17:00:00-03:00';
    C.wedding.calendarTitle='Convite demonstrativo de casamento';
    C.wedding.calendarDescription='Demonstração ilustrativa do convite digital.';
    C.wedding.calendarLocation='Local fictício';
    if(C.sharing) C.sharing.title='Demonstração de convite de casamento';
    C.opening.title = 'Uma celebração especial está chegando.';
    C.hero.subtitle = 'Um exemplo de como pode ficar o seu convite personalizado.';
    C.story.title = 'Uma história que merece ser celebrada.';
    C.story.paragraphs = ['Cada história é única. Aqui você poderá contar como se conheceram, os momentos especiais e os planos para o grande dia.', 'As fotografias desta demonstração são ilustrativas e serão substituídas pelas imagens do seu casamento.'];
    C.story.quote = 'O próximo capítulo pode ser o de vocês.';
    (C.events || []).forEach((v, i) => { v.venue=i===0?'Local da cerimônia':'Espaço da recepção';v.address='Endereço a definir';v.time=i===0?'Horário da cerimônia':'Após a cerimônia';v.mapsUrl=''; });
    C.sections = { ...(C.sections || {}), rsvp:false };
    if(C.rsvp) C.rsvp.enabled=false;
    C.guestSystem.enabled=false;
    if (G.payment) G.payment = { mode:'noAmount',pixCode:'',pixLink:'',giftPixCodes:{},receiverName:'' };
    const banner=document.createElement('div');banner.className='sample-mode-banner';banner.textContent='DEMONSTRAÇÃO · Fotos ilustrativas · Sem RSVP ou pagamentos';
    document.body.appendChild(banner);
    document.querySelectorAll('a[href="#rsvp"]').forEach(a=>{a.href='#detalhes';a.textContent='Ver detalhes';});
    document.body.classList.add('is-sample-demo');
  }
  // Inicia a conferência do acervo antes da consulta ao convidado, em paralelo.
  // Não bloqueia a abertura se o Storage estiver lento (ou o marcador ainda não existir).
  const demoMarkerKey = 'wedding_demo_library_ready_v1';
  let readyFromSession = false;
  try {readyFromSession=sessionStorage.getItem(demoMarkerKey)==='1';} catch {}
  const probePromise = origin.startsWith('https://') && !readyFromSession
    ? fetch(demoRoot+'_ready.png',{method:'GET',cache:'default'})
        .then(response=>{
          if(response.ok){try{sessionStorage.setItem(demoMarkerKey,'1');}catch{}}
          return response.ok;
        }).catch(()=>false)
    : Promise.resolve(readyFromSession);
  async function apply(media = {}) {
    // Espera no máximo 180 ms; fotos próprias são aplicadas independentemente do marcador.
    const hasSampleLibrary = readyFromSession || await Promise.race([
      probePromise, new Promise(resolve=>setTimeout(()=>resolve(false),180))
    ]);
    if(hasSampleLibrary){
      for(const getter of Object.values(slots)) replaceSamples(getter());
      (G.items||[]).forEach(item=>{if(typeof item.image==='string') item.image=replaceSamples(item.image);});
    }
    applyPrivateOverrides(media);
  }
  window.InviteMedia = {demoMode, demoProfile, apply, applyWeddingIdentity};
})();
