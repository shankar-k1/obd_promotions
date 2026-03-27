"use client";

import React from "react";
import {
    Users, Activity, Globe, Volume2,
    TrendingUp, ShieldAlert,
    Cpu, Key, ArrowUpRight
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

const stats = [
    { name: "Total Users", value: "24", change: "+12%", icon: <Users className="w-4 h-4" /> },
    { name: "Daily Active", value: "18", change: "+5%", icon: <Activity className="w-4 h-4" /> },
    { name: "Translations", value: "1,240", change: "+32%", icon: <Globe className="w-4 h-4" /> },
    { name: "Audio Generated", value: "854", change: "+18%", icon: <Volume2 className="w-4 h-4" /> }
];

const engines = [
    { name: "Deepgram", status: "Healthy", latency: "240ms", color: "bg-green-500" },
    { name: "ElevenLabs", status: "Active", latency: "850ms", color: "bg-blue-400" },
    { name: "OpenAI", status: "Maintenance", latency: "---", color: "bg-orange-400" },
    { name: "Murf AI", status: "Online", latency: "1.2s", color: "bg-purple-500" }
];

export default function AdminOverview() {
    const { t } = useTheme();

    return (
        <div className="w-full space-y-12">

            {/* ─── Page Header ─── */}
            <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
                    Systems Overview
                </h1>
                <p className="text-base font-medium flex items-center gap-3" style={{ color: t.textSecondary }}>
                    <TrendingUp className="w-5 h-5" style={{ color: t.primary }} />
                    Platform usage surged 24% over the last week
                </p>
            </div>

            {/* ─── Stats Grid ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 min-w-0">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="p-7 rounded-2xl transition-all group min-w-0"
                        style={{
                            background: t.bgCard,
                            border: `1px solid ${t.cardBorder}`,
                        }}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: t.hoverBg, color: t.textSecondary }}
                            >
                                {stat.icon}
                            </div>
                            <span className="text-[11px] font-bold text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3" />
                                {stat.change}
                            </span>
                        </div>

                        <p className="text-3xl font-bold mb-1.5 tracking-tight" style={{ color: t.textPrimary }}>
                            {stat.value}
                        </p>
                        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: t.textMuted }}>
                            {stat.name}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* ─── Engine Monitor + Security ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Engine Health */}
                <div className="lg:col-span-2 space-y-5">
                    <h2 className="text-lg font-bold flex items-center gap-3" style={{ color: t.textPrimary }}>
                        <Cpu className="w-5 h-5" style={{ color: t.primary }} />
                        Engine Health Monitor
                    </h2>
                    <div className="rounded-2xl overflow-hidden" style={{ background: t.bgCard, border: `1px solid ${t.cardBorder}` }}>
                        <table className="w-full text-left">
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                                    <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold" style={{ color: t.textMuted }}>Provider</th>
                                    <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold" style={{ color: t.textMuted }}>Status</th>
                                    <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-right" style={{ color: t.textMuted }}>Latency</th>
                                </tr>
                            </thead>
                            <tbody>
                                {engines.map((eg, i) => (
                                    <tr
                                        key={i}
                                        className="transition-colors"
                                        style={{ borderBottom: i < engines.length - 1 ? `1px solid ${t.border}` : "none" }}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                                                    style={{ background: t.hoverBg, border: `1px solid ${t.border}` }}
                                                >
                                                    <Key className="w-4 h-4" style={{ color: t.textMuted }} />
                                                </div>
                                                <span className="text-sm font-semibold" style={{ color: t.textPrimary }}>{eg.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="inline-flex items-center gap-2.5">
                                                <div className={cn("w-2 h-2 rounded-full animate-pulse", eg.color)} />
                                                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.textSecondary }}>
                                                    {eg.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right font-mono text-sm" style={{ color: t.textMuted }}>
                                            {eg.latency}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Security Feed */}
                <div className="space-y-5">
                    <h2 className="text-lg font-bold flex items-center gap-3" style={{ color: t.textPrimary }}>
                        <ShieldAlert className="w-5 h-5 text-red-400" />
                        Security Alerts
                    </h2>
                    <div className="space-y-3">
                        {[
                            { title: "API Burst Detected", desc: "User #124 exceeded rate limit", time: "2h ago", severity: "warning" },
                            { title: "Brute Force Block", desc: "Blocked IP: 192.168.1.1", time: "4h ago", severity: "critical" },
                            { title: "Key Rotation", desc: "OpenAI secret refreshed", time: "1d ago", severity: "info" }
                        ].map((alert, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="p-5 rounded-2xl flex items-start gap-4 transition-all group"
                                style={{ background: t.bgCard, border: `1px solid ${t.cardBorder}` }}
                            >
                                <span className={cn(
                                    "w-2.5 h-2.5 mt-1.5 rounded-full shrink-0",
                                    alert.severity === "warning" ? "bg-amber-500" :
                                        alert.severity === "critical" ? "bg-red-500" : "bg-blue-400"
                                )} />
                                <div className="flex-1 space-y-1.5">
                                    <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>{alert.title}</p>
                                    <p className="text-xs leading-relaxed" style={{ color: t.textSecondary }}>{alert.desc}</p>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest pt-1" style={{ color: t.textMuted }}>
                                        {alert.time}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
