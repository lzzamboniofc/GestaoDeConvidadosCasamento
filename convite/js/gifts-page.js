(async () => {
  'use strict';
  const C = window.WEDDING_CONFIG, G = window.GIFT_LIST_CONFIG;
  const $ = (s,r=document) => r.querySelector(s);
  const $$ = (s,r=document) => [...r.querySelectorAll(s)];
  const esc = v => String(v??'').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const params = new URLSearchParams(location.search);
  let guest = null, lookupError = '';
  window.InviteMedia?.demoProfile();
  try { guest = await window.GuestSystem.resolve(C.guestSystem); }
  catch(e) { lookupError = e.message || 'Não foi possível abrir o convite.'; }
  if (!guest && !window.InviteMedia?.demoMode && C.guestSystem?.mode === 'api') {
    document.body.innerHTML = '<main style="min-height:100vh;display:grid;place-content:center;text-align:center;padding:35px;font-family:system-ui,sans-serif;color:#29362f;background:#f8f7f4"><h1>Lista não disponível</h1><p>Acesse usando seu link personalizado de convite.</p></main>';
    return;
  }
  window.InviteMedia?.applyWeddingIdentity(guest);
  window.InvitePersonalization?.apply(guest?.customization);
  await window.InviteMedia?.apply(guest?.media);
  const colors = {...(window.WEDDING_THEMES?.[C.themePreset] || window.WEDDING_THEMES.sage),...(C.customColors || {})};
  const cssMap = {background:'--bg',surface:'--surface',surfaceAlt:'--surface-alt',text:'--text',muted:'--muted',accent:'--accent',accentDark:'--accent-dark',accentSoft:'--accent-soft',warm:'--warm',line:'--line',heroText:'--hero-text'};
  for(const [key,name] of Object.entries(cssMap)) if(colors[key]) document.documentElement.style.setProperty(name,colors[key]);
  if(C.fonts?.title) document.documentElement.style.setProperty('--title-font', C.fonts.title);
  if(C.fonts?.body) document.documentElement.style.setProperty('--body-font', C.fonts.body);
  $('meta[name="theme-color"]')?.setAttribute('content',colors.background || '#F4F6FA');
  const get = path => path.split('.').reduce((v,k)=>v?.[k],C);
  $$('[data-wedding]').forEach(el => { const v=get(el.dataset.wedding); if(v!=null)el.textContent=v; });
  const backLinks = $$('a[href^="index.html"]');
  backLinks.forEach(el=>{const url=new URL(el.getAttribute('href'),location.href);if(params.has('convite')) url.searchParams.set('convite',params.get('convite')); if(window.InviteMedia?.demoMode) url.searchParams.set('demo','1');el.href=url.href;});
  document.title = `${G.title} — ${C.couple.firstName} & ${C.couple.secondName}`;
  $('#giftPageTitle').textContent = G.title;
  $('#giftEyebrow').textContent = G.eyebrow;
  $('#giftIntro').textContent = G.intro;
  $('#giftCount').textContent = String(G.items.length);
  const giftNotice=$('#giftNotice');
  const accessible=(guest || window.InviteMedia?.demoMode) && C.sections?.gifts !== false;
  if(!accessible){
    giftNotice.textContent = !params.get('convite') ? 'Para visualizar os presentes, abra o link personalizado do seu convite.' : lookupError || 'Esta lista não está disponível para este convite.';
    $('#giftFilters').hidden=true;$('#giftGrid').hidden=true;$('#giftEmpty').hidden=true;
    document.querySelector('#como-funciona')?.remove();document.querySelector('#sobre-lua-de-mel')?.remove();
    return;
  }
  const perGift = G.payment?.mode === 'perGift';
  const availableCodes = G.items.filter(item=>String(G.payment?.giftPixCodes?.[item.id] || '').trim()).length;
  const configured=perGift ? availableCodes>0 : Boolean(G.payment?.pixLink || G.payment?.pixCode);
  giftNotice.textContent = window.InviteMedia?.demoMode ? 'Demonstração ilustrativa: pagamentos desabilitados neste exemplo.' : perGift
    ? (availableCodes ? `${availableCodes} de ${G.items.length} presentes com PIX individual cadastrado. Os valores são definidos pelo banco; confira valor e favorecido antes de confirmar.` : 'Os noivos ainda não cadastraram os códigos PIX dos presentes.')
    : configured ? (G.notice || 'Confira os dados antes de concluir qualquer pagamento.') : 'A lista de presentes está disponível para consulta; o PIX ainda não foi configurado pelos noivos.';
  const money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
  const label=category=>G.categories.find(c=>c.id===category)?.label || category;
  const filters=$('#giftFilters');let filter='all';
  filters.innerHTML=G.categories.map(c=>`<button type="button" class="gift-filter ${c.id==='all'?'is-active':''}" data-filter="${esc(c.id)}" aria-pressed="${c.id==='all'}">${esc(c.label)}</button>`).join('');
  const grid=$('#giftGrid');
  grid.innerHTML=G.items.map((item,i)=>`<article class="gift-card" data-category="${esc(item.category)}"><button class="gift-card__button" data-open="${esc(item.id)}" type="button" aria-label="Ver presente: ${esc(item.title)}"><div class="gift-card__media"><img loading="lazy" src="${esc(item.image)}" alt="${esc(item.title)}"><span class="gift-card__number">${String(i+1).padStart(2,'0')}</span></div><span class="gift-card__category">${esc(label(item.category))}</span><h3>${esc(item.title)}</h3><p class="gift-card__description">${esc(item.description)}</p><div class="gift-card__bottom"><strong class="gift-card__price">${money.format(item.price)}</strong><span class="gift-card__cta">Presentear →</span></div></button></article>`).join('');
  const applyFilter=(id,scroll=false)=>{
    filter=id;let count=0;
    $$('.gift-card').forEach(card=>{const yes=id==='all'||card.dataset.category===id;card.hidden=!yes;if(yes)count++});
    $$('.gift-filter').forEach(btn=>{const on=btn.dataset.filter===id;btn.classList.toggle('is-active',on);btn.setAttribute('aria-pressed',String(on))});
    $('#giftEmpty').hidden=count>0;
    if(scroll) $('#lista').scrollIntoView({behavior:'smooth'});
  };
  filters.addEventListener('click',e=>{const el=e.target.closest('[data-filter]');if(el)applyFilter(el.dataset.filter)});
  $$('[data-filter-jump]').forEach(el=>el.addEventListener('click',()=>applyFilter(el.dataset.filterJump,true)));
  const modal=$('#giftModal'), copy=$('#giftCopyPix'), external=$('#giftPixLink');
  const pixPanel=$('#giftPixPanel'), pixCodeField=$('#giftPixCode');
  const pixCopyStatus=$('#giftPixCopyStatus'), pixReceiver=$('#giftPixReceiver');
  let lastFocus;
  grid.addEventListener('click',e=>{
    const btn=e.target.closest('[data-open]');if(!btn)return;
    const item=G.items.find(g=>g.id===btn.dataset.open);if(!item)return;
    lastFocus=document.activeElement;
    $('#giftModalPhoto').src=item.image;$('#giftModalPhoto').alt=item.title;
    $('#giftModalCategory').textContent=label(item.category);$('#giftModalTitle').textContent=item.title;
    $('#giftModalDescription').textContent=item.description;$('#giftModalPrice').textContent=money.format(item.price);
    const pixCode=String(perGift ? (G.payment?.giftPixCodes?.[item.id] || '') : (G.payment?.pixCode || '')).trim();
    const pixLink=perGift ? '' : (G.payment?.pixLink || '');
    const receiverName=String(G.payment?.receiverName || '').trim();
    pixPanel.hidden=!pixCode;
    pixCodeField.value=pixCode;
    copy.disabled=!pixCode;
    copy.textContent='Copiar código PIX';
    pixCopyStatus.textContent='';
    pixReceiver.hidden=!receiverName;
    pixReceiver.textContent=receiverName ? `Favorecido informado pelos noivos: ${receiverName}` : '';
    external.hidden=!pixLink;
    if(pixLink) external.href=pixLink;
    else external.removeAttribute('href');
    $('#giftModalNote').textContent=perGift
      ? (pixCode
        ? `PIX cadastrado especificamente para ${money.format(item.price)}. Confira o favorecido e o valor final no banco. Copiar o código não confirma pagamento nem reserva o presente.`
        : 'O código PIX deste presente ainda não foi cadastrado pelos noivos. Este presente está temporariamente indisponível para pagamento; você pode escolher outro.')
      : (configured
        ? `Este PIX não define automaticamente ${money.format(item.price)}. Informe ou confira o valor no banco antes de pagar. Copiar o código não confirma pagamento.`
        : 'Os noivos ainda não cadastraram um código PIX nem um link de pagamento. Consulte novamente mais tarde.');
    $('.gift-modal__panel',modal).scrollTop=0;
    $('.gift-modal__content',modal).scrollTop=0;
    modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');document.body.classList.add('gift-modal-open');
    $('.gift-modal__close',modal)?.focus();
  });
  const close=()=>{modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('gift-modal-open');lastFocus?.focus?.()};
  $$('[data-gift-close]',modal).forEach(el=>el.addEventListener('click',close));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('is-open'))close()});
  const fallbackCopy=()=>{
    pixCodeField.focus();pixCodeField.select();pixCodeField.setSelectionRange(0,pixCodeField.value.length);
    return document.execCommand('copy');
  };
  copy.addEventListener('click',async()=>{
    const value=pixCodeField.value.trim();
    if(!value) return;
    try {
      if(navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        // Alternativa para navegadores sem Clipboard API, incluindo alguns aparelhos antigos.
        if(!fallbackCopy()) throw new Error('Cópia indisponível');
      }
      copy.textContent='Código PIX copiado ✓';
      pixCopyStatus.textContent='Copiado! Agora abra seu banco e escolha PIX copia e cola.';
    } catch {
      try {
        if(!fallbackCopy()) throw new Error('Cópia indisponível');
        copy.textContent='Código PIX copiado ✓';
        pixCopyStatus.textContent='Copiado! Agora abra seu banco e escolha PIX copia e cola.';
      } catch {
        pixCodeField.focus();pixCodeField.select();
        copy.textContent='Selecione e copie o código';
        pixCopyStatus.textContent='Não foi possível copiar automaticamente. Selecione o código acima e copie manualmente.';
      }
    }
  });
  modal.addEventListener('keydown',e=>{
    if(e.key!=='Tab' || !modal.classList.contains('is-open'))return;
    const focusable=$$('button:not([disabled]):not([hidden]),a[href]:not([hidden]),textarea:not([disabled]):not([hidden])',modal).filter(el=>el.getClientRects().length>0);
    if(!focusable.length)return;
    const first=focusable[0],last=focusable.at(-1);
    if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
  });
  const navToggle=$('#giftMenuToggle');navToggle.addEventListener('click',()=>{let active=document.body.classList.toggle('gift-menu-open');navToggle.setAttribute('aria-expanded',String(active))});
  $$('#giftNav a').forEach(el=>el.addEventListener('click',()=>{document.body.classList.remove('gift-menu-open');navToggle.setAttribute('aria-expanded','false')}));
  const onScroll=()=>{const limit=document.documentElement.scrollHeight-innerHeight;$('#giftProgressBar').style.width= limit>0?`${Math.min(100,scrollY/limit*100)}%`:'0%';$('#giftBackToTop').classList.toggle('is-visible',scrollY>350)};
  addEventListener('scroll',onScroll,{passive:true});onScroll();
})();
