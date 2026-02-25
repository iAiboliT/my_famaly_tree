import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[999] bg-white/20 dark:bg-gray-950/20 backdrop-blur-md flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 dark:border-gray-800 rounded-full animate-pulse"></div>
                    <Loader2 className="absolute inset-0 animate-spin text-indigo-600" size={64} />
                </div>
                <p className="text-indigo-600 font-black uppercase tracking-[0.3em] text-xs animate-pulse">Загрузка...</p>
            </div>
        </div>
    );
}
