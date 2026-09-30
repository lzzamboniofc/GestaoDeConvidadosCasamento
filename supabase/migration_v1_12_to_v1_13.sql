-- Ampliação do limite para 15 códigos PIX independentes no JSON de personalização.
-- Não altera dados existentes, donos, políticas ou o comportamento do RSVP.
ALTER TABLE public.wedding_customizations
  DROP CONSTRAINT IF EXISTS customization_size;
ALTER TABLE public.wedding_customizations
  ADD CONSTRAINT customization_size CHECK (octet_length(settings::text) <= 90000);
