"use client";
import React, { useState } from "react";

type SubjectBoxProps = {
    text: string;
    state: boolean;
    onClose?: () => void;
};

export default function SubjectBox({ text, state, onClose, onSelectSide }: SubjectBoxProps & { onSelectSide?: (side: 'A' | 'B') => void }) {
    if (!state) return null;

    const sides = text.split(/vs/i).map(s => s.trim());
    const sideA = sides[0] || "A";
    const sideB = sides[1] || "B";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
            <div className="w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
                <div className="p-6 flex flex-col gap-4 text-amber-900">
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-xl">📢</span>
                            <p className="text-lg truncate">
                                <strong className="mr-2 opacity-70">오늘의 주제:</strong>
                                <span className="font-bold text-amber-950">{text}</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-xs rounded-full px-3 py-1 border border-amber-200 hover:bg-amber-100 text-amber-700 transition-colors"
                        >
                            닫기
                        </button>
                    </div>

                    {/* Selection Buttons */}
                    {onSelectSide && (
                        <div className="grid grid-cols-2 gap-4 mt-1">
                            <button
                                onClick={() => onSelectSide('A')}
                                className="flex flex-col items-center justify-center gap-1 p-4 rounded-xl border-2 border-amber-200 bg-white/50 hover:bg-amber-100 hover:border-amber-400 transition-all active:scale-95 group"
                            >
                                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Option A</span>
                                <span className="text-lg font-bold text-gray-900 group-hover:text-amber-800">{sideA}</span>
                            </button>
                            <button
                                onClick={() => onSelectSide('B')}
                                className="flex flex-col items-center justify-center gap-1 p-4 rounded-xl border-2 border-amber-200 bg-white/50 hover:bg-amber-100 hover:border-amber-400 transition-all active:scale-95 group"
                            >
                                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Option B</span>
                                <span className="text-lg font-bold text-gray-900 group-hover:text-amber-800">{sideB}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
