"use client";
import React, { useEffect, useMemo, useRef } from "react";


export type Message = {
    id: string;
    userId: string;
    name: string;
    text: string;
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
    const endRef = useRef<HTMLDivElement | null>(null);


    // sort by createdAt ascending just in case
    const sorted = useMemo(() => [...messages].sort((a, b) => a.createdAt - b.createdAt), [messages]);


    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [sorted.length]);


    return (
        <div className={`mx-auto max-w-4xl w-full ${className ?? ""}`}>
            <ul className="flex flex-col gap-2">
                {sorted.map((m) => {
                    const mine = m.userId === meId;
                    return (
                        <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] ${mine ? "items-end text-right" : "items-start"} flex flex-col gap-1`}>
                                <div className={`text-xs ${mine ? "text-gray-500" : "text-gray-600"}`}>{mine ? "나" : m.name}</div>
                                <div className={`rounded-2xl px-3 py-2 leading-relaxed shadow-sm ${mine ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}>
                                    {m.text}
                                </div>
                                <div className="text-[10px] text-gray-400">{formatTime(m.createdAt)}</div>
                            </div>
                        </li>
                    );
                })}
                <div ref={endRef} />
            </ul>
        </div>
    );
}