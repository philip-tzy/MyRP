-- ============================================================
-- Planify MRP — Supabase Schema
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── PARTS ──────────────────────────────────────────────────
create table if not exists parts (
  id             uuid primary key default gen_random_uuid(),
  part_number    text not null unique,
  name           text not null,
  type           text not null check (type in ('Raw Material','Sub-Assembly','Finished Good')),
  uom            text not null default 'EA',
  on_hand_qty    integer not null default 0,
  lot_size       integer not null default 1,
  lead_time_days integer not null default 1,
  status         text not null default 'Active' check (status in ('Active','Inactive')),
  created_at     timestamptz default now()
);

-- ── CUSTOMERS ──────────────────────────────────────────────
create table if not exists customers (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  name       text not null,
  city       text,
  contact    text,
  email      text,
  created_at timestamptz default now()
);

-- ── SUPPLIERS ──────────────────────────────────────────────
create table if not exists suppliers (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  name       text not null,
  city       text,
  contact    text,
  email      text,
  created_at timestamptz default now()
);

-- ── BOM (Bill of Materials) ─────────────────────────────────
create table if not exists bom (
  id             uuid primary key default gen_random_uuid(),
  parent_part_id uuid not null references parts(id) on delete cascade,
  child_part_id  uuid not null references parts(id) on delete cascade,
  qty_per        numeric not null default 1,
  created_at     timestamptz default now(),
  unique(parent_part_id, child_part_id)
);

-- ── BOO (Bill of Operations) ────────────────────────────────
create table if not exists boo (
  id           uuid primary key default gen_random_uuid(),
  part_id      uuid not null references parts(id) on delete cascade,
  step_no      integer not null default 10,
  operation    text not null,
  work_center  text not null,
  time_minutes integer not null default 0,
  created_at   timestamptz default now()
);

-- ── SALES ORDERS ────────────────────────────────────────────
create table if not exists sales_orders (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  so_number   text not null unique,
  order_date  date not null default current_date,
  due_date    date not null,
  status      text not null default 'Draft' check (status in ('Draft','Confirmed','Shipped','Cancelled')),
  notes       text,
  created_at  timestamptz default now()
);

-- ── SALES ORDER LINES ───────────────────────────────────────
create table if not exists sales_order_lines (
  id        uuid primary key default gen_random_uuid(),
  so_id     uuid not null references sales_orders(id) on delete cascade,
  part_id   uuid not null references parts(id),
  order_qty integer not null default 1,
  shipped   boolean not null default false,
  created_at timestamptz default now()
);

-- ── INVENTORY ADJUSTMENTS ───────────────────────────────────
create table if not exists inventory_adjustments (
  id         uuid primary key default gen_random_uuid(),
  part_id    uuid not null references parts(id),
  qty_change integer not null,
  reason     text,
  created_at timestamptz default now()
);

-- ── MRP SUGGESTIONS ─────────────────────────────────────────
create table if not exists mrp_suggestions (
  id          uuid primary key default gen_random_uuid(),
  part_id     uuid not null references parts(id),
  supplier_id uuid references suppliers(id),
  order_qty   integer not null,
  start_date  date not null,
  due_date    date not null,
  type        text not null check (type in ('Purchase','Job')),
  status      text not null default 'Pending' check (status in ('Pending','Firm','Cancelled')),
  source_so   text,
  created_at  timestamptz default now()
);

-- ── RLS: Disable for development (enable + add policies in production) ──
alter table parts               disable row level security;
alter table customers           disable row level security;
alter table suppliers           disable row level security;
alter table bom                 disable row level security;
alter table boo                 disable row level security;
alter table sales_orders        disable row level security;
alter table sales_order_lines   disable row level security;
alter table inventory_adjustments disable row level security;
alter table mrp_suggestions     disable row level security;
