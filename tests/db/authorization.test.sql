\set ON_ERROR_STOP on
-- Runs as superuser; switches role to prove what each Supabase role can do.
create or replace function pg_temp.expect_denied(q text) returns void language plpgsql as $$
begin
  begin execute q; exception when insufficient_privilege then return; end;
  raise exception 'EXPECTED PERMISSION DENIED: %', q;
end $$;

-- 1. service_role creates an order (idempotently)
set role service_role;
select public.create_order_request(
  '{"reference":"NO-2611-AAAAA","public_token":"tok_abcdefghijklmnopqrstuv","idempotency_key":"6f1b6c2e-3a1d-4c1e-9f7a-2b2f0a6d1e01",
    "customer_name":"Test","customer_email":"t@example.test","ship_city":"Pune","ship_country":"IN","subtotal_paise":129500,
    "has_enquiry_items":false,"shipping_estimate":{"region":"domestic","amount":14000,"free":false},
    "items":[{"sku":"dt-50-sheet","productSlug":"double-tissue-50cm","productName":"P","optionLabel":"Per sheet","sizeLabel":"50","colourId":"red","colourName":"Red","units":5,"sheetsPerUnit":1,"unitPrice":25900,"lineTotal":129500}]}'::jsonb,
  '[{"kind":"order_studio","recipient":"s@example.test"},{"kind":"order_customer","recipient":"t@example.test"}]'::jsonb) as first_call;
-- Same idempotency key, different reference: must return created=false and not insert.
select public.create_order_request(
  '{"reference":"NO-2611-BBBBB","public_token":"tok_zzzzzzzzzzzzzzzzzzzzzz","idempotency_key":"6f1b6c2e-3a1d-4c1e-9f7a-2b2f0a6d1e01",
    "customer_name":"Test","customer_email":"t@example.test","ship_city":"Pune","ship_country":"IN","subtotal_paise":1,
    "has_enquiry_items":false,"shipping_estimate":{},"items":[]}'::jsonb, '[]'::jsonb) as second_call;
do $$ begin
  if (select count(*) from public.order_requests) <> 1 then raise exception 'duplicate order created'; end if;
  if (select count(*) from public.order_request_items) <> 1 then raise exception 'items wrong'; end if;
  if (select count(*) from public.notification_outbox) <> 2 then raise exception 'outbox wrong'; end if;
  if (select status from public.order_requests) <> 'requested' then raise exception 'initial status must be requested'; end if;
end $$;
select public.set_order_status((select id from public.order_requests), 'reviewing', 'test');
do $$ begin if (select count(*) from public.order_status_history) <> 2 then raise exception 'history not written'; end if; end $$;
reset role;

-- 2. anon and authenticated: no access to anything, including the functions
do $$
declare r text; t text;
begin
  foreach r in array array['anon','authenticated'] loop
    execute format('set local role %I', r);
    foreach t in array array['order_requests','order_request_items','order_status_history','order_notes','enquiries','notification_outbox','catalogue_options','catalogue_products'] loop
      perform pg_temp.expect_denied(format('select * from public.%I', t));
      perform pg_temp.expect_denied(format('delete from public.%I', t));
    end loop;
    perform pg_temp.expect_denied($q$insert into public.catalogue_options (sku, unit_price_paise) values ('dt-50-sheet', 1)$q$);
    perform pg_temp.expect_denied($q$select public.create_order_request('{}'::jsonb, '[]'::jsonb)$q$);
    perform pg_temp.expect_denied($q$select public.set_order_status(gen_random_uuid(), 'paid', '')$q$);
    reset role;
  end loop;
end $$;

-- 3. constraints
set role service_role;
do $$ begin
  begin insert into public.catalogue_options (sku, min_units, max_units) values ('dt-x', 5, 2); raise exception 'min>max accepted';
  exception when check_violation then null; end;
  begin insert into public.catalogue_options (sku, unit_price_paise) values ('dt-y', -1); raise exception 'negative price accepted';
  exception when check_violation then null; end;
end $$;
reset role;
select 'ALL DATABASE AUTHORIZATION TESTS PASSED' as result;
