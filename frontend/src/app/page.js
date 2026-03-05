"use client";
import React, { useState, useEffect } from 'react';
import PerformanceReport from '@/components/PerformanceReport';
import MermaidViewer from '@/components/MermaidViewer';
import FileUploadZone from '@/components/FileUploadZone';
import { motion, AnimatePresence } from 'framer-motion';
import CampaignFlowVisualizer from './components/CampaignFlowVisualizer';
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
  Activity,
  Menu,
  History,
  Lock,
  User,
  LogOut,
  Settings,
  X,
  Users,
  PieChart,
  Palette,
  ChevronDown,
  Phone,
  PhoneOutgoing
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
  const [selectedAccount, setSelectedAccount] = useState('');
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
  const [reactFlowData, setReactFlowData] = useState({ nodes: [], edges: [] });
  const [flowLoading, setFlowLoading] = useState(false);
  const [flowError, setFlowError] = useState('');

  const [msisdnList, setMsisdnList] = useState([]);
  const [cleanedMsisdns, setCleanedMsisdns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [xmlContent, setXmlContent] = useState('');
  const [studioMode, setStudioMode] = useState('strategy'); // 'strategy' or 'xml'
  const [pdfLoading, setPdfLoading] = useState(false);
  const [dbStats, setDbStats] = useState({ dnd_count: null, sub_count: null, unsub_count: null });
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [apiColor, setApiColor] = useState('var(--text-dim)');
  const [scheduleData, setScheduleData] = useState({
    obd_name: '',
    flow_name: '',
    msc_ip: '',
    cli: ''
  });

  // VOIP State
  const [voipMsisdn, setVoipMsisdn] = useState('');
  const [voipShortcode, setVoipShortcode] = useState('5566');
  const [voipScript, setVoipScript] = useState('Hello, this is a test call from the Outsmart Global OBD platform. Have a great day!');
  const [voipLoading, setVoipLoading] = useState(false);
  const [voipResult, setVoipResult] = useState(null);
  const [activeVirtualCall, setActiveVirtualCall] = useState(null);

  // Theme State & Persistence
  const [theme, setTheme] = useState('dark');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('landing');
  const [loginCreds, setLoginCreds] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('obd_token');
    if (token) setIsAuthenticated(true);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginCreds)
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('obd_token', data.token);
        setIsAuthenticated(true);
      } else {
        const err = await res.json();
        setLoginError(err.detail || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Network Error. Is backend running?');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoginError('');
    setSuccessMsg('');
    setIsLoggingIn(true);
    try {
      const res = await fetch(`${API_BASE}/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginCreds)
      });
      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(data.message || 'User created. Please log in.');
        setIsCreatingUser(false);
      } else {
        const err = await res.json();
        setLoginError(err.detail || 'Failed to create user');
      }
    } catch (err) {
      setLoginError('Network Error. Is backend running?');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('obd_token');
    setIsAuthenticated(false);
    setCurrentView('landing');
  };


  useEffect(() => {
    const savedTheme = localStorage.getItem('obd-theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themes = ['dark', 'light', 'midnight', 'cyberpunk', 'forest', 'aurora'];
  const toggleTheme = () => {
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    setTheme(nextTheme);
    localStorage.setItem('obd-theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  useEffect(() => {
    fetch(`${API_BASE}/db-stats`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        setBackendStatus('Connected');
        setApiColor('var(--accent-emerald)');
        return res.json();
      })
      .then(data => setDbStats(data))
      .catch((err) => {
        console.error("Failed to fetch DB stats:", err);
        setBackendStatus('Disconnected');
        setApiColor('var(--accent-rose)');
        setDbStats({ dnd_count: `ERR`, sub_count: 'ERR', unsub_count: 'ERR' });
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

      if (res.status === 413) {
        throw new Error("File too large for cloud transfer. Please split your file into smaller chunks (e.g. 50k names).");
      }

      if (!res.ok) {
        const errInfo = await res.json();
        throw new Error(errInfo.detail || `Server returned ${res.status}`);
      }

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

  const handleLaunchCampaign = async () => {
    if (!cleanedMsisdns.length) {
      alert("No verified targets found. Please run the scrubbing pipeline first.");
      return;
    }

    const chunkSizeInput = prompt("Enter custom chunk size for campaign launch (e.g., 5000):", "5000");
    if (chunkSizeInput === null) return; // User cancelled

    const chunkSize = parseInt(chunkSizeInput);
    if (isNaN(chunkSize) || chunkSize <= 0) {
      alert("Invalid chunk size. Please enter a positive number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/launch-campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msisdn_list: cleanedMsisdns,
          chunk_size: chunkSize
        }),
      });

      if (!res.ok) {
        const errInfo = await res.json();
        throw new Error(errInfo.detail || `Server returned ${res.status}`);
      }

      const data = await res.json();
      alert(`CAMPAIGN LAUNCHED: ${data.message}`);
    } catch (err) {
      console.error("Launch failed", err);
      alert(`Launch Failed: ${err.message || 'Network Error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (data) => {
    console.log("Dashboard: Upload Success intercepted", data.total);
    setLoading(true);
    setSessionStats({ dnd: 0, sub: 0, unsub: 0, operator: 0 });
    setCleanedMsisdns([]);
    if (data.account) setSelectedAccount(data.account);

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

  const handleLogScrubEntry = async () => {
    try {
      const res = await fetch(`${API_BASE}/log-scrub-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_input: counts.total,
          final_count: counts.final,
          dnd_removed: sessionStats.dnd,
          sub_removed: sessionStats.sub,
          unsub_removed: sessionStats.unsub,
          operator_removed: sessionStats.operator,
          msisdn_list: cleanedMsisdns
        })
      });
      const data = await res.json();
      if (res.ok) alert(`SUCCESS: ${data.message}`);
      else alert(`ERROR: ${data.detail || 'Failed to log entry'}`);
    } catch (err) {
      alert(`Network Error: ${err.message}`);
    }
  };

  const fetchScrubHistory = async () => {
    setIsHistoryModalOpen(true);
    setIsMenuOpen(false);
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/scrub-history`);
      if (res.ok) {
        const data = await res.json();
        setHistoryData(data.data || []);
      } else {
        alert("Failed to fetch history.");
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const generateFlowFromDoc = async () => {
    if (studioMode === 'strategy' && !docText.trim()) return;
    if (studioMode === 'xml' && !xmlContent.trim()) return;

    setFlowLoading(true);
    setFlowError('');
    setReactFlowData({ nodes: [], edges: [] });
    try {
      let endpoint = `${API_BASE}/generate-flow-json`;
      let payload = {};

      if (studioMode === 'xml') {
        payload = { xml_content: xmlContent };
        endpoint = `${API_BASE}/generate-flow-json-from-xml`;
      } else {
        payload = { doc_text: docText };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Internal AI Error');
      }

      const data = await res.json();

      if (data.nodes && data.nodes.length > 0) {
        // Auto-layout logic (Simple grid/tree)
        const layoutedNodes = data.nodes.map((node, index) => ({
          ...node,
          position: { x: (index % 3) * 300 + 100, y: Math.floor(index / 3) * 200 + 50 }
        }));
        setReactFlowData({ nodes: layoutedNodes, edges: data.edges || [] });
      } else {
        setFlowError('The AI Architect could not detect logical nodes in this input. Try being more specific or simplifying the strategy.');
      }
    } catch (err) {
      console.error('Flow generation failed', err);
      setFlowError(`AI Architect Failed: ${err.message}`);
    } finally {
      setFlowLoading(false);
    }
  };

  const downloadFlowPdf = async () => {
    if (!mermaidFlow) return;
    setPdfLoading(true);
    try {
      const formData = new FormData();
      formData.append('mermaid_code', mermaidFlow);
      formData.append('campaign_name', scheduleData.obd_name || 'AI Campaign Studio');

      const res = await fetch(`${API_BASE}/export-flow-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Campaign_Flow_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        const err = await res.json();
        alert(`PDF Export Failed: ${err.detail || 'Server error'}`);
      }
    } catch (err) {
      console.error('PDF export failed', err);
      alert('Network error during PDF export.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleVoipCall = async (e) => {
    e.preventDefault();
    if (!voipMsisdn) return;
    setVoipLoading(true);
    setVoipResult(null);
    try {
      const res = await fetch(`${API_BASE}/trigger-voip-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msisdn: voipMsisdn,
          shortcode: voipShortcode,
          script: voipScript
        })
      });
      const data = await res.json();
      if (res.ok) {
        setVoipResult({ success: true, message: data.message });
      } else {
        setVoipResult({ success: false, message: data.detail || 'Call failed' });
      }
    } catch (err) {
      setVoipResult({ success: false, message: 'Network Error' });
    } finally {
      setVoipLoading(false);
    }
  };

  // Virtual VOIP Polling & Simulation
  useEffect(() => {
    let pollInterval;
    if (isAuthenticated) {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/voip/virtual-calls`);
          const data = await res.json();
          const calls = Object.entries(data.calls || {});
          if (calls.length > 0) {
            const [id, callData] = calls[0];
            setActiveVirtualCall({ id, ...callData });
          } else {
            setActiveVirtualCall(null);
          }
        } catch (err) {
          console.error("Signal Error:", err);
        }
      }, 2000);
    }
    return () => clearInterval(pollInterval);
  }, [isAuthenticated]);

  const handleVirtualRespond = async (action) => {
    if (!activeVirtualCall) return;
    const body = new FormData();
    body.append('call_id', activeVirtualCall.id);
    body.append('action', action);

    await fetch(`${API_BASE}/voip/virtual-respond`, {
      method: 'POST',
      body
    });

    if (action === 'answered') {
      // Simulate IVR Audio
      const msg = new SpeechSynthesisUtterance(activeVirtualCall.script);
      msg.rate = 0.9;
      window.speechSynthesis.speak(msg);
    } else if (action === 'hangup') {
      window.speechSynthesis.cancel();
      setActiveVirtualCall(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div
        className="flex items-center justify-center relative overflow-hidden"
        data-theme={theme}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          background: 'var(--bg-main)',
          fontFamily: "'Inter', sans-serif",
          overflow: 'auto',
          zIndex: 9999
        }}
      >
        {/* Environmental Glows - Theme Aware */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-[0.1] blur-[120px]" style={{ background: 'var(--accent-cyan)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full opacity-[0.05] blur-[100px]" style={{ background: 'var(--accent-purple)' }} />

        {/* Theme Dropdown for Login */}
        <div style={{
          position: 'absolute',
          top: '40px',
          right: '40px',
          zIndex: 10000
        }}>
          <div className="relative">
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="flex items-center gap-3 px-5 h-12 rounded-2xl glass-action shadow-xl hover:scale-105 transition-all"
              style={{ background: 'var(--bg-glass-heavy)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', cursor: 'pointer' }}
            >
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Theme</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">{theme}</span>
              </div>
              <ChevronDown size={14} className={`ml-2 transition-transform ${isThemeMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isThemeMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 p-3 rounded-2xl glass-panel shadow-2xl min-w-[200px]"
                  style={{ background: 'var(--bg-glass-heavy)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(40px)' }}
                >
                  <div className="grid grid-cols-1 gap-2">
                    {themes.map(t => (
                      <button
                        key={t}
                        onClick={() => {
                          setTheme(t);
                          localStorage.setItem('obd-theme', t);
                          document.documentElement.setAttribute('data-theme', t);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${theme === t ? 'bg-emerald-500/10 border-emerald-500/20' : 'hover:bg-white-5'}`}
                        style={{ border: '1px solid transparent', cursor: 'pointer', textAlign: 'left' }}
                      >
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: t === 'dark' ? '#0f172a' : t === 'light' ? '#fff' : t === 'midnight' ? '#1e1b4b' : t === 'cyberpunk' ? '#ff00ff' : t === 'forest' ? '#10b981' : '#a855f7',
                          boxShadow: '0 0 10px rgba(0,0,0,0.1)'
                        }} />
                        <span
                          className="text-[11px] font-bold uppercase tracking-wider"
                          style={{ color: theme === t ? 'var(--accent-emerald)' : 'var(--text-main)' }}
                        >
                          {theme === t ? `• ${t}` : t}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-10"
          style={{
            width: '100%',
            maxWidth: '420px',
            background: 'var(--bg-main)',
            borderRadius: '40px',
            boxShadow: theme === 'light'
              ? '15px 15px 30px #d1d9e6, -15px -15px 30px #ffffff'
              : '15px 15px 30px rgba(0,0,0,0.4), -15px -15px 30px rgba(255,255,255,0.02)',
            overflow: 'hidden',
            margin: '20px',
            border: '1px solid var(--glass-border)'
          }}
        >
          {/* Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-emerald) 0%, #059669 100%)',
            padding: '40px 20px',
            textAlign: 'center',
            boxShadow: 'inset 0 -5px 15px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{
              color: 'white',
              fontSize: '2.2rem',
              fontWeight: '800',
              letterSpacing: '-0.02em',
              margin: 0,
              textShadow: '0 2px 4px rgba(247, 247, 247, 0.5)'
            }}>
              {isCreatingUser ? 'Admin Setup' : 'Sign In'}
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.813rem',
              marginTop: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: '600'
            }}>
              {isCreatingUser ? 'Create new admin credentials' : 'Authenticate to continue'}
            </p>
          </div>

          {/* Form Section */}
          <div style={{ padding: '40px' }}>
            <form onSubmit={isCreatingUser ? handleCreateUser : handleLogin} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div style={{
                  position: 'relative',
                  background: 'var(--bg-main)',
                  borderRadius: '20px',
                  boxShadow: theme === 'light'
                    ? 'inset 6px 6px 12px #d1d9e6, inset -6px -6px 12px #ffffff'
                    : 'inset 6px 6px 12px rgba(0,0,0,0.5), inset -6px -6px 12px rgba(255,255,255,0.03)',
                  padding: '5px'
                }}>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      padding: '15px 20px',
                      fontSize: '1rem',
                      color: 'var(--text-main)',
                      outline: 'none',
                      fontWeight: '500'
                    }}
                    placeholder="Username"
                    value={loginCreds.username}
                    onChange={(e) => setLoginCreds({ ...loginCreds, username: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div style={{
                  position: 'relative',
                  background: 'var(--bg-main)',
                  borderRadius: '20px',
                  boxShadow: theme === 'light'
                    ? 'inset 6px 6px 12px #d1d9e6, inset -6px -6px 12px #ffffff'
                    : 'inset 6px 6px 12px rgba(0,0,0,0.5), inset -6px -6px 12px rgba(255,255,255,0.03)',
                  padding: '5px'
                }}>
                  <input
                    type="password"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      padding: '15px 20px',
                      fontSize: '1rem',
                      color: 'var(--text-main)',
                      outline: 'none',
                      fontWeight: '500'
                    }}
                    placeholder="Password"
                    value={loginCreds.password}
                    onChange={(e) => setLoginCreds({ ...loginCreds, password: e.target.value })}
                    required
                  />
                </div>
                <div style={{ textAlign: 'right', marginTop: '8px' }}>
                  <span
                    onClick={() => {
                      setIsCreatingUser(!isCreatingUser);
                      setLoginError('');
                      setSuccessMsg('');
                    }}
                    style={{ fontSize: '0.75rem', color: 'var(--text-dim)', cursor: 'pointer', fontWeight: '500' }}
                  >
                    {isCreatingUser ? 'Cancel (Back to Login)' : 'Forgot Username/Password? Create New'}
                  </span>
                </div>
              </div>

              {successMsg && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  color: 'var(--accent-emerald)',
                  padding: '12px',
                  borderRadius: '15px',
                  fontSize: '0.8rem',
                  textAlign: 'center',
                  fontWeight: '600'
                }}>
                  {successMsg}
                </div>
              )}

              {loginError && (
                <div style={{
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                  color: 'var(--accent-rose)',
                  padding: '12px',
                  borderRadius: '15px',
                  fontSize: '0.8rem',
                  textAlign: 'center',
                  fontWeight: '600'
                }}>
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                style={{
                  background: isCreatingUser
                    ? 'linear-gradient(135deg, var(--accent-purple) 0%, #7c3aed 100%)'
                    : 'linear-gradient(135deg, var(--accent-emerald) 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '18px',
                  fontSize: '0.9rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                  opacity: isLoggingIn ? 0.7 : 1,
                  boxShadow: theme === 'light'
                    ? '6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff'
                    : '6px 6px 12px rgba(0,0,0,0.5), -6px -6px 12px rgba(255,255,255,0.03)'
                }}
              >
                {isLoggingIn
                  ? (isCreatingUser ? 'CREATING...' : 'AUTHENTICATING...')
                  : (isCreatingUser ? 'CREATE ADMIN USER' : 'ENTER AGENT DASHBOARD')}
              </button>

              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: '0 0 10px 0' }}>Don't have an account?</p>
                <span style={{ fontSize: '0.9rem', color: 'var(--accent-emerald)', fontWeight: '800', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sign Up Now</span>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  if (currentView === 'landing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden" data-theme={theme} style={{ background: 'var(--bg-main)' }}>

        {/* Theme Dropdown for Landing */}
        <div style={{
          position: 'absolute',
          top: '40px',
          left: '40px',
          zIndex: 10000
        }}>
          <div className="relative">
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="flex items-center gap-3 px-5 h-12 rounded-2xl glass-action shadow-xl hover:scale-105 transition-all text-left"
              style={{ background: 'var(--bg-glass-heavy)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', cursor: 'pointer' }}
            >
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Theme</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">{theme}</span>
              </div>
              <ChevronDown size={14} className={`ml-2 transition-transform ${isThemeMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isThemeMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute left-0 mt-3 p-3 rounded-2xl glass-panel shadow-2xl min-w-[200px]"
                  style={{ background: 'var(--bg-glass-heavy)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(40px)' }}
                >
                  <div className="grid grid-cols-1 gap-2">
                    {themes.map(t => (
                      <button
                        key={t}
                        onClick={() => {
                          setTheme(t);
                          localStorage.setItem('obd-theme', t);
                          document.documentElement.setAttribute('data-theme', t);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${theme === t ? 'bg-emerald-500/10 border-emerald-500/20' : 'hover:bg-white-5'}`}
                        style={{ border: '1px solid transparent', cursor: 'pointer', textAlign: 'left' }}
                      >
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: t === 'dark' ? '#0f172a' : t === 'light' ? '#fff' : t === 'midnight' ? '#1e1b4b' : t === 'cyberpunk' ? '#ff00ff' : t === 'forest' ? '#10b981' : '#a855f7',
                          boxShadow: '0 0 10px rgba(0,0,0,0.1)'
                        }} />
                        <span
                          className="text-[11px] font-bold uppercase tracking-wider"
                          style={{ color: theme === t ? 'var(--accent-emerald)' : 'var(--text-main)' }}
                        >
                          {theme === t ? `• ${t}` : t}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div style={{ position: 'absolute', top: '40px', right: '40px' }}>
          <button onClick={handleLogout} className="flex items-center gap-2 transition-all font-bold tracking-widest uppercase" style={{ color: 'var(--text-dim)', fontSize: '0.75rem', cursor: 'pointer', background: 'transparent', border: 'none' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center" style={{ marginBottom: '64px', marginTop: '40px' }}>
          <h1 className="font-light tracking-widest mb-4" style={{ fontSize: '2.5rem', color: 'var(--text-main)', margin: '0 0 16px 0' }}>OBD <span className="font-bold" style={{ color: 'var(--accent-cyan)' }}>SERVICES</span></h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)', maxWidth: '450px', margin: '0 auto' }}>Select a module to continue to the administration dashboard and configure your automated workflows.</p>
        </motion.div>

        <div className="flex flex-wrap justify-center" style={{ gap: '20px', width: '100%', maxWidth: '1200px', padding: '0 20px' }}>
          <motion.div whileHover={{ y: -5 }} onClick={() => setCurrentView('dashboard')} className="glass-panel flex flex-col items-center justify-center transition-all" style={{ padding: '32px', cursor: 'pointer', flex: 1, minWidth: '0', height: '280px' }}>
            <div className="p-4 rounded-full transition-all flex items-center justify-center" style={{ background: 'rgba(34, 211, 238, 0.1)', color: 'var(--accent-cyan)', marginBottom: '24px', width: '64px', height: '64px' }}>
              <Database size={32} strokeWidth={1.5} />
            </div>
            <span className="font-bold tracking-wide text-center uppercase text-sm" style={{ color: 'var(--text-main)' }}>Scrubber Pipeline</span>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="glass-panel flex flex-col items-center justify-center transition-all" style={{ padding: '32px', cursor: 'not-allowed', opacity: 0.5, flex: 1, minWidth: '0', height: '280px' }}>
            <div className="p-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-dim)', marginBottom: '24px', width: '64px', height: '64px' }}>
              <BarChart3 size={32} strokeWidth={1.5} />
            </div>
            <span className="font-bold tracking-wide text-center uppercase text-sm" style={{ color: 'var(--text-dim)' }}>Analytics Engine</span>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="glass-panel flex flex-col items-center justify-center transition-all" style={{ padding: '32px', cursor: 'not-allowed', opacity: 0.5, flex: 1, minWidth: '0', height: '280px' }}>
            <div className="p-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-dim)', marginBottom: '24px', width: '64px', height: '64px' }}>
              <Users size={32} strokeWidth={1.5} />
            </div>
            <span className="font-bold tracking-wide text-center uppercase text-sm" style={{ color: 'var(--text-dim)' }}>User Management</span>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="glass-panel flex flex-col items-center justify-center transition-all" style={{ padding: '32px', cursor: 'not-allowed', opacity: 0.5, flex: 1, minWidth: '0', height: '280px' }}>
            <div className="p-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-dim)', marginBottom: '24px', width: '64px', height: '64px' }}>
              <Settings size={32} strokeWidth={1.5} />
            </div>
            <span className="font-bold tracking-wide text-center uppercase text-sm" style={{ color: 'var(--text-dim)' }}>System Config</span>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container" data-theme={theme}>

      <header>
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setCurrentView('landing')}>
          <h1 className="logo-text transition-all group-hover:opacity-80" style={{
            background: theme === 'light'
              ? 'linear-gradient(135deg, var(--text-main) 0%, var(--accent-cyan) 50%, var(--accent-emerald) 100%)'
              : 'linear-gradient(135deg, #fff 0%, var(--accent-cyan) 50%, var(--accent-blue) 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '1.8rem',
            filter: 'none'
          }}>
            OBD OUTSMART
          </h1>
          <div className="rounded-full border hidden md:block" style={{ background: 'var(--bg-glass)', borderColor: 'var(--glass-border)', color: 'var(--accent-cyan)', padding: '4px 12px', fontSize: '0.688rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            Scrubber Pipeline
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-4 h-11 rounded-xl bg-white-5 border border-white-10 shadow-lg transition-all">
            <div
              className="animate-pulse"
              style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: apiColor, boxShadow: `0 0 12px ${apiColor}` }}
            ></div>
            <div className="flex flex-col items-start" style={{ lineHeight: 1 }}>
              <span style={{ fontSize: '0.625rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.4, color: 'var(--text-main)', marginBottom: '2px' }}>Backend</span>
              <span style={{ fontSize: '0.688rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '800', color: apiColor }}>
                {backendStatus}
              </span>
            </div>
          </div>

          {/* System Hub */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-3 px-4 h-11 rounded-2xl glass-action group shadow-lg"
          >
            <div className="flex items-center justify-center rounded-lg transition-all duration-500 group-hover-rotate-90" style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.05)', color: 'var(--accent-cyan)' }}>
              <Menu size={18} />
            </div>
            <div className="flex flex-col items-start pr-2 text-left" style={{ lineHeight: 1.25 }}>
              <span style={{ fontSize: '0.688rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, color: 'var(--text-main)' }}>Menu</span>
            </div>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* BACKDROP */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(8px)',
                zIndex: 100
              }}
            />

            {/* SIDE DRAWER */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                height: '100vh',
                width: '380px',
                background: 'var(--bg-glass-heavy)',
                backdropFilter: 'blur(40px)',
                borderLeft: '1px solid var(--glass-border)',
                boxShadow: '-10px 0 40px rgba(255, 255, 255, 0.5)',
                zIndex: 101,
                display: 'flex',
                flexDirection: 'column',
                padding: '40px 0'
              }}
            >
              <div className="px-8 mb-12 flex justify-between items-center">
                <h2 className="text-ghost" style={{ fontSize: '0.8rem', letterSpacing: '0.3em' }}>System Menu</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col">
                <motion.div
                  whileHover={{ x: 8 }}
                  className="flex items-center gap-4 transition-all group"
                  style={{ padding: '24px 32px', cursor: 'pointer', borderLeft: '4px solid transparent' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.36)';
                    e.currentTarget.style.borderLeftColor = 'var(--accent-cyan)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderLeftColor = 'transparent';
                  }}
                  onClick={() => {
                    setCurrentView('landing');
                    setIsMenuOpen(false);
                  }}
                >
                  <Layout size={22} className="transition-all" style={{ color: 'var(--accent-cyan)' }} />
                  <div className="flex flex-col">
                    <span className="font-bold tracking-wider uppercase text-sm" style={{ color: 'var(--text-main)' }}>Modules Hub</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Switch system modules</span>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ x: 8 }}
                  className="flex items-center gap-4 transition-all group"
                  style={{ padding: '24px 32px', cursor: 'pointer', borderLeft: '4px solid transparent' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderLeftColor = 'var(--accent-emerald)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderLeftColor = 'transparent';
                  }}
                  onClick={() => {
                    fetchScrubHistory();
                    setIsMenuOpen(false);
                  }}
                >
                  <History size={22} className="transition-all" style={{ color: 'var(--accent-emerald)' }} />
                  <div className="flex flex-col">
                    <span className="font-bold tracking-wider uppercase text-sm" style={{ color: 'var(--text-main)' }}>Scrub History</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>View past execution logs</span>
                  </div>
                </motion.div>

                {/* DESIGN STUDIO */}
                <div className="mt-4 px-8 pt-8 border-t border-white-5">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] block mb-6" style={{ color: 'var(--accent-cyan)' }}>Design Studio</span>
                  <div className="grid grid-cols-2 gap-4 pb-8">
                    {themes.map((t) => (
                      <motion.button
                        key={t}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setTheme(t);
                          localStorage.setItem('obd-theme', t);
                          document.documentElement.setAttribute('data-theme', t);
                        }}
                        className={`group flex flex-col items-center justify-center p-4 rounded-3xl border transition-all duration-500 overflow-hidden relative ${theme === t
                          ? 'border-cyan-400 bg-cyan-400/5 shadow-[0_0_30px_rgba(34,211,238,0.15)]'
                          : 'border-white-5 bg-white-5 hover:border-white-20'
                          }`}
                      >
                        {/* THEME SWATCH */}
                        <div className="w-12 h-12 rounded-2xl mb-3 flex items-center justify-center relative overflow-hidden shadow-2xl border border-white-10 group-hover:rotate-6 transition-transform">
                          <div className="absolute inset-0" style={{
                            background: t === 'dark' ? 'linear-gradient(135deg, #020617 0%, #172554 100%)' :
                              t === 'light' ? 'linear-gradient(135deg, #fff 0%, #dbeafe 100%)' :
                                t === 'midnight' ? 'linear-gradient(135deg, #050510 0%, #312e81 100%)' :
                                  t === 'cyberpunk' ? 'linear-gradient(135deg, #0a011a 0%, #701a75 100%)' :
                                    t === 'forest' ? 'linear-gradient(135deg, #061006 0%, #064e3b 100%)' :
                                      'linear-gradient(135deg, #1a1a61ff 0%, #4c1d95 100%)'
                          }} />

                          {/* Accent preview dots */}
                          <div className="relative z-10 flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: t === 'cyberpunk' ? '#ff00ff' : 'var(--accent-cyan)' }} />
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: t === 'forest' ? '#10b981' : 'var(--accent-blue)' }} />
                          </div>

                          {theme === t && (
                            <motion.div
                              layoutId="active-indicator"
                              className="absolute inset-0 border-2 border-cyan-400 z-20 rounded-2xl"
                            />
                          )}
                        </div>

                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-main)' }}>{t}</span>
                          {theme === t && (
                            <span className="text-[7px] font-bold text-cyan-400 uppercase tracking-tighter">Active</span>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <motion.div
                  whileHover={{ x: 8 }}
                  className="flex items-center gap-4 transition-all group"
                  style={{ padding: '24px 32px', cursor: 'pointer', borderLeft: '4px solid transparent', marginTop: 'auto' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(244, 63, 94, 0.05)';
                    e.currentTarget.style.borderLeftColor = 'var(--accent-rose)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderLeftColor = 'transparent';
                  }}
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                >
                  <LogOut size={22} className="transition-all" style={{ color: 'var(--accent-rose)' }} />
                  <div className="flex flex-col">
                    <span className="font-bold tracking-wider uppercase text-sm" style={{ color: 'var(--text-main)' }}>Secure Logout</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Terminate current session</span>
                  </div>
                </motion.div>
              </div>

              <div className="mt-auto px-8 py-8 border-t border-white-5">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 font-black text-sm">AD</div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white uppercase tracking-widest">Admin User</span>
                    <span className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-tighter">System Online</span>
                  </div>
                </div>
                <div className="flex justify-between items-center opacity-40">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em]">OBD OUTSMART v2.0</span>
                  <span className="text-[9px] font-bold uppercase tracking-tighter">© 2026 PR</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div
        key="dashboard-flow"
        className="sequential-flow-container"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
      >
        {/* STEP 1: DATA INJECTION */}
        <motion.section
          className="glass-panel sequential-step"
          style={{
            padding: '50px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.03)',
            border: '1px solid var(--glass-border)',
            width: '100%',
            minHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
            margin: '0 auto 40px auto'
          }}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          <div className="step-badge"><UploadCloud size={20} /></div>
          <h2 className="panel-title">
            <span className="accent-line" style={{ background: 'var(--accent-cyan)' }}></span>
            Step 1: Data Injection
            <span className="text-ghost" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>Lead Base Upload</span>
          </h2>
          {selectedAccount && (
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active Account:</span>
              <span style={{ fontSize: '0.813rem', fontWeight: '700', color: 'var(--accent-cyan)', textTransform: 'capitalize', padding: '4px 12px', borderRadius: '20px', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}>{selectedAccount}</span>
            </div>
          )}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileUploadZone onUploadSuccess={handleFileUpload} />
          </div>
        </motion.section>

        {/* STEP 2: DATABASE ANALYTICS */}
        <motion.section
          className="glass-panel sequential-step"
          style={{
            padding: '40px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.03)',
            border: '1px solid var(--glass-border)',
            width: '100%',
            minHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
            margin: '0 auto 40px auto'
          }}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          <div className="step-badge"><Database size={20} /></div>
          <h2 className="panel-title">
            <span className="accent-line" style={{ background: 'var(--accent-emerald)' }}></span>
            Step 2: Database Analytics
            <span className="text-ghost" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>Global Cross-Reference</span>
          </h2>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', justifyContent: 'center' }}>
            {/* ROW 1: DND & SUB */}
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', flex: 1, marginBottom: 0 }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)', display: 'flex' }}>
                  <ShieldCheck size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.688rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>Global DND</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent-emerald)', lineHeight: 1 }}>
                    {dbStats.dnd_count === null ? '...' : dbStats.dnd_count.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', flex: 1, marginBottom: 0 }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(34, 211, 238, 0.1)', color: 'var(--accent-cyan)', display: 'flex' }}>
                  <Smartphone size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.688rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>Subscriptions</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent-cyan)', lineHeight: 1 }}>
                    {dbStats.sub_count === null ? '...' : dbStats.sub_count.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            {/* ROW 2: UNSUB */}
            <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', width: '100%', marginBottom: 0 }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(244, 63, 92, 0.1)', color: 'var(--accent-rose)', display: 'flex' }}>
                <XCircle size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.688rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>Unsubscribe Archive</span>
                <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent-rose)', lineHeight: 1 }}>
                  {dbStats.unsub_count === null ? '...' : dbStats.unsub_count.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* STEP 3: VERIFICATION INTELLIGENCE */}
        <motion.section
          className="glass-panel sequential-step"
          style={{
            padding: '40px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.03)',
            border: '1px solid var(--glass-border)',
            width: '100%',
            minHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
            margin: '0 auto 40px auto'
          }}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          <div className="step-badge"><ShieldCheck size={20} /></div>
          <h2 className="panel-title">
            <span className="accent-line" style={{ background: 'var(--accent-purple)' }}></span>
            Step 3: Verification Intelligence
            <span className="text-ghost" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>Scrubbing Outcome Preview</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="stat-card" style={{ display: 'flex', alignItems: 'center', padding: '16px 24px' }}>
              <div className="flex flex-col">
                <div className="stat-label" style={{ marginBottom: 2, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Initial Lead Load</div>
                <div style={{ fontSize: '0.688rem', color: 'var(--text-dim)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '-0.025em' }}><Info size={10} /> Total volume</div>
              </div>
              <div className="stat-value" style={{ color: 'var(--accent-blue)', fontSize: '1.8rem', marginLeft: 'auto' }}>
                {loading ? <span style={{ fontSize: '0.75rem' }} className="animate-pulse">Syncing...</span> : counts.total.toLocaleString()}
              </div>
            </div>
            <div className="stat-card" style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderLeft: '4px solid var(--accent-emerald)' }}>
              <div className="flex flex-col">
                <div className="stat-label" style={{ marginBottom: 2, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Verified Clean Base</div>
                <div style={{ fontSize: '0.688rem', color: 'var(--accent-emerald)', opacity: 0.6, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '-0.025em' }}><CheckCircle2 size={10} /> Ready</div>
              </div>
              <div className="stat-value" style={{ color: 'var(--accent-emerald)', fontSize: '1.8rem', marginLeft: 'auto' }}>
                {loading ? <span style={{ fontSize: '0.75rem' }} className="animate-pulse">Wait...</span> : counts.final.toLocaleString()}
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
          style={{
            padding: '40px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.03)',
            border: '1px solid var(--glass-border)',
            width: '100%',
            minHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
            margin: '0 auto 40px auto',
            position: 'relative',
            overflow: 'hidden',
          }}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          <div className="step-badge"><Zap size={20} /></div>
          <h2 className="panel-title">
            <span className="accent-line" style={{ background: 'var(--accent-blue)' }}></span>
            Step 4: Scrubber Configuration
            <span className="text-ghost" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>Filter Logic & Execution</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:px-8">
            {Object.keys(scrubOptions).map((opt) => (
              <div key={opt} className="glass-card-interactive flex items-center gap-4 p-5 hover:bg-white-5 transition-all shadow-md"
                onClick={() => setScrubOptions(prev => ({ ...prev, [opt]: !prev[opt] }))}
              >
                <div className="flex items-center justify-center rounded-lg transition-all" style={{ width: '22px', height: '22px', borderWidth: '2px', borderStyle: 'solid', borderColor: scrubOptions[opt] ? 'var(--accent-cyan)' : 'var(--glass-border)', background: scrubOptions[opt] ? 'var(--accent-cyan)' : 'var(--bg-glass)' }}>
                  {scrubOptions[opt] && <CheckCircle2 size={14} strokeWidth={3} style={{ color: '#020617' }} />}
                </div>
                <div className="flex flex-col">
                  <span style={{ fontSize: '0.813rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-main)' }}>
                    <span style={{ color: scrubOptions[opt] ? 'var(--accent-cyan)' : 'inherit' }}>{opt}</span> FILTER
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
                    {opt === 'dnd' ? 'Remove numbers registered in National DND Registry' :
                      opt === 'sub' ? 'Remove users already subscribed to this service' :
                        opt === 'unsub' ? 'Remove users who explicitly opted out previously' :
                          'Filter targets by matching carrier/operator prefixes'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-row flex-wrap gap-3 mt-6" style={{ position: 'relative' }}>
            <button
              className="btn-primary glow-hover"
              style={{ padding: '12px 16px', fontSize: '0.813rem', flex: 2, minWidth: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', position: 'relative' }}
              onClick={handleRunScrub}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  SCRUBBING PIPELINE...
                </>
              ) : (
                <>
                  <Zap size={14} fill="currentColor" />
                  EXECUTE SCRUBBING PIPELINE
                </>
              )}
            </button>
            <button
              className="btn-secondary glow-hover"
              style={{ padding: '10px 16px', fontSize: '0.75rem', flex: 1, minWidth: '120px', cursor: 'pointer' }}
              onClick={downloadCleanedBase}
              disabled={cleanedMsisdns.length === 0}
            >
              <Download size={14} />
              EXPORT CSV
            </button>
            <button
              className="btn-secondary glow-hover"
              style={{ padding: '10px 16px', fontSize: '0.75rem', flex: 1, minWidth: '140px', cursor: 'pointer' }}
              onClick={handleLogScrubEntry}
              disabled={cleanedMsisdns.length === 0}
            >
              <Database size={14} />
              LOG ENTRY
            </button>
            <button
              className="btn-secondary glow-hover"
              style={{ padding: '10px 16px', fontSize: '0.75rem', flex: 1, minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: cleanedMsisdns.length > 0 ? 'var(--accent-cyan)' : 'inherit', borderColor: cleanedMsisdns.length > 0 ? 'var(--accent-cyan)' : 'var(--glass-border)', cursor: 'pointer' }}
              onClick={() => setIsScheduleModalOpen(true)}
              disabled={cleanedMsisdns.length === 0}
            >
              <Calendar size={14} />
              SCHEDULE
            </button>
          </div>

          {/* SCRUBBING FULL-SECTION OVERLAY SPINNER */}
          {loading && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(6px)',
              borderRadius: '32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              gap: '20px',
            }}>
              <div style={{ position: 'relative', width: '64px', height: '64px' }}>
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: '3px solid rgba(34,211,238,0.15)'
                }} />
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: '3px solid transparent',
                  borderTopColor: 'var(--accent-cyan)',
                  borderRightColor: 'var(--accent-cyan)',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <Zap size={24} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: 'var(--accent-cyan)' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.813rem', fontWeight: '700', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>Scrubbing Pipeline Active</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Cross-referencing {counts.total.toLocaleString()} records...</p>
              </div>
            </div>
          )}
        </motion.section>

        {/* STEP 5: VERIFIED RESULTS TERMINAL */}
        < AnimatePresence >
          {
            cleanedMsisdns.length > 0 && (
              <motion.section
                className="glass-panel sequential-step"
                style={{
                  padding: '10px',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.03)',
                  border: '1px solid var(--glass-border)',
                  width: '100%',
                  minHeight: '300px',
                  display: 'flex',
                  flexDirection: 'column',
                  margin: '0 auto 40px auto'
                }}
                initial={{ opacity: 0, height: 0, marginTop: -40 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="step-badge"><Layout size={20} /></div>
                <h2 className="panel-title">
                  <span className="accent-line" style={{ background: 'var(--accent-emerald)' }}></span>
                  Step 5: Verified Results Output
                  <span className="text-ghost" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>Real-time Terminal View</span>
                </h2>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)' }}></div>
                    <span style={{ fontSize: '0.688rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)' }}>Live Session MSISDN Feed</span>
                  </div>
                  <button
                    className="glass-pill transition-all"
                    style={{ fontSize: '0.688rem', fontWeight: '700', color: 'var(--accent-emerald)' }}
                    onClick={() => {
                      navigator.clipboard.writeText(cleanedMsisdns.join('\n'));
                      alert('Copied to clipboard!');
                    }}
                  >
                    <Copy size={12} style={{ display: 'inline', marginRight: '8px' }} />
                    COPY ALL TO CLIPBOARD
                  </button>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '20px', border: '1px solid var(--glass-border)', padding: '24px', height: '220px', overflowY: 'auto' }}>
                  <pre style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontFamily: 'JetBrains Mono, monospace', lineHeight: '1.6' }}>{cleanedMsisdns.join('\n')}</pre>
                </div>
              </motion.section>
            )
          }
        </AnimatePresence >

        {/* STEP 6: AI CAMPAIGN STUDIO */}
        <motion.section
          className="glass-panel sequential-step"
          style={{
            padding: '40px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.03)',
            border: '1px solid var(--glass-border)',
            width: '100%',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            margin: '0 auto 40px auto'
          }}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          <div className="step-badge"><Wand2 size={20} /></div>
          <h2 className="panel-title">
            <span className="accent-line" style={{ background: 'var(--accent-rose)' }}></span>
            Step 6: AI Campaign Studio
            <span className="text-ghost" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>Content & Flow Engineering</span>
          </h2>

          <div className="flex gap-4 mb-8">
            <button
              onClick={() => { setStudioMode('strategy'); setFlowError(''); }}
              className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all border-2 ${studioMode === 'strategy' ? 'bg-rose-500 text-white border-rose-400 shadow-[0_4px_25px_rgba(244,63,94,0.4)] scale-105' : 'bg-slate-800/50 text-slate-500 border-slate-700 hover:bg-slate-700/50 hover:text-slate-300'}`}
            >
              AI Strategy
            </button>
            <button
              onClick={() => { setStudioMode('xml'); setFlowError(''); }}
              className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all border-2 ${studioMode === 'xml' ? 'bg-cyan-500 text-white border-cyan-400 shadow-[0_4px_25px_rgba(34,211,238,0.4)] scale-105' : 'bg-slate-800/50 text-slate-500 border-slate-700 hover:bg-slate-700/50 hover:text-slate-300'}`}
            >
              XML Blueprint
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="flex flex-col gap-6">
              <div className="form-group" style={{ marginBottom: 0 }}>
                {studioMode === 'strategy' ? (
                  <>
                    <label className="label flex items-center gap-2"><BarChart3 size={14} /> Campaign Strategy & Script Goals</label>
                    <textarea
                      className="input-field"
                      rows="10"
                      placeholder="e.g. Create a holiday promotion for prepaid users with a 20% bonus offer. Keep it high energy..."
                      value={docText}
                      onChange={(e) => setDocText(e.target.value)}
                    />
                    {docText.includes('<') && docText.includes('>') && (
                      <div className="mt-2 p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                        <Info size={14} /> XML tags detected. Did you mean to use the <b>XML Blueprint</b> tab?
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <label className="label flex items-center gap-2"><Database size={14} /> XML Flow Configuration (Paste XML)</label>
                    <textarea
                      className="input-field font-mono text-[11px]"
                      rows="10"
                      style={{ lineHeight: '1.6' }}
                      placeholder='<campaign name="Loyalty Program">
  <node id="welcome">
    <prompt>Hello! You have 500 reward points.</prompt>
    <input type="dtmf">
      <option key="1" next="redeem"/>
      <option key="2" next="balance"/>
    </input>
  </node>
</campaign>'
                      value={xmlContent}
                      onChange={(e) => setXmlContent(e.target.value)}
                    />
                  </>
                )}

                <button className="btn-primary w-full mt-6" style={{ background: 'var(--accent-rose)', boxShadow: '0 4px 20px rgba(244,63,94,0.2)' }} onClick={generateFlowFromDoc} disabled={flowLoading}>
                  <Wand2 size={18} className="mr-2 inline" />
                  {flowLoading ? 'ENGINEERING FLOW...' : (studioMode === 'xml' ? 'GENERATE FROM XML' : 'GENERATE AI CAMPAIGN PROMPT')}
                </button>
                {flowError && <div className="mt-4 p-4 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-xs font-bold leading-relaxed">{flowError}</div>}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <label className="label flex items-center gap-2 m-0"><Layout size={14} /> Design Visualization</label>
                {mermaidFlow && (
                  <button
                    onClick={downloadFlowPdf}
                    disabled={pdfLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                  >
                    {pdfLoading ? <Activity size={14} className="animate-spin" /> : <Download size={14} />}
                    {pdfLoading ? 'EXPORTING...' : 'Download PDF'}
                  </button>
                )}
              </div>
              <div style={{ background: '#020617', borderRadius: '32px', border: '1px solid #1e293b', padding: '12px', minHeight: '500px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)' }}>
                {(!reactFlowData.nodes || reactFlowData.nodes.length === 0) && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-500">
                    <Activity size={48} strokeWidth={1} className="opacity-20 translate-y-2 animate-bounce" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Architecting Visual Flow...</span>
                  </div>
                )}
                {reactFlowData.nodes && reactFlowData.nodes.length > 0 && (
                  <CampaignFlowVisualizer
                    nodes={reactFlowData.nodes}
                    edges={reactFlowData.edges}
                  />
                )}
              </div>
            </div>
          </div>
        </motion.section >

        {/* STEP 7: VOIP COMMUNICATION CENTER */}
        <motion.section
          className="glass-panel sequential-step"
          style={{
            padding: '40px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.03)',
            border: '1px solid var(--glass-border)',
            width: '100%',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            margin: '0 auto 40px auto'
          }}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          <div className="step-badge"><Smartphone size={20} /></div>
          <h2 className="panel-title">
            <span className="accent-line" style={{ background: 'var(--accent-cyan)' }}></span>
            Step 7: Global VOIP Dialer
            <span className="text-ghost" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>Multi-Carrier Routing (Airtel, Jio, MTN, etc.)</span>
          </h2>
          <div className="flex justify-center mb-6">
            <span style={{ padding: '4px 12px', borderRadius: '9999px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--accent-emerald)', fontSize: '0.688rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              ⚡ LIVE TELECOM INTEGRATION ACTIVE
            </span>
          </div>
          <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', marginBottom: '16px' }}>Trigger manual test calls or high-priority alerts directly via the integrated VOIP shortcode platform.</p>

            <form onSubmit={handleVoipCall} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label style={{ fontSize: '0.688rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', paddingLeft: '8px' }}>Target MSISDN (Global Format)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. +91 99XXXXXXX or +234 80XXXXXXXX"
                    value={voipMsisdn}
                    onChange={(e) => setVoipMsisdn(e.target.value)}
                    style={{ background: 'var(--bg-glass-heavy)', border: '1px solid var(--glass-border)', zIndex: 10, position: 'relative' }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label style={{ fontSize: '0.688rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', paddingLeft: '8px' }}>Caller Shortcode</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 5566"
                    value={voipShortcode}
                    onChange={(e) => setVoipShortcode(e.target.value)}
                    style={{ background: 'var(--bg-glass-heavy)', border: '1px solid var(--glass-border)', zIndex: 10, position: 'relative' }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label style={{ fontSize: '0.688rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', paddingLeft: '8px' }}>Campaign Script (AI Voice)</label>
                <textarea
                  className="input-field min-h-[80px] py-3 text-xs"
                  placeholder="What should the AI say to the customer?"
                  value={voipScript}
                  onChange={(e) => setVoipScript(e.target.value)}
                  style={{ background: 'var(--bg-glass-heavy)', border: '1px solid var(--glass-border)', zIndex: 10, position: 'relative' }}
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full shadow-2xl transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)', height: '54px' }}
                disabled={voipLoading || !voipMsisdn}
              >
                {voipLoading ? (
                  <Activity className="animate-spin mr-2 inline" size={18} />
                ) : (
                  <Zap size={18} className="mr-2 inline" />
                )}
                {voipLoading ? 'CONNECTING VOIP...' : 'TRIGGER VOIP CALL NOW'}
              </button>
            </form>

            <AnimatePresence>
              {voipResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-4 rounded-2xl border flex items-center gap-4 ${voipResult.success ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' : 'bg-rose-400/10 border-rose-400/20 text-rose-400'}`}
                >
                  {voipResult.success ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest">{voipResult.success ? 'Call Initiated' : 'Call Failed'}</span>
                    <span className="text-xs font-bold">{voipResult.message}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section >

        {/* Performance Overview */}
        < motion.section
          style={{ gridColumn: '1 / -1', marginTop: '60px' }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1 }
          }}
        >
          <PerformanceReport />
        </motion.section >
      </motion.div >

      {/* HISTORY MODAL OVERLAY */}
      {
        isHistoryModalOpen && (
          <div className="modal-overlay" onClick={() => setIsHistoryModalOpen(false)}>
            <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Scrub History Log</h2>
                <p className="text-xs text-slate-400 mt-2">Past verified results execution logs</p>
              </div>

              <div className="p-4 overflow-x-auto" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {historyLoading ? (
                  <div className="flex justify-center p-10"><Activity className="animate-pulse text-cyan-400" /></div>
                ) : historyData.length === 0 ? (
                  <div className="text-center p-10 text-slate-500 text-sm">No history found.</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700/50">
                        <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-widest min-w-[150px]">Date</th>
                        <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Input</th>
                        <th className="p-3 text-xs font-bold text-emerald-400 uppercase tracking-widest text-right">Final</th>
                        <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Filtered</th>
                        <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-widest pl-6">Results Table</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((row) => {
                        const date = new Date(row.logged_at).toLocaleString();
                        const filtered = row.dnd_removed + row.sub_removed + row.unsub_removed + row.operator_removed;
                        return (
                          <tr key={row.id} className="border-b border-slate-800/50 hover:bg-white-5 transition-colors">
                            <td className="p-3 text-xs text-slate-300">{date}</td>
                            <td className="p-3 text-xs text-slate-300 text-right">{row.total_input.toLocaleString()}</td>
                            <td className="p-3 text-xs font-bold text-emerald-400 text-right">{row.final_count.toLocaleString()}</td>
                            <td className="p-3 text-xs text-rose-400 text-right">-{filtered.toLocaleString()}</td>
                            <td className="p-3 text-xs text-cyan-400 font-mono pl-6" style={{ fontSize: '0.65rem' }}>{row.results_table || 'N/A'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setIsHistoryModalOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        )
      }

      {/* MODAL OVERLAY */}
      {
        isScheduleModalOpen && (
          <div className="modal-overlay overflow-y-auto py-10" onClick={() => setIsScheduleModalOpen(false)}>
            <div className="modal-content !max-w-[700px]" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header border-b border-white-5 pb-6 mb-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h2 className="modal-title !text-2xl">Configuration Studio</h2>
                    <p className="text-xs text-slate-500 tracking-wider uppercase font-bold">Campaign Scheduling & MSC Routing</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
                <div className="form-group">
                  <label className="label flex items-center gap-2 mb-3">
                    <Layout size={14} className="text-cyan-400" />
                    OBD Project Identifier
                  </label>
                  <input
                    type="text"
                    className="input-field !py-4 rounded-2xl bg-white-5 border-white-10 focus:border-cyan-400 transition-all"
                    placeholder="e.g. Summer_Campaign_V1"
                    value={scheduleData.obd_name}
                    onChange={(e) => setScheduleData({ ...scheduleData, obd_name: e.target.value })}
                  />
                  <p className="text-[9px] text-slate-600 mt-2 px-1 uppercase tracking-tighter">Unique namespace for reporting</p>
                </div>

                <div className="form-group">
                  <label className="label flex items-center gap-2 mb-3">
                    <Zap size={14} className="text-amber-400" />
                    Voice/Flow Logic selection
                  </label>
                  <div className="relative">
                    <select
                      className="input-field !py-4 rounded-2xl bg-white-5 border-white-10 focus:border-amber-400 transition-all appearance-none pr-10"
                      value={scheduleData.flow_name}
                      onChange={(e) => setScheduleData({ ...scheduleData, flow_name: e.target.value })}
                    >
                      <option value="" disabled>Select execution logic...</option>
                      <option value="Promo Flow 1">Standard Promotion Engine</option>
                      <option value="Holiday Special">Holiday Multi-tier Logic</option>
                      {mermaidFlow && <option value="AI Generated Flow">AI Generated Scrubber Flow</option>}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 line-height-1">
                      <ChevronRight size={16} className="rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label flex items-center gap-2 mb-3">
                    <Activity size={14} className="text-emerald-400" />
                    MSC Connection IP Path
                  </label>
                  <input
                    type="text"
                    className="input-field !py-4 rounded-2xl bg-white-5 border-white-10 focus:border-emerald-400 transition-all font-mono"
                    placeholder="10.200.XXX.XXX"
                    value={scheduleData.msc_ip}
                    onChange={(e) => setScheduleData({ ...scheduleData, msc_ip: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="label flex items-center gap-2 mb-3">
                    <Info size={14} className="text-purple-400" />
                    CLI Masking / Caller ID
                  </label>
                  <input
                    type="text"
                    className="input-field !py-4 rounded-2xl bg-white-5 border-white-10 focus:border-purple-400 transition-all"
                    placeholder="e.g. 556677"
                    value={scheduleData.cli}
                    onChange={(e) => setScheduleData({ ...scheduleData, cli: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-12 pt-8 border-t border-white-5">
                <button
                  className="btn-secondary flex-1 py-4 font-bold tracking-widest text-xs uppercase"
                  onClick={() => setIsScheduleModalOpen(false)}
                >
                  Discard Configuration
                </button>
                <button
                  className="btn-primary !bg-emerald-500 hover:!bg-emerald-400 shadow-emerald-500/20 flex-[2] py-4 rounded-2xl font-bold tracking-widest text-xs uppercase flex items-center justify-center gap-3 transition-all active:scale-95"
                  onClick={async () => {
                    if (isLaunching) return;
                    setIsLaunching(true);
                    setSuccessMsg('');
                    try {
                      // 1. Save Scheduling Details FIRST
                      const schedRes = await fetch(`${API_BASE}/schedule-promotion`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(scheduleData)
                      });

                      if (!schedRes.ok) {
                        const err = await schedRes.json();
                        alert(`Scheduling Failed: ${err.detail}`);
                        setIsLaunching(false);
                        return;
                      }

                      // 2. Trigger Launch
                      const launchRes = await fetch(`${API_BASE}/launch-campaign`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          msisdn_list: cleanedMsisdns,
                          project_name: scheduleData.obd_name
                        })
                      });

                      if (launchRes.ok) {
                        const data = await launchRes.json();
                        setSuccessMsg(`CAMPAIGN LIVE! 🚀 - ${data.message}`);
                        // Keep success message visible for a bit before closing
                        setTimeout(() => {
                          setIsScheduleModalOpen(false);
                          setIsLaunching(false);
                          setSuccessMsg('');
                        }, 2000);
                      } else {
                        const err = await launchRes.json();
                        alert(`Launch Failed: ${err.detail}`);
                        setIsLaunching(false);
                      }
                    } catch (err) {
                      alert(`Network Error: ${err.message}`);
                      setIsLaunching(false);
                    }
                  }}
                >
                  <Zap size={16} fill="white" className={isLaunching ? "animate-spin" : ""} />
                  {isLaunching ? "Launching..." : successMsg || "Initialize & Launch Campaign"}
                </button >
              </div >
            </div >
          </div >
        )
      }
      {/* VIRTUAL IVR SIMULATOR MODAL */}
      <AnimatePresence>
        {activeVirtualCall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 100 }}
            style={{
              position: 'fixed',
              bottom: '40px',
              right: '40px',
              width: '320px',
              background: 'var(--bg-glass-heavy)',
              backdropFilter: 'blur(40px)',
              border: '2px solid var(--accent-cyan)',
              borderRadius: '32px',
              padding: '32px',
              zIndex: 2000,
              boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(34,211,238,0.2)'
            }}
          >
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-cyan-400/20 flex items-center justify-center text-cyan-400 animate-pulse">
                  <Phone size={40} />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping" />
              </div>

              <div className="text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Incoming Virtual Call</span>
                <h3 className="text-xl font-bold mt-1">{activeVirtualCall.msisdn}</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Shortcode: {activeVirtualCall.shortcode}</p>
              </div>

              {activeVirtualCall.status === 'ringing' ? (
                <div className="flex gap-4 w-full">
                  <button
                    onClick={() => handleVirtualRespond('hangup')}
                    className="flex-1 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                  >
                    <X size={24} />
                  </button>
                  <button
                    onClick={() => handleVirtualRespond('answered')}
                    className="flex-1 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center animate-bounce"
                  >
                    <PhoneOutgoing size={24} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 w-full">
                  <div className="p-4 rounded-2xl bg-white-5 border border-white-10 text-[11px] font-medium leading-relaxed italic text-slate-300">
                    "{activeVirtualCall.script}"
                  </div>
                  <div className="grid grid-cols-3 gap-2 w-full">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map(key => (
                      <button
                        key={key}
                        className="h-10 rounded-lg bg-white-5 hover:bg-cyan-400/20 transition-all font-mono text-xs text-slate-400"
                        onClick={() => console.log(`DTMF: ${key}`)}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handleVirtualRespond('hangup')}
                    className="w-full h-12 rounded-xl bg-rose-500 text-white font-bold uppercase tracking-widest text-[10px]"
                  >
                    End Simulation
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
}
