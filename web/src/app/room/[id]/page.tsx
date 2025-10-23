"use client";
import React, { useCallback, useMemo, useState } from "react";
import RoomHeader from "@/app/components/chat/RoomHeader";
import MessageList, { Message } from "@/app/components/chat/MessageList";
import ChatBox from "@/app/components/chat/ChatBox";
import SubjectBox from "@/app/components/chat/SubjectBox";


export default function ChatRoomPage({ params }: { params: { id: string } }) {
    const [open, setOpen] = useState(false);
    const roomId = params.id;


    const [topic, setTopic] = useState('주제 미정')
    // 주제 매핑 (실서비스에선 서버/DB에서 fetch)
    const TOPIC: Record<string, string> = {
        "1": "따뜻해진 냉면 vs 식어버린 라면",
        "2": "겨울엔 아이스 vs 뜨아",
        "3": "아침 샤워 vs 밤 샤워",
    };


    let topicId = 0
    const randomTopic = () => {
        topicId = Math.floor(Math.random() * 3) + 1
        setOpen(true)
        setTopic(TOPIC[topicId])
    }

    const me = { id: "me-001", name: "나" };
    const [messages, setMessages] = useState<Message[]>([
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
            <RoomHeader roomId={roomId} title={headerTitle} participants={3} onStart={randomTopic} />
            {/* 🔔 채팅 상단 공지 영역 */}
            <SubjectBox
                text={topic}
                state={open}
                onClose={() => setOpen(false)}
            />
            <MessageList meId={me.id} messages={messages} className="flex-1 overflow-y-auto px-4 py-4" />
            <ChatBox onSend={handleSend} />
        </div>
    );
}