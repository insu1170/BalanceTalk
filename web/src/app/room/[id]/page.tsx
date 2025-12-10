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
  side?: 'A' | 'B';
  createdAt: string | number;
}

export default function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = React.use(params);

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
  const [userSides, setUserSides] = useState<Record<string, 'A' | 'B'>>({});
  const [endTime, setEndTime] = useState<number | undefined>(undefined);
  const [debateEndTime, setDebateEndTime] = useState<number | undefined>(undefined); // 👈 복구
  const [phase, setPhase] = useState<'selecting' | 'debating' | 'final_selecting' | 'waiting'>('waiting');

  // ... (existing code)


  const userCounts = useMemo(() => {
    const counts = { A: 0, B: 0 };
    Object.values(userSides).forEach((side) => {
      if (side) counts[side]++;
    });
    return counts;
  }, [userSides]);

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
          side: m.side,
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
      s.emit("join_room", { roomId, userId, name });
    });

    s.on("room_state", (data: { status: string; topic?: string; mySide?: 'A' | 'B'; selectionEndTime?: number; debateEndTime?: number }) => {
      console.log("🔄 방 상태 동기화:", data);
      if (data.topic) setTopic(data.topic);
      if (data.mySide) setSelectedSide(data.mySide);

      if (data.status === 'selecting') {
        setOpen(true);
        if (data.selectionEndTime) setEndTime(data.selectionEndTime);
      } else if (data.status === 'debating') {
        setOpen(false);
        if (data.debateEndTime) setDebateEndTime(data.debateEndTime);
      }
    });

    s.on("error", (err: { message: string }) => {
      alert(err.message);
      window.location.href = "/";
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
          side: msg.side,
          createdAt:
            typeof msg.createdAt === "string"
              ? new Date(msg.createdAt).getTime()
              : msg.createdAt,
        },
      ]);
    });

    s.on("debate_progress", (data: { phase: 'selecting' | 'debating' | 'final_selecting' | 'waiting'; topic?: string; endTime: number }) => {
      console.log("⏳ 토론 진행 상태:", data);
      setPhase(data.phase);
      if (data.phase === 'selecting') {
        if (data.topic) setTopic(data.topic);
        setEndTime(data.endTime);
        setOpen(true);
        setSelectedSide(null);
        setUserSides({});
      } else if (data.phase === 'debating') {
        setOpen(false);
        setDebateEndTime(data.endTime);
      } else if (data.phase === 'final_selecting') {
        console.log("📢 Final Selecting Phase Triggered! Opening SubjectBox...");
        setOpen(true); // 다시 열기
        setEndTime(data.endTime);
        setDebateEndTime(undefined); // 타이머 제거
      } else if (data.phase === 'waiting') {
        console.log("🛑 Waiting Phase Triggered! Closing SubjectBox...");
        setOpen(false);
        setDebateEndTime(undefined);
        setTopic("주제 미정");
        setSelectedSide(null);
        setUserSides({});
      }
    });

    s.on("side_update", (data: { userId: string; side: 'A' | 'B' }) => {
      console.log("⚖️ 진영 선택 업데이트:", data);
      setUserSides((prev) => ({
        ...prev,
        [data.userId]: data.side,
      }));
    });

    s.on("room_users_update", (users: Record<string, { side?: 'A' | 'B' }>) => {
      const newSides: Record<string, 'A' | 'B'> = {};
      Object.entries(users).forEach(([uid, u]) => {
        if (u.side) newSides[uid] = u.side;
      });
      setUserSides(newSides);

      if (users[userId]?.side) {
        setSelectedSide(users[userId].side);
      }
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
        side: selectedSide ?? undefined,
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
        debateEndTime={debateEndTime}
      />
      <SubjectBox
        text={topic}
        state={open}
        phase={phase} // 👈 phase 전달 추가
        onClose={() => setOpen(false)}
        endTime={endTime}
        userCounts={userCounts}
        mySelection={selectedSide}
        onSelectSide={(side) => {
          setSelectedSide(side);
          console.log(`진영 선택: ${side}`);
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
