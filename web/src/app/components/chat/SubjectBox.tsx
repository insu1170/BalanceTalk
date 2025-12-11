"use client";
import React, { useState } from "react";

type SubjectBoxProps = {
    text: string;
    state: boolean;
    onClose?: () => void;
};

export default function SubjectBox({
    text,
    state,
    onClose,
    onSelectSide,
    endTime,
    userCounts = { A: 0, B: 0 },
    mySelection,
    phase
}: SubjectBoxProps & {
    onSelectSide?: (side: 'A' | 'B') => void;
    endTime?: number;
    userCounts?: { A: number; B: number };
    mySelection?: 'A' | 'B' | null;
    phase?: 'selecting' | 'debating' | 'final_selecting' | 'waiting';
}) {
    const [timeLeft, setTimeLeft] = useState(10);

    // 타이머 로직
    React.useEffect(() => {
        if (!endTime) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = Math.ceil((endTime - now) / 1000);
            // console.log(`Timer Tick: endTime=${endTime}, now=${now}, diff=${diff}`);
            if (diff <= 0) {
                setTimeLeft(0);
                clearInterval(interval);
            } else {
                setTimeLeft(diff);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [endTime]);

    if (!state) return null;

    // Parse topic format: "Main Topic|Option A vs Option B" or just "Option A vs Option B"
    const parts = text.split('|');
    const hasMainTopic = parts.length > 1;
    const mainTopic = hasMainTopic ? parts[0] : null;
    const debateStr = hasMainTopic ? parts[1] : parts[0];

    const sides = debateStr.split(/vs/i).map(s => s.trim());
    const sideA = sides[0] || "A";
    const sideB = sides[1] || "B";

    const title = phase === 'final_selecting' ? "최종 선택:" : "진영 선택:";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
            <div className="w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
                <div className="p-6 flex flex-col gap-4 text-amber-900">
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-xl">📢</span>
                            <div className="flex flex-col min-w-0">
                                {mainTopic && (
                                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">
                                        {mainTopic}
                                    </span>
                                )}
                                <p className="text-lg truncate leading-tight">
                                    <strong className="mr-2 opacity-70">{title}</strong>
                                    <span className="font-bold text-amber-950">{debateStr}</span>
                                </p>
                            </div>
                        </div>
                        {timeLeft > 0 && (
                            <div className="text-2xl font-bold text-red-500 animate-pulse">
                                {timeLeft}초
                            </div>
                        )}
                    </div>

                    {/* Selection Buttons */}
                    {onSelectSide && (
                        <div className="grid grid-cols-2 gap-4 mt-1">
                            <button
                                onClick={() => onSelectSide('A')}
                                className={`flex flex-col items-center justify-center gap-1 p-4 rounded-xl border-2 transition-all active:scale-95 group relative
                                    ${mySelection === 'A' ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-300' : 'bg-white/50 border-amber-200 hover:bg-amber-50'}
                                `}
                            >
                                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Option A</span>
                                <span className="text-lg font-bold text-gray-900 group-hover:text-amber-800">{sideA}</span>
                                <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                                    👥 {userCounts.A}명 선택
                                </div>
                            </button>
                            <button
                                onClick={() => onSelectSide('B')}
                                className={`flex flex-col items-center justify-center gap-1 p-4 rounded-xl border-2 transition-all active:scale-95 group relative
                                    ${mySelection === 'B' ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-300' : 'bg-white/50 border-amber-200 hover:bg-blue-50'}
                                `}
                            >
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Option B</span>
                                <span className="text-lg font-bold text-gray-900 group-hover:text-blue-800">{sideB}</span>
                                <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                                    👥 {userCounts.B}명 선택
                                </div>
                            </button>
                        </div>
                    )}

                    <p className="text-center text-xs text-gray-400">
                        {mySelection ? "선택 완료! 잠시만 기다려주세요..." : "10초 내에 선택하지 않으면 A로 자동 배정됩니다."}
                    </p>
                </div>
            </div>
        </div>
    );
}
