"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";


export type ChatBoxProps = {
    onSend: (text: string) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
};


export default function ChatBox({ onSend, disabled, placeholder = "메시지를 입력하세요… (Enter: 전송, Shift+Enter: 줄바꿈)", className }: ChatBoxProps) {
    const [text, setText] = useState("");
    const taRef = useRef<HTMLTextAreaElement | null>(null);


    const send = useCallback(() => {
        const value = text.trim();
        if (!value) return;
        onSend(value);
        setText("");
    }, [onSend, text]);


    // auto-resize textarea
    useEffect(() => {
        const el = taRef.current;
        if (!el) return;
        el.style.height = "0px";
        el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }, [text]);


    return (
        <div className={`border-t bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 ${className ?? ""}`}>
            <div className="mx-auto max-w-4xl w-full px-4 py-3">
                <div className="flex items-end gap-2">
                    <textarea
                        ref={taRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                send();
                            }
                        }}
                        disabled={!!disabled}
                        placeholder={placeholder}
                        rows={1}
                        className="flex-1 resize-none rounded-2xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60"
                    />
                    <button
                        type="button"
                        onClick={send}
                        disabled={!!disabled}
                        className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                        전송
                    </button>
                </div>
            </div>
        </div>
    );
}