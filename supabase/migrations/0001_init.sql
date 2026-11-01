-- Extensions
create extension if not exists pgcrypto;
create extension if not exists citext;

-- Enums
create type admin_role as enum ('owner','admin','support');
create type user_status as enum ('active','blocked');
create type order_status as enum ('pending','approved','rejected');
create type risk_level as enum ('low','medium','high');
create type ledger_kind as enum ('deposit_credit','withdraw_hold','withdraw_refund','manual_adjust');

-- Sequences
create sequence user_id_seq start 100000;
create sequence order_id_seq start 100000;

-- Tables
create table admins (
  id uuid primary key default gen_random_uuid(),
  email citext unique not null,
  password_hash text not null,
  role admin_role not null default 'support',
  totp_secret text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references admins(id) on delete cascade,
  token_hash text unique not null,
  ip inet,
  user_agent text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table login_attempts (
  id bigserial primary key,
  email citext not null,
  ip inet not null,
  success boolean not null,
  created_at timestamptz not null default now()
);
create index on login_attempts (email, created_at desc);
create index on login_attempts (ip, created_at desc);

create table users (
  id bigint primary key default nextval('user_id_seq'),
  balance numeric(14,2) not null default 0 check (balance >= 0),
  pin_hash text not null,
  status user_status not null default 'active',
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index on users (status) where deleted_at is null;
create index on users (created_at desc);

create table deposit_orders (
  id bigint primary key default nextval('order_id_seq'),
  user_id bigint not null references users(id),
  price_inr numeric(12,2) not null check (price_inr > 0),
  tokens integer not null check (tokens > 0),
  utr varchar(32) not null,
  status order_status not null default 'pending',
  deal_date timestamptz not null default now(),
  reviewed_by uuid references admins(id),
  reviewed_at timestamptz
);
create unique index deposit_utr_unique on deposit_orders (utr) where status <> 'rejected';
create index on deposit_orders (status, deal_date desc);
create index on deposit_orders (user_id);

create table withdraw_orders (
  id bigint primary key default nextval('order_id_seq'),
  user_id bigint not null references users(id),
  price_inr numeric(12,2) not null check (price_inr > 0),
  tokens integer not null check (tokens > 0),
  upi_id varchar(80) not null,
  status order_status not null default 'pending',
  deal_date timestamptz not null default now(),
  paid_confirmed_at timestamptz,
  reviewed_by uuid references admins(id),
  reviewed_at timestamptz
);
create index on withdraw_orders (status, deal_date desc);
create index on withdraw_orders (user_id);

create table upi_requests (
  id bigint generated always as identity primary key,
  user_id bigint not null references users(id),
  upi_id varchar(80) not null,
  enabled boolean not null default true,
  status order_status not null default 'pending',
  risk risk_level not null default 'low',
  risk_note text,
  created_at timestamptz not null default now(),
  reviewed_by uuid references admins(id),
  reviewed_at timestamptz
);
create index on upi_requests (status, created_at desc);
create index on upi_requests (upi_id);

create table wallet_ledger (
  id bigserial primary key,
  user_id bigint not null references users(id),
  kind ledger_kind not null,
  amount numeric(14,2) not null,
  balance_after numeric(14,2) not null,
  ref_type text,
  ref_id bigint,
  admin_id uuid references admins(id),
  created_at timestamptz not null default now()
);
create index on wallet_ledger (user_id, created_at desc);

create table audit_log (
  id bigserial primary key,
  admin_id uuid references admins(id),
  action text not null,
  entity text not null,
  entity_id text,
  meta jsonb not null default '{}',
  ip inet,
  created_at timestamptz not null default now()
);
create index on audit_log (created_at desc);

-- ==========================================
-- MONEY MOVEMENT SQL FUNCTIONS
-- ==========================================

create or replace function approve_deposit(p_order bigint, p_admin uuid)
returns void language plpgsql as $$
declare o deposit_orders%rowtype; b numeric;
begin
  select * into o from deposit_orders where id = p_order for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.status <> 'pending' then raise exception 'ALREADY_REVIEWED'; end if;
  update users set balance = balance + o.tokens where id = o.user_id returning balance into b;
  update deposit_orders set status='approved', reviewed_by=p_admin, reviewed_at=now() where id = p_order;
  insert into wallet_ledger(user_id,kind,amount,balance_after,ref_type,ref_id,admin_id)
  values (o.user_id,'deposit_credit',o.tokens,b,'deposit',o.id,p_admin);
  insert into audit_log(admin_id,action,entity,entity_id) values
  (p_admin,'deposit.approve','deposit_order',o.id::text);
end $$;

create or replace function reject_deposit(p_order bigint, p_admin uuid)
returns void language plpgsql as $$
declare o deposit_orders%rowtype;
begin
  select * into o from deposit_orders where id = p_order for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.status <> 'pending' then raise exception 'ALREADY_REVIEWED'; end if;
  update deposit_orders set status='rejected', reviewed_by=p_admin, reviewed_at=now() where id = p_order;
  insert into audit_log(admin_id,action,entity,entity_id) values
  (p_admin,'deposit.reject','deposit_order',o.id::text);
end $$;

create or replace function approve_withdraw(p_order bigint, p_admin uuid)
returns void language plpgsql as $$
declare o withdraw_orders%rowtype;
begin
  select * into o from withdraw_orders where id = p_order for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.status <> 'pending' then raise exception 'ALREADY_REVIEWED'; end if;
  if o.paid_confirmed_at is null then raise exception 'PAYMENT_NOT_CONFIRMED'; end if;
  update withdraw_orders set status='approved', reviewed_by=p_admin, reviewed_at=now() where id = p_order;
  insert into audit_log(admin_id,action,entity,entity_id) values
  (p_admin,'withdraw.approve','withdraw_order',o.id::text);
end $$;

create or replace function reject_withdraw(p_order bigint, p_admin uuid)
returns void language plpgsql as $$
declare o withdraw_orders%rowtype; b numeric;
begin
  select * into o from withdraw_orders where id = p_order for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.status <> 'pending' then raise exception 'ALREADY_REVIEWED'; end if;
  update users set balance = balance + o.tokens where id = o.user_id returning balance into b;
  update withdraw_orders set status='rejected', reviewed_by=p_admin, reviewed_at=now() where id = p_order;
  insert into wallet_ledger(user_id,kind,amount,balance_after,ref_type,ref_id,admin_id)
  values (o.user_id,'withdraw_refund',o.tokens,b,'withdraw',o.id,p_admin);
  insert into audit_log(admin_id,action,entity,entity_id) values
  (p_admin,'withdraw.reject','withdraw_order',o.id::text);
end $$;

create or replace function create_withdraw(p_user bigint, p_amount numeric, p_tokens int, p_upi varchar)
returns bigint language plpgsql as $$
declare b numeric; o_id bigint;
begin
  select balance into b from users where id = p_user for update;
  if b < p_tokens then raise exception 'INSUFFICIENT_BALANCE'; end if;
  update users set balance = balance - p_tokens where id = p_user returning balance into b;
  insert into withdraw_orders(user_id, price_inr, tokens, upi_id) values (p_user, p_amount, p_tokens, p_upi) returning id into o_id;
  insert into wallet_ledger(user_id,kind,amount,balance_after,ref_type,ref_id)
  values (p_user,'withdraw_hold',p_tokens,b,'withdraw',o_id);
  return o_id;
end $$;

create or replace function adjust_balance(p_user bigint, p_amount numeric, p_admin uuid)
returns void language plpgsql as $$
declare b numeric;
begin
  update users set balance = balance + p_amount where id = p_user returning balance into b;
  if b < 0 then raise exception 'INSUFFICIENT_BALANCE'; end if;
  insert into wallet_ledger(user_id,kind,amount,balance_after,ref_type,admin_id)
  values (p_user,'manual_adjust',p_amount,b,'admin',p_admin);
  insert into audit_log(admin_id,action,entity,entity_id) values
  (p_admin,'user.adjust_balance','user',p_user::text);
end $$;

create or replace function approve_upi_bulk(p_ids bigint[], p_admin uuid)
returns void language plpgsql as $$
declare id bigint;
begin
  foreach id in array p_ids loop
    update upi_requests set status='approved', reviewed_by=p_admin, reviewed_at=now() where id=id and status='pending';
    insert into audit_log(admin_id,action,entity,entity_id) values
    (p_admin,'upi.approve','upi_request',id::text);
  end loop;
end $$;