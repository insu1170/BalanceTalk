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
import { UserContext } from "@/app/components/appShell"; // 파일 경로는 실제 구조에 맞게

interface ServerMessagePayload {
  id: string;
  user?: string;
  userId?: string;
  name?: string;
  text: string;
  createdAt: string | number;
}

export default function ChatRoomPage({ params }: { params: { id: string } }) {
  const roomId = params.id;

  // 🔹 전역 유저 정보 (AppShell에서 제공)
  const user = useContext(UserContext);
  if (!user) {
    // 아직 AppShell에서 user를 못 만들었을 때 (첫 렌더)
    return null; // 필요하면 로딩 UI로 바꿔도 됨
  }

  const { userId, name } = user;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("주제 미정");
  const [selectedSide, setSelectedSide] = useState<'A' | 'B' | null>(null); // 👈 진영 선택 상태 추가

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

  // 🔹 초기 로딩 + 소켓 연결
  useEffect(() => {
    // 1) HTTP로 이전 채팅 로그 불러오기
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

    // 2) 소켓 연결
    const s = io(
      process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000",
      {
        path: "/socket.io",
        transports: ["websocket"],
      }
    );

    setSocket(s);

    s.on("connect", () => {
      // 방 입장
      s.emit("join_room", roomId);
    });

    // 서버에서 브로드캐스트된 메시지 수신
    s.on("receive_message", (msg: ServerMessagePayload) => {
      // 내가 보낸 메시지면 이미 로컬에 추가했으니 스킵
      if (msg.userId && msg.userId === userId) return;

      setMessages((prev) => [
        ...prev,
        {
          id: msg.id,
          userId: msg.userId ?? "unknown",
          name: msg.name ?? msg.user ?? "익명",
          text: msg.text,
          createdAt:
            typeof msg.createdAt === "string"
              ? new Date(msg.createdAt).getTime()
              : msg.createdAt,
        },
      ]);
    });

    // 토론 시작 이벤트 수신
    s.on("start_debate", (data: { topic: string }) => {
      console.log(`📥 start_debate 이벤트 수신: ${data.topic}`);
      setTopic(data.topic);
      setOpen(true);
      setSelectedSide(null); // 새로운 토론 시작 시 선택 초기화
    });

    return () => {
      s.emit("leave_room", roomId);
      s.disconnect();
    };
  }, [roomId, userId]);

  // 🔹 메시지 전송 핸들러 (ChatBox → 여기로)
  const handleSend = useCallback(
    async (text: string) => {
      if (!socket) return;

      // 1) 서버에 먼저 저장 (logs/{roomId}.json)
      const res = await fetch(
        `http://localhost:4000/api/rooms/${roomId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: name,
            userId, // 👈 userId 전송 추가
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
        createdAt:
          typeof saved.createdAt === "string"
            ? new Date(saved.createdAt).getTime()
            : saved.createdAt,
      };

      // 2) 내 화면에는 즉시 반영
      setMessages((prev) => [...prev, mapped]);

      // 3) 다른 유저에게 브로드캐스트 (소켓)
      socket.emit("send_message", {
        roomId,
        ...saved,
        userId: mapped.userId,
        name: mapped.name,
      });
    },
    [socket, roomId, userId, name]
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
      />
      <SubjectBox
        text={topic}
        state={open}
        onClose={() => setOpen(false)}
        onSelectSide={(side) => {
          setSelectedSide(side);
          console.log(`진영 선택: ${side}`);
          // TODO: 서버에 진영 선택 정보 전송
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
