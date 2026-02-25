"use client";

import { signIn, useSession } from "next-auth/react";
import { TreePine, ArrowRight, Shield, Share2, History, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LandingPage() {
    const { data: session } = useSession();
    const router = useRouter();

    const handleStart = () => {
        if (session) {
            router.push("/trees");
        } else {
            signIn();
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-transparent font-sans">

            <header className="relative z-10 px-8 py-6 flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-indigo-500/20">G</div>
                    <span className="text-sm font-black uppercase tracking-tighter dark:text-white">Genealogy OS</span>
                </div>
                {session ? (
                    <Link href="/login" className="text-sm font-black uppercase text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-2">
                        {session.user?.name || "Личный кабинет"}
                    </Link>
                ) : (
                    <Link href="/login" className="text-sm font-black uppercase text-gray-400 hover:text-indigo-600 transition-colors">Войти</Link>
                )}
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-40 grid lg:grid-cols-2 gap-20 items-center">
                <div className="space-y-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest">
                            <Shield size={14} />
                            Безопасный семейный архив
                        </div>
                        <h1 className="text-7xl lg:text-8xl font-black dark:text-white tracking-tighter leading-[0.9]">
                            История вашей семьи <span className="text-indigo-600">оживает здесь.</span>
                        </h1>
                        <p className="text-xl text-gray-400 font-medium max-w-md leading-relaxed">
                            Создайте интерактивное древо жизни, сохраните воспоминания и передайте наследие следующим поколениям.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleStart}
                            className="px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[32px] font-black text-xl shadow-2xl shadow-indigo-500/40 flex items-center justify-center gap-3 transition-all hover:-translate-y-1 active:scale-95"
                        >
                            {session ? "Начать построение древа" : "Создать дерево родословной"}
                            <ArrowRight size={20} />
                        </button>
                    </div>
                    ...

                    <div className="grid grid-cols-2 gap-8 pt-10 border-t dark:border-gray-800">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600"><Share2 size={18} /> <span className="text-xs font-black uppercase">Совместный доступ</span></div>
                            <p className="text-sm text-gray-400 font-medium">Приглашайте родственников дополнять историю вместе с вами.</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600"><History size={18} /> <span className="text-xs font-black uppercase">Вечный архив</span></div>
                            <p className="text-sm text-gray-400 font-medium">Ваши данные надежно защищены и готовы к передаче по наследству.</p>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div className="aspect-square bg-indigo-600/5 rounded-[80px] border border-indigo-500/10 backdrop-blur-3xl overflow-hidden shadow-2xl group">
                        <div className="absolute inset-0 flex items-center justify-center text-indigo-600/20 group-hover:scale-110 transition-transform duration-700">
                            <TreePine size={400} />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-950 via-transparent to-transparent" />
                    </div>
                </div>
            </main>

            <footer className="relative z-10 px-8 py-10 border-t dark:border-gray-800 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[.5em]">2026 Genealogy OS. Вечная память.</p>
            </footer>
        </div>
    );
}
