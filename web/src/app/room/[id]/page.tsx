"use client";
import React, { useCallback, useMemo, useState } from "react";
import RoomHeader from "@/app/components/chat/RoomHeader";
import MessageList, { Message } from "@/app/components/chat/MessageList";
import ChatBox from "@/app/components/chat/ChatBox";

import SubjectBox from "@/app/components/chat/SubjectBox";


export default function ChatRoomPage({ params }: { params: { id: string } }) {
    const roomId = params.id;


    // 주제 매핑 (실서비스에선 서버/DB에서 fetch)
    const TOPIC: Record<string, string> = {
        "1": "라면은 국물 먼저? 면 먼저?",
        "2": "겨울엔 아이스 vs 뜨아",
        "3": "아침 샤워 vs 밤 샤워",
    };
    const topic = TOPIC[roomId] ?? "주제 미정";


    const me = { id: "me-001", name: "나" };
    const [messages, setMessages] = useState<Message[]>([
        // 🔔 공지는 더 이상 메시지로 넣지 않습니다.
        { id: "m1", userId: "u1", name: "민수", text: "면 먼저가 국룰임", createdAt: Date.now() - 1000 * 60 * 4 },
        { id: "m2", userId: "u2", name: "지현", text: "국물 예열 필수", createdAt: Date.now() - 1000 * 60 * 3 },
    ]);


    const handleSend = useCallback((text: string) => {
        setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), userId: me.id, name: me.name, text, createdAt: Date.now() },
        ]);
    }, []);


    const headerTitle = useMemo(() => `밸런스 토론방 · #${roomId}`, [roomId]);


    return (
        <div className="flex h-[80vh] flex-col bg-white">
            <RoomHeader roomId={roomId} title={headerTitle} participants={3} />
            {/* 🔔 채팅 상단 공지 영역 */}
            <SubjectBox text={topic} />


            <MessageList meId={me.id} messages={messages} className="flex-1 overflow-y-auto px-4 py-4" />
            <ChatBox onSend={handleSend} />
        </div>
    );
}