import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { joinRoom, startDebate, selectSide, getUserSide } from "./rooms";

const webSocket = (server: HTTPServer) => {
    const io = new SocketIOServer(server, {
        path: "/socket.io",
        cors: {
            origin: "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true,
        },
        transports: ["websocket", "polling"],
    });

    io.on("connection", (socket: Socket) => {
        console.log("✅ 소켓 연결됨:", socket.id);

        // 1) 방 입장 처리
        socket.on("join_room", (data: { roomId: string; userId: string; name: string }) => {
            const { roomId, userId, name } = data;
            const result = joinRoom(roomId, userId, name);

            if (!result.success) {
                socket.emit("error", { message: result.message });
                return;
            }

            socket.join(roomId);
            console.log(`🚪 ${name}(${userId})님이 ${roomId}방에 입장하셨습니다.`);

            // 현재 방 상태 전송 (토론 주제, 내 진영 등)
            const room = result.room;
            if (room) {
                socket.emit("room_state", {
                    status: room.status,
                    topic: room.topic,
                    mySide: room.users[userId]?.side,
                });
            }
        });

        // 2) 메시지 전송 처리
        socket.on("send_message", (data: { roomId: string; text: string; userId: string; name: string }) => {
            console.log(`📨 [Room: ${data.roomId}] ${data.name}: ${data.text}`);

            // 유저의 진영 정보 가져오기
            const side = getUserSide(data.roomId, data.userId);

            socket.to(data.roomId).emit("receive_message", {
                id: crypto.randomUUID(),
                userId: data.userId,
                name: data.name,
                text: data.text,
                side: side, // 👈 진영 정보 추가
                createdAt: Date.now(),
            });
        });

        // 3) 토론 시작 처리
        socket.on("start_debate", (data: { roomId: string; topic: string }) => {
            console.log(`📢 [Room: ${data.roomId}] 토론 시작: ${data.topic}`);

            startDebate(data.roomId, data.topic);

            io.to(data.roomId).emit("start_debate", {
                topic: data.topic,
            });
        });

        // 4) 진영 선택 처리
        socket.on("select_side", (data: { roomId: string; userId: string; side: 'A' | 'B' }) => {
            console.log(`⚖️ [Room: ${data.roomId}] ${data.userId}님이 ${data.side} 진영 선택`);

            const success = selectSide(data.roomId, data.userId, data.side);
            if (success) {
                // 나에게는 확정 알림 (필요 시)
                // 방 전체에는 알릴 필요가 있나? (채팅 칠 때만 보여주면 됨)
            }
        });
    });
};

export default webSocket;