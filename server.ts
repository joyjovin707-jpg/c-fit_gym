import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import os from 'os';

const PORT = 3000;
const DATA_DIR = path.resolve(import.meta.dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'cfit_shared_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed data if file does not exist
function loadInitialDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.warn('[SERVER] Could not parse existing DB file, reinitializing:', e);
    }
  }

  const initial = {
    version: '2.0.0',
    updatedAt: new Date().toISOString(),
    members: [
      { id: 1, member_id: 'GYM-0142', full_name: 'Rahul Sharma', plan_type: 'Platinum', trainer_id: 1, trainer_name: 'Vikram Sethi', join_date: '2026-03-01', expiry_date: '2026-09-01', status: 'Active' },
      { id: 2, member_id: 'GYM-0071', full_name: 'Priya Nair', plan_type: 'Gold', trainer_id: 2, trainer_name: 'Sneha Pillai', join_date: '2026-02-15', expiry_date: '2026-08-15', status: 'Active' },
      { id: 3, member_id: 'GYM-0057', full_name: 'Ananya Mohan', plan_type: 'Silver', trainer_id: null, trainer_name: 'Unassigned', join_date: '2026-01-10', expiry_date: '2026-07-10', status: 'Expiring' },
      { id: 4, member_id: 'GYM-0198', full_name: 'Kavya Suresh', plan_type: 'Platinum', trainer_id: 1, trainer_name: 'Vikram Sethi', join_date: '2026-04-01', expiry_date: '2026-10-01', status: 'Active' },
      { id: 5, member_id: 'GYM-0311', full_name: 'Deepak Varma', plan_type: 'Gold', trainer_id: 3, trainer_name: 'Mathew Thomas', join_date: '2026-02-01', expiry_date: '2026-08-01', status: 'Active' },
      { id: 6, member_id: 'GYM-0233', full_name: 'Suresh Kumar', plan_type: 'Silver', trainer_id: null, trainer_name: 'Unassigned', join_date: '2026-01-20', expiry_date: '2026-07-20', status: 'Active' }
    ],
    staff_users: [
      { id: 1, username: 'admin', password: 'admin123', full_name: 'Gym Administrator', role: 'Admin', email: 'admin@cfitgym.com', phone: '+91 98470 11223', shift: 'Full Day', status: 'Active', can_manage_members: true, can_process_payments: true, can_manage_classes: true, can_manage_trainers: true, created_at: '2025-01-01 00:00:00' },
      { id: 2, username: 'staff', password: 'staff123', full_name: 'Reception Frontdesk', role: 'Staff', email: 'reception@cfitgym.com', phone: '+91 98470 44556', shift: 'Morning', status: 'Active', can_manage_members: true, can_process_payments: true, can_manage_classes: true, can_manage_trainers: true, created_at: '2025-03-15 08:30:00' },
      { id: 3, username: 'vishnu', password: 'staff123', full_name: 'Vishnu Nair', role: 'Staff', email: 'vishnu.nair@cfitgym.com', phone: '+91 94471 22334', shift: 'Evening', status: 'Active', can_manage_members: true, can_process_payments: true, can_manage_classes: true, can_manage_trainers: true, created_at: '2025-06-20 14:00:00' },
      { id: 4, username: 'anjali', password: 'staff123', full_name: 'Anjali Menon', role: 'Staff', email: 'anjali.m@cfitgym.com', phone: '+91 98950 33445', shift: 'Morning', status: 'Active', can_manage_members: true, can_process_payments: true, can_manage_classes: true, can_manage_trainers: false, created_at: '2025-08-10 09:15:00' }
    ],
    trainers: [
      { id: 1, trainer_code: 'TR-01', full_name: 'Vikram Sethi', specialty: 'Strength & Bodybuilding', rating: 4.9, clients_assigned: 14, sessions_this_week: 22 },
      { id: 2, trainer_code: 'TR-02', full_name: 'Sneha Pillai', specialty: 'Cardio & HIIT Conditioning', rating: 4.8, clients_assigned: 11, sessions_this_week: 18 },
      { id: 3, trainer_code: 'TR-03', full_name: 'Mathew Thomas', specialty: 'CrossFit & Olympic Lifting', rating: 4.7, clients_assigned: 9, sessions_this_week: 16 }
    ],
    attendance: [
      { id: 1, member_id: 'GYM-0142', member_name: 'Rahul Sharma', check_in_time: '2026-10-18 06:15:00', check_out_time: null, check_in_method: 'Reception Desk', duration: 'In progress' },
      { id: 2, member_id: 'GYM-0071', member_name: 'Priya Nair', check_in_time: '2026-10-18 07:00:00', check_out_time: null, check_in_method: 'Reception Desk', duration: 'In progress' }
    ],
    payments: [
      { id: 1, member_id: 'GYM-0142', member_name: 'Rahul Sharma', plan_description: 'Platinum — 6 Months Full Access', amount: 15000, due_date: '2026-10-30', payment_status: 'Paid' },
      { id: 2, member_id: 'GYM-0071', member_name: 'Priya Nair', plan_description: 'Gold — Quarterly Access', amount: 8500, due_date: '2026-11-05', payment_status: 'Paid' },
      { id: 3, member_id: 'GYM-0057', member_name: 'Ananya Mohan', plan_description: 'Silver — Monthly Renewal', amount: 2000, due_date: '2026-10-20', payment_status: 'Pending' }
    ],
    classes: [
      { id: 1, class_name: 'CrossFit Power Hour', trainer_id: 1, trainer_name: 'Vikram Sethi', studio_location: 'Studio A (Ground)', start_time: '06:30 AM', max_capacity: 15, booked_count: 8 },
      { id: 2, class_name: 'HIIT Conditioning Blitz', trainer_id: 2, trainer_name: 'Sneha Pillai', studio_location: 'Studio B (Level 1)', start_time: '07:30 AM', max_capacity: 20, booked_count: 14 }
    ]
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  return initial;
}

