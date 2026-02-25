"use client";

import { X, Copy, Check, AlertCircle, Info } from "lucide-react";
import { useState } from "react";

interface StatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: "error" | "success" | "info";
    code?: string;
}

export default function StatusModal({ isOpen, onClose, title, message, type = "info", code }: StatusModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        if (code) {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const bgColor = type === "error" ? "bg-rose-500" : type === "success" ? "bg-emerald-500" : "bg-indigo-600";
    const icon = type === "error" ? <AlertCircle size={32} /> : type === "success" ? <Check size={32} /> : <Info size={32} />;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-950 rounded-[32px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-white/20 dark:border-white/5 animate-in zoom-in duration-300">
                <div className={`${bgColor} p-8 shrink-0 flex justify-center text-white relative`}>
                    <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                        {icon}
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 space-y-6 overflow-y-auto no-scrollbar">
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black dark:text-white uppercase tracking-tight">{title}</h3>
                        <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{message}</p>
                    </div>

                    {code && (
                        <div className="mt-2 bg-gray-50 dark:bg-black/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 relative group">
                            <pre className="text-[10px] font-mono text-gray-400 overflow-x-auto whitespace-pre-wrap max-h-48 custom-scrollbar">
                                {code}
                            </pre>
                            <button
                                onClick={handleCopy}
                                className="absolute top-3 right-3 p-2 bg-white dark:bg-gray-800 text-gray-400 hover:text-indigo-600 rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all border border-gray-100 dark:border-gray-700"
                                title="Копировать код"
                            >
                                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-8 pt-0 shrink-0">
                    <button
                        onClick={onClose}
                        className={`w-full py-4 ${bgColor} text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2`}
                    >
                        Понятно
                    </button>
                </div>
            </div>
        </div>
    );
}
