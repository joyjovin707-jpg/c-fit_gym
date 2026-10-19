// C-fit Gym Management System Database Schema & Dynamic Seed Generator
// Generates schema with dynamically anchored dates relative to current date

export function generateSeedSql(baseDate: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const addDays = (d: Date, days: number) => {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + days);
    return copy;
  };
  const addMonths = (d: Date, months: number) => {
    const copy = new Date(d);
    copy.setMonth(copy.getMonth() + months);
    return copy;
  };

  const today = new Date(baseDate);
  const todayStr = fmtDate(today);

  // Dynamic Member Dates:
  // 1. neeraj
  const neerajJoin = fmtDate(addMonths(today, -11));
  const neerajExpiry = fmtDate(addMonths(today, 1)); // Active

  // 2. abin
  const abinJoin = fmtDate(addMonths(today, -5));
  const abinExpiry = fmtDate(addMonths(today, 7)); // Active

  // 3. sadi
  const sadiJoin = fmtDate(addMonths(today, -3));
  const sadiExpiry = fmtDate(addMonths(today, 9)); // Active

  // 4. vinod
  const vinodJoin = fmtDate(addMonths(today, -6));
  const vinodExpiry = fmtDate(addMonths(today, 6)); // Active

  // 5. farzan
  const farzanJoin = fmtDate(addMonths(today, -2));
  const farzanExpiry = fmtDate(addMonths(today, 10)); // Active

  // Dynamic Attendance Dates (Logged today):
  const att1In = `${todayStr} 06:12:00`;
  const att1Out = `${todayStr} 07:34:00`;
  const att2In = `${todayStr} 07:02:00`; // Currently on gym floor
  const att3In = `${todayStr} 08:15:00`;
  const att3Out = `${todayStr} 09:20:00`;
  const att4In = `${todayStr} 09:05:00`; // Currently on gym floor

  // Dynamic Payment Dates:
  const pay1Due = fmtDate(addDays(today, -15)); // Paid
  const pay2Due = fmtDate(addDays(today, -8));  // Paid
  const pay3Due = fmtDate(addDays(today, -4));  // Paid
  const pay4Due = fmtDate(addDays(today, -2));  // Paid
  const pay5Due = fmtDate(addDays(today, 5));   // Pending

  return `-- 1. System Users / Staff Credentials
CREATE TABLE IF NOT EXISTS admin (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'Admin access'
);

-- Staff Accounts & Role Control
CREATE TABLE IF NOT EXISTS staff_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Staff',
    email TEXT,
    phone TEXT,
    shift TEXT DEFAULT 'Morning',
    status TEXT DEFAULT 'Active',
    can_manage_members INTEGER DEFAULT 1,
    can_process_payments INTEGER DEFAULT 1,
    can_manage_classes INTEGER DEFAULT 1,
    can_manage_trainers INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
);

-- 2. Trainers Table
CREATE TABLE IF NOT EXISTS trainers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer_code TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    rating REAL DEFAULT 5.0
);

-- 3. Gym Members Table
CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    plan_type TEXT NOT NULL,           -- e.g., Gold, Silver, Platinum
    trainer_id INTEGER,
    join_date TEXT NOT NULL,            -- YYYY-MM-DD
    expiry_date TEXT NOT NULL,          -- YYYY-MM-DD
    status TEXT NOT NULL,               -- Active, Expiring, Paused, Expired
    FOREIGN KEY (trainer_id) REFERENCES trainers(id)
);

-- 4. Attendance / Check-in Logs
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id TEXT NOT NULL,
    check_in_time TEXT NOT NULL,        -- YYYY-MM-DD HH:MM:SS
    check_out_time TEXT,                -- YYYY-MM-DD HH:MM:SS or NULL
    check_in_method TEXT NOT NULL,      -- Reception Desk
    FOREIGN KEY (member_id) REFERENCES members(member_id)
);

-- 5. Payments & Billing Records
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id TEXT NOT NULL,
    plan_description TEXT NOT NULL,
    amount REAL NOT NULL,
    due_date TEXT NOT NULL,             -- YYYY-MM-DD
    payment_status TEXT NOT NULL,       -- Paid, Overdue, Pending
    FOREIGN KEY (member_id) REFERENCES members(member_id)
);

-- 6. Class Schedule Table
CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_name TEXT NOT NULL,
    trainer_id INTEGER NOT NULL,
    studio_location TEXT NOT NULL,
    start_time TEXT NOT NULL,           -- e.g., '06:00 AM'
    max_capacity INTEGER NOT NULL,
    booked_count INTEGER DEFAULT 0,
    FOREIGN KEY (trainer_id) REFERENCES trainers(id)
);

-- 7. Class Bookings (Roster)
CREATE TABLE IF NOT EXISTS class_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    member_id TEXT NOT NULL,
    booked_at TEXT NOT NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
    UNIQUE(class_id, member_id)
);

-- System User Credentials
INSERT OR IGNORE INTO admin (username, password, role) 
VALUES ('admin', 'admin123', 'Admin access'),
       ('staff', 'staff123', 'Staff access'),
       ('adhil', 'adhil123', 'Staff access'),
       ('dnv', 'dnv123', 'Staff access'),
       ('balu', 'balu123', 'Staff access'),
       ('abhiram', 'abhiram123', 'Staff access');

-- Administrator: JOVIN and Staff Members (staff, adhil, DNV, balu, abhiram)
INSERT OR IGNORE INTO staff_users (id, username, password, full_name, role, email, phone, shift, status, can_manage_members, can_process_payments, can_manage_classes, can_manage_trainers, created_at)
VALUES (1, 'admin', 'admin123', 'JOVIN', 'Admin', 'admin@cfitgym.com', '+91 98470 11223', 'Full Day', 'Active', 1, 1, 1, 1, '2025-01-01 00:00:00'),
       (2, 'staff', 'staff123', 'staff', 'Staff', 'staff@cfitgym.com', '+91 98470 44556', 'Morning', 'Active', 1, 1, 1, 1, '2025-03-15 08:30:00'),
       (3, 'adhil', 'adhil123', 'adhil', 'Staff', 'adhil@cfitgym.com', '+91 94471 22334', 'Morning', 'Active', 1, 1, 1, 1, '2025-06-20 14:00:00'),
       (4, 'dnv', 'dnv123', 'DNV', 'Staff', 'dnv@cfitgym.com', '+91 98950 33445', 'Evening', 'Active', 1, 1, 1, 1, '2025-08-10 09:15:00'),
       (5, 'balu', 'balu123', 'balu', 'Staff', 'balu@cfitgym.com', '+91 98472 55667', 'Evening', 'Active', 1, 1, 1, 1, '2025-09-01 10:00:00'),
       (6, 'abhiram', 'abhiram123', 'abhiram', 'Staff', 'abhiram@cfitgym.com', '+91 98473 66778', 'Full Day', 'Active', 1, 1, 1, 1, '2025-09-15 11:30:00');

-- Seed Mock Trainers
INSERT OR IGNORE INTO trainers (id, trainer_code, full_name, specialty, rating) 
VALUES (1, 'TR-01', 'Arjun Menon', 'Strength & conditioning', 4.9),
       (2, 'TR-02', 'Nina D''Souza', 'Spin & cardio', 4.8),
       (3, 'TR-03', 'Meera Kutty', 'Yoga & mobility', 5.0);

-- Default Members: neeraj, abin, sadi, vinod, farzan
INSERT OR IGNORE INTO members (id, member_id, full_name, plan_type, trainer_id, join_date, expiry_date, status)
VALUES (1, 'GYM-0101', 'neeraj', 'Gold', 1, '${neerajJoin}', '${neerajExpiry}', 'Active'),
       (2, 'GYM-0102', 'abin', 'Platinum', 2, '${abinJoin}', '${abinExpiry}', 'Active'),
       (3, 'GYM-0103', 'sadi', 'Silver', 3, '${sadiJoin}', '${sadiExpiry}', 'Active'),
       (4, 'GYM-0104', 'vinod', 'Gold', 1, '${vinodJoin}', '${vinodExpiry}', 'Active'),
       (5, 'GYM-0105', 'farzan', 'Platinum', 2, '${farzanJoin}', '${farzanExpiry}', 'Active');

-- Seed Mock Attendance Logs (5 records for 5 members)
INSERT OR IGNORE INTO attendance (id, member_id, check_in_time, check_out_time, check_in_method)
VALUES (1, 'GYM-0101', '${att1In}', '${att1Out}', 'Reception Desk'),
       (2, 'GYM-0102', '${att2In}', NULL, 'Reception Desk'),
       (3, 'GYM-0103', '${att3In}', '${att3Out}', 'Reception Desk'),
       (4, 'GYM-0104', '${att4In}', NULL, 'Reception Desk'),
       (5, 'GYM-0105', '${att2In}', NULL, 'Reception Desk');

-- Seed Mock Payments (5 records for 5 members)
INSERT OR IGNORE INTO payments (id, member_id, plan_description, amount, due_date, payment_status)
VALUES (1, 'GYM-0101', 'Gold — monthly', 2500, '${pay1Due}', 'Paid'),
       (2, 'GYM-0102', 'Platinum — annual', 28000, '${pay2Due}', 'Paid'),
       (3, 'GYM-0103', 'Silver — monthly', 1800, '${pay3Due}', 'Paid'),
       (4, 'GYM-0104', 'Gold — 6 month', 14000, '${pay4Due}', 'Paid'),
       (5, 'GYM-0105', 'Platinum — monthly', 3500, '${pay5Due}', 'Pending');

-- Seed Mock Class Schedule (5 classes)
INSERT OR IGNORE INTO classes (id, class_name, trainer_id, studio_location, start_time, max_capacity, booked_count)
VALUES (1, 'CrossFit Power Hour', 1, 'Studio A (Ground)', '06:30 AM', 15, 1),
       (2, 'HIIT Conditioning Blitz', 2, 'Studio B (Level 1)', '07:30 AM', 20, 1),
       (3, 'Power Yoga Flow', 4, 'Studio C (Level 2)', '08:30 AM', 12, 1),
       (4, 'Strength & Hypertrophy', 3, 'Studio A (Ground)', '05:30 PM', 15, 1),
       (5, 'Spin & Cardio Blast', 2, 'Studio B (Level 1)', '06:30 PM', 18, 1);

-- Seed Mock Class Bookings (5 bookings for 5 members)
INSERT OR IGNORE INTO class_bookings (id, class_id, member_id, booked_at)
VALUES (1, 1, 'GYM-0101', '2026-10-18 10:00:00'),
       (2, 2, 'GYM-0102', '2026-10-18 11:00:00'),
       (3, 3, 'GYM-0103', '2026-10-18 14:00:00'),
       (4, 4, 'GYM-0104', '2026-10-19 08:00:00'),
       (5, 5, 'GYM-0105', '2026-10-19 08:30:00');
`;
}

export const SCHEMA_SQL = generateSeedSql(new Date());
