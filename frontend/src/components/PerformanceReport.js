"use client";
import React from 'react';
import { TrendingUp, Clock, Target, ShieldAlert } from 'lucide-react';

export default function PerformanceReport() {
    const kpis = [
        { name: 'Success Rate', value: '68%', color: 'var(--accent-emerald)', icon: <TrendingUp size={14} /> },
        { name: 'Average Handle Time', value: '18s', color: 'var(--accent-cyan)', icon: <Clock size={14} /> },
        { name: 'Response Rate', value: '42%', color: 'var(--accent-blue)', icon: <Target size={14} /> },
        { name: 'Unsub Rate', value: '1.2%', color: 'var(--accent-purple)', icon: <ShieldAlert size={14} /> },
    ];

    return (
        <div className="glass-panel">
            <h2 className="panel-title">
                <span className="accent-line" style={{ background: 'var(--accent-purple)' }}></span>
                OBD Performance Matrix
                <span className="text-ghost ml-auto text-[10px]">System KPIs</span>
            </h2>
            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                {kpis.map((kpi, i) => (
                    <div key={i} className="flex flex-col gap-3 p-4 rounded-2xl bg-white-5 border-white-5">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-slate-400">
                                <span style={{ color: kpi.color }}>{kpi.icon}</span>
                                <span className="text-ghost" style={{ fontSize: '0.65rem' }}>{kpi.name}</span>
                            </div>
                            <span style={{ fontFamily: 'JetBrains Mono', fontWeight: '700', color: 'var(--text-main)', fontSize: '1.1rem' }}>{kpi.value}</span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(0,0,0,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: kpi.value.includes('%') ? kpi.value : '45%', background: kpi.color, borderRadius: '10px' }}></div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-8 p-6" style={{ background: 'rgba(168, 85, 247, 0.04)', borderRadius: '24px', border: '1px solid rgba(168, 85, 247, 0.1)', color: 'var(--accent-purple)', fontSize: '0.85rem', textAlign: 'center', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                "Performance metrics are currently stabilizing within healthy parameters. No disturbances detected."
            </div>
        </div>
    );
}
