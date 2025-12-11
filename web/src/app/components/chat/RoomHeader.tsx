"use client";
import Link from "next/link";
import React from "react";

export type RoomHeaderProps = {
    roomId: string;
    title?: string;
    participants?: number;
    className?: string;
    onStart?: () => void;
    userSide?: 'A' | 'B' | null;
    debateEndTime?: number;
    onToggleUserList?: () => void;
};

export default function RoomHeader({
    roomId,
    title = "밸런스 토론방",
    participants,
    className,
    onStart,
    userSide,
    debateEndTime,
    onToggleUserList,
}: RoomHeaderProps) {
    const [timeLeft, setTimeLeft] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!debateEndTime) {
            setTimeLeft(null);
            return;
        }

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = Math.ceil((debateEndTime - now) / 1000);

            if (diff <= 0) {
                setTimeLeft("00:00");
                clearInterval(interval);
            } else {
                const min = Math.floor(diff / 60);
                const sec = diff % 60;
                setTimeLeft(`${min}:${sec.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [debateEndTime]);

    return (
        <header className={`sticky top-0 z-10 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 ${className ?? ""}`}>
            <div className="mx-auto max-w-4xl px-4 py-3 flex items-center gap-3">
                <Link
                    href="/"
                    className="rounded-xl border px-3 py-1 text-sm hover:bg-gray-50"
                >
                    ← 목록
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="truncate font-semibold text-gray-900">{title}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            live
                        </span>
                        {userSide && (
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${userSide === 'A' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                {userSide} 진영
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                        Room ID: {roomId}
                        {typeof participants === "number"
                            ? ` · 참가자 ${participants}명`
                            : ""}
                    </div>
                </div>

                {/* 타이머 또는 시작 버튼 */}
                {timeLeft ? (
                    <div className="bg-gray-900 text-white font-mono font-bold px-4 py-2 rounded-xl text-lg min-w-[80px] text-center">
                        {timeLeft}
                    </div>
                ) : (
                    <button
                        onClick={onStart}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2 rounded-xl transition-colors duration-200 cursor-pointer"
                    >
                        토론 시작
                    </button>
                )}

                {/* 메뉴 버튼 */}
                <button
                    onClick={onToggleUserList}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    <span className="text-xl">☰</span>
                </button>
            </div>
        </header>
    );
}