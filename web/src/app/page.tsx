"use client";
import { io } from "socket.io-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CreateRoom from "./components/CreateRoom";
import Login from "./components/Login"
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"

// import Login from "./components/Login"

// 서버에서 오는 원본 타입
type RawRoom = {
  id: string;
  title: string;
  participants: number; // capacity (정원)이라고 가정
};

// UI에서 쓰는 타입
type Room = {
  id: string;
  name: string;
  currentParticipants: number;
  maxParticipants: number;
};

export default function Home() {
  const router = useRouter();
  const [modalState, setModalState] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loginState, setLoginState] = useState(false)

  // ...

  // ...

  // ...

  // 🔹 서버에서 방 목록 가져오기 & 소켓 연결
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch("https://balancetalk.onrender.com/api/rooms");
        const data: RawRoom[] = await res.json();

        // RawRoom → Room 으로 매핑
        const mapped: Room[] = data.map((room: any) => ({
          id: room.id,
          name: room.title,
          currentParticipants: room.users ? Object.keys(room.users).length : 0,
          maxParticipants: room.participants,
        }));

        setRooms(mapped);
      } catch (e) {
        console.error("방 목록 불러오기 실패:", e);
      }
    };

    fetchRooms();

    // 🔌 소켓 연결 및 이벤트 리스너 설정
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "https://balancetalk.onrender.com", {
      path: "/socket.io",
      transports: ["websocket"],
    });

    socket.on("room_created", (newRoom: RawRoom) => {
      setRooms((prev) => {
        if (prev.some((room) => room.id === newRoom.id)) return prev;
        return [
          {
            id: newRoom.id,
            name: newRoom.title,
            currentParticipants: 1,
            maxParticipants: newRoom.participants,
          },
          ...prev,
        ];
      });
    });

    socket.on("room_updated", (data: { id: string; currentParticipants: number; maxParticipants: number }) => {
      setRooms((prev) =>
        prev.map((room) =>
          room.id === data.id
            ? { ...room, currentParticipants: data.currentParticipants, maxParticipants: data.maxParticipants }
            : room
        )
      );
    });

    socket.on("room_deleted", (roomId: string) => {
      setRooms((prev) => prev.filter((room) => room.id !== roomId));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // 🔹 방 생성
  const handleCreateRoom = async (data: { title: string; participants: number }) => {
    console.log("방 생성 요청:", data);

    // ⚠️ 여기 공백 하나 들어가 있던 거 지워야 함!
    const res = await fetch("https://balancetalk.onrender.com/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      console.error("방 생성 실패");
      return;
    }

    const result = await res.json();
    const created: RawRoom = result.room;

    // 새 방을 현재 리스트에 추가
    const newRoom: Room = {
      id: created.id,
      name: created.title,
      currentParticipants: 1,
      maxParticipants: created.participants,
    };

    setRooms((prev) => {
      if (prev.some((room) => room.id === newRoom.id)) return prev;
      return [newRoom, ...prev];
    });
    setModalState(false);
    router.push(`/room/${created.id}`);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 font-sans">
      <main className="flex flex-col gap-8">
        {/* Actions */}
        <section className="bg-gray-50 border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Join by code */}
            <div className="flex w-full sm:w-auto items-center gap-3">
              <input
                type="text"
                placeholder="방 코드를 입력하세요"
                className="w-full sm:w-60 rounded-xl border-gray-300 px-4 py-2.5 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
              <button onClick={() => setLoginState(true)} className="whitespace-nowrap rounded-xl bg-gray-800 px-5 py-2.5 text-white font-bold hover:bg-gray-900 transition-all duration-200 ease-in-out transform hover:scale-105 cursor-pointer">
                참여
              </button>
            </div>
            <div className="hidden sm:block h-8 border-l border-gray-200" />

            {/* Create room */}
            <div className="flex">
              <button
                className="w-full rounded-xl bg-indigo-600 px-6 py-2.5 text-white font-bold shadow-lg hover:bg-indigo-700 transition-all duration-200 ease-in-out transform hover:scale-105 cursor-pointer"
                onClick={() => setModalState(true)}
              >
                새 토론방 만들기
              </button>
            </div>
          </div>
        </section>

        {/* Create room Modal */}
        {modalState && (
          <Dialog open={modalState}>
            <DialogContent>
              <CreateRoom
                onClose={() => setModalState(false)}
                onSubmit={handleCreateRoom}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
              />
            </DialogContent>
          </Dialog>
        )}
        {loginState && (
          <Dialog open={loginState}>
            <DialogContent>
              <Login className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
                onClose={() => setLoginState(false)}
              />
            </DialogContent>
          </Dialog>
        )}


        {/* Room list */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm min-h-[500px] h-[60vh] overflow-auto">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">현재 활성화된 토론방</h2>
            <span className="rounded-full bg-gray-100 px-3.5 py-1.5 text-sm font-medium text-gray-700">
              총 {rooms.length}개
            </span>
          </div>
          <ul className="space-y-4">
            {rooms.map((room) => {
              const isFull = room.currentParticipants >= room.maxParticipants;
              return (
                <li key={room.id}>
                  <Link href={`/room/${room.id}`} className="block group">
                    <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4 bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-200 ease-in-out">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                          {room.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">ID: {room.id}</p>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${isFull
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : "bg-green-100 text-green-800 border border-green-200"
                            }`}
                        >
                          {isFull ? "참여불가" : "참여가능"}
                        </span>
                        <span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                          {room.currentParticipants} / {room.maxParticipants}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
