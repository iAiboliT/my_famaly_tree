"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-[48px] p-12 shadow-2xl border border-gray-100 dark:border-gray-800 text-center space-y-8 animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-3xl flex items-center justify-center text-rose-500 mx-auto shadow-lg">
                    <AlertCircle size={48} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black dark:text-white leading-tight uppercase tracking-tighter">Что-то пошло не так</h2>
                    <p className="text-gray-500 font-bold">Приложение столкнулось с неожиданной ошибкой. Не волнуйтесь, ваши данные в безопасности.</p>
                </div>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => reset()}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCcw size={20} /> Попробовать снова
                    </button>
                    <Link
                        href="/"
                        className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                    >
                        <Home size={20} /> На главную
                    </Link>
                </div>
                {error.digest && (
                    <p className="text-[10px] text-gray-300 font-mono uppercase">ID ошибки: {error.digest}</p>
                )}
            </div>
        </div>
    );
}
