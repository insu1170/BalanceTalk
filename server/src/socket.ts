import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";

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
        socket.on("join_room", (roomId: string) => {
            socket.join(roomId);
            console.log(`🚪 ${socket.id}님이 ${roomId}방에 입장하셨습니다.`);
        });

        // 2) 메시지 전송 처리
        // 데이터 구조를 { roomId, text } 등으로 명확히 받는 것이 좋습니다.
        socket.on("send_message", (data: { roomId: string; text: string; userId: string; name: string }) => {
            console.log(`📨 [Room: ${data.roomId}] ${data.name}: ${data.text}`);

            // broadcast: 보낸 사람(socket)을 제외한 나머지 방 사람들에게만 전송
            // 낙관적 업데이트를 사용하므로 보낸 사람에게 다시 보낼 필요 없음
            socket.to(data.roomId).emit("receive_message", {
                id: crypto.randomUUID(), // 서버에서 ID 생성 권장
                userId: data.userId,
                name: data.name,
                text: data.text,
                createdAt: Date.now(),
            });
        });

        // 3) 토론 시작 처리
        socket.on("start_debate", (data: { roomId: string; topic: string }) => {
            console.log(`📢 [Room: ${data.roomId}] 토론 시작: ${data.topic}`);
            // 방에 있는 모든 사람(나 포함)에게 전송
            io.to(data.roomId).emit("start_debate", {
                topic: data.topic,
            });
        });
    });
};

export default webSocket;