let dbMemory = loadInitialDb();

function saveDb() {
  dbMemory.updatedAt = new Date().toISOString();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbMemory, null, 2), 'utf-8');
  } catch (e) {
    console.error('[SERVER] Failed to persist DB to file:', e);
  }
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  // CORS for local cross-device requests (e.g. mobile phone hitting laptop IP)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // ==================== REST API ENDPOINTS FOR CROSS-DEVICE SYNC ====================

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      mode: 'full-stack-centralized',
      serverTime: new Date().toISOString(),
      updatedAt: dbMemory.updatedAt,
      stats: {
        membersCount: dbMemory.members?.length || 0,
        staffCount: dbMemory.staff_users?.length || 0,
        paymentsCount: dbMemory.payments?.length || 0,
        attendanceCount: dbMemory.attendance?.length || 0
      }
    });
  });

  // Get full database snapshot for cross-device syncing
  app.get('/api/sync', (req, res) => {
    res.json(dbMemory);
  });

  // Push updates from any device (laptop or phone) to central database
  app.post('/api/sync', (req, res) => {
    try {
      const incoming = req.body;
      if (!incoming) return res.status(400).json({ error: 'Missing body' });

      if (Array.isArray(incoming.members)) dbMemory.members = incoming.members;
      if (Array.isArray(incoming.staff_users)) dbMemory.staff_users = incoming.staff_users;
      if (Array.isArray(incoming.trainers)) dbMemory.trainers = incoming.trainers;
      if (Array.isArray(incoming.attendance)) dbMemory.attendance = incoming.attendance;
      if (Array.isArray(incoming.payments)) dbMemory.payments = incoming.payments;
      if (Array.isArray(incoming.classes)) dbMemory.classes = incoming.classes;

      saveDb();
      res.json({ success: true, message: 'Central database updated and synced across all devices.', updatedAt: dbMemory.updatedAt });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Sync error' });
    }
  });

  // Members endpoints
  app.get('/api/members', (req, res) => {
    res.json(dbMemory.members || []);
  });

  app.post('/api/members', (req, res) => {
    const member = req.body;
    if (!member || !member.member_id) {
      return res.status(400).json({ error: 'member_id is required' });
    }

    const idx = dbMemory.members.findIndex((m: any) => m.member_id === member.member_id || m.id === member.id);
    if (idx >= 0) {
      dbMemory.members[idx] = { ...dbMemory.members[idx], ...member };
    } else {
      const newId = dbMemory.members.reduce((max: number, m: any) => Math.max(max, m.id || 0), 0) + 1;
      dbMemory.members.push({ id: newId, ...member });
    }
    saveDb();
    res.json({ success: true, member });
  });

  // Staff endpoints
  app.get('/api/staff', (req, res) => {
    res.json(dbMemory.staff_users || []);
  });

  app.post('/api/staff', (req, res) => {
    const staff = req.body;
    if (!staff || !staff.username) {
      return res.status(400).json({ error: 'username is required' });
    }

    const idx = dbMemory.staff_users.findIndex((s: any) => s.username?.toLowerCase() === staff.username?.toLowerCase() || s.id === staff.id);
    if (idx >= 0) {
      dbMemory.staff_users[idx] = { ...dbMemory.staff_users[idx], ...staff };
    } else {
      const newId = dbMemory.staff_users.reduce((max: number, s: any) => Math.max(max, s.id || 0), 0) + 1;
      dbMemory.staff_users.push({ id: newId, ...staff });
    }
    saveDb();
    res.json({ success: true, staff });
  });

  // Payments endpoints
  app.get('/api/payments', (req, res) => {
    res.json(dbMemory.payments || []);
  });

  app.post('/api/payments', (req, res) => {
    const p = req.body;
    const newId = (dbMemory.payments || []).reduce((max: number, item: any) => Math.max(max, item.id || 0), 0) + 1;
    dbMemory.payments.unshift({ id: newId, ...p });
    saveDb();
    res.json({ success: true, payment: dbMemory.payments[0] });
  });

  // Attendance endpoints
  app.get('/api/attendance', (req, res) => {
    res.json(dbMemory.attendance || []);
  });

  app.post('/api/attendance', (req, res) => {
    const a = req.body;
    const newId = (dbMemory.attendance || []).reduce((max: number, item: any) => Math.max(max, item.id || 0), 0) + 1;
    dbMemory.attendance.unshift({ id: newId, ...a });
    saveDb();
    res.json({ success: true, record: dbMemory.attendance[0] });
  });

  // Local Network IP discovery endpoint (helps users easily find their laptop IP to open on phone)
  app.get('/api/network-info', (req, res) => {
    const interfaces = os.networkInterfaces();
    const ips: string[] = [];
    for (const devName in interfaces) {
      const iface = interfaces[devName];
      if (!iface) continue;
      for (const alias of iface) {
        if (alias.family === 'IPv4' && !alias.internal) {
          ips.push(alias.address);
        }
      }
    }
    res.json({
      localIps: ips,
      port: PORT,
      lanUrls: ips.map((ip) => `http://${ip}:${PORT}`),
      instructions: 'Open any of these URLs in your mobile phone browser while connected to the same Wi-Fi network.'
    });
  });

  // ==================== VITE MIDDLEWARE / STATIC ASSETS ====================
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(import.meta.dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[C-FIT SERVER] Full-Stack Centralized Server listening on http://0.0.0.0:${PORT}`);
    console.log(`[C-FIT SERVER] Persistent Central Database active at: ${DB_FILE}`);
  });
}

startServer().catch((err) => {
  console.error('[C-FIT SERVER] Failed to start server:', err);
});
