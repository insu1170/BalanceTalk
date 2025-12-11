import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { joinRoom, startDebate, selectSide, getUserSide, startMainDebate, startFinalSelection, endDebate, leaveRoom, getRoom } from "./rooms";

let io: SocketIOServer;

export const initSocket = (server: HTTPServer) => {
    io = new SocketIOServer(server, {
        path: "/socket.io",
        cors: {
            origin: "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true,
        },
        transports: ["websocket", "polling"],
    });

    // Disconnect timers: userId -> Timeout
    const disconnectTimers = new Map<string, NodeJS.Timeout>();

    io.on("connection", (socket: Socket) => {
        console.log("✅ 소켓 연결됨:", socket.id);

        let currentRoomId: string | null = null;
        let currentUserId: string | null = null;

        // 1) 방 입장 처리
        socket.on("join_room", (data: { roomId: string; userId: string; name: string }) => {
            const { roomId, userId, name } = data;

            // 재접속 시 기존 타이머 취소
            if (disconnectTimers.has(userId)) {
                console.log(`♻️ User ${userId} reconnected, clearing disconnect timer`);
                clearTimeout(disconnectTimers.get(userId)!);
                disconnectTimers.delete(userId);
            }

            const result = joinRoom(roomId, userId, name);

            if (!result.success) {
                socket.emit("error", { message: result.message });
                return;
            }

            // 입장 성공 시에만 세션 상태 업데이트
            currentRoomId = roomId;
            currentUserId = userId;

            socket.join(roomId);
            console.log(`🚪 ${name}(${userId})님이 ${roomId}방에 입장하셨습니다.`);

            // 현재 방 상태 전송 (토론 주제, 내 진영 등)
            const room = result.room;
            if (room) {
                const hostId = Object.keys(room.users)[0]; // 첫 번째 유저가 방장

                socket.emit("room_state", {
                    status: room.status,
                    topic: room.topic,
                    mySide: room.users[userId]?.side,
                    selectionEndTime: room.selectionEndTime,
                    debateEndTime: room.debateEndTime,
                    finalSelectionEndTime: room.finalSelectionEndTime,
                    hostId: hostId, // 👈 방장 ID 전송
                });

                // 👈 입장 시 유저 목록 업데이트 브로드캐스트 추가
                io.to(roomId).emit("room_users_update", { users: room.users, hostId });

                // 📢 방 목록 갱신을 위한 전체 브로드캐스트
                io.emit("room_updated", {
                    id: roomId,
                    currentParticipants: Object.keys(room.users).length,
                    maxParticipants: room.participants,
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
        socket.on("start_debate", (data: { roomId: string; topic: string; userId: string }) => {
            console.log(`📢 [Room: ${data.roomId}] 토론 시작 요청: ${data.topic} by ${data.userId}`);

            // 방장 권한 확인
            const room = getRoom(data.roomId);
            if (!room) return;

            const hostId = Object.keys(room.users)[0];
            if (hostId !== data.userId) {
                console.log(`🚫 권한 없음: ${data.userId}는 방장이 아님 (방장: ${hostId})`);
                socket.emit("error", { message: "방장만 토론을 시작할 수 있습니다." });
                return;
            }

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
                    const hostId = Object.keys(updatedRoom.users)[0];
                    io.to(data.roomId).emit("room_users_update", { users: updatedRoom.users, hostId });

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
                                    const hostId = Object.keys(resetRoom.users)[0];
                                    io.to(data.roomId).emit("room_users_update", { users: resetRoom.users, hostId });
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

        // 5) 연결 종료 처리
        socket.on("disconnect", () => {
            if (currentRoomId && currentUserId) {
                console.log(`🔌 Disconnect detected: ${currentUserId} from ${currentRoomId}`);

                const room = getRoom(currentRoomId);
                if (!room) return;

                // 모든 상태에서 유예 시간(2초) 부여 (새로고침 지원)
                console.log(`⏳ User ${currentUserId} disconnected. Scheduling removal in 2s.`);

                const timer = setTimeout(() => {
                    console.log(`⏰ Disconnect timeout reached for ${currentUserId}. Removing from room.`);
                    const updatedRoom = leaveRoom(currentRoomId!, currentUserId!); // ! checks are safe due to closure
                    if (updatedRoom) {
                        const hostId = Object.keys(updatedRoom.users)[0];
                        io.to(currentRoomId!).emit("room_users_update", { users: updatedRoom.users, hostId });

                        // 📢 방 목록 갱신을 위한 전체 브로드캐스트 (퇴장 시)
                        io.emit("room_updated", {
                            id: currentRoomId!,
                            currentParticipants: Object.keys(updatedRoom.users).length,
                            maxParticipants: updatedRoom.participants,
                        });
                    } else {
                        // 방이 삭제된 경우 (null 반환)
                        console.log(`🗑️ Room ${currentRoomId} deleted (empty). Broadcasting room_deleted.`);
                        io.emit("room_deleted", currentRoomId!);
                    }
                    disconnectTimers.delete(currentUserId!);
                }, 2000); // 2초

                disconnectTimers.set(currentUserId, timer);
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};