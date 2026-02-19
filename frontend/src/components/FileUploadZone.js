"use client";
import React, { useState, useCallback } from 'react';

export default function FileUploadZone({ onUploadSuccess }) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fileName, setFileName] = useState('');

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            await uploadFile(files[0]);
        }
    }, []);

    const uploadFile = async (file) => {
        setUploading(true);
        setFileName(file.name);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('http://localhost:8000/upload', {
                method: 'POST',
                body: formData,
            });
            console.log("FileUploadZone: Upload response status", res.status);
            const data = await res.json();
            console.log("FileUploadZone: Upload data parsed", data);
            onUploadSuccess(data);
        } catch (err) {
            console.error("FileUploadZone: Upload failed", err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div
            className={`glass-panel border-dashed border-2 transition-all flex flex-col items-center justify-center p-8 ${isDragging ? 'border-cyan-400 bg-cyan-400-10' : 'border-slate-700'}`}
            style={{ minHeight: '220px' }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <div className="text-center">
                {uploading ? (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full border-2 border-cyan-400 mb-4" style={{ width: '32px', height: '32px', borderBottomColor: 'transparent' }}></div>
                        <p className="text-slate-300">Processing {fileName}...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="stat-label mb-2">Drag & Drop Lead Files</div>
                        <p className="text-slate-400 text-sm mb-6">Supports CSV, TXT, XLSX (Local or Drive)</p>
                        <div className="flex gap-4 justify-center">
                            <label className="btn-primary py-2 px-6 text-sm cursor-pointer inline-block w-auto" style={{ padding: '10px 24px' }}>
                                Browse Local
                                <input type="file" className="hidden" style={{ display: 'none' }} onChange={(e) => uploadFile(e.target.files[0])} />
                            </label>
                            <button
                                className="btn-primary py-2 px-6 text-sm inline-block w-auto"
                                style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                                onClick={() => alert("Google Drive Picker logic would go here.")}
                            >
                                Google Drive
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
