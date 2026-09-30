/*
  ============================================================
  PAINEL DE CONVIDADOS — CONFIGURAÇÃO
  ============================================================

  MODO DEMO:
  - funciona sem banco de dados;
  - salva alterações no localStorage do navegador;
  - ideal para testar a interface.

  MODO SUPABASE:
  1. aplique supabase/schema.sql;
  2. publique as Edge Functions invite-public e admin-access;
  3. crie o perfil do primeiro administrador em public.profiles;
  4. preencha supabaseUrl + publishableKey;
  5. troque mode para "supabase".

  NUNCA coloque secret key / service_role neste arquivo.
*/
window.GUEST_ADMIN_CONFIG = {
  mode: "supabase", // "demo" ou "supabase"
  demoRole: "admin", // em DEMO: "admin" ou "couple" (também aceita ?perfil=casal)

  supabaseUrl: "https://oblucxwvsouyjhfqaten.supabase.co",
  publishableKey: "sb_publishable_1NGjECehE1zlq5jYGa6cCQ_3w0Jb4bb",

  // Única rota pública, fixa para todos os casamentos e convites.
  defaultInviteBaseUrl: "../convite/",

  // Importação e exportação de convidados por planilha.
  importTemplateUrl: "../modelos/modelo-importacao-convidados.xlsx",
  maxImportRows: 500,
  exportFilePrefix: "lista-convidados",

  // Autenticação administrativa.
  loginPage: "../index.html",
  passwordResetPage: "reset-password.html",

  // v1.5 — gestão de acessos do casal.
  accessFunctionName: "admin-access",
  inviteSetupPage: "../reset-password.html?convite_acesso=1",

  // Apenas apresentação do painel.
  brandName: "Gestão de Convidados"
};
