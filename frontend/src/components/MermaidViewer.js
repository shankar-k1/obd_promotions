"use client";
import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';

export default function MermaidViewer({ chart }) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        mermaid.initialize({
            startOnLoad: true,
            theme: 'dark',
            securityLevel: 'loose',
        });
    }, []);

    useEffect(() => {
        if (isClient) {
            mermaid.contentLoaded();
        }
    }, [chart, isClient]);

    if (!isClient) return <div className="p-8 text-center text-slate-500">Loading Blueprint...</div>;

    return (
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700 mt-4 overflow-auto">
            <div className="mermaid">
                {chart}
            </div>
        </div>
    );
}
