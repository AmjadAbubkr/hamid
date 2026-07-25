-- Migration 013: add _en locale columns to all 7 Content Item tables.
--
-- Every bilingual (_ar / _fr) column receives a nullable _en counterpart.
-- Tagline also gets a default-empty string for its seed row.
-- Existing rows keep null _en values; the publish gate is not yet widened
-- (see migration 014 for enforcement).

-- position_held
alter table if exists public.position_held
  add column if not exists title_en text not null default '',
  add column if not exists body_en  text;

-- education_entry
alter table if exists public.education_entry
  add column if not exists degree_en      text not null default '',
  add column if not exists institution_en text not null default '',
  add column if not exists honours_en     text;

-- past_participation
alter table if exists public.past_participation
  add column if not exists title_en       text not null default '',
  add column if not exists body_en        text,
  add column if not exists venue_en       text not null default '',
  add column if not exists institution_en text not null default '',
  add column if not exists role_other_en  text;

-- upcoming_event
alter table if exists public.upcoming_event
  add column if not exists title_en       text not null default '',
  add column if not exists body_en        text,
  add column if not exists venue_en       text not null default '',
  add column if not exists institution_en text not null default '',
  add column if not exists role_other_en  text;

-- article
alter table if exists public.article
  add column if not exists title_en             text not null default '',
  add column if not exists body_en              text not null default '',
  add column if not exists published_in_name_en text;

-- gallery_photo
alter table if exists public.gallery_photo
  add column if not exists caption_en             text not null default '',
  add column if not exists photographer_credit_en text,
  add column if not exists category_en            text;

-- tagline
alter table if exists public.tagline
  add column if not exists tagline_en text not null default '';

-- Extend the seed to include the empty English column so that
-- existing deployments re-running this migration stay consistent.
update public.tagline
  set tagline_en = ''
  where tagline_en is null and singleton_key = true;
