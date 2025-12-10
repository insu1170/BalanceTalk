import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { joinRoom, startDebate, selectSide, getUserSide, startMainDebate, startFinalSelection, endDebate } from "./rooms";

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
                side: side,
                createdAt: Date.now(),
            });
        });

        // 3) 토론 시작 처리
        socket.on("start_debate", (data: { roomId: string; topic: string }) => {
            console.log(`📢 [Room: ${data.roomId}] 토론 시작: ${data.topic}`);

            startDebate(data.roomId, data.topic);

            // 1단계: 진영 선택 단계 시작 알림 (10초)
            io.to(data.roomId).emit("debate_progress", {
                phase: 'selecting',
                topic: data.topic,
                endTime: Date.now() + 10000,
            });

            // 10초 후 본 토론 시작
            setTimeout(() => {
                console.log(`⏰ [Room: ${data.roomId}] 선택 종료 -> 토론 시작`);
                // 테스트를 위해 10초(10000ms)로 설정
                const updatedRoom = startMainDebate(data.roomId, 10000);
                if (updatedRoom) {
                    io.to(data.roomId).emit("debate_progress", {
                        phase: 'debating',
                        endTime: updatedRoom.debateEndTime,
                    });

                    // 자동 배정된 결과도 알려줘야 함
                    io.to(data.roomId).emit("room_users_update", updatedRoom.users);

                    // 5분(또는 테스트용 짧은 시간) 후 최종 선택 단계 시작
                    // const DEBATE_DURATION = 5 * 60 * 1000;
                    const DEBATE_DURATION = 10000; // 👈 테스트를 위해 10초로 단축!

                    setTimeout(() => {
                        console.log(`⏰ [Room: ${data.roomId}] 토론 종료 -> 최종 선택 시작`);
                        const finalRoom = startFinalSelection(data.roomId);
                        if (finalRoom) {
                            io.to(data.roomId).emit("debate_progress", {
                                phase: 'final_selecting',
                                endTime: finalRoom.finalSelectionEndTime,
                            });

                            // 10초 후 토론 종료 및 초기화
                            setTimeout(() => {
                                console.log(`⏰ [Room: ${data.roomId}] 최종 선택 종료 -> 대기 상태로 복귀`);
                                const resetRoom = endDebate(data.roomId);
                                if (resetRoom) {
                                    io.to(data.roomId).emit("debate_progress", {
                                        phase: 'waiting',
                                        endTime: 0,
                                    });
                                    // 유저 상태 초기화 알림
                                    io.to(data.roomId).emit("room_users_update", resetRoom.users);
                                }
                            }, 10000);
                        }
                    }, DEBATE_DURATION);
                }
            }, 10000);
        });

        // 4) 진영 선택 처리
        socket.on("select_side", (data: { roomId: string; userId: string; side: 'A' | 'B' }) => {
            console.log(`⚖️ [Room: ${data.roomId}] ${data.userId}님이 ${data.side} 진영 선택`);

            const success = selectSide(data.roomId, data.userId, data.side);
            if (success) {
                // 실시간 선택 현황 브로드캐스트
                io.to(data.roomId).emit("side_update", {
                    userId: data.userId,
                    side: data.side,
                });
            }
        });
    });
};

export default webSocket;