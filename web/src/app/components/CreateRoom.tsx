"use client";
import { useState } from "react";

type Props = {
    defaultParticipants?: number;
    onSubmit?: (data: { title: string; participants: number }) => void;
    onClose?: () => void;
    className?: string;
};

export default function CreateRoom({
    defaultParticipants = 4,
    onSubmit,
    onClose,
    className = "",
}: Props) {
    const [title, setTitle] = useState("");
    const [participants, setParticipants] = useState(defaultParticipants);

    return (
        <div className={`w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ${className}`}>
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">새로운 방 만들기</h3>
                <button onClick={onClose} className="h-8 w-8 rounded-md text-gray-500 hover:bg-gray-100">✕</button>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">방 제목</label>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: 커피 vs 차"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">인원 선택</label>
                <div className="grid grid-cols-4 gap-2">
                    {[2, 4, 6, 8].map(n => (
                        <label key={n}
                            className={`flex cursor-pointer items-center justify-center rounded-md border py-2 transition
                ${participants === n ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}>
                            <input type="radio" name="participants" className="hidden"
                                checked={participants === n} onChange={() => setParticipants(n)} />
                            {n}명
                        </label>
                    ))}
                </div>
            </div>

            <button
                onClick={() => onSubmit?.({ title, participants })}
                className="w-full rounded-md bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-700"
            >
                방 만들기
            </button>
        </div>
    );
}
