"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-3 md:px-5 md:py-4 text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all flex items-center gap-3 border border-transparent hover:border-rose-100"
            title="Выйти"
        >
            <LogOut size={20} className="md:w-6 md:h-6" />
            <span className="hidden md:inline text-xs font-black uppercase tracking-tight">Выйти</span>
        </button>
    );
}
