"use client";
import Link from "next/link";
import React from "react";
export type RoomHeaderProps = {
    roomId: string;
    title?: string;
    participants?: number;
    className?: string;
    onStart?: () => void; // 콜백 추가
};

export default function RoomHeader({
    roomId,
    title = "밸런스 토론방",
    participants,
    className,
    onStart,
}: RoomHeaderProps) {
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
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                        Room ID: {roomId}
                        {typeof participants === "number"
                            ? ` · 참가자 ${participants}명`
                            : ""}
                    </div>
                </div>
                <button
                    onClick={onStart}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2 rounded-xl transition-colors duration-200 cursor-pointer"
                >
                    토론 시작
                </button>
            </div>
        </header>
    );
}