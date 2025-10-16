"use client";
import Link from "next/link";
import TextField from "../components/TextInputField";
import { useState } from "react";


interface CreateRoomProps {
    className?: string;
}

const CreateRoom = ({ className = "" }) => {
    const [participants, setParticipants] = useState<number>(4);

    return (
        <div className={`mx-auto w-full max-w-md bg-gray-100 p-6 rounded-xl shadow-sm font-sans fl items-center justify-center ${className}`}>
            <div className="flex justify-end">
                <button className="text-gray-500 hover:text-gray-700 cursor-pointer text-lg font-semibold">
                    ✕
                </button>
            </div>

            {/* 방 제목 */}
            <TextField label="방 제목" placeholder="예: 커피 vs 차" />

            {/* 인원 선택 */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    인원 선택
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {[2, 4, 6, 8].map((num) => (
                        <label
                            key={num}
                            className={`flex items-center justify-center py-2 rounded-md border cursor-pointer transition-colors
                ${participants === num
                                    ? "bg-blue-500 text-white border-blue-500"
                                    : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
                                }`}
                        >
                            <input
                                type="radio"
                                name="participants"
                                value={num}
                                checked={participants === num}
                                onChange={() => setParticipants(num)}
                                className="hidden"
                            />
                            {num}명
                        </label>
                    ))}
                </div>
            </div>

            <button className="w-full bg-blue-500 text-white py-2 rounded-md font-semibold hover:bg-blue-600 transition-colors">
                방 만들기
            </button>

            <div className="mt-6 text-center">
                <Link
                    href="/"
                    className="text-sm text-gray-600 hover:text-blue-500 underline"
                >
                    ← 홈으로 돌아가기
                </Link>
            </div>
        </div>
    );
};

export default CreateRoom;
