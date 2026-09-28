-- Apply once to the existing AZMAYRA Link Bio project.
alter table public.az_links add column if not exists link_type text;
alter table public.az_links add column if not exists image_url text;
update public.az_links set link_type=case
  when icon='whatsapp' or url ilike '%wa.me/%' then 'wa'
  when icon='shopee' or url ilike '%shopee.%' then 'shopee'
  when url ilike '%azmayra-lp.vercel.app%' then 'lp'
  else 'other' end where link_type is null;
alter table public.az_links drop constraint if exists az_links_link_type_check;
alter table public.az_links add constraint az_links_link_type_check check(link_type in ('wa','lp','shopee','other'));
-- Analytics are visible only to the server-side admin route.
drop policy if exists "publik baca klik" on public.az_clicks;
