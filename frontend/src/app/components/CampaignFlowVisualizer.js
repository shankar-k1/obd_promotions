'use client';

import React, { useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Handle,
    Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
    Play,
    Mic,
    GitBranch,
    LogOut,
    Zap
} from 'lucide-react';

const NodeWrapper = ({ children, label, type, color, icon: Icon }) => (
    <div className={`px-4 py-3 rounded-2xl border-2 shadow-2xl bg-slate-900 flex flex-col items-center gap-2 min-w-[140px] transition-all hover:scale-105`}
        style={{ borderColor: color }}>
        <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-slate-700 !border-2" />
        <div className={`p-2 rounded-xl`} style={{ backgroundColor: `${color}20`, color: color }}>
            <Icon size={20} />
        </div>
        <div className="text-[10px] font-black text-white uppercase tracking-wider text-center">{label}</div>
        <div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{type}</div>
        <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-slate-700 !border-2" />
    </div>
);

const customNodeTypes = {
    start: (n) => <NodeWrapper label={n.data.label} type="Entry Point" color="#22d3ee" icon={Zap} />,
    play: (n) => <NodeWrapper label={n.data.label} type="Audio Play" color="#f43f5e" icon={Play} />,
    input: (n) => <NodeWrapper label={n.data.label} type="User Input" color="#fbbf24" icon={Mic} />,
    condition: (n) => <NodeWrapper label={n.data.label} type="Switch Box" color="#a855f7" icon={GitBranch} />,
    end: (n) => <NodeWrapper label={n.data.label} type="Hangup" color="#64748b" icon={LogOut} />,
};

export default function CampaignFlowVisualizer({ nodes = [], edges = [] }) {
    // Convert basic JSON nodes/edges to React Flow format
    const rfNodes = useMemo(() => nodes.map((n, i) => ({
        id: n.id || `node-${i}`,
        type: n.type in customNodeTypes ? n.type : 'play',
        data: { label: n.label },
        position: { x: 250, y: i * 150 }, // Simple vertical layout fallback
    })), [nodes]);

    const rfEdges = useMemo(() => edges.map((e, i) => ({
        id: `edge-${i}`,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: true,
        style: { stroke: '#475569', strokeWidth: 2 },
        labelStyle: { fill: '#94a3b8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' },
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: '#0f172a', color: '#fff', fillOpacity: 0.7 },
    })), [edges]);

    return (
        <div className="w-full h-full min-h-[500px] relative">
            <ReactFlow
                nodes={rfNodes}
                edges={rfEdges}
                nodeTypes={customNodeTypes}
                fitView
                className="bg-slate-950/20"
            >
                <Background color="#1e293b" gap={20} />
                <Controls />
                <MiniMap
                    nodeColor={(n) => {
                        if (n.type === 'start') return '#22d3ee';
                        if (n.type === 'play') return '#f43f5e';
                        if (n.type === 'input') return '#fbbf24';
                        return '#64748b';
                    }}
                    maskColor="rgba(15, 23, 42, 0.8)"
                    style={{ background: '#0f172a', borderRadius: '12px' }}
                />
            </ReactFlow>
        </div>
    );
}
