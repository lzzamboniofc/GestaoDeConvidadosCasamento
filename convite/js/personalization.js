// Modelo único: opções publicadas do casamento, sem permissão para editar imagens.
(() => {
  "use strict";
  const keys = new Set([
    "couple.firstName","couple.secondName","couple.initials","couple.signature",
    "wedding.longDate","wedding.shortDate","wedding.weekday","wedding.day","wedding.month","wedding.year","wedding.time","wedding.city",
    "opening.eyebrow","opening.title","opening.hint","opening.buttonLabel","opening.guestPrefix",
    "hero.eyebrow","hero.subtitle","hero.primaryButton","hero.secondaryButton",
    "welcome.eyebrow","welcome.title","welcome.text",
    "story.pretitle","story.phrase","story.eyebrow","story.title","story.year","story.paragraphs","story.quote",
    "schedule.eyebrow","schedule.title","schedule.note","gallery.eyebrow","gallery.title",
    "dressCode.eyebrow","dressCode.title","dressCode.text","dressCode.note",
    "guestInfo.eyebrow","guestInfo.title","faq.eyebrow","faq.title",
    "rsvp.eyebrow","rsvp.title","rsvp.text","rsvp.deadline","rsvp.buttonLabel",
    "footer.text","details.eyebrow","details.title",
    "gifts.title","gifts.eyebrow","gifts.intro","gifts.notice",
    "events.0.label","events.0.time","events.0.venue","events.0.address",
    "events.1.label","events.1.time","events.1.venue","events.1.address"
  ]);
  const sectionKeys = new Set(["opening","welcome","story","details","schedule","gallery","dressCode","guestInfo","faq","rsvp","gifts","music"]);
  const colorKeys = new Set(["background","surface","surfaceAlt","text","muted","accent","accentDark","accentSoft","warm","line","heroText"]);
  const fontSets = {
    classic: {title:'"Cormorant Garamond", Georgia, serif',body:'"Manrope", Arial, sans-serif'},
    editorial: {title:'"Playfair Display", Georgia, serif',body:'"DM Sans", Arial, sans-serif'},
    modern: {title:'"DM Serif Display", Georgia, serif',body:'"Inter", Arial, sans-serif'},
    romantic: {title:'"Great Vibes", cursive',body:'"Lora", Georgia, serif'}
  };
  function apply(settings) {
    if (!settings || typeof settings !== "object") return;
    const c = window.WEDDING_CONFIG; if (!c) return;
    const gifts = window.GIFT_LIST_CONFIG;
    if (["sage","champagne","dusk","dustyBlue","navyBlue","royalBlue","deepBlue"].includes(settings.themePreset)) c.themePreset = settings.themePreset;
    c.customColors = {};
    Object.entries(settings.colors || {}).forEach(([key,value]) => {
      if (colorKeys.has(key) && typeof value === 'string' && /^#[a-fA-F0-9]{6}$/.test(value)) c.customColors[key] = value;
    });
    if (fontSets[settings.fontPreset]) c.fonts = {...fontSets[settings.fontPreset]};
    c.sections = Object.fromEntries(Object.entries(settings.sections || {}).filter(([k,v]) => sectionKeys.has(k) && typeof v === 'boolean'));
    if (c.sections.opening === false) c.opening.enabled = false;
    if (c.sections.music === false) c.music.enabled = false;
    Object.entries(settings.text || {}).forEach(([path,value]) => {
      if (!keys.has(path) || typeof value !== 'string') return;
      if (path.startsWith('gifts.')) {
        if (c.gifts) c.gifts[path.slice(6)] = value;
        if (gifts) gifts[path.slice(6)] = value;
        return;
      }
      const nodes = path.split('.'); let target = c;
      for (const key of nodes.slice(0,-1)) {target = target?.[key]; if (!target) return;}
      const key = nodes.at(-1);
      if (path === 'story.paragraphs') target[key] = value.split(/\n\s*\n/).map(v=>v.trim()).filter(Boolean).slice(0,10);
      else target[key] = value;
    });
    const pay = settings.payment || {};
    if (gifts) {
      const link = typeof pay.pixLink === 'string' && /^https:\/\/[^\s]+$/i.test(pay.pixLink) ? pay.pixLink : '';
      const knownGifts = new Set((gifts.items || []).map(item => item.id));
      const fixed = pay.giftPixCodes && typeof pay.giftPixCodes === 'object' && !Array.isArray(pay.giftPixCodes) ? pay.giftPixCodes : {};
      const codes = Object.fromEntries(Object.entries(fixed).filter(([id,code]) => knownGifts.has(id) && typeof code === 'string' && code.length <= 1500));
      gifts.payment = {
        mode: pay.mode === 'perGift' ? 'perGift' : 'noAmount',
        pixLink: link,
        pixCode: typeof pay.pixCode === 'string' ? pay.pixCode.slice(0,1500) : '',
        giftPixCodes: codes,
        receiverName: typeof pay.receiverName === 'string' ? pay.receiverName.slice(0,120) : ''
      };
    }
  }
  window.InvitePersonalization = {apply};
})();
