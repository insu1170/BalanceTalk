import fs from "fs";
import path from "path";

const ROOMS_FILE = path.join(process.cwd(), "rooms", "room.json");

export interface Room {
    id: string;
    title: string;
    participants: number; // max capacity
    status: 'waiting' | 'selecting' | 'debating';
    topic?: string;
    selectionEndTime?: number;
    debateEndTime?: number;
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

export const startMainDebate = (roomId: string) => {
    const rooms = readRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
        room.status = 'debating';
        room.debateEndTime = Date.now() + 5 * 60 * 1000; // 5분 후 종료

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
