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
import DebateTeamList from "@/app/components/chat/DebateTeamList";
import TopicSelector from "@/app/components/chat/TopicSelector";
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
  const [roomUsers, setRoomUsers] = useState<Record<string, { name: string; side?: 'A' | 'B' }>>({});
  const [endTime, setEndTime] = useState<number | undefined>(undefined);
  const [debateEndTime, setDebateEndTime] = useState<number | undefined>(undefined);
  const [phase, setPhase] = useState<'selecting' | 'debating' | 'final_selecting' | 'waiting'>('waiting');
  const [showUserList, setShowUserList] = useState(false);
  const [hostId, setHostId] = useState<string | null>(null);
  const [showTopicSelector, setShowTopicSelector] = useState(false);

  const userCounts = useMemo(() => {
    const counts = { A: 0, B: 0 };
    Object.values(roomUsers).forEach((u) => {
      if (u.side) counts[u.side]++;
    });
    return counts;
  }, [roomUsers]);

  const TOPIC: Record<string, string> = {
    "1": "따뜻해진 냉면 vs 식어버린 라면",
    "2": "겨울엔 아이스 vs 뜨아",
    "3": "아침 샤워 vs 밤 샤워",
  };

  const handleStartClick = () => {
    setShowTopicSelector(true);
  };

  const handleTopicSelect = (selectedTopic: string) => {
    if (socket) {
      console.log(`📤 start_debate 이벤트 전송: ${selectedTopic}`);
      socket.emit("start_debate", { roomId, topic: selectedTopic, userId });
    } else {
      console.error("❌ 소켓이 연결되지 않음");
    }
    setShowTopicSelector(false);
  };

  const randomTopic = () => {
    // Deprecated, kept for reference if needed but handleStartClick replaces it
    handleStartClick();
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

    s.on("room_state", (data: {
      status: string;
      topic?: string;
      mySide?: 'A' | 'B';
      selectionEndTime?: number;
      debateEndTime?: number;
      finalSelectionEndTime?: number;
      hostId?: string;
    }) => {
      console.log("🔄 방 상태 동기화:", data);
      if (data.hostId) setHostId(data.hostId);
      if (data.topic) setTopic(data.topic);
      if (data.mySide) setSelectedSide(data.mySide);

      // 상태 복구 로직
      if (data.status === 'selecting') {
        setPhase('selecting');
        setOpen(true);
        if (data.selectionEndTime) setEndTime(data.selectionEndTime);
      } else if (data.status === 'debating') {
        setPhase('debating');
        setOpen(false);
        if (data.debateEndTime) setDebateEndTime(data.debateEndTime);
      } else if (data.status === 'final_selecting') {
        setPhase('final_selecting');
        setOpen(true);
        if (data.finalSelectionEndTime) setEndTime(data.finalSelectionEndTime);
      } else {
        setPhase('waiting');
        setOpen(false);
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
      } else if (data.phase === 'debating') {
        setOpen(false);
        setDebateEndTime(data.endTime);
      } else if (data.phase === 'final_selecting') {
        console.log("📢 Final Selecting Phase Triggered! Opening SubjectBox...");
        setOpen(true);
        setEndTime(data.endTime);
        setDebateEndTime(undefined);
      } else if (data.phase === 'waiting') {
        console.log("🛑 Waiting Phase Triggered! Closing SubjectBox...");
        setOpen(false);
        setDebateEndTime(undefined);
        setTopic("주제 미정");
        setSelectedSide(null);
      }
    });

    s.on("side_update", (data: { userId: string; side: 'A' | 'B' }) => {
      console.log("⚖️ 진영 선택 업데이트:", data);
      setRoomUsers((prev) => ({
        ...prev,
        [data.userId]: { ...prev[data.userId], side: data.side },
      }));
    });

    s.on("room_users_update", (data: { users: Record<string, { name: string; side?: 'A' | 'B' }>; hostId?: string } | Record<string, { name: string; side?: 'A' | 'B' }>) => {
      let users: Record<string, { name: string; side?: 'A' | 'B' }> = {};

      if ('users' in data) {
        users = data.users;
        if (data.hostId) setHostId(data.hostId);
      } else {
        users = data;
      }

      console.log("👥 유저 목록 업데이트:", users);
      setRoomUsers(users);

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
    <div className="flex h-[80vh] flex-col bg-white relative overflow-hidden">
      <RoomHeader
        roomId={roomId}
        title={headerTitle}
        participants={Object.keys(roomUsers).length}
        onStart={handleStartClick}
        userSide={selectedSide}
        debateEndTime={debateEndTime}
        onToggleUserList={() => setShowUserList(prev => !prev)}
        isHost={hostId === userId}
      />

      <TopicSelector
        isOpen={showTopicSelector}
        onClose={() => setShowTopicSelector(false)}
        onSelect={handleTopicSelect}
        topics={TOPIC}
      />

      {/* 유저 리스트 드로어 (오른쪽에서 슬라이드) */}
      <div className={`absolute inset-y-0 right-0 w-64 bg-white transform transition-transform duration-300 z-20 ${showUserList ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">참가자 목록</h3>
          <button onClick={() => setShowUserList(false)} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="h-full overflow-y-auto pb-20">
          {topic !== "주제 미정" ? (
            <DebateTeamList topic={topic} users={roomUsers} />
          ) : (
            <div className="p-4">
              <h4 className="text-sm font-bold text-gray-500 mb-2">대기 중인 참가자 ({Object.keys(roomUsers).length}명)</h4>
              <ul className="space-y-2">
                {Object.values(roomUsers).map((u, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-800 bg-gray-50 p-2 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    {u.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* 배경 오버레이 (드로어 열렸을 때) */}
      {showUserList && (
        <div
          className="absolute inset-0 bg-black/20 z-10"
          onClick={() => setShowUserList(false)}
        />
      )}
      <SubjectBox
        text={topic}
        state={open}
        phase={phase}
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
