/*
  ============================================================
  CONVITE DE CASAMENTO — MODELO PADRÃO INTEGRADO
  ============================================================
  Arquivo principal de personalização do convite conectado ao
  Sistema de Convidados.

  IMAGENS RESPONSIVAS
  -------------------
  Os pontos fotográficos aceitam:
    image: "caminho/foto.jpg"
  ou, para composições diferentes no desktop e no celular:
    image: {
      desktop: "caminho/foto-desktop.jpg",
      mobile: "caminho/foto-mobile.jpg"
    }

  Enquanto você não tiver duas artes, desktop e mobile podem
  apontar para o mesmo arquivo. O convite escolhe automaticamente
  a versão mobile abaixo de 768 px. Para fundos que usam cover,
  recomenda-se aproximadamente 1920x1080 no desktop e 1080x1920
  no mobile, mantendo a pessoa/assunto principal na área central.
*/

window.WEDDING_THEMES = {
  sage: {
    background: "#F5F2EC",
    surface: "#FFFDF9",
    surfaceAlt: "#E9EEE9",
    text: "#25302A",
    muted: "#68736C",
    accent: "#718274",
    accentDark: "#425247",
    accentSoft: "#DCE4DC",
    warm: "#B28B70",
    line: "#D9DDD8",
    heroText: "#FFFFFF"
  },
  champagne: {
    background: "#F8F2E9",
    surface: "#FFFDF8",
    surfaceAlt: "#F0E5D6",
    text: "#30271F",
    muted: "#776A60",
    accent: "#AA8865",
    accentDark: "#71583F",
    accentSoft: "#EADBC8",
    warm: "#C19A6B",
    line: "#E1D5C8",
    heroText: "#FFFFFF"
  },
  dusk: {
    background: "#F2F1F5",
    surface: "#FCFBFE",
    surfaceAlt: "#E6E3EC",
    text: "#2B2732",
    muted: "#726B7B",
    accent: "#756B86",
    accentDark: "#4C435D",
    accentSoft: "#DED9E8",
    warm: "#B78F82",
    line: "#D8D3DE",
    heroText: "#FFFFFF"
  },
  dustyBlue: {
    background: "#F4F7F9",
    surface: "#FFFDF9",
    surfaceAlt: "#E7EEF3",
    text: "#24323D",
    muted: "#687985",
    accent: "#718FA3",
    accentDark: "#405E73",
    accentSoft: "#DCE7ED",
    warm: "#B99A7A",
    line: "#D6E0E6",
    heroText: "#FFFFFF"
  },
  navyBlue: {
    background: "#F2F4F7",
    surface: "#FFFFFF",
    surfaceAlt: "#E3E9EF",
    text: "#182433",
    muted: "#5F6D7B",
    accent: "#2F5273",
    accentDark: "#162D46",
    accentSoft: "#D5E0E9",
    warm: "#B89A78",
    line: "#CFD7DF",
    heroText: "#FFFFFF"
  },
  royalBlue: {
    background: "#F3F6FA",
    surface: "#FFFFFF",
    surfaceAlt: "#E4EBF5",
    text: "#172A3D",
    muted: "#607286",
    accent: "#285F91",
    accentDark: "#173F68",
    accentSoft: "#D5E3F0",
    warm: "#B99A76",
    line: "#CEDAE6",
    heroText: "#FFFFFF"
  },
  navy: {
    background: "#F4F5F7",
    surface: "#FFFFFF",
    surfaceAlt: "#E4E9F0",
    text: "#10243A",
    muted: "#5D6D7D",
    accent: "#1F4E79",
    accentDark: "#0D2D4F",
    accentSoft: "#D2DFEB",
    warm: "#B99B78",
    line: "#CCD5DE",
    heroText: "#FFFFFF"
  },
  deepBlue: {
    background: "#F4F6FA",
    surface: "#FFFFFF",
    surfaceAlt: "#E2EAF5",
    text: "#132A42",
    muted: "#5C7086",
    accent: "#245D9C",
    accentDark: "#123B6D",
    accentSoft: "#D4E2F2",
    warm: "#B99A76",
    line: "#CCD9E7",
    heroText: "#FFFFFF"
  }
};

