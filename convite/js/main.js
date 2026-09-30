(async () => {
  const C = window.WEDDING_CONFIG || {};
  // Busca configurações do casamento pelo token ANTES de montar a página.
  const params = new URLSearchParams(location.search);
  window.InviteMedia?.demoProfile();
  let invitationContext = null;
  try { invitationContext = await window.GuestSystem?.resolve(C.guestSystem); }
  catch (error) { console.warn("Não foi possível carregar o convite:", error); }
  if (!invitationContext && !window.InviteMedia?.demoMode && C.guestSystem?.mode === 'api') {
    document.body.classList.remove('is-locked');
    document.body.innerHTML = '<main style="min-height:100vh;display:grid;place-content:center;text-align:center;padding:35px;font-family:system-ui,sans-serif;color:#29362f;background:#f8f7f4"><h1>Convite não disponível</h1><p>Abra o link personalizado que você recebeu dos noivos.</p></main>';
    return;
  }
  window.InviteMedia?.applyWeddingIdentity(invitationContext);
  window.InvitePersonalization?.apply(invitationContext?.customization);
  await window.InviteMedia?.apply(invitationContext?.media);
  const themes = window.WEDDING_THEMES || {};
  const theme = { ...(themes[C.themePreset] || themes.sage || {}), ...(C.customColors || {}) };
  const root = document.documentElement;

  const cssVars = {
    background: '--bg', surface: '--surface', surfaceAlt: '--surface-alt', text: '--text', muted: '--muted',
    accent: '--accent', accentDark: '--accent-dark', accentSoft: '--accent-soft', warm: '--warm', line: '--line', heroText: '--hero-text'
  };
  Object.entries(cssVars).forEach(([key, variable]) => theme[key] && root.style.setProperty(variable, theme[key]));
  if (C.fonts?.title) root.style.setProperty('--title-font', C.fonts.title);
  if (C.fonts?.body) root.style.setProperty('--body-font', C.fonts.body);

  const get = (path) => path.split('.').reduce((obj, key) => obj?.[key], C);
  const isMobileViewport = () => window.matchMedia('(max-width: 767px)').matches;
  const pickAsset = (asset) => {
    if (!asset) return '';
    if (typeof asset === 'string') return asset;
    if (typeof asset === 'object') return isMobileViewport() ? (asset.mobile || asset.desktop || asset.src || '') : (asset.desktop || asset.mobile || asset.src || '');
    return '';
  };
  const resolveAssetUrl = (asset) => {
    const src = pickAsset(asset);
    if (!src) return '';
    try { return new URL(src, document.baseURI).href; } catch { return src; }
  };
  const applyImageAsset = (img, asset) => {
    const src = resolveAssetUrl(asset);
    if (img && src && img.getAttribute('src') !== src) img.setAttribute('src', src);
  };
  const imageCssValue = (asset) => {
    const src = resolveAssetUrl(asset);
    return src ? `url("${src.replace(/"/g, '\\"')}")` : 'none';
  };
  document.querySelectorAll('[data-text]').forEach(el => {
    const value = get(el.dataset.text);
    if (value !== undefined && value !== null) el.textContent = value;
  });

  // Paleta completa inclui superfícies, bordas, fundos e textos do tema.
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta && theme.background) themeMeta.content = theme.background;
  document.title = `Casamento — ${C.couple.firstName} & ${C.couple.secondName}`;
  const metaTitle = document.querySelector('meta[property="og:title"]');
  const metaDesc = document.querySelector('meta[property="og:description"]');
  if (metaTitle) metaTitle.content = C.sharing?.title || document.title;
  if (metaDesc) metaDesc.content = C.sharing?.text || C.hero?.subtitle || '';

  const heroImage = document.getElementById('heroImage');
  const openingImage = document.getElementById('openingImage');
  applyImageAsset(heroImage, C.hero?.image);
  applyImageAsset(openingImage, C.hero?.image);

  const guestParam = C.opening?.guestQueryParam || 'convidado';
  const legacyGuestName = (params.get(guestParam) || '').trim();
  const guestName = invitationContext?.displayName || legacyGuestName;
  const greeting = document.getElementById('personalGreeting');
  const greetingLabel = document.getElementById('personalGreetingLabel');
  const heroGuestBadge = document.getElementById('heroGuestBadge');
  if (greetingLabel) greetingLabel.textContent = guestName ? (C.opening?.guestPrefix || 'Convite destinado a') : '';
  if (greeting) greeting.textContent = guestName || '';
  if (heroGuestBadge) {
    if (guestName) { heroGuestBadge.hidden = false; heroGuestBadge.textContent = `Convidado: ${guestName}`; }
    else heroGuestBadge.hidden = true;
  }
  const rsvpName = document.getElementById('rsvpName');
  if (rsvpName && guestName) rsvpName.value = guestName;

  const opening = document.getElementById('opening');
  const openButton = document.getElementById('openInvitation');
  const header = document.getElementById('siteHeader');
  const musicPlayer = document.getElementById('musicPlayer');
  const musicToggle = document.getElementById('musicToggle');
  const backgroundMusic = document.getElementById('backgroundMusic');
  const musicStatus = document.getElementById('musicStatus');
  const revealMusicPlayer = () => {
    if (C.music?.enabled && C.music?.file && musicPlayer) musicPlayer.hidden = false;
  };
  const openSite = () => {
    opening?.setAttribute('hidden', '');
    document.body.classList.remove('is-locked');
    header?.classList.add('is-visible');
    revealMusicPlayer();
  };
  if (C.opening?.enabled === false) openSite();
  else openButton?.addEventListener('click', openSite);

  const navToggle = document.getElementById('navToggle');
  const nav = document.getElementById('siteNav');
  const closeNav = () => {
    nav?.classList.remove('is-open');
    navToggle?.setAttribute('aria-expanded', 'false');
    navToggle?.setAttribute('aria-label', 'Abrir menu');
  };
  navToggle?.addEventListener('click', () => {
    const open = nav?.classList.toggle('is-open') ?? false;
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
  document.addEventListener('pointerdown', event => {
    if (nav?.classList.contains('is-open') && !nav.contains(event.target) && !navToggle?.contains(event.target)) closeNav();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav?.classList.contains('is-open')) {
      closeNav(); navToggle?.focus();
    }
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', event => {
    if (event.matches) closeNav();
  });

  const targetDate = new Date(C.wedding.dateISO).getTime();
  const updateCountdown = () => {
    const diff = Math.max(0, targetDate - Date.now());
    const values = {
      days: Math.floor(diff / 86400000),
      hours: Math.floor(diff / 3600000) % 24,
      minutes: Math.floor(diff / 60000) % 60,
      seconds: Math.floor(diff / 1000) % 60
    };
    Object.entries(values).forEach(([key, value]) => {
      const el = document.querySelector(`[data-count="${key}"]`);
      if (el) el.textContent = String(value).padStart(2, '0');
    });
  };
  updateCountdown(); setInterval(updateCountdown, 1000);

  const storyImage = document.getElementById('storyImage');
  applyImageAsset(storyImage, C.story?.image);
  const storyParagraphs = document.getElementById('storyParagraphs');
  if (storyParagraphs) (C.story?.paragraphs || []).forEach(text => {
    const p = document.createElement('p'); p.textContent = text; storyParagraphs.appendChild(p);
  });
  if (C.story?.enabled === false) document.getElementById('historia')?.remove();

  const eventGrid = document.getElementById('eventGrid');
  (C.events || []).forEach((event, index) => {
    const article = document.createElement('article'); article.className = 'event-card';
    const mediaStyle = event.image ? ` style="--event-image:${imageCssValue(event.image)}"` : '';
    article.innerHTML = `<div class="event-card__media"${mediaStyle} aria-hidden="true"></div><div class="event-card__body"><span class="event-card__index">0${index + 1} · ${event.label}</span><h3>${event.venue}</h3><p class="event-card__time">${event.time}</p><address>${event.address}</address>${event.mapsUrl ? `<a href="${event.mapsUrl}" target="_blank" rel="noopener">${event.mapsLabel} →</a>` : ""}</div>`;
    eventGrid?.appendChild(article);
  });

  const timeline = document.getElementById('timeline');
  const scheduleSection = document.getElementById('programacao');
  let activeScheduleIndex = null;
  const defaultScheduleImage = () => C.schedule?.backgroundImage ? imageCssValue(C.schedule.backgroundImage) : 'none';
  const scheduleItemImage = (index) => C.schedule?.items?.[index]?.image ? imageCssValue(C.schedule.items[index].image) : '';
  const setScheduleBackground = (value) => {
    if (scheduleSection) scheduleSection.style.setProperty('--schedule-bg-image', value || defaultScheduleImage() || 'none');
  };
  setScheduleBackground(defaultScheduleImage());
  (C.schedule?.items || []).forEach((item, index) => {
    const row = document.createElement('div'); row.className = 'timeline-item';
    row.dataset.scheduleIndex = String(index);
    row.innerHTML = `<time>${item.time}</time><div><h3>${item.title}</h3><p>${item.text}</p></div>`;
    const activate = () => {
      const itemImage = scheduleItemImage(index);
      if (!itemImage) return;
      activeScheduleIndex = index;
      setScheduleBackground(itemImage);
    };
    if (item.image) {
      row.addEventListener('mouseenter', activate);
      row.addEventListener('focusin', activate);
    }
    const deactivate = () => {
      activeScheduleIndex = null;
      setScheduleBackground(defaultScheduleImage());
    };
    row.addEventListener('mouseleave', deactivate);
    row.addEventListener('focusout', deactivate);
    timeline?.appendChild(row);
  });
  timeline?.addEventListener('mouseleave', () => {
    activeScheduleIndex = null;
    setScheduleBackground(defaultScheduleImage());
  });
  if (C.schedule?.enabled === false) document.getElementById('programacao')?.remove();

  const galleryGrid = document.getElementById('galleryGrid');
  const galleryImages = C.gallery?.images || [];
  galleryImages.forEach((image, index) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'gallery-item'; button.dataset.index = index;
    const src = resolveAssetUrl(image.src ?? image);
    button.innerHTML = `<img src="${src}" alt="${image.alt || ''}" loading="lazy"><span>${image.caption || `Foto ${index + 1}`}</span>`;
    galleryGrid?.appendChild(button);
  });
  if (C.gallery?.enabled === false) document.getElementById('galeria')?.remove();

  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxCaption = document.getElementById('lightboxCaption');
  let currentImage = 0;
  const showImage = (index) => {
    if (!galleryImages.length) return;
    currentImage = (index + galleryImages.length) % galleryImages.length;
    const img = galleryImages[currentImage];
    lightboxImage.src = resolveAssetUrl(img.src ?? img); lightboxImage.alt = img.alt || ''; lightboxCaption.textContent = img.caption || '';
  };
  const openLightbox = (index) => { showImage(index); lightbox.classList.add('is-open'); lightbox.setAttribute('aria-hidden', 'false'); };
  const closeLightbox = () => { lightbox.classList.remove('is-open'); lightbox.setAttribute('aria-hidden', 'true'); };
  galleryGrid?.addEventListener('click', e => { const item = e.target.closest('.gallery-item'); if (item) openLightbox(Number(item.dataset.index)); });
  document.getElementById('lightboxClose')?.addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev')?.addEventListener('click', () => showImage(currentImage - 1));
  document.getElementById('lightboxNext')?.addEventListener('click', () => showImage(currentImage + 1));
  lightbox?.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => { if (!lightbox?.classList.contains('is-open')) return; if (e.key === 'Escape') closeLightbox(); if (e.key === 'ArrowLeft') showImage(currentImage - 1); if (e.key === 'ArrowRight') showImage(currentImage + 1); });

  const dressImage = document.getElementById('dressImage');
  applyImageAsset(dressImage, C.dressCode?.image);
  const palette = document.getElementById('dressPalette');
  (C.dressCode?.palette || []).forEach(color => { const swatch = document.createElement('span'); swatch.style.background = color; palette?.appendChild(swatch); });
  if (C.dressCode?.enabled === false) document.getElementById('dress-code')?.remove();

  const iconMap = { car: '↗', clock: '◷', camera: '◎', heart: '♡' };
  const infoGrid = document.getElementById('infoGrid');
  (C.guestInfo?.items || []).forEach(item => {
    const card = document.createElement('article'); card.className = 'info-card';
    card.innerHTML = `<span class="info-card__icon">${iconMap[item.icon] || '•'}</span><h3>${item.title}</h3><p>${item.text}</p>`;
    infoGrid?.appendChild(card);
  });
  if (C.guestInfo?.enabled === false) document.getElementById('informacoes')?.remove();

  const faqList = document.getElementById('faqList');
  (C.faq?.items || []).forEach((item, index) => {
    const wrap = document.createElement('div'); wrap.className = 'faq-item';
    wrap.innerHTML = `<button class="faq-question" type="button" aria-expanded="false"><span>${item.question}</span><span>+</span></button><div class="faq-answer"><div><p>${item.answer}</p></div></div>`;
    const btn = wrap.querySelector('.faq-question');
    btn.addEventListener('click', () => {
      const open = wrap.classList.toggle('is-open'); btn.setAttribute('aria-expanded', String(open)); btn.lastElementChild.textContent = open ? '−' : '+';
    });
    faqList?.appendChild(wrap);
  });
  if (C.faq?.enabled === false) document.getElementById('duvidas')?.remove();

  const rsvpImage = document.getElementById('rsvpImage');
  applyImageAsset(rsvpImage, C.images?.rsvp);
  const guestCount = document.getElementById('guestCount');
  const guestCountField = document.getElementById('guestCountField');
  const memberSection = document.getElementById('rsvpMembers');
  const memberOptions = document.getElementById('rsvpMemberOptions');
  const limitParam = C.rsvp?.guestLimitQueryParam || 'lugares';
  const queryLimit = parseInt(params.get(limitParam), 10);
  const maxGuests = invitationContext?.seats || (Number.isFinite(queryLimit) && queryLimit > 0 ? queryLimit : (C.rsvp?.maxGuestsDefault || 4));
  if (guestCount) { guestCount.max = String(maxGuests); guestCount.value = String(Math.min(Number(guestCount.value || 1), maxGuests)); }
  const rsvpLimitNote = document.getElementById('rsvpLimitNote');
  if (rsvpLimitNote && invitationContext) rsvpLimitNote.textContent = `Este convite contempla até ${maxGuests} ${maxGuests === 1 ? 'pessoa' : 'pessoas'}.`;

  const invitationMembers = Array.isArray(invitationContext?.members) ? invitationContext.members.filter(Boolean) : [];
  if (invitationMembers.length && memberSection && memberOptions) {
    memberSection.hidden = false;
    if (guestCountField) guestCountField.hidden = true;
    memberOptions.innerHTML = invitationMembers.map(name => `<label class="member-option"><input type="checkbox" name="member_name" value="${String(name).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}"><span>${String(name).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span></label>`).join('');
    const syncMemberCount = () => { if (guestCount) guestCount.value = String(memberOptions.querySelectorAll('input[name="member_name"]:checked').length); };
    memberOptions.addEventListener('change', syncMemberCount);
  }

  const rsvpForm = document.getElementById('rsvpForm');
  const status = document.getElementById('formStatus');
  const rsvpSubmitButton = rsvpForm?.querySelector('button[type="submit"]');
  const rsvpSuccessDialog = document.getElementById('rsvpSuccessDialog');
  const rsvpSuccessText = document.getElementById('rsvpSuccessText');
  const lockRsvp = (response) => {
    if (!rsvpForm) return;
    rsvpForm.dataset.locked = '1';
    rsvpForm.querySelectorAll('input, select, textarea, button[type="submit"]').forEach(el => { el.disabled = true; });
    rsvpForm.classList.add('rsvp-form--locked');
    if (rsvpSubmitButton) rsvpSubmitButton.textContent = 'Confirmação já enviada';
    if (status) {
      status.textContent = response?.attending === false
        ? 'Sua resposta já foi registrada neste convite.'
        : 'Sua presença já foi confirmada neste convite.';
      status.classList.add('form-status--success');
    }
  };
  const showRsvpSuccess = (attending) => {
    if (rsvpSuccessText) rsvpSuccessText.textContent = attending
      ? 'Sua presença foi confirmada com sucesso. Deseja recarregar o convite agora?'
      : 'Sua resposta foi registrada com sucesso. Deseja recarregar o convite agora?';
    if (rsvpSuccessDialog?.showModal) rsvpSuccessDialog.showModal();
    else if (confirm('Sua resposta foi registrada. Recarregar o convite agora?')) location.reload();
  };
  document.getElementById('rsvpReloadButton')?.addEventListener('click', () => location.reload());
  document.getElementById('rsvpStayButton')?.addEventListener('click', () => rsvpSuccessDialog?.close());

  if (invitationContext?.rsvp) {
    const previous = invitationContext.rsvp;
    if (rsvpName && (previous.submittedName || previous.submitted_name)) rsvpName.value = previous.submittedName || previous.submitted_name;
    const presence = document.querySelector('[name="presenca"]');
    if (presence) presence.value = previous.attending ? 'Sim, estarei presente' : 'Infelizmente não poderei ir';
    const previousNames = previous.guestNames || previous.guest_names || [];
    if (invitationMembers.length && memberOptions) {
      memberOptions.querySelectorAll('input[name="member_name"]').forEach(input => { input.checked = previousNames.includes(input.value); });
      if (guestCount) guestCount.value = String(previousNames.length || previous.guestCount || previous.guest_count || 0);
    } else if (guestCount) guestCount.value = String(previous.guestCount ?? previous.guest_count ?? 1);
    const msg = document.querySelector('[name="mensagem"]'); if (msg) msg.value = previous.message || '';
  }

  if (invitationContext?.rsvp) lockRsvp(invitationContext.rsvp);

  rsvpForm?.addEventListener('submit', async e => {
    e.preventDefault();
    if (rsvpForm.dataset.locked === '1' || rsvpForm.dataset.submitting === '1') return;
    rsvpForm.dataset.submitting = '1';
    if (rsvpSubmitButton) { rsvpSubmitButton.disabled = true; rsvpSubmitButton.textContent = 'Enviando...'; }
    const data = new FormData(rsvpForm);
    const payload = Object.fromEntries(data.entries());
    const mode = C.rsvp?.mode || 'demo';
    if (invitationContext && C.guestSystem?.enabled) {
      try {
        const attending = payload.presenca === 'Sim, estarei presente';
        const selectedMembers = invitationMembers.length ? data.getAll('member_name').map(String) : [];
        if (attending && invitationMembers.length && selectedMembers.length === 0) throw new Error('Selecione ao menos uma pessoa que estará presente.');
        const result = await window.GuestSystem.submit(C.guestSystem, invitationContext, {
          attending, guestCount: attending ? (invitationMembers.length ? selectedMembers.length : Number(payload.convidados || 1)) : 0, submittedName: payload.nome || guestName,
          message: payload.mensagem || '', guestNames: attending ? selectedMembers : []
        });
        invitationContext.rsvp = { attending, guestCount: attending ? (invitationMembers.length ? selectedMembers.length : Number(payload.convidados || 1)) : 0, guestNames: selectedMembers, submittedName: payload.nome || guestName, message: payload.mensagem || '' };
        lockRsvp(invitationContext.rsvp);
        showRsvpSuccess(attending);
      } catch (error) {
        status.textContent = error.message || 'Não foi possível enviar. Tente novamente.';
        status.classList.remove('form-status--success');
        rsvpForm.dataset.submitting = '0';
        if (rsvpSubmitButton) { rsvpSubmitButton.disabled = false; rsvpSubmitButton.textContent = C.rsvp?.buttonLabel || 'Enviar confirmação'; }
      }
      return;
    }
    if (mode === 'whatsapp' && C.rsvp.whatsappNumber) {
      const lines = [C.rsvp.baseMessage, '', `Nome: ${payload.nome}`, `Presença: ${payload.presenca}`, `Número de pessoas: ${payload.convidados}`];
      if (payload.mensagem) lines.push(`Mensagem: ${payload.mensagem}`);
      location.href = `https://wa.me/${C.rsvp.whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
      return;
    }
    if (mode === 'form' && C.rsvp.formAction) {
      try {
        status.textContent = 'Enviando...';
        const response = await fetch(C.rsvp.formAction, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('Falha no envio');
        status.textContent = C.rsvp.successMessage || 'Confirmação enviada.'; rsvpForm.reset(); rsvpForm.dataset.submitting = '0'; if (rsvpSubmitButton) { rsvpSubmitButton.disabled = false; rsvpSubmitButton.textContent = C.rsvp?.buttonLabel || 'Enviar confirmação'; }
      } catch { status.textContent = 'Não foi possível enviar. Tente novamente.'; rsvpForm.dataset.submitting = '0'; if (rsvpSubmitButton) { rsvpSubmitButton.disabled = false; rsvpSubmitButton.textContent = C.rsvp?.buttonLabel || 'Enviar confirmação'; } }
      return;
    }
    status.textContent = `Modo demonstração: confirmação de ${payload.nome} preenchida corretamente.`; rsvpForm.dataset.submitting = '0'; if (rsvpSubmitButton) { rsvpSubmitButton.disabled = false; rsvpSubmitButton.textContent = C.rsvp?.buttonLabel || 'Enviar confirmação'; }
  });
  if (C.rsvp?.enabled === false) document.getElementById('rsvp')?.remove();

  const toICSDate = iso => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  document.getElementById('calendarButton')?.addEventListener('click', () => {
    const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Convite Digital//PT-BR','BEGIN:VEVENT',`DTSTART:${toICSDate(C.wedding.dateISO)}`,`DTEND:${toICSDate(C.wedding.endISO)}`,`SUMMARY:${C.wedding.calendarTitle}`,`DESCRIPTION:${C.wedding.calendarDescription}`,`LOCATION:${C.wedding.calendarLocation}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'casamento.ics'; a.click(); URL.revokeObjectURL(a.href);
  });

  let responsiveImageTimer = null;
  addEventListener('resize', () => {
    clearTimeout(responsiveImageTimer);
    responsiveImageTimer = setTimeout(() => {
      applyImageAsset(heroImage, C.hero?.image);
      applyImageAsset(openingImage, C.hero?.image);
      applyImageAsset(storyImage, C.story?.image);
      applyImageAsset(dressImage, C.dressCode?.image);
      applyImageAsset(rsvpImage, C.images?.rsvp);
      eventGrid?.querySelectorAll('.event-card__media').forEach((media, index) => {
        const asset = C.events?.[index]?.image;
        if (asset) media.style.setProperty('--event-image', imageCssValue(asset));
      });
      galleryGrid?.querySelectorAll('.gallery-item img').forEach((img, index) => {
        const asset = galleryImages?.[index]?.src ?? galleryImages?.[index];
        const src = resolveAssetUrl(asset);
        if (src) img.src = src;
      });
      setScheduleBackground(activeScheduleIndex === null ? defaultScheduleImage() : scheduleItemImage(activeScheduleIndex));
    }, 120);
  });


  const syncMusicPlayer = () => {
    if (!musicToggle || !backgroundMusic) return;
    const playing = !backgroundMusic.paused && !backgroundMusic.ended;
    musicToggle.classList.toggle('is-playing', playing);
    musicToggle.setAttribute('aria-pressed', String(playing));
    const label = playing ? (C.music?.labelPause || 'Pausar música') : (C.music?.labelPlay || 'Tocar música');
    musicToggle.setAttribute('aria-label', label);
    if (musicStatus) musicStatus.textContent = label;
  };

  if (C.music?.enabled && C.music?.file && backgroundMusic && musicToggle) {
    // Só baixa a trilha sonora (aprox. 5,8 MB) se o visitante pedir para tocar.
    backgroundMusic.preload = 'none';
    const requestedVolume = Number(C.music.volume);
    backgroundMusic.volume = Number.isFinite(requestedVolume) ? Math.min(1, Math.max(0, requestedVolume)) : 0.55;
    musicToggle.addEventListener('click', async () => {
      if (backgroundMusic.paused || backgroundMusic.ended) {
        try {
          if (!backgroundMusic.getAttribute('src')) backgroundMusic.src = C.music.file;
          await backgroundMusic.play();
        } catch (error) {
          console.warn('Não foi possível iniciar a música:', error);
          if (musicStatus) musicStatus.textContent = 'Toque novamente';
        }
      } else {
        backgroundMusic.pause();
      }
      syncMusicPlayer();
    });
    backgroundMusic.addEventListener('play', syncMusicPlayer);
    backgroundMusic.addEventListener('pause', syncMusicPlayer);
    backgroundMusic.addEventListener('ended', syncMusicPlayer);
    backgroundMusic.addEventListener('error', () => {
      musicToggle.disabled = true;
      musicToggle.classList.add('is-error');
      musicToggle.setAttribute('aria-label', 'Música indisponível');
      if (musicStatus) musicStatus.textContent = 'Música indisponível';
    });
    syncMusicPlayer();
  } else {
    musicPlayer?.remove();
  }

  // Seções opcionais: removidas somente após o restante do convite ser renderizado.
  const sectionTargets = {
    welcome:'boas-vindas', story:'historia', details:'detalhes', schedule:'programacao',
    gallery:'galeria', dressCode:'dress-code', guestInfo:'informacoes', faq:'duvidas',
    rsvp:'rsvp', gifts:'presentes'
  };
  Object.entries(sectionTargets).forEach(([key,id]) => {
    if (C.sections?.[key] !== false) return;
    document.getElementById(id)?.remove();
    document.querySelectorAll(`a[href="#${id}"]`).forEach(link => link.remove());
  });
  // Os links da lista de presentes preservam ?convite=TOKEN em ambas as direções.
  document.querySelectorAll('[data-gifts-link]').forEach(link => {
    const url = new URL('presentes.html', location.href);
    if (window.InviteMedia?.demoMode) url.searchParams.set('demo', '1');
    if (params.has('convite')) url.searchParams.set('convite', params.get('convite'));
    link.href = url.href;
  });
  const backTop = document.getElementById('backTop');
  const onScroll = () => backTop?.classList.toggle('is-visible', scrollY > innerHeight * .75);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  backTop?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
})();
