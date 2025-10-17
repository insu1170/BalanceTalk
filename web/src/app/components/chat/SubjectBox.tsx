"use client";
import React, { useState } from "react";


export default function SubjectBox({ text }: { text: string }) {
    const [open, setOpen] = useState(true);
    if (!open) return null;
    return (
        <div className="sticky top-12 z-10 w-full border-b bg-amber-50/90 backdrop-blur supports-[backdrop-filter]:bg-amber-50/70">
            <div className="mx-auto max-w-4xl px-4 py-2 flex items-center gap-2 text-amber-900">
                <span className="text-sm">📢</span>
                <p className="flex-1 text-sm truncate"><strong className="mr-1">주제:</strong><b>{text}</b></p>
                <button
                    onClick={() => setOpen(false)}
                    className="text-xs rounded-md px-2 py-1 border hover:bg-amber-100"
                >닫기</button>
            </div>
        </div>
    );
}