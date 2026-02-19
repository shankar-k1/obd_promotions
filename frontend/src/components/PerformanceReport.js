"use client";
import React from 'react';

export default function PerformanceReport() {
    const kpis = [
        { name: 'Success Rate', value: '68%', color: 'var(--accent-emerald)' },
        { name: 'Average Handle Time', value: '18s', color: 'var(--accent-cyan)' },
        { name: 'Response Rate', value: '42%', color: 'var(--accent-blue)' },
        { name: 'Unsub Rate', value: '1.2%', color: 'var(--accent-purple)' },
    ];

    return (
        <div className="glass-panel">
            <h2 className="panel-title">
                <span className="accent-line" style={{ background: 'var(--accent-purple)' }}></span>
                OBD Performance Matrix
            </h2>
            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                {kpis.map((kpi, i) => (
                    <div key={i} className="flex flex-col">
                        <div className="flex justify-between mb-2 items-center">
                            <span className="text-slate-400" style={{ fontSize: '0.85rem', fontWeight: '500' }}>{kpi.name}</span>
                            <span style={{ fontFamily: 'JetBrains Mono', fontWeight: '700', color: 'white' }}>{kpi.value}</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: kpi.value.includes('%') ? kpi.value : '45%', background: kpi.color, borderRadius: '10px', transition: 'width 1s ease-out' }}></div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 p-4" style={{ background: 'rgba(168, 85, 247, 0.05)', borderRadius: '20px', border: '1px solid rgba(168, 85, 247, 0.1)', color: 'var(--accent-purple)', fontSize: '0.9rem', textAlign: 'center', fontStyle: 'italic' }}>
                "Performance metrics are currently stabilizing within healthy parameters. No disturbances detected."
            </div>
        </div>
    );
}
