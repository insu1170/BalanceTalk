"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import RoomHeader from "@/app/components/chat/RoomHeader";
import MessageList, { Message } from "@/app/components/chat/MessageList";
import ChatBox from "@/app/components/chat/ChatBox";
import SubjectBox from "@/app/components/chat/SubjectBox";
import { io, Socket } from "socket.io-client";

interface MessagePayload {
    id: string;
    userId: string;
    name: string;
    text: string;
    createdAt: number;
}
export default function ChatRoomPage({ params }: { params: { id: string } }) {
    const roomId = params.id;
    const [socket, setSocket] = useState<Socket | null>(null);
    
    const [me] = useState(() => {
    const randomId = Math.floor(Math.random() * 10000);
    return {
        id: `user-${randomId}`,
        name: `사용자 ${randomId}`, // 예: 사용자 1234
    };
});
    
    const [messages, setMessages] = useState<Message[]>([
        { id: "m1", userId: "u1", name: "민수", text: "면 먼저가 국룰임", createdAt: Date.now() - 1000 * 60 * 4 },
        {id: "m2", userId: "u2", name: "지현", text: "국물 예열 필수", createdAt: Date.now() - 1000 * 60 * 3 }
    ]);

    const [open, setOpen] = useState(false);
    const [topic, setTopic] = useState("주제 미정");
    const TOPIC: Record<string, string> = {
        "1": "따뜻해진 냉면 vs 식어버린 라면",
        "2": "겨울엔 아이스 vs 뜨아",
        "3": "아침 샤워 vs 밤 샤워",
    };

    const randomTopic = () => {
        const topicId = Math.floor(Math.random() * 3) + 1;
        setOpen(true);
        setTopic(TOPIC[String(topicId)]);
    };

    useEffect(() => {
        const s = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000", {
            path: "/socket.io",
            transports: ["websocket"],
        });

        setSocket(s);

        // 1) 연결 성공 시 방 입장 요청
        s.on("connect", () => {
            s.emit("join_room", roomId);
        });

        // 2) 서버 메시지 수신 (타입을 맞춰주는 것이 안전)
        s.on("receive_message", (msg: MessagePayload) => {
            // 이미 내가 보낸 메시지가 낙관적 업데이트로 들어가 있다면 중복 방지 (broadcast 사용 시 불필요하지만 안전장치)
            if (msg.userId === me.id) return; 

            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            s.disconnect();
        };
    }, [roomId]); // me.id가 바뀔 일이 없다면 의존성에서 제외

    const handleSend = useCallback(
        (text: string) => {
            if (!socket) return;

            // 3) 데이터 객체로 전송
            const payload = {
                roomId,
                text,
                userId: me.id,
                name: me.name,
            };
            
            socket.emit("send_message", payload);

            // 낙관적 업데이트 (내 화면엔 즉시 표시)
            setMessages((prev) => [
                ...prev,
                { id: crypto.randomUUID(), userId: me.id, name: me.name, text, createdAt: Date.now() },
            ]);
        },
        [socket, roomId]
    );

    const headerTitle = useMemo(() => `밸런스 토론방 · #${roomId}`, [roomId]);

    return (
        <div className="flex h-[80vh] flex-col bg-white">
            <RoomHeader roomId={roomId} title={headerTitle} participants={3} onStart={randomTopic} />
            <SubjectBox text={topic} state={open} onClose={() => setOpen(false)} />
            <MessageList meId={me.id} messages={messages} className="flex-1 overflow-y-auto px-4 py-4" />
            <ChatBox onSend={handleSend} />
        </div>
    );
}