window.WEDDING_CONFIG = {
  themePreset: "deepBlue",

  fonts: {
    title: '"Cormorant Garamond", Georgia, serif',
    body: '"Manrope", Arial, sans-serif'
  },

  couple: {
    firstName: "Liliane",
    secondName: "Igor",
    initials: "L · I",
    signature: "Com amor, Liliane & Igor"
  },

  wedding: {
    dateISO: "2027-04-24T17:00:00-03:00",
    endISO: "2027-04-24T23:30:00-03:00",
    longDate: "24 de Abril de 2027",
    shortDate: "24 · 04 · 2027",
    weekday: "Sábado",
    day: "24",
    month: "Abril",
    year: "2027",
    time: "19h00",
    city: "Itu · São Paulo",
    calendarTitle: "Casamento — Liliane & Igor",
    calendarDescription: "Celebração do casamento de Liliane e Igor.",
    calendarLocation: "Paróquia São Luís Gonzaga — Itu, SP"
  },

  opening: {
    enabled: true,
    eyebrow: "Você recebeu um convite especial",
    title: "Queremos celebrar este dia com você.",
    hint: "Um capítulo importante da nossa história está prestes a começar.",
    buttonLabel: "Abrir convite",
    guestQueryParam: "convidado",
    guestPrefix: "Convite destinado a"
  },

  hero: {
    image: {
      desktop: "assets/images/hero.jpg",
      mobile: "assets/images/hero.jpg"
    },
    eyebrow: "Save the date",
    subtitle: "Uma celebração de amor, encontros e novos começos.",
    primaryButton: "Confirmar presença",
    secondaryButton: "Ver detalhes"
  },

  welcome: {
    eyebrow: "Nosso convite",
    title: "Um dia para guardar na memória.",
    text: "Depois de tantos caminhos compartilhados, chegou o momento de abrirmos um novo capítulo. Queremos viver esse dia ao lado das pessoas que fizeram parte da nossa história — e você é uma delas."
  },

  story: {
    enabled: true,
    pretitle: "1 João 4:19",
    phrase: "Nós amamos porque ele nos amou primeiro.",
    eyebrow: "Nossa história",
    title: "O sem planos, virou cem planos...",
    image: {
      desktop: "assets/images/story.jpg",
      mobile: "assets/images/story.jpg"
    },
    year: "desde 2022",
    paragraphs: [
      "Tudo começou sem grandes planos, em uma festa, através de um amigo que nos apresentou . Naquele momento, nenhum de nós poderia imaginar que aquele encontro daria início a uma história que chegaria tão longe.",

      "Entre conversas, encontros e momentos compartilhados, fomos nos conhecendo e descobrindo que aquele acaso tinha, na verdade, um propósito muito maior.",

      "O que começou sem grandes expectativas se transformou em amor, companheirismo e em uma vontade de construir juntos uma vida inteira.",

      "Hoje, depois de tantos momentos vividos lado a lado, escolhemos dar o passo mais importante da nossa história: dizer “sim” um ao outro diante de Deus e das pessoas que amamos."
    ],
    quote: "Sem planejar o começo, encontramos um no outro o futuro que queremos viver."
  },

  events: [
    {
      label: "Cerimônia",
      time: "19h00 · chegar as 18h30",
      venue: "Paróquia São Luís Gonzaga",
      address: "R. Leonardo Piunti, 475 — São Luiz, Itu — SP",
      mapsUrl: "https://maps.app.goo.gl/cBcnP7PYY2Ed3Zdf9",
      mapsLabel: "Abrir no mapa",
      image: {
        desktop: "assets/images/paroquia.jpg",
        mobile: "assets/images/paroquia.jpg"
      }
    },
    {
      label: "Recepção",
      time: "Te aguardamos aqui, após a cerimônia",
      venue: "Buffet Encanto",
      address: "Av. Walter Nardelli, 1074 - Jardim Guarujá, Salto - SP, 13323-260",
      mapsUrl: "https://maps.app.goo.gl/nietYBWBGj9y7Lm67",
      mapsLabel: "Como chegar",
      image: {
        desktop: "assets/images/buffet.png",
        mobile: "assets/images/buffet.png"
      }
    }
  ],

  schedule: {
    enabled: true,
    eyebrow: "Programação",
    title: "O roteiro do nosso dia",
    note: "Os horários podem receber pequenos ajustes conforme o andamento da celebração.",
    backgroundImage: {
      desktop: "assets/images/gallery-2.jpg",
      mobile: "assets/images/gallery-2.jpg"
    },
    items: [
      { time: "18:30", title: "Boas-vindas", text: "Chegue com calma e encontre seu lugar.", image: { desktop: "assets/images/gallery-1.jpg", mobile: "assets/images/gallery-1.jpg" } },
      { time: "19:00", title: "Cerimônia", text: "O momento do nosso sim.", image: { desktop: "assets/images/story.jpg", mobile: "assets/images/story.jpg" } },
      { time: "20:30", title: "Recepção", text: "Brindes, encontros e celebração.", image: { desktop: "assets/images/gallery-4.jpg", mobile: "assets/images/gallery-4.jpg" } },
      { time: "21:30", title: "Jantar", text: "Um momento preparado para compartilhar à mesa.", image: { desktop: "assets/images/gallery-5.jpg", mobile: "assets/images/gallery-5.jpg" } },
      { time: "22:00", title: "Pista aberta", text: "Hora de comemorar sem pressa.", image: { desktop: "assets/images/gallery-3.jpg", mobile: "assets/images/gallery-3.jpg" } }
    ]
  },

  gallery: {
    enabled: true,
    eyebrow: "Memórias",
    title: "Alguns capítulos antes do grande dia.",
    images: [
      { src: { desktop: "assets/images/gallery-1.jpg", mobile: "assets/images/gallery-1.jpg" }, alt: "Foto do casal", caption: "Capítulo 01" },
      { src: { desktop: "assets/images/gallery-2.jpg", mobile: "assets/images/gallery-2.jpg" }, alt: "Foto do casal", caption: "Capítulo 02" },
      { src: { desktop: "assets/images/gallery-3.jpg", mobile: "assets/images/gallery-3.jpg" }, alt: "Foto do casal", caption: "Capítulo 03" },
      { src: { desktop: "assets/images/gallery-4.jpg", mobile: "assets/images/gallery-4.jpg" }, alt: "Foto do casal", caption: "Capítulo 04" },
      { src: { desktop: "assets/images/gallery-5.jpg", mobile: "assets/images/gallery-5.jpg" }, alt: "Foto do casal", caption: "Capítulo 05" }
    ]
  },

  dressCode: {
    enabled: true,
    eyebrow: "Dress code",
    title: "Traje Esporte fino",
    text: "Elegância e conforto para celebrar conosco. Blazer e gravata não são necessários, também como vestido longo para as mulheres",
    note: "Pedimos gentilmente que branco e azul-marinho não sejam utilizados, pois essas cores estarão reservadas para a composição do casamento.",
    image: {
      desktop: "assets/images/dress-code.jpg",
      mobile: "assets/images/dress-code.jpg"
    },
    palette: ["#3F4C39", "#7A8469", "#B8A58B", "#C9B8A4", "#4F3931"]
  },

  details: { eyebrow: "Onde & quando", title: "Tudo o que você precisa para celebrar conosco." },
  gifts: {
    title: "Lista de presentes",
    intro: "Sua presença é o maior presente. Se quiser contribuir com nossos planos, conheça nossa lista."
  },

  guestInfo: {
    enabled: true,
    eyebrow: "Para você se organizar",
    title: "Informações importantes",
    items: [
      { icon: "car", title: "Estacionamento", text: "Há vagas próximo ao local. Se for beber, considere táxi ou aplicativo." },
      { icon: "clock", title: "Pontualidade", text: "A cerimônia começa às 19h00. Recomendamos chegar com 30 minutos de antecedência. (18h:30min)" },
      { icon: "camera", title: "Fotos", text: "Registre e compartilhe os momentos, mantendo o corredor livre durante a cerimônia." }
    ]
  },

  faq: {
    enabled: true,
    eyebrow: "Dúvidas frequentes",
    title: "Antes do grande dia",
    items: [
      { question: "Posso levar acompanhante?", answer: "Consideraremos apenas os nomes indicados no convite. Caso exista acompanhante liberado, essa informação pode ser combinada com os noivos." },
      { question: "Até quando preciso confirmar presença?", answer: "Pedimos que a confirmação seja feita até 10 de Março de 2027 para facilitar a organização do evento." },
      { question: "A cerimônia e a recepção são no mesmo local?", answer: "Não, a cerimônia será na Paróquia São Luís Gonzaga e a recepção será no Buffet Encanto." },
      { question: "Vai ter estacionamento?", answer: "Sim. Porém, as vagas situam-se na rua próximo ao local da festa." }
    ]
  },

  rsvp: {
    enabled: true,
    eyebrow: "Confirmação de presença",
    title: "Você vem celebrar com a gente?",
    text: "Sua resposta é muito importante para organizarmos cada detalhe com carinho.",
    deadline: "10 de Março de 2027",
    buttonLabel: "Enviar confirmação",

    /* MODOS: "whatsapp", "form" ou "demo" */
    mode: "whatsapp",

    /* WhatsApp: somente números, com país + DDD. Ex.: 5511999999999 */
    whatsappNumber: "5511956766105",

    /* Formulário externo, por exemplo Formspree. */
    formAction: "",
    successMessage: "Obrigada! Sua confirmação foi recebida.",

    maxGuestsDefault: 4,
    guestLimitQueryParam: "lugares",
    baseMessage: "Olá! Estou respondendo ao convite de casamento de Liliane e Igor. E confirmo minha presença"
  },

  music: {
    enabled: true,
    file: "assets/audio/musica.mp3",
    volume: 0.55,
    labelPlay: "Tocar música",
    labelPause: "Pausar música"
  },

  sharing: {
    enabled: false,
    title: "Convite de casamento — Liliane & Igor",
    text: "Você é nosso convidado para celebrar este dia com a gente."
  },

  /*
    SISTEMA DE CONVIDADOS
    ---------------------
    mode: "demo" permite testar sem banco.
    mode: "api" usa a Edge Function do Supabase.
    O convidado chega por ?convite=TOKEN.
  */
  guestSystem: {
    enabled: true,
    mode: "api", // "demo" ou "api"
    tokenQueryParam: "convite",
    endpoint: "https://oblucxwvsouyjhfqaten.supabase.co/functions/v1/invite-public",
    demoInvites: {
      "DEMO-FAMILIA-SILVA": { displayName: "Família Silva", seats: 4, members: ["João Silva", "Maria Silva", "Pedro Silva", "Ana Silva"] },
      "DEMO-MARIA-SOUZA": { displayName: "Maria Souza", seats: 1, members: ["Maria Souza"] },
      "DEMO-PEDRO-ANA": { displayName: "Pedro & Ana", seats: 2, members: ["Pedro Costa", "Ana Costa"] }
    }
  },

  images: {
    rsvp: {
      desktop: "assets/images/rsvp.jpg",
      mobile: "assets/images/rsvp.jpg"
    }
  },

  footer: {
    text: "Esperamos você para celebrar este capítulo com a gente."
  }
};
