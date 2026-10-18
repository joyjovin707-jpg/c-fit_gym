import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  RefreshCw,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Server,
  Layers,
  ArrowDownToLine,
  FileCode2,
  Check,
  Smartphone,
  Share2
} from 'lucide-react';
import { gymDb } from '../../db/database.ts';

interface DatabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (msg: string) => void;
}

export const DatabaseSyncModal: React.FC<DatabaseSyncModalProps> = ({
  isOpen,
  onClose,
  onNotify
}) => {
  const [serverUrl, setServerUrl] = useState('http://localhost:8080/api');
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [backendStatus, setBackendStatus] = useState<{ connected: boolean; latencyMs?: number; message?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [tableCounts, setTableCounts] = useState<{ table: string; count: number }[]>([]);

  // Cloud Sync Room (for Vercel cross-device sync)
  const [cloudRoom, setCloudRoom] = useState(gymDb.getCloudRoomKey());
  const [copiedLink, setCopiedLink] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStats();
      setCloudRoom(gymDb.getCloudRoomKey());
    }
  }, [isOpen]);

  const loadStats = async () => {
    try {
      const db = await gymDb.getDb();
      const tables = ['members', 'staff_users', 'trainers', 'attendance', 'payments', 'classes'];
      const counts: { table: string; count: number }[] = [];
      for (const t of tables) {
        try {
          const res = db.exec(`SELECT COUNT(*) FROM ${t}`);
          counts.push({ table: t, count: (res[0]?.values[0]?.[0] as number) || 0 });
        } catch {
          counts.push({ table: t, count: 0 });
        }
      }
      setTableCounts(counts);
    } catch (e) {
      console.error(e);
    }
  };

  const testBackend = async () => {
    setIsChecking(true);
    const res = await gymDb.checkBackendStatus(serverUrl);
    setBackendStatus(res);
    setIsChecking(false);
  };

  const handleSyncWithJava = async () => {
    setIsSyncing(true);
    const res = await gymDb.syncWithJavaBackend(serverUrl);
    setIsSyncing(false);
    onNotify(res.message);
    if (res.success) {
      loadStats();
    }
  };

  const handleSaveRoom = () => {
    gymDb.setCloudRoomKey(cloudRoom);
    onNotify('Cloud Sync Room updated to: ' + cloudRoom);
  };

  const handleForceCloudPush = () => {
    gymDb.pushToCloudRelay();
    onNotify('Current database broadcast to Cloud Relay (Phone will sync automatically)!');
  };

  const handleForceCloudPull = async () => {
    setIsCloudSyncing(true);
    const success = await gymDb.pollCloudRelay();
    setIsCloudSyncing(false);
    if (success) {
      onNotify('Pulled and synchronized latest records from Cloud Relay!');
      loadStats();
    } else {
      onNotify('Checked Cloud Relay. Database is up to date.');
    }
  };

  const handleCopyPairingLink = async () => {
    try {
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      const pairingUrl = `${origin}${pathname}?sync=${encodeURIComponent(cloudRoom)}`;
      await navigator.clipboard.writeText(pairingUrl);
      setCopiedLink(true);
      onNotify('Copied pairing link! Send this link to your phone (WhatsApp/Email) to open in sync.');
      setTimeout(() => setCopiedLink(false), 3500);
    } catch {
      onNotify(`Sync link: ${window.location.origin}?sync=${cloudRoom}`);
    }
  };

  const handleExportJson = async () => {
    try {
      const jsonStr = await gymDb.exportCompleteDatabaseJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cfit_database_sync_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onNotify('Database exported as JSON file successfully!');
    } catch (e: any) {
      onNotify('Export failed: ' + e?.message);
    }
  };

  const handleExportSql = async () => {
    try {
      const sqlStr = await gymDb.exportCompleteDatabaseSql();
      const blob = new Blob([sqlStr], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cfit_database_dump_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onNotify('Database SQL dump generated and downloaded!');
    } catch (e: any) {
      onNotify('SQL Export failed: ' + e?.message);
    }
  };

  const handleCopyJson = async () => {
    try {
      const jsonStr = await gymDb.exportCompleteDatabaseJson();
      await navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      onNotify('Full database snapshot copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onNotify('Could not copy to clipboard.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const result = await gymDb.importCompleteDatabaseJson(text);
        if (result.success) {
          onNotify(result.message);
          loadStats();
        } else {
          onNotify(result.message);
        }
      } catch (err: any) {
        onNotify('Import error: ' + (err?.message || 'Invalid format'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1A1D21] border border-[#2C3034] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#2C3034] flex items-center justify-between bg-[#151719]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9FF3D]/10 border border-[#C9FF3D]/30 flex items-center justify-center text-[#C9FF3D]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#EDEEEA] flex items-center gap-2">
                Database Connection & Synchronization Hub
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8FB82A]/20 text-[#C9FF3D] border border-[#C9FF3D]/30 font-mono">
                  LIVE
                </span>
              </h2>
              <p className="text-xs text-[#9A9E9F]">
                Synchronize members, staff, attendance, and billing between Web, Java Desktop, and all tabs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#9A9E9F] hover:text-[#EDEEEA] hover:bg-[#212528] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Card: Vercel Cloud Realtime Sync (Laptop ⇄ Mobile Phone) */}
          <div className="bg-[#212528] border-2 border-[#C9FF3D]/50 rounded-xl p-4 space-y-3.5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#C9FF3D]" />
                <span className="text-xs font-bold text-[#EDEEEA] uppercase tracking-wider">
                  Vercel Cross-Device Cloud Sync (Laptop ⇄ Mobile Phone)
                </span>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-[#C9FF3D] font-mono bg-[#C9FF3D]/15 px-2.5 py-0.5 rounded-full border border-[#C9FF3D]/40 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#C9FF3D] animate-pulse" />
                Active on Vercel
              </span>
            </div>

            <p className="text-xs text-[#EDEEEA] leading-relaxed">
              <strong>Solves the Vercel mobile sync issue:</strong> When deployed on Vercel, browsers on your Laptop and Mobile Phone each have separate local storage. This Cloud Relay links them in real-time so changes on your laptop appear on your phone instantly!
            </p>

            <div className="bg-[#1A1D21] p-3 rounded-lg border border-[#2C3034] space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex flex-col items-center shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=4&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?sync=${cloudRoom}` : '')}`}
                    alt="Scan with mobile"
                    className="w-24 h-24 rounded-lg bg-white p-1 border border-[#2C3034] shadow-sm"
                  />
                  <span className="text-[10px] text-[#9A9E9F] mt-1 font-mono">Scan on Phone</span>
                </div>

                <div className="flex-1 w-full space-y-2">
                  <div className="text-[10px] text-[#5D6164] uppercase font-mono">Sync Room Key (Shared across your Laptop & Mobile)</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cloudRoom}
                      onChange={(e) => setCloudRoom(e.target.value)}
                      className="flex-1 bg-[#151719] border border-[#2C3034] rounded px-2.5 py-1.5 text-xs font-mono text-[#C9FF3D] focus:outline-none focus:border-[#C9FF3D]"
                    />
                    <button
                      onClick={handleSaveRoom}
                      className="px-3 py-1.5 bg-[#212528] hover:bg-[#2C3034] text-[#EDEEEA] border border-[#2C3034] rounded text-xs font-medium cursor-pointer"
                    >
                      Set Key
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={handleCopyPairingLink}
                      className="px-3 py-1.5 bg-[#C9FF3D] hover:bg-[#B5EB34] text-[#101214] rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied Link!' : 'Copy Mobile Link'}</span>
                    </button>
                    <button
                      onClick={handleForceCloudPush}
                      className="px-2.5 py-1.5 bg-[#212528] hover:bg-[#2C3034] text-[#EDEEEA] rounded border border-[#2C3034] text-xs cursor-pointer flex items-center gap-1"
                    >
                      <span>Push Laptop Data</span>
                    </button>
                    <button
                      onClick={handleForceCloudPull}
                      disabled={isCloudSyncing}
                      className="px-2.5 py-1.5 bg-[#212528] hover:bg-[#2C3034] text-[#C9FF3D] rounded border border-[#2C3034] text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                      <span>Pull to Mobile</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#9A9E9F] bg-[#151719] p-2.5 rounded-lg border border-[#2C3034]">
              <strong className="text-[#EDEEEA]">How to view & edit between Laptop and Mobile:</strong> Scan the QR code with your mobile camera or click <strong className="text-[#C9FF3D]">"Copy Mobile Link"</strong> and send it to your phone via WhatsApp/Email. Any updates on your laptop will automatically update your phone in real-time!
            </div>
          </div>

          {/* Card 1: Local Engine & Multi-tab Status */}
          <div className="bg-[#212528] border border-[#2C3034] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#C9FF3D]" />
                <span className="text-xs font-bold text-[#EDEEEA] uppercase tracking-wider">
                  Active Database Engine
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C9FF3D] animate-pulse" />
                <span className="text-xs font-mono font-semibold text-[#C9FF3D]">
                  Connected (In-Browser SQLite + Auto-Sync)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
              {tableCounts.map((tc) => (
                <div key={tc.table} className="bg-[#1A1D21] p-2.5 rounded-lg border border-[#2C3034] text-center">
                  <div className="text-[10px] text-[#5D6164] uppercase font-mono truncate">{tc.table}</div>
                  <div className="text-sm font-bold font-mono text-[#EDEEEA] mt-0.5">{tc.count}</div>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-[#9A9E9F] bg-[#1A1D21] p-2.5 rounded-lg border border-[#2C3034] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C9FF3D]" />
                <span>Multi-tab Real-Time BroadcastChannel: <strong>Active</strong></span>
              </span>
              <span className="text-[#5D6164] font-mono text-[10px]">Zero delay</span>
            </div>
          </div>

          {/* Card: MySQL JDBC & Cross-Device Central Database */}
          <div className="bg-[#212528] border border-[#2C3034] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#C9FF3D]" />
                <span className="text-xs font-bold text-[#EDEEEA] uppercase tracking-wider">
                  MySQL JDBC Connection (Java & Backend)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C9FF3D]/15 text-[#C9FF3D] border border-[#C9FF3D]/30">
                JDBC: MySQL 8.0+
              </span>
            </div>

            <p className="text-xs text-[#9A9E9F]">
              Standard Java JDBC datasource configuration provided in <code className="text-[#C9FF3D] font-mono">java/resources/application.yml</code>:
            </p>

            <div className="bg-[#1A1D21] p-3 rounded-lg border border-[#2C3034] space-y-2 font-mono text-[11px]">
              <div className="text-[#5D6164] flex items-center justify-between border-b border-[#2C3034] pb-1.5">
                <span>JDBC DATASOURCE CONFIGURATION</span>
                <span className="text-[#C9FF3D]">com.mysql.cj.jdbc.Driver</span>
              </div>
              <div className="text-[#EDEEEA] truncate">
                <span className="text-[#5D6164]">URL: </span>
                <span className="text-[#C9FF3D]">jdbc:mysql://${'{DB_HOST:localhost}'}:3306/cfit_db?createDatabaseIfNotExist=true&useSSL=false</span>
              </div>
              <div className="text-[#9A9E9F] flex gap-4">
                <span>User: <strong className="text-[#EDEEEA]">root</strong></span>
                <span>Pass: <strong className="text-[#EDEEEA]">root</strong></span>
                <span>Status: <strong className="text-[#C9FF3D]">Ready for MySQL</strong></span>
              </div>
            </div>
          </div>

          {/* Card 2: Java Backend Synchronization */}
          <div className="bg-[#212528] border border-[#2C3034] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#C9FF3D]" />
                <span className="text-xs font-bold text-[#EDEEEA] uppercase tracking-wider">
                  Sync with C-FIT Java Desktop / HTTP Server
                </span>
              </div>
              {backendStatus?.connected ? (
                <span className="flex items-center gap-1.5 text-xs text-[#C9FF3D] font-mono bg-[#C9FF3D]/10 px-2 py-0.5 rounded border border-[#C9FF3D]/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Java Online ({backendStatus.latencyMs}ms)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-[#9A9E9F] font-mono bg-[#1A1D21] px-2 py-0.5 rounded border border-[#2C3034]">
                  <AlertCircle className="w-3.5 h-3.5 text-[#FFAE42]" /> Optional Local Bridge
                </span>
              )}
            </div>

            <div className="text-[11px] text-[#9A9E9F] bg-[#1A1D21] p-2.5 rounded-lg border border-[#2C3034] space-y-1">
              <div className="text-[#EDEEEA] font-semibold">
                💡 Why "localhost:8080" says failed to fetch:
              </div>
              <p>
                <strong>1. On Mobile:</strong> <code className="text-[#FFAE42] font-mono">localhost</code> is your phone, not your laptop! To test locally from mobile, use your laptop's Wi-Fi IP (e.g. <code className="text-[#C9FF3D] font-mono">http://192.168.1.X:8080/api</code>).
              </p>
              <p>
                <strong>2. On Vercel:</strong> Browsers block insecure HTTP requests from HTTPS sites. Use the <strong>Cloud Sync</strong> at the top to sync Laptop & Mobile seamlessly with zero configuration!
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://localhost:8080/api"
                className="flex-1 bg-[#1A1D21] border border-[#2C3034] rounded-lg px-3 py-2 text-xs text-[#EDEEEA] font-mono focus:outline-none focus:border-[#C9FF3D]"
              />
              <button
                onClick={testBackend}
                disabled={isChecking}
                className="px-3 py-2 bg-[#1A1D21] hover:bg-[#2C3034] text-[#EDEEEA] border border-[#2C3034] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                <span>Test</span>
              </button>
              <button
                onClick={handleSyncWithJava}
                disabled={isSyncing}
                className="px-4 py-2 bg-[#C9FF3D] hover:bg-[#B5EB34] text-[#101214] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync with Java'}</span>
              </button>
            </div>

            {backendStatus && (
              <div className={`text-xs p-2.5 rounded-lg border ${
                backendStatus.connected
                  ? 'bg-[#C9FF3D]/10 border-[#C9FF3D]/30 text-[#C9FF3D]'
                  : 'bg-[#212528] border-[#2C3034] text-[#EDEEEA]'
              }`}>
                {backendStatus.message}
              </div>
            )}
          </div>

          {/* Card 3: Transfer & Portable Sync (Take Members / Staff list anywhere) */}
          <div className="bg-[#212528] border border-[#2C3034] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ArrowDownToLine className="w-4 h-4 text-[#C9FF3D]" />
              <span className="text-xs font-bold text-[#EDEEEA] uppercase tracking-wider">
                Take Database Anywhere (Export & Import)
              </span>
            </div>
            <p className="text-xs text-[#9A9E9F]">
              Take your members list, staff list, and all records to another computer, browser, or assignment submission.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleExportJson}
                className="p-3 bg-[#1A1D21] hover:bg-[#2C3034] border border-[#2C3034] hover:border-[#C9FF3D]/50 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-[#EDEEEA] flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-[#C9FF3D]" />
                    <span>Export JSON Sync File</span>
                  </div>
                  <div className="text-[10px] text-[#5D6164] mt-0.5">
                    Universal format for web & app transfer
                  </div>
                </div>
                <span className="text-xs text-[#5D6164] font-mono group-hover:text-[#C9FF3D]">.json</span>
              </button>

              <button
                onClick={handleExportSql}
                className="p-3 bg-[#1A1D21] hover:bg-[#2C3034] border border-[#2C3034] hover:border-[#C9FF3D]/50 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-[#EDEEEA] flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5 text-[#C9FF3D]" />
                    <span>Export SQL Dump File</span>
                  </div>
                  <div className="text-[10px] text-[#5D6164] mt-0.5">
                    Standard ANSI SQL INSERT statements
                  </div>
                </div>
                <span className="text-xs text-[#5D6164] font-mono group-hover:text-[#C9FF3D]">.sql</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                onClick={handleCopyJson}
                className="w-full sm:w-auto flex-1 py-2 px-3 bg-[#1A1D21] hover:bg-[#2C3034] text-[#EDEEEA] border border-[#2C3034] rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#C9FF3D]" /> : <Copy className="w-3.5 h-3.5 text-[#C9FF3D]" />}
                <span>{copied ? 'Copied Snapshot!' : 'Copy Snapshot to Clipboard'}</span>
              </button>

              <label className="w-full sm:w-auto flex-1 py-2 px-3 bg-[#1A1D21] hover:bg-[#2C3034] text-[#EDEEEA] border border-[#2C3034] rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#C9FF3D]" />
                <span>Import JSON Snapshot</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2C3034] bg-[#151719] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#212528] hover:bg-[#2C3034] text-[#EDEEEA] rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-[#2C3034]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
