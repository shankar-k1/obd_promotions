"use client";
import React, { useState, useEffect } from 'react';
import PerformanceReport from '@/components/PerformanceReport';
import MermaidViewer from '@/components/MermaidViewer';
import FileUploadZone from '@/components/FileUploadZone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  ShieldCheck,
  Zap,
  BarChart3,
  Wand2,
  Layout,
  ChevronRight,
  Download,
  Calendar,
  Copy,
  UploadCloud,
  Smartphone,
  Info,
  CheckCircle2,
  XCircle,
  Activity
} from 'lucide-react';
const getApiBase = () => {
  if (typeof window === 'undefined') return 'http://localhost:8000';
  if (window.location.hostname === 'localhost') return 'http://localhost:8000';

  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) return 'http://localhost:8000';

  // If it's a protocol-less host from Render (e.g. obd-backend.onrender.com)
  if (!envUrl.startsWith('http')) {
    return `https://${envUrl}`;
  }
  return envUrl;
};

const API_BASE = getApiBase();

export default function Dashboard() {
  const [counts, setCounts] = useState({ total: 0, scrubbed: 0, final: 0 });
  const [prompts, setPrompts] = useState([
    "Win a new car today! Press 1 to join our lucky draw.",
    "Exclusive offer for you! Subscribe now and get 50% extra talk time.",
    "Stay connected with our best plans. Press 1 to see details."
  ]);
  const [scrubOptions, setScrubOptions] = useState({
    dnd: true,
    sub: true,
    unsub: true,
    operator: true
  });
  const [docText, setDocText] = useState('');
  const [mermaidFlow, setMermaidFlow] = useState('');
  const [flowLoading, setFlowLoading] = useState(false);
  const [flowError, setFlowError] = useState('');

  const [msisdnList, setMsisdnList] = useState([]);
  const [cleanedMsisdns, setCleanedMsisdns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dbStats, setDbStats] = useState({ dnd_count: null, sub_count: null, unsub_count: null });
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    obd_name: '',
    flow_name: '',
    msc_ip: '',
    cli: ''
  });

  // Theme State & Persistence
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('obd-theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('obd-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    fetch(`${API_BASE}/db-stats`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => setDbStats(data))
      .catch((err) => {
        console.error("Failed to fetch DB stats:", err);
        setDbStats({ dnd_count: `ERR (${API_BASE})`, sub_count: 'ERR', unsub_count: 'ERR' });
      });
  }, []);

  const [sessionStats, setSessionStats] = useState({ dnd: 0, sub: 0, unsub: 0, operator: 0 });

  const performScrub = async (listToScrub) => {
    const targetList = listToScrub || msisdnList;
    if (!targetList.length) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/scrub`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msisdn_list: targetList,
          options: scrubOptions
        }),
      });
      const data = await res.json();

      setSessionStats({
        dnd: data.report.dnd_removed || 0,
        sub: data.report.sub_removed || 0,
        unsub: data.report.unsub_removed || 0,
        operator: data.report.operator_removed || 0
      });

      setCounts(prev => ({
        ...prev,
        scrubbed: data.final_base_count,
        final: data.final_base_count
      }));
      setCleanedMsisdns(data.final_base || []);

      if (data.email_status && data.email_status.startsWith('FAILED')) {
        alert(`Scrubbing Complete, but Report Email Failed: ${data.email_status}`);
      }
    } catch (err) {
      console.error("Scrubbing failed", err);
      alert(`Scrubbing Failed: ${err.message || 'Network Error'}. Check file size or backend status.`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (data) => {
    console.log("Dashboard: Upload Success intercepted", data.total);
    setLoading(true);
    setSessionStats({ dnd: 0, sub: 0, unsub: 0, operator: 0 });
    setCleanedMsisdns([]);

    const newList = data.msisdns || [];
    setMsisdnList(newList);
    setCounts({ total: data.total, scrubbed: 0, final: 0 });

    // Auto-trigger scrubbing after setting the list
    if (newList.length > 0) {
      performScrub(newList);
    } else {
      setLoading(false);
    }
  };

  const handleRunScrub = () => performScrub();

  const downloadCleanedBase = () => {
    if (!cleanedMsisdns.length) {
      alert("No data to download yet. Please run a scrub first.");
      return;
    }
    try {
      const csvContent = "msisdn\n" + cleanedMsisdns.join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `scrubbed_base_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error("Download failed", err);
      alert("Download failed. Please try the 'Copy All' option as a workaround.");
    }
  };

  const generateFlowFromDoc = async () => {
    if (!docText.trim()) return;
    setFlowLoading(true);
    setFlowError('');
    setMermaidFlow('');
    try {
      const formData = new FormData();
      formData.append('doc_text', docText);
      const res = await fetch(`${API_BASE}/generate-flow-from-doc`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.flow) {
        setMermaidFlow(data.flow);
      } else {
        setFlowError('No flow returned. Check your API key or try again.');
      }
    } catch (err) {
      console.error('Flow generation failed', err);
      setFlowError('Failed to connect to backend. Is it running?');
    } finally {
      setFlowLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header>
        <div>
          <h1 className="logo-text">OBD OUTSMART</h1>
          <p className="subtitle">Automated Content & Scrubber Intelligence</p>
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
        </button>
      </header>

      <motion.div
        className="sequential-flow-container"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.1 } }
        }}
      >
        {/* STEP 1: DATA INJECTION */}
        <motion.section
          className="glass-panel sequential-step"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          <div className="step-badge"><UploadCloud size={20} /></div>
          <h2 className="panel-title">
            <span className="accent-line" style={{ background: 'var(--accent-cyan)' }}></span>
            Step 1: Data Injection
            <span className="text-ghost ml-auto text-[10px]">Lead Base Upload</span>
          </h2>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <FileUploadZone onUploadSuccess={handleFileUpload} />
          </div>
        </motion.section>

        {/* STEP 2: DATABASE ANALYTICS */}
        <motion.section
          className="glass-panel sequential-step"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          <div className="step-badge"><Database size={20} /></div>
          <h2 className="panel-title">
            <span className="accent-line" style={{ background: 'var(--accent-emerald)' }}></span>
            Step 2: Database Analytics
            <span className="text-ghost ml-auto text-[10px]">Global Cross-Reference</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-6 bg-white-5 rounded-2xl border-white-5 glass-pill">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-emerald-400" size={18} />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Global DND List</span>
              </div>
              <span className="text-xl font-bold text-emerald-400">
                {dbStats.dnd_count === null ? '...' : dbStats.dnd_count.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-6 bg-white-5 rounded-2xl border-white-5 glass-pill">
              <div className="flex items-center gap-3">
                <Smartphone className="text-cyan-400" size={18} />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Subscriptions</span>
              </div>
              <span className="text-xl font-bold text-cyan-400">
                {dbStats.sub_count === null ? '...' : dbStats.sub_count.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-6 bg-white-5 rounded-2xl border-white-5 glass-pill">
              <div className="flex items-center gap-3">
                <XCircle className="text-rose-400" size={18} />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Unsubscribe Archive</span>
              </div>
              <span className="text-xl font-bold text-rose-400">
                {dbStats.unsub_count === null ? '...' : dbStats.unsub_count.toLocaleString()}
              </span>
            </div>
          </div>
        </motion.section>

        {/* STEP 3: VERIFICATION INTELLIGENCE */}
        <motion.section
          className="glass-panel sequential-step"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          <div className="step-badge"><ShieldCheck size={20} /></div>
          <h2 className="panel-title">
            <span className="accent-line" style={{ background: 'var(--accent-purple)' }}></span>
            Step 3: Verification Intelligence
            <span className="text-ghost ml-auto text-[10px]">Scrubbing Outcome Preview</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="stat-card" style={{ display: 'flex', alignItems: 'center', padding: '32px' }}>
              <div className="flex flex-col">
                <div className="stat-label" style={{ marginBottom: 4, color: 'var(--text-muted)' }}>Initial Lead Load</div>
                <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Info size={10} /> Total input volume</div>
              </div>
              <div className="stat-value" style={{ color: 'var(--accent-blue)', fontSize: '2.5rem', marginLeft: 'auto' }}>
                {loading ? <span className="text-sm animate-pulse">Syncing...</span> : counts.total.toLocaleString()}
              </div>
            </div>
            <div className="stat-card" style={{ display: 'flex', alignItems: 'center', padding: '32px', borderLeft: '6px solid var(--accent-emerald)' }}>
              <div className="flex flex-col">
                <div className="stat-label" style={{ marginBottom: 4, color: 'var(--text-muted)' }}>Verified Clean Base</div>
                <div className="text-[10px] text-emerald-400/60 font-bold flex items-center gap-1"><CheckCircle2 size={10} /> Campaign ready</div>
              </div>
              <div className="stat-value" style={{ color: 'var(--accent-emerald)', fontSize: '2.5rem', marginLeft: 'auto' }}>
                {loading ? <span className="text-sm animate-pulse">Wait...</span> : counts.final.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
              <div className="stat-label" style={{ marginBottom: 8, fontSize: '0.6rem', color: 'var(--accent-purple)' }}>DND Removals</div>
              <div className="stat-value" style={{ color: 'var(--text-main)', fontSize: '1.5rem' }}>
                {sessionStats.dnd.toLocaleString()}
              </div>
              <div className="h-1 w-full bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-purple-400" style={{ width: counts.total ? `${(sessionStats.dnd / counts.total) * 100}%` : '0%' }}></div>
              </div>
            </div>
            <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
              <div className="stat-label" style={{ marginBottom: 8, fontSize: '0.6rem', color: 'var(--accent-cyan)' }}>Sub Removals</div>
              <div className="stat-value" style={{ color: 'var(--text-main)', fontSize: '1.5rem' }}>
                {sessionStats.sub.toLocaleString()}
              </div>
              <div className="h-1 w-full bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-cyan-400" style={{ width: counts.total ? `${(sessionStats.sub / counts.total) * 100}%` : '0%' }}></div>
              </div>
            </div>
            <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
              <div className="stat-label" style={{ marginBottom: 8, fontSize: '0.6rem', color: '#f87171' }}>Unsub Blocks</div>
              <div className="stat-value" style={{ color: 'var(--text-main)', fontSize: '1.5rem' }}>
                {sessionStats.unsub.toLocaleString()}
              </div>
              <div className="h-1 w-full bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-red-400" style={{ width: counts.total ? `${(sessionStats.unsub / counts.total) * 100}%` : '0%' }}></div>
              </div>
            </div>
            <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
              <div className="stat-label" style={{ marginBottom: 8, fontSize: '0.6rem', color: 'var(--accent-blue)' }}>Operator Filter</div>
              <div className="stat-value" style={{ color: 'var(--text-main)', fontSize: '1.5rem' }}>
                {sessionStats.operator.toLocaleString()}
              </div>
              <div className="h-1 w-full bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-blue-400" style={{ width: counts.total ? `${(sessionStats.operator / counts.total) * 100}%` : '0%' }}></div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* STEP 4: SCRUBBING CONFIGURATION */}
        <motion.section
          className="glass-panel sequential-step"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          <div className="step-badge"><Zap size={20} /></div>
          <h2 className="panel-title">
            <span className="accent-line" style={{ background: 'var(--accent-blue)' }}></span>
            Step 4: Scrubber Configuration
            <span className="text-ghost ml-auto text-[10px]">Filter Logic & Execution</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(scrubOptions).map((opt) => (
              <div key={opt} className="glass-card-interactive flex items-center gap-3 py-3"
                onClick={() => setScrubOptions(prev => ({ ...prev, [opt]: !prev[opt] }))}
              >
                <div className={`flex items-center justify-center rounded-lg border-2 border-cyan-400 transition-all ${scrubOptions[opt] ? 'bg-cyan-400 border-cyan-400' : 'bg-transparent border-slate-700'}`} style={{ width: '18px', height: '18px' }}>
                  {scrubOptions[opt] && <CheckCircle2 size={12} strokeWidth={3} color="#020617" />}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  <span style={{ color: scrubOptions[opt] ? 'var(--accent-cyan)' : 'var(--text-dim)' }}>{opt}</span> FILTER
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap md:flex-nowrap gap-4 mt-10">
            <button
              className="btn-secondary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid var(--accent-cyan)', background: 'rgba(34, 211, 238, 0.05)' }}
              onClick={async () => {
                try {
                  const res = await fetch(`${API_BASE}/verify-email`);
                  const data = await res.json();
                  if (res.ok) alert(`SUCCESS: ${data.message}`);
                  else alert(`ERROR: ${data.detail || 'Email verification failed'}`);
                } catch (err) {
                  alert(`Network Error: ${err.message}. Is backend live at ${API_BASE}?`);
                }
              }}
            >
              <Zap size={14} className="text-cyan-400" />
              VERIFY EMAIL
            </button>
            <button className="btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }} onClick={handleRunScrub} disabled={loading}>
              <Zap size={18} fill="currentColor" />
              {loading ? 'Sychronizing Datasets...' : 'EXECUTE SCRUBBING PIPELINE'}
            </button>
            <button className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={downloadCleanedBase} disabled={cleanedMsisdns.length === 0}>
              <Download size={16} />
              EXPORT CSV
            </button>
            <button
              className="btn-primary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: cleanedMsisdns.length > 0 ? 'var(--accent-cyan)' : 'var(--bg-glass)', opacity: cleanedMsisdns.length > 0 ? 1 : 0.4 }}
              onClick={() => setIsScheduleModalOpen(true)}
              disabled={cleanedMsisdns.length === 0}
            >
              <Calendar size={16} />
              SCHEDULE
            </button>
          </div>
        </motion.section>

        {/* STEP 5: VERIFIED RESULTS TERMINAL */}
        <AnimatePresence>
          {cleanedMsisdns.length > 0 && (
            <motion.section
              className="glass-panel sequential-step"
              initial={{ opacity: 0, height: 0, marginTop: -40 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="step-badge"><Layout size={20} /></div>
              <h2 className="panel-title">
                <span className="accent-line" style={{ background: 'var(--accent-emerald)' }}></span>
                Step 5: Verified Results Output
                <span className="text-ghost ml-auto text-[10px]">Real-time Terminal View</span>
              </h2>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Session MSISDN Feed</span>
                </div>
                <button
                  className="glass-pill text-[10px] font-bold text-emerald-400 hover:bg-emerald-400 hover:text-black transition-all"
                  onClick={() => {
                    navigator.clipboard.writeText(cleanedMsisdns.join('\n'));
                    alert('Copied to clipboard!');
                  }}
                >
                  <Copy size={12} className="inline mr-2" />
                  COPY ALL TO CLIPBOARD
                </button>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '20px', border: '1px solid var(--glass-border)', padding: '24px', height: '220px', overflowY: 'auto' }}>
                <pre style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontFamily: 'JetBrains Mono, monospace', lineHeight: '1.6' }}>{cleanedMsisdns.join('\n')}</pre>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* STEP 6: AI CAMPAIGN STUDIO */}
        <motion.section
          className="glass-panel sequential-step"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          <div className="step-badge"><Wand2 size={20} /></div>
          <h2 className="panel-title">
            <span className="accent-line" style={{ background: 'var(--accent-rose)' }}></span>
            Step 6: AI Campaign Studio
            <span className="text-ghost ml-auto text-[10px]">Content & Flow Engineering</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="flex flex-col gap-6">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label flex items-center gap-2"><BarChart3 size={14} /> Campaign Strategy & Script Goals</label>
                <textarea
                  className="input-field"
                  rows="10"
                  placeholder="e.g. Create a holiday promotion for prepaid users with a 20% bonus offer. Keep it high energy..."
                  value={docText}
                  onChange={(e) => setDocText(e.target.value)}
                />
                <button className="btn-primary w-full mt-6" style={{ background: 'var(--accent-rose)' }} onClick={generateFlowFromDoc} disabled={flowLoading}>
                  <Wand2 size={18} className="mr-2 inline" />
                  {flowLoading ? 'THINKING...' : 'GENERATE AI CAMPAIGN PROMPT'}
                </button>
                {flowError && <div className="mt-4 p-4 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-xs font-bold leading-relaxed">{flowError}</div>}
              </div>
            </div>
            <div className="flex flex-col">
              <label className="label flex items-center gap-2"><Layout size={14} /> Design Visualization</label>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '28px', border: '1px solid var(--glass-border)', padding: '32px', minHeight: '380px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!mermaidFlow && (
                  <div className="flex flex-col items-center gap-4 text-slate-500">
                    <Activity size={48} strokeWidth={1} className="opacity-20 translate-y-2 animate-bounce" />
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Awaiting Campaign Design...</span>
                  </div>
                )}
                {mermaidFlow && (
                  <div className="mermaid-box w-full h-full shadow-2xl">
                    <MermaidViewer chart={mermaidFlow} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Performance Overview */}
        <motion.section
          style={{ gridColumn: '1 / -1', marginTop: '60px' }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1 }
          }}
        >
          <PerformanceReport />
        </motion.section>
      </motion.div>

      {/* MODAL OVERLAY */}
      {isScheduleModalOpen && (
        <div className="modal-overlay" onClick={() => setIsScheduleModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Schedule Campaign</h2>
              <p className="text-xs text-slate-400 mt-2">Configure execution parameters for your finalized base</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
              <div className="form-group">
                <label className="form-label">OBD Project Name</label>
                <input type="text" className="form-input" placeholder="e.g. Summer_2024" value={scheduleData.obd_name} onChange={(e) => setScheduleData({ ...scheduleData, obd_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Voice/Flow Logic</label>
                <select className="form-input form-select" value={scheduleData.flow_name} onChange={(e) => setScheduleData({ ...scheduleData, flow_name: e.target.value })}>
                  <option value="">Select flow...</option>
                  <option value="Promo Flow 1">Standard Promo</option>
                  <option value="Holiday Special">Holiday Special</option>
                  {mermaidFlow && <option value="AI Generated Flow">AI Generated Flow</option>}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">MSC Connection IP</label>
                <input type="text" className="form-input" placeholder="0.0.0.0" value={scheduleData.msc_ip} onChange={(e) => setScheduleData({ ...scheduleData, msc_ip: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">CLI Masking</label>
                <input type="text" className="form-input" placeholder="123456" value={scheduleData.cli} onChange={(e) => setScheduleData({ ...scheduleData, cli: e.target.value })} />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsScheduleModalOpen(false)}>Cancel</button>
              <button className="btn-primary"
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_BASE}/schedule-promotion`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(scheduleData)
                    });
                    if (res.ok) {
                      alert('Broadcast Scheduled Successfully! 🚀');
                      setIsScheduleModalOpen(false);
                    } else {
                      const errData = await res.json();
                      alert(`Failed to schedule: ${errData.detail || 'Unknown error'}`);
                    }
                  } catch (err) {
                    alert('Network Error.');
                  }
                }}
              >
                Launch Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
