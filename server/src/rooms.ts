import fs from "fs";
import path from "path";

const ROOMS_FILE = path.join(process.cwd(), "rooms", "room.json");

export interface Room {
    id: string;
    title: string;
    participants: number; // max capacity
    status: 'waiting' | 'selecting' | 'debating' | 'final_selecting';
    topic?: string;
    selectionEndTime?: number;
    debateEndTime?: number;
    finalSelectionEndTime?: number; // 👈 최종 선택 종료 시간
    users: Record<string, { side?: 'A' | 'B'; name: string }>; // userId -> info
}

// Helper to read rooms
const readRooms = (): Room[] => {
    if (!fs.existsSync(ROOMS_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(ROOMS_FILE, "utf-8"));
    } catch {
        return [];
    }
};

// Helper to write rooms
const writeRooms = (rooms: Room[]) => {
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(rooms, null, 2));
};

export const getRooms = () => readRooms();

export const getRoom = (roomId: string): Room | undefined => {
    const rooms = readRooms();
    return rooms.find((r) => r.id === roomId);
};

export const createRoom = (title: string, participants: number): Room => {
    const rooms = readRooms();
    const newRoom: Room = {
        id: Date.now().toString(),
        title,
        participants,
        status: 'waiting',
        users: {},
    };
    rooms.push(newRoom);
    writeRooms(rooms);
    return newRoom;
};

export const joinRoom = (roomId: string, userId: string, name: string): { success: boolean; message?: string; room?: Room } => {
    const rooms = readRooms();
    const roomIndex = rooms.findIndex((r) => r.id === roomId);
    if (roomIndex === -1) return { success: false, message: "Room not found" };

    const room = rooms[roomIndex];

    // Migration: ensure users object exists
    if (!room.users) {
        room.users = {};
    }

    // If user is already in, just update name (or do nothing)
    if (room.users[userId]) {
        room.users[userId].name = name;
        writeRooms(rooms);
        return { success: true, room };
    }

    // Check lock
    if (room.status === 'debating') {
        return { success: false, message: "Debate already started" };
    }

    // Check capacity (simple count check)
    if (Object.keys(room.users).length >= room.participants) {
        return { success: false, message: "Room is full" };
    }

    // Add user
    room.users[userId] = { name };
    writeRooms(rooms);
    return { success: true, room };
};

export const startDebate = (roomId: string, topic: string) => {
    const rooms = readRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
        room.status = 'selecting';
        room.topic = topic;
        room.selectionEndTime = Date.now() + 10000; // 10초 후 종료
        writeRooms(rooms);
    }
};

export const startMainDebate = (roomId: string, duration: number = 5 * 60 * 1000) => {
    const rooms = readRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
        room.status = 'debating';
        room.debateEndTime = Date.now() + duration;

        // 미선택자 'A'로 자동 배정
        Object.keys(room.users).forEach((userId) => {
            if (!room.users[userId].side) {
                room.users[userId].side = 'A';
            }
        });

        writeRooms(rooms);
        return room; // 변경된 방 정보 반환
    }
};

export const startFinalSelection = (roomId: string) => {
    const rooms = readRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
        room.status = 'final_selecting';
        room.finalSelectionEndTime = Date.now() + 10000; // 10초 후 종료
        writeRooms(rooms);
        return room;
    }
};

export const endDebate = (roomId: string) => {
    const rooms = readRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
        room.status = 'waiting';
        delete room.topic;
        delete room.selectionEndTime;
        delete room.debateEndTime;
        delete room.finalSelectionEndTime;

        // (선택 사항) 유저 선택 초기화? 
        // 일단 유지하거나, 다음 토론을 위해 초기화할 수도 있음.
        // 여기서는 다음 토론을 위해 초기화
        Object.keys(room.users).forEach((userId) => {
            delete room.users[userId].side;
        });

        writeRooms(rooms);
        return room;
    }
};

export const selectSide = (roomId: string, userId: string, side: 'A' | 'B') => {
    const rooms = readRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (room && room.users[userId]) {
        room.users[userId].side = side;
        writeRooms(rooms);
        return true;
    }
    return false;
};

export const getUserSide = (roomId: string, userId: string): 'A' | 'B' | undefined => {
    const room = getRoom(roomId);
    return room?.users[userId]?.side;
}

export const leaveRoom = (roomId: string, userId: string) => {
    console.log(`🗑️ leaveRoom called for Room: ${roomId}, User: ${userId}`);
    const rooms = readRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
        if (room.users[userId]) {
            // 대기 상태일 때만 유저 삭제 (토론 중에는 재접속을 위해 유지)
            if (room.status === 'waiting') {
                delete room.users[userId];
                console.log(`✅ User ${userId} removed from room ${roomId}`);
                writeRooms(rooms);
                return room;
            } else {
                console.log(`🔒 User ${userId} kept in room ${roomId} (Status: ${room.status})`);
                // 토론 중에는 유저를 삭제하지 않지만, 연결 끊김 상태를 알리기 위해
                // room_users_update를 보낼 필요가 있을까?
                // 일단은 삭제하지 않고 room 객체를 반환하지 않음 (변경 사항 없음)
                // 하지만 클라이언트에서 "접속 종료" 표시를 하려면 뭔가 변경이 필요함.
                // 현재 요구사항은 "새로고침 시 토론 유지"이므로, 삭제만 안 하면 됨.
                return null;
            }
        } else {
            console.log(`⚠️ User ${userId} not found in room ${roomId}`);
        }
    } else {
        console.log(`⚠️ Room ${roomId} not found`);
    }
    return null;
};


