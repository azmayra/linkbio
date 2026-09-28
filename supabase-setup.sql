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
-- Each browser visitor is counted once per saved link through /api/track.
alter table public.az_clicks add column if not exists source_key text;
alter table public.az_clicks add column if not exists visitor_hash text;
do $$ begin
  if not exists(select 1 from pg_constraint where conname='az_clicks_one_visitor_per_source') then
    alter table public.az_clicks add constraint az_clicks_one_visitor_per_source unique (source_key,visitor_hash);
  end if;
end $$;
drop policy if exists "publik tulis klik" on public.az_clicks;
