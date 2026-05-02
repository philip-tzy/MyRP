-- ============================================================
-- Planify MRP — Seed Data
-- Run AFTER schema.sql
-- ============================================================

-- Parts
insert into parts (part_number, name, type, uom, on_hand_qty, lot_size, lead_time_days) values
  ('FG-001', 'Finished Pump Assembly',   'Finished Good',  'EA',  12, 1,  5),
  ('FG-002', 'Hydraulic Motor Unit',     'Finished Good',  'EA',   4, 1,  7),
  ('SA-012', 'Impeller Sub-Assembly',    'Sub-Assembly',   'EA',   8, 1,  3),
  ('SA-013', 'Motor Bracket Weld',       'Sub-Assembly',   'EA',   0, 1,  4),
  ('SA-014', 'Valve Block Assembly',     'Sub-Assembly',   'EA',   3, 1,  3),
  ('RM-045', 'Steel Rod 12mm',           'Raw Material',   'kg', 240, 50, 7),
  ('RM-046', 'Seal Ring O-60',           'Raw Material',   'EA',   2,100,14),
  ('RM-089', 'Bearing 6205',             'Raw Material',   'EA',  10, 20, 7),
  ('RM-102', 'Hex Bolt M8x30',           'Raw Material',   'EA', 500,200, 3),
  ('RM-110', 'Gasket Sheet 3mm',         'Raw Material',   'EA',  15, 50, 5)
on conflict (part_number) do nothing;

-- BOM lines
insert into bom (parent_part_id, child_part_id, qty_per)
select p.id, c.id, q.qty_per from (values
  ('FG-001','SA-012', 1),
  ('FG-001','SA-013', 1),
  ('FG-001','RM-045', 0.8),
  ('FG-001','RM-046', 2),
  ('FG-002','SA-014', 1),
  ('FG-002','SA-013', 2),
  ('SA-012','RM-089', 2),
  ('SA-012','RM-045', 0.4),
  ('SA-013','RM-102', 4),
  ('SA-013','RM-045', 0.3),
  ('SA-014','RM-046', 3),
  ('SA-014','RM-110', 1)
) as q(pno, cno, qty_per)
join parts p on p.part_number = q.pno
join parts c on c.part_number = q.cno
on conflict do nothing;

-- BOO lines
insert into boo (part_id, step_no, operation, work_center, time_minutes)
select p.id, s.step_no, s.op, s.wc, s.tm from (values
  ('FG-001', 10, 'Assembly',      'WC-ASSY-01', 45),
  ('FG-001', 20, 'Quality Check', 'WC-QC-01',  15),
  ('FG-002', 10, 'Assembly',      'WC-ASSY-02', 60),
  ('FG-002', 20, 'Testing',       'WC-TEST-01', 30),
  ('FG-002', 30, 'Quality Check', 'WC-QC-01',  15),
  ('SA-012', 10, 'Machining',     'WC-MACH-01', 30),
  ('SA-012', 20, 'Welding',       'WC-WELD-02', 20),
  ('SA-013', 10, 'Welding',       'WC-WELD-01', 25)
) as s(pno, step_no, op, wc, tm)
join parts p on p.part_number = s.pno;

-- Customers
insert into customers (code, name, city, contact, email) values
  ('CUST-001', 'PT Maju Bersama',  'Jakarta',  'Budi Santoso',   'budi@majubersama.co.id'),
  ('CUST-002', 'CV Tekno Jaya',    'Surabaya', 'Sari Wulandari', 'sari@teknojaya.co.id'),
  ('CUST-003', 'PT Karya Abadi',   'Bandung',  'Doni Prabowo',   'doni@karyaabadi.co.id')
on conflict (code) do nothing;

-- Suppliers
insert into suppliers (code, name, city, contact) values
  ('SUP-001', 'PT Baja Nusantara',    'Cikarang', 'Agus Malik'),
  ('SUP-002', 'CV Sumber Gaskindo',   'Bekasi',   'Rina Fitri'),
  ('SUP-003', 'UD Baut Jaya',         'Jakarta',  'Hendra S.')
on conflict (code) do nothing;

-- Sales Orders
insert into sales_orders (customer_id, so_number, order_date, due_date, status)
select c.id, s.sono, s.odate::date, s.ddate::date, s.st
from (values
  ('CUST-001','SO-2024-0890','2024-01-10','2024-02-10','Confirmed'),
  ('CUST-002','SO-2024-0891','2024-01-14','2024-02-05','Confirmed'),
  ('CUST-003','SO-2024-0892','2024-01-15','2024-02-20','Draft')
) as s(ccode, sono, odate, ddate, st)
join customers c on c.code = s.ccode
on conflict (so_number) do nothing;

-- Sales Order Lines
insert into sales_order_lines (so_id, part_id, order_qty, shipped)
select so.id, p.id, l.qty, l.shipped from (values
  ('SO-2024-0890','FG-001', 10, false),
  ('SO-2024-0890','FG-002',  5, false),
  ('SO-2024-0891','FG-001',  8, false),
  ('SO-2024-0892','FG-001',  6, false),
  ('SO-2024-0892','FG-002',  4, false)
) as l(sono, pno, qty, shipped)
join sales_orders so on so.so_number = l.sono
join parts p on p.part_number = l.pno;
