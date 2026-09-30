/*
  ============================================================
  LISTA DE PRESENTES
  ============================================================
  Este arquivo existe separado para você duplicar o template sem
  precisar procurar presentes pelo HTML.

  IMPORTANTE:
  - Este catálogo não contém QR Codes de cobrança demonstrativos.
  - PIX completo e link opcional são cadastrados pelo casal no painel.
  - Valores dos presentes são apenas sugestões, sem integração bancária.
  - Fotos podem ser JPG, PNG, WebP ou SVG.
*/

window.GIFT_LIST_CONFIG = {
  title: "Lista de presentes",
  eyebrow: "Um carinho, se você quiser",
  intro: "Sua presença é o que mais importa. Para quem também quiser contribuir com a nossa nova fase, preparamos algumas ideias simbólicas.",
  notice: "Os valores são sugestões de contribuição. Confirme o valor no aplicativo antes de pagar.",
  currency: "BRL",
  payment: {
    mode: "noAmount", // "noAmount": mesmo código sem valor; "perGift": um PIX de valor fixo por presente.
    pixLink: "", // URL HTTPS externa opcional, usada somente no modo sem valor.
    pixCode: "", // Código PIX compartilhado sem valor determinado.
    giftPixCodes: {}, // Códigos individuais, indexados pelo ID de cada presente; configurados pelo painel.
    receiverName: ""
  },
  categories: [
    { id: "all", label: "Todos" },
    { id: "casa", label: "Casa" },
    { id: "experiencias", label: "Experiências" },
    { id: "lua-de-mel", label: "Lua de mel" }
  ],
  items: [
    {
      id: "cafe-da-manha",
      title: "Café da manhã dos recém-casados",
      category: "casa",
      price: 100,
      description: "Um começo de dia com café fresco e nenhuma pressa.",
      image: "assets/images/gifts/cafe-da-manha.jpg",
    },
    {
      id: "jogo-de-tacas",
      title: "Jogo de taças para brindar",
      category: "casa",
      price: 129,
      description: "Para os brindes dos próximos capítulos.",
      image: "assets/images/gifts/jogo-de-tacas.jpg",
    },
    {
      id: "kit-fondue",
      title: "Noite de fondue em casa",
      category: "experiencias",
      price: 159,
      description: "Uma noite gostosa para inaugurar a vida a dois.",
      image: "assets/images/gifts/kit-fondue.jpg",
    },
    {
      id: "jantar-a-dois",
      title: "Jantar romântico a dois",
      category: "experiencias",
      price: 219,
      description: "Uma mesa bonita, boa conversa e um novo motivo para celebrar.",
      image: "assets/images/gifts/jantar-a-dois.jpg",
    },
    {
      id: "cama-mesa-banho",
      title: "Kit cama, mesa e banho",
      category: "casa",
      price: 279,
      description: "Um carinho simbólico para a nova casa.",
      image: "assets/images/gifts/cama-mesa-banho.jpg",
    },
    {
      id: "air-fryer",
      title: "Air fryer da casa nova",
      category: "casa",
      price: 349,
      description: "Para as receitas rápidas — e os domingos preguiçosos.",
      image: "assets/images/gifts/air-fryer.jpg",
    },
    {
      id: "mala-de-viagem",
      title: "Mala para novas viagens",
      category: "casa",
      price: 399,
      description: "Para carregar memórias dos próximos destinos.",
      image: "assets/images/gifts/mala-de-viagem.jpg",
    },
    {
      id: "experiencia-gastronomica",
      title: "Experiência gastronômica",
      category: "experiencias",
      price: 449,
      description: "Um jantar especial durante uma das nossas próximas aventuras.",
      image: "assets/images/gifts/experiencia-gastronomica.jpg",
    },
    {
      id: "passeio-lua-de-mel",
      title: "Passeio na lua de mel",
      category: "lua-de-mel",
      price: 249,
      description: "Uma experiência para descobrir o destino juntos.",
      image: "assets/images/gifts/passeio-lua-de-mel.jpg",
    },
    {
      id: "jantar-lua-de-mel",
      title: "Jantar especial na lua de mel",
      category: "lua-de-mel",
      price: 329,
      description: "Uma noite especial durante a viagem dos recém-casados.",
      image: "assets/images/gifts/jantar-lua-de-mel.jpg",
    },
    {
      id: "diaria-hotel",
      title: "Uma diária da lua de mel",
      category: "lua-de-mel",
      price: 489,
      description: "Ajude a transformar uma noite da viagem em uma lembrança inesquecível.",
      image: "assets/images/gifts/diaria-hotel.jpg",
    },
    {
      id: "passeio-barco",
      title: "Passeio de barco",
      category: "lua-de-mel",
      price: 549,
      description: "Uma cota simbólica para um dia diferente durante a viagem.",
      image: "assets/images/gifts/passeio-barco.jpg",
    },
    {
      id: "upgrade-quarto",
      title: "Upgrade do quarto",
      category: "lua-de-mel",
      price: 699,
      description: "Um pouco mais de conforto para começar a viagem em grande estilo.",
      image: "assets/images/gifts/upgrade-quarto.jpg",
    },
    {
      id: "fim-de-semana",
      title: "Fim de semana especial",
      category: "experiencias",
      price: 799,
      description: "Uma pausa a dois depois da maratona do casamento.",
      image: "assets/images/gifts/fim-de-semana.jpg",
    },
    {
      id: "cota-especial",
      title: "Cota especial dos nossos sonhos",
      category: "lua-de-mel",
      price: 999,
      description: "Uma contribuição livre para os planos que queremos viver juntos.",
      image: "assets/images/gifts/cota-especial.jpg",
    }
  ]
};
