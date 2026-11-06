-- Nara Origami: order requests, enquiries, catalogue overrides and notification outbox.
-- Intended for a NEW Supabase project (see DEPLOYMENT.md). It does not touch any other tables.
--
-- Security model
--   * Every table has RLS enabled and NO policies for anon/authenticated, and all table
--     privileges are revoked from those roles. Nothing here is readable through the public
--     Data API, even with the publishable/anon key.
--   * Only the website's server (service_role / secret key, never sent to the browser) reads
--     and writes these tables, after its own validation and studio-admin authentication.

create extension if not exists pgcrypto;

create type public.order_status as enum (
  'requested','reviewing','awaiting_customer','accepted','awaiting_payment',
  'paid','preparing','shipped','completed','cancelled'
);
create type public.option_availability as enum ('made_to_order','in_stock','by_enquiry','unavailable');
create type public.notification_status as enum ('pending','sent','failed');

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- Catalogue overrides (price / MOQ / availability edited in /studio) ----------
create table public.catalogue_options (
  sku text primary key check (sku ~ '^[a-z0-9-]{1,64}$'),
  unit_price_paise integer check (unit_price_paise is null or unit_price_paise >= 0),
  min_units integer check (min_units is null or min_units >= 1),
  max_units integer check (max_units is null or max_units >= 1),
  availability public.option_availability,
  updated_at timestamptz not null default now(),
  check (min_units is null or max_units is null or min_units <= max_units)
);
create trigger catalogue_options_touch before update on public.catalogue_options
  for each row execute function public.touch_updated_at();

create table public.catalogue_products (
  slug text primary key check (slug ~ '^[a-z0-9-]{1,80}$'),
  published boolean not null,
  updated_at timestamptz not null default now()
);
create trigger catalogue_products_touch before update on public.catalogue_products
  for each row execute function public.touch_updated_at();

-- ---------- Order requests ----------
create table public.order_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check (reference ~ '^NO-[0-9]{4}-[0-9A-Z]{5}$'),
  public_token text not null unique check (char_length(public_token) >= 20),
  idempotency_key uuid not null unique,
  status public.order_status not null default 'requested',
  customer_name text not null check (char_length(customer_name) between 1 and 120),
  customer_email text not null check (char_length(customer_email) between 3 and 254),
  customer_phone text not null default '' check (char_length(customer_phone) <= 40),
  ship_city text not null check (char_length(ship_city) <= 80),
  ship_region text not null default '' check (char_length(ship_region) <= 80),
  ship_postal_code text not null default '' check (char_length(ship_postal_code) <= 16),
  ship_country char(2) not null check (ship_country ~ '^[A-Z]{2}$'),
  note text not null default '' check (char_length(note) <= 2000),
  subtotal_paise bigint not null check (subtotal_paise >= 0),
  has_enquiry_items boolean not null default false,
  shipping_estimate jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index order_requests_status_idx on public.order_requests (status, created_at desc);
create trigger order_requests_touch before update on public.order_requests
  for each row execute function public.touch_updated_at();

-- Snapshot of each line at the moment of request: later price changes never alter it.
create table public.order_request_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.order_requests(id) on delete cascade,
  position smallint not null,
  sku text not null,
  product_slug text not null,
  product_name text not null,
  option_label text not null,
  size_label text not null,
  colour_id text not null,
  colour_name text not null,
  units integer not null check (units >= 1),
  sheets_per_unit integer not null check (sheets_per_unit >= 1),
  unit_price_paise integer check (unit_price_paise is null or unit_price_paise >= 0),
  line_total_paise bigint check (line_total_paise is null or line_total_paise >= 0),
  unique (order_id, position)
);
create index order_request_items_order_idx on public.order_request_items (order_id);

create table public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.order_requests(id) on delete cascade,
  status public.order_status not null,
  note text not null default '' check (char_length(note) <= 1000),
  created_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history (order_id, created_at);

create table public.order_notes (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.order_requests(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index order_notes_order_idx on public.order_notes (order_id, created_at);

-- ---------- Commission / professional enquiries ----------
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check (reference ~ '^EN-[0-9]{4}-[0-9A-Z]{5}$'),
  idempotency_key uuid not null unique,
  kind text not null check (kind in ('commission','acquisition','collaboration','press','general')),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254),
  organisation text not null default '' check (char_length(organisation) <= 160),
  country char(2) not null check (country ~ '^[A-Z]{2}$'),
  budget text not null default '' check (char_length(budget) <= 80),
  timeline text not null default '' check (char_length(timeline) <= 80),
  message text not null check (char_length(message) between 1 and 4000),
  status text not null default 'new' check (status in ('new','replied','closed')),
  created_at timestamptz not null default now()
);

-- ---------- Notification outbox (retryable email jobs) ----------
create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('order_studio','order_customer','enquiry_studio','enquiry_customer')),
  order_id uuid references public.order_requests(id) on delete cascade,
  enquiry_id uuid references public.enquiries(id) on delete cascade,
  recipient text not null,
  status public.notification_status not null default 'pending',
  attempts integer not null default 0 check (attempts >= 0),
  last_error text check (last_error is null or char_length(last_error) <= 1000),
  provider_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((order_id is null) <> (enquiry_id is null)),
  unique (kind, order_id),
  unique (kind, enquiry_id)
);
create index notification_outbox_status_idx on public.notification_outbox (status, created_at);
create trigger notification_outbox_touch before update on public.notification_outbox
  for each row execute function public.touch_updated_at();

