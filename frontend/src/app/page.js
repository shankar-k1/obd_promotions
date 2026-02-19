"use client";
import React, { useState, useEffect } from 'react';
import PerformanceReport from '@/components/PerformanceReport';
import MermaidViewer from '@/components/MermaidViewer';
import FileUploadZone from '@/components/FileUploadZone';

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
    fetch('http://localhost:8000/db-stats')
      .then(res => res.json())
      .then(data => setDbStats(data))
      .catch(() => setDbStats({ dnd_count: 'N/A', sub_count: 'N/A', unsub_count: 'N/A' }));
  }, []);

  const [sessionStats, setSessionStats] = useState({ dnd: 0, sub: 0, unsub: 0, operator: 0 });

  const performScrub = async (listToScrub) => {
    const targetList = listToScrub || msisdnList;
    if (!targetList.length) return;

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/scrub', {
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
    } catch (err) {
      console.error("Scrubbing failed", err);
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
      const res = await fetch('http://localhost:8000/generate-flow-from-doc', {
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

      <div className="sequential-flow-container">
        {/* STEP 1: DATA INJECTION */}
        <section className="glass-panel sequential-step">
          <div className="step-badge">1</div>
          <h2 className="panel-title">
            <span className="accent-line" style={{ background: 'var(--accent-cyan)' }}></span>
            Step 1: Data Injection
          </h2>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <FileUploadZone onUploadSuccess={handleFileUpload} />
          </div>
        </section>

        {/* STEP 2: DATABASE ANALYTICS */}
        <section className="glass-panel sequential-step">
          <div className="step-badge">2</div>
          <h2 className="panel-title">
            <span className="accent-line" style={{ background: 'var(--accent-emerald)' }}></span>
            Step 2: Database Analytics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-4 bg-white-5 rounded-2xl border-white-5">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Global DND List</span>
              <span className="text-lg font-bold text-emerald-400">
                {dbStats.dnd_count === null ? '...' : dbStats.dnd_count.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white-5 rounded-2xl border-white-5">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Subscriptions</span>
              <span className="text-lg font-bold text-cyan-400">
                {dbStats.sub_count === null ? '...' : dbStats.sub_count.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white-5 rounded-2xl border-white-5">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Unsubscribe Archive</span>
              <span className="text-lg font-bold text-rose-400">
                {dbStats.unsub_count === null ? '...' : dbStats.unsub_count.toLocaleString()}
              </span>
            </div>
          </div>
        </section>

        {/* STEP 3: VERIFICATION INTELLIGENCE */}
        <section className="glass-panel sequential-step">
          <div className="step-badge">3</div>
          <h2 className="panel-title">
            <span className="accent-line" style={{ background: 'var(--accent-purple)' }}></span>
            Step 3: Verification Intelligence
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="stat-card" style={{ display: 'flex', alignItems: 'center', padding: '30px' }}>
              <div className="stat-label" style={{ marginBottom: 0, color: 'var(--text-muted)' }}>Initial Lead Load</div>
              <div className="stat-value" style={{ color: 'var(--accent-blue)', fontSize: '2rem', marginLeft: 'auto' }}>
                {loading ? <span className="text-sm animate-pulse">Syncing...</span> : counts.total.toLocaleString()}
              </div>
            </div>
            <div className="stat-card" style={{ display: 'flex', alignItems: 'center', padding: '30px', borderLeft: '4px solid var(--accent-emerald)' }}>
              <div className="stat-label" style={{ marginBottom: 0, color: 'var(--text-muted)' }}>Verified Clean Base</div>
              <div className="stat-value" style={{ color: 'var(--accent-emerald)', fontSize: '2rem', marginLeft: 'auto' }}>
                {loading ? <span className="text-sm animate-pulse">Wait...</span> : counts.final.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card" style={{ display: 'flex', alignItems: 'center', padding: '16px 20px' }}>
              <div className="stat-label" style={{ marginBottom: 0, fontSize: '0.65rem', color: 'var(--accent-purple)' }}>DND Removals</div>
              <div className="stat-value" style={{ color: 'var(--text-main)', fontSize: '1.2rem', marginLeft: 'auto' }}>
                {sessionStats.dnd.toLocaleString()}
              </div>
            </div>
            <div className="stat-card" style={{ display: 'flex', alignItems: 'center', padding: '16px 20px' }}>
              <div className="stat-label" style={{ marginBottom: 0, fontSize: '0.65rem', color: 'var(--accent-cyan)' }}>Sub Removals</div>
              <div className="stat-value" style={{ color: 'var(--text-main)', fontSize: '1.2rem', marginLeft: 'auto' }}>
                {sessionStats.sub.toLocaleString()}
              </div>
            </div>
            <div className="stat-card" style={{ display: 'flex', alignItems: 'center', padding: '16px 20px' }}>
              <div className="stat-label" style={{ marginBottom: 0, fontSize: '0.65rem', color: '#f87171' }}>Unsub Blocks</div>
              <div className="stat-value" style={{ color: 'var(--text-main)', fontSize: '1.2rem', marginLeft: 'auto' }}>
                {sessionStats.unsub.toLocaleString()}
              </div>
            </div>
            <div className="stat-card" style={{ display: 'flex', alignItems: 'center', padding: '16px 20px' }}>
              <div className="stat-label" style={{ marginBottom: 0, fontSize: '0.65rem', color: 'var(--accent-blue)' }}>Operator Filter</div>
              <div className="stat-value" style={{ color: 'var(--text-main)', fontSize: '1.2rem', marginLeft: 'auto' }}>
                {sessionStats.operator.toLocaleString()}
              </div>
            </div>
          </div>
        </section>

        {/* STEP 4: SCRUBBING CONFIGURATION */}
        <section className="glass-panel sequential-step">
          <div className="step-badge">4</div>
          <h2 className="panel-title">
            <span className="accent-line" style={{ background: 'var(--accent-blue)' }}></span>
            Step 4: Scrubber Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.keys(scrubOptions).map((opt) => (
              <div key={opt} className="flex items-center gap-4 p-4 bg-white-5 rounded-2xl border-white-5 cursor-pointer hover:border-cyan-400 transition-all glow-hover"
                onClick={() => setScrubOptions(prev => ({ ...prev, [opt]: !prev[opt] }))}
              >
                <div className={`flex items-center justify-center rounded-full border-2 border-cyan-400 ${scrubOptions[opt] ? 'bg-cyan-400' : ''}`} style={{ width: '20px', height: '20px' }}>
                  {scrubOptions[opt] && <div className="rounded-full" style={{ width: '8px', height: '8px', background: '#05070a' }}></div>}
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  <span style={{ color: scrubOptions[opt] ? 'var(--accent-cyan)' : 'inherit' }}>{opt}</span> FILTER
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-8">
            <button className="btn-primary" style={{ flex: 2 }} onClick={handleRunScrub} disabled={loading}>{loading ? 'Processing...' : '🚀 Execute Scrubbing Pipeline'}</button>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={downloadCleanedBase} disabled={cleanedMsisdns.length === 0}>📥 Export Final Base</button>
            <button
              className="btn-primary"
              style={{ flex: 1, background: cleanedMsisdns.length > 0 ? 'var(--accent-cyan)' : 'var(--bg-glass)', opacity: cleanedMsisdns.length > 0 ? 1 : 0.4 }}
              onClick={() => setIsScheduleModalOpen(true)}
              disabled={cleanedMsisdns.length === 0}
            >
              🗓️ Schedule
            </button>
          </div>
        </section>

        {/* STEP 5: VERIFIED RESULTS TERMINAL */}
        {cleanedMsisdns.length > 0 && (
          <section className="glass-panel sequential-step">
            <div className="step-badge">5</div>
            <h2 className="panel-title">
              <span className="accent-line" style={{ background: 'var(--accent-emerald)' }}></span>
              Step 5: Verified Results Terminal
            </h2>
            <div className="flex justify-between items-center mb-3">
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Session MSISDN Output</div>
              <button
                style={{ background: 'var(--accent-emerald)', color: '#05070a', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '6px' }}
                onClick={() => {
                  navigator.clipboard.writeText(cleanedMsisdns.join('\n'));
                  alert('Copied to clipboard!');
                }}
              >
                COPY ALL
              </button>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid var(--glass-border)', padding: '16px', height: '180px', overflowY: 'auto' }}>
              <pre style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontFamily: 'JetBrains Mono, monospace', lineHeight: '1.5' }}>{cleanedMsisdns.join('\n')}</pre>
            </div>
          </section>
        )}

        {/* STEP 6: AI CAMPAIGN STUDIO */}
        <section className="glass-panel sequential-step">
          <div className="step-badge">6</div>
          <h2 className="panel-title">
            <span className="accent-line" style={{ background: 'var(--accent-rose)' }}></span>
            Step 6: AI Campaign Studio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Script & Flow Strategy</label>
              <textarea
                className="input-field"
                rows="8"
                placeholder="Describe your promotion goals..."
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
              />
              <button className="btn-primary w-full mt-4" onClick={generateFlowFromDoc} disabled={flowLoading}>
                {flowLoading ? '🧠 Engineering Flow...' : '✨ Generate AI Prompt Flow'}
              </button>
              {flowError && <div style={{ color: '#f87171', marginTop: '10px', fontSize: '0.8rem' }}>{flowError}</div>}
            </div>
            <div>
              <label className="label">Live Design View</label>
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid var(--glass-border)', padding: '24px', minHeight: '340px' }}>
                {!mermaidFlow && <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '100px' }}>Waiting for campaign design...</div>}
                {mermaidFlow && (
                  <div className="mermaid-box">
                    <MermaidViewer chart={mermaidFlow} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Performance Overview */}
        <section style={{ gridColumn: '1 / -1', marginTop: '40px' }}>
          <PerformanceReport />
        </section>
      </div>

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
                    const res = await fetch('http://localhost:8000/schedule-promotion', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(scheduleData)
                    });
                    if (res.ok) {
                      alert('Broadcast Scheduled Successfully! 🚀');
                      setIsScheduleModalOpen(false);
                    } else {
                      alert('Failed to schedule. Check server logs.');
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
