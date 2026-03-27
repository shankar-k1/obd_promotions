"use client";

import React, { useState, useEffect } from "react";
import {
    Key, Save, Zap,
    ShieldCheck, Database,
    CheckCircle, Lock, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

export default function AdminSettings() {
    const [settings, setSettings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const { t } = useTheme();

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get("/api/admin/settings");
            setSettings(res.data.settings);
            setLoading(false);
        } catch (err) { console.error("Failed to fetch settings:", err); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.post("/api/admin/settings", { settings });
            setMessage({ text: "Settings saved successfully!", type: "success" });
            setTimeout(() => setMessage({ text: "", type: "" }), 3000);
        } catch (err) {
            setMessage({ text: "Failed to save settings.", type: "error" });
        }
        setSaving(false);
    };

    const updateValue = (key: string, value: string) => {
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    };

    if (loading) return null;

    const apiKeySettings = settings.filter(s => s.key.endsWith("_KEY"));
    const limitSettings = settings.filter(s => !s.key.endsWith("_KEY"));

    return (
        <div className="w-full space-y-12">

            {/* ─── Header ─── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
                        Platform Settings
                    </h1>
                    <p className="text-base font-medium" style={{ color: t.textSecondary }}>
                        Configure API access and operational boundaries for the ecosystem.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div
                        className="h-10 px-4 rounded-xl inline-flex items-center justify-center gap-2.5"
                        style={{ background: t.hoverBg, border: `1px solid ${t.border}` }}
                    >
                        <Activity className="w-4 h-4" style={{ color: t.primary }} />
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>Synced</span>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="h-10 px-6 rounded-xl text-white font-semibold text-sm inline-flex items-center justify-center gap-2.5 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md"
                        style={{ background: t.primary }}
                    >
                        {saving ? <Database className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            </div>

            {/* ─── Status Message ─── */}
            <AnimatePresence>
                {message.text && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                            "p-4 rounded-xl flex items-center gap-3 border text-sm font-semibold",
                            message.type === "success"
                                ? "bg-green-500/10 border-green-500/20 text-green-500"
                                : "bg-red-500/10 border-red-500/20 text-red-400"
                        )}
                    >
                        {message.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <ShieldCheck className="w-4 h-4 shrink-0" />}
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── API Keys ─── */}
            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                        <Key className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="space-y-0.5">
                        <h2 className="text-lg font-bold" style={{ color: t.textPrimary }}>Provider API Keys</h2>
                        <p className="text-sm" style={{ color: t.textSecondary }}>Manage credentials for transcription and synthesis services.</p>
                    </div>
                </div>

                <div className="rounded-2xl p-6 md:p-8" style={{ background: t.bgCard, border: `1px solid ${t.cardBorder}` }}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {apiKeySettings.map((s) => (
                            <div key={s.key} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>
                                        {s.key.replace(/_/g, " ")}
                                    </label>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md"
                                        style={{ background: t.hoverBg, color: t.textMuted }}>
                                        Encrypted
                                    </span>
                                </div>
                                <div className="relative group">
                                    <input
                                        type="password"
                                        value={s.value}
                                        onChange={(e) => updateValue(s.key, e.target.value)}
                                        placeholder="Enter provider key..."
                                        className="w-full rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 transition-all font-mono"
                                        style={{
                                            background: t.inputBg,
                                            border: `1px solid ${t.border}`,
                                            color: t.textPrimary,
                                            "--tw-ring-color": `${t.primary}40`,
                                        } as React.CSSProperties}
                                    />
                                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: t.textMuted }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Operational Limits ─── */}
            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                        <Zap className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="space-y-0.5">
                        <h2 className="text-lg font-bold" style={{ color: t.textPrimary }}>Operational Limits</h2>
                        <p className="text-sm" style={{ color: t.textSecondary }}>Configure resource constraints and execution ceilings.</p>
                    </div>
                </div>

                <div className="rounded-2xl p-6 md:p-8" style={{ background: t.bgCard, border: `1px solid ${t.cardBorder}` }}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {limitSettings.map((s) => (
                            <div key={s.key} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>
                                        {s.key.replace(/_/g, " ")}
                                    </label>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md"
                                        style={{ background: t.hoverBg, color: t.textMuted }}>
                                        Limit
                                    </span>
                                </div>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={s.value}
                                        onChange={(e) => updateValue(s.key, e.target.value)}
                                        className="w-full rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 transition-all font-semibold"
                                        style={{
                                            background: t.inputBg,
                                            border: `1px solid ${t.border}`,
                                            color: t.textPrimary,
                                            "--tw-ring-color": `${t.primary}40`,
                                        } as React.CSSProperties}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
