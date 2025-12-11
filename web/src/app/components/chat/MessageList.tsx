"use client";

import React, { useMemo } from "react";
import { Virtuoso } from "react-virtuoso";

export type Message = {
    id: string;
    userId: string;
    name: string;
    text: string;
    side?: "A" | "B";
    createdAt: number; // epoch ms
};

export type MessageListProps = {
    meId: string;
    messages: Message[];
    className?: string;
};

function formatTime(ts: number) {
    const d = new Date(ts);
    const hh = `${d.getHours()}`.padStart(2, "0");
    const mm = `${d.getMinutes()}`.padStart(2, "0");
    return `${hh}:${mm}`;
}

export default function MessageList({ meId, messages, className }: MessageListProps) {
    // 시간 기준 정렬 (기존과 동일)
    const sorted = useMemo(
        () => [...messages].sort((a, b) => a.createdAt - b.createdAt),
        [messages]
    );

    return (
        <div className={`mx-auto max-w-4xl w-full ${className ?? ""}`}>
            <Virtuoso
                data={sorted}
                // 채팅처럼 항상 아래쪽(최근 메시지)부터 보이게
                initialTopMostItemIndex={sorted.length - 1}
                followOutput="auto" // 새 메시지 생기면 자동으로 아래로 스크롤(내려와 있는 상태일 때)
                itemContent={(index, m) => {
                    const mine = m.userId === meId;
                    return (
                        <div
                            key={m.id}
                            className={`flex ${mine ? "justify-end" : "justify-start"} py-1`}
                        >
                            <div
                                className={`max-w-[80%] ${mine ? "items-end text-right" : "items-start"
                                    } flex flex-col gap-1`}
                            >
                                <div
                                    className={`text-xs flex items-center gap-1 ${mine ? "text-gray-500 flex-row-reverse" : "text-gray-600"
                                        }`}
                                >
                                    <span>{mine ? "나" : m.name}</span>
                                    {m.side && (
                                        <span
                                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${m.side === "A"
                                                ? "bg-amber-100 text-amber-700"
                                                : "bg-blue-100 text-blue-700"
                                                }`}
                                        >
                                            {m.side}
                                        </span>
                                    )}
                                </div>
                                <div
                                    className={`rounded-2xl px-3 py-2 leading-relaxed shadow-sm ${mine
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-900"
                                        }`}
                                >
                                    {m.text}
                                </div>
                                <div className="text-[10px] text-gray-400">
                                    {formatTime(m.createdAt)}
                                </div>
                            </div>
                        </div>
                    );
                }}
                className="flex flex-col gap-2"
            />
        </div>
    );
}