-- ---------- Lock everything down ----------
do $$
declare t text;
begin
  foreach t in array array['catalogue_options','catalogue_products','order_requests','order_request_items',
                           'order_status_history','order_notes','enquiries','notification_outbox']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated, public', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
  end loop;
end $$;
grant usage on all sequences in schema public to service_role;

-- ---------- Atomic, idempotent creation ----------
-- p_order: order fields (+ "items" array); p_notify: [{kind, recipient}]
-- Returns {"id": uuid, "created": bool}. A repeated idempotency_key returns the original id.
create or replace function public.create_order_request(p_order jsonb, p_notify jsonb)
returns jsonb language plpgsql set search_path = '' as $$
declare v_id uuid; v_item jsonb; v_pos int := 0; v_n jsonb;
begin
  insert into public.order_requests (
    reference, public_token, idempotency_key, customer_name, customer_email, customer_phone,
    ship_city, ship_region, ship_postal_code, ship_country, note,
    subtotal_paise, has_enquiry_items, shipping_estimate)
  values (
    p_order->>'reference', p_order->>'public_token', (p_order->>'idempotency_key')::uuid,
    p_order->>'customer_name', p_order->>'customer_email', coalesce(p_order->>'customer_phone',''),
    p_order->>'ship_city', coalesce(p_order->>'ship_region',''), coalesce(p_order->>'ship_postal_code',''),
    p_order->>'ship_country', coalesce(p_order->>'note',''),
    (p_order->>'subtotal_paise')::bigint, (p_order->>'has_enquiry_items')::boolean, p_order->'shipping_estimate')
  on conflict (idempotency_key) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.order_requests where idempotency_key = (p_order->>'idempotency_key')::uuid;
    return jsonb_build_object('id', v_id, 'created', false);
  end if;

  for v_item in select * from jsonb_array_elements(p_order->'items') loop
    insert into public.order_request_items (order_id, position, sku, product_slug, product_name, option_label,
      size_label, colour_id, colour_name, units, sheets_per_unit, unit_price_paise, line_total_paise)
    values (v_id, v_pos, v_item->>'sku', v_item->>'productSlug', v_item->>'productName', v_item->>'optionLabel',
      v_item->>'sizeLabel', v_item->>'colourId', v_item->>'colourName', (v_item->>'units')::int,
      (v_item->>'sheetsPerUnit')::int, (v_item->>'unitPrice')::int, (v_item->>'lineTotal')::bigint);
    v_pos := v_pos + 1;
  end loop;

  insert into public.order_status_history (order_id, status, note) values (v_id, 'requested', 'Submitted on the website');

  for v_n in select * from jsonb_array_elements(p_notify) loop
    insert into public.notification_outbox (kind, order_id, recipient) values (v_n->>'kind', v_id, v_n->>'recipient');
  end loop;

  return jsonb_build_object('id', v_id, 'created', true);
end $$;

create or replace function public.create_enquiry(p_enquiry jsonb, p_notify jsonb)
returns jsonb language plpgsql set search_path = '' as $$
declare v_id uuid; v_n jsonb;
begin
  insert into public.enquiries (reference, idempotency_key, kind, name, email, organisation, country, budget, timeline, message)
  values (p_enquiry->>'reference', (p_enquiry->>'idempotency_key')::uuid, p_enquiry->>'kind', p_enquiry->>'name',
    p_enquiry->>'email', coalesce(p_enquiry->>'organisation',''), p_enquiry->>'country',
    coalesce(p_enquiry->>'budget',''), coalesce(p_enquiry->>'timeline',''), p_enquiry->>'message')
  on conflict (idempotency_key) do nothing
  returning id into v_id;
  if v_id is null then
    select id into v_id from public.enquiries where idempotency_key = (p_enquiry->>'idempotency_key')::uuid;
    return jsonb_build_object('id', v_id, 'created', false);
  end if;
  for v_n in select * from jsonb_array_elements(p_notify) loop
    insert into public.notification_outbox (kind, enquiry_id, recipient) values (v_n->>'kind', v_id, v_n->>'recipient');
  end loop;
  return jsonb_build_object('id', v_id, 'created', true);
end $$;

create or replace function public.set_order_status(p_order_id uuid, p_status public.order_status, p_note text)
returns void language plpgsql set search_path = '' as $$
begin
  update public.order_requests set status = p_status where id = p_order_id;
  if not found then raise exception 'order % not found', p_order_id; end if;
  insert into public.order_status_history (order_id, status, note) values (p_order_id, p_status, coalesce(p_note, ''));
end $$;

revoke all on function public.create_order_request(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.create_enquiry(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.set_order_status(uuid, public.order_status, text) from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
grant execute on function public.create_order_request(jsonb, jsonb) to service_role;
grant execute on function public.create_enquiry(jsonb, jsonb) to service_role;
grant execute on function public.set_order_status(uuid, public.order_status, text) to service_role;
