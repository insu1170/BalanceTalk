"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useContext,
} from "react";
import RoomHeader from "@/app/components/chat/RoomHeader";
import MessageList, { Message } from "@/app/components/chat/MessageList";
import ChatBox from "@/app/components/chat/ChatBox";
import SubjectBox from "@/app/components/chat/SubjectBox";
import { io, Socket } from "socket.io-client";
import { UserContext } from "@/app/components/appShell";

interface ServerMessagePayload {
  id: string;
  user?: string;
  userId?: string;
  name?: string;
  text: string;
  side?: 'A' | 'B'; // 👈 진영 정보 추가
  createdAt: string | number;
}

export default function ChatRoomPage({ params }: { params: { id: string } }) {
  const roomId = params.id;

  const user = useContext(UserContext);
  if (!user) {
    return null;
  }

  const { userId, name } = user;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("주제 미정");
  const [selectedSide, setSelectedSide] = useState<'A' | 'B' | null>(null);

  const TOPIC: Record<string, string> = {
    "1": "따뜻해진 냉면 vs 식어버린 라면",
    "2": "겨울엔 아이스 vs 뜨아",
    "3": "아침 샤워 vs 밤 샤워",
  };

  const randomTopic = () => {
    console.log("🔘 토론 시작 버튼 클릭됨");
    const topicId = Math.floor(Math.random() * 3) + 1;
    const newTopic = TOPIC[String(topicId)];

    if (socket) {
      console.log(`📤 start_debate 이벤트 전송: ${newTopic}`);
      socket.emit("start_debate", { roomId, topic: newTopic });
    } else {
      console.error("❌ 소켓이 연결되지 않음");
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `http://localhost:4000/api/rooms/${roomId}/messages`
        );
        const data: ServerMessagePayload[] = await res.json();

        const mapped: Message[] = data.map((m) => ({
          id: m.id,
          userId: m.userId ?? "unknown",
          name: m.name ?? m.user ?? "익명",
          text: m.text,
          side: m.side, // 👈 진영 정보 매핑
          createdAt:
            typeof m.createdAt === "string"
              ? new Date(m.createdAt).getTime()
              : m.createdAt,
        }));

        setMessages(mapped);
      } catch (e) {
        console.error("메시지 불러오기 실패:", e);
      }
    };

    fetchMessages();

    const s = io(
      process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000",
      {
        path: "/socket.io",
        transports: ["websocket"],
      }
    );

    setSocket(s);

    s.on("connect", () => {
      // 방 입장 (유저 정보 포함)
      s.emit("join_room", { roomId, userId, name });
    });

    // 🔹 방 상태 복구 (새로고침 시)
    s.on("room_state", (data: { status: string; topic?: string; mySide?: 'A' | 'B' }) => {
      console.log("🔄 방 상태 동기화:", data);
      if (data.status === 'debating' && data.topic) {
        setTopic(data.topic);
        // 내가 아직 선택 안했으면 배너 띄우기 (선택했으면 안 띄움)
        if (!data.mySide) {
          setOpen(true);
        }
      }
      if (data.mySide) {
        setSelectedSide(data.mySide);
      }
    });

    s.on("error", (err: { message: string }) => {
      alert(err.message);
      window.location.href = "/"; // 에러 시 목록으로 이동 (예: 방 꽉참, 이미 시작됨)
    });

    s.on("receive_message", (msg: ServerMessagePayload) => {
      if (msg.userId && msg.userId === userId) return;

      setMessages((prev) => [
        ...prev,
        {
          id: msg.id,
          userId: msg.userId ?? "unknown",
          name: msg.name ?? msg.user ?? "익명",
          text: msg.text,
          side: msg.side, // 👈 진영 정보 수신
          createdAt:
            typeof msg.createdAt === "string"
              ? new Date(msg.createdAt).getTime()
              : msg.createdAt,
        },
      ]);
    });

    s.on("start_debate", (data: { topic: string }) => {
      console.log(`📥 start_debate 이벤트 수신: ${data.topic}`);
      setTopic(data.topic);
      setOpen(true);
      setSelectedSide(null);
    });

    return () => {
      s.emit("leave_room", roomId);
      s.disconnect();
    };
  }, [roomId, userId, name]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!socket) return;

      const res = await fetch(
        `http://localhost:4000/api/rooms/${roomId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: name,
            userId,
            text,
          }),
        }
      );

      if (!res.ok) {
        console.error("메시지 저장 실패");
        return;
      }

      const result = await res.json();
      const saved: ServerMessagePayload = result.data;

      const mapped: Message = {
        id: saved.id,
        userId: saved.userId ?? userId,
        name: saved.name ?? saved.user ?? name,
        text: saved.text,
        side: selectedSide ?? undefined, // 👈 내 진영 정보 추가 (로컬 표시용)
        createdAt:
          typeof saved.createdAt === "string"
            ? new Date(saved.createdAt).getTime()
            : saved.createdAt,
      };

      setMessages((prev) => [...prev, mapped]);

      socket.emit("send_message", {
        roomId,
        ...saved,
        userId: mapped.userId,
        name: mapped.name,
      });
    },
    [socket, roomId, userId, name, selectedSide]
  );

  const headerTitle = useMemo(
    () => `밸런스 토론방 · #${roomId}`,
    [roomId]
  );

  return (
    <div className="flex h-[80vh] flex-col bg-white">
      <RoomHeader
        roomId={roomId}
        title={headerTitle}
        participants={3}
        onStart={randomTopic}
        userSide={selectedSide}
      />
      <SubjectBox
        text={topic}
        state={open}
        onClose={() => setOpen(false)}
        onSelectSide={(side) => {
          setSelectedSide(side);
          setOpen(false);
          console.log(`진영 선택: ${side}`);
          // 서버에 진영 선택 정보 전송
          socket?.emit("select_side", { roomId, userId, side });
        }}
      />
      <MessageList
        meId={userId}
        messages={messages}
        className="flex-1 overflow-y-auto px-4 py-4"
      />
      <ChatBox onSend={handleSend} />
    </div>
  );
}
