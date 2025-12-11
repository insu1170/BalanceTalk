"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveRoom = exports.getHostId = exports.getUserSide = exports.selectSide = exports.endDebate = exports.startFinalSelection = exports.startMainDebate = exports.startDebate = exports.joinRoom = exports.createRoom = exports.getRoom = exports.getRooms = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ROOMS_FILE = path_1.default.join(process.cwd(), "rooms", "room.json");
// Helper to read rooms
const readRooms = () => {
    if (!fs_1.default.existsSync(ROOMS_FILE))
        return [];
    try {
        return JSON.parse(fs_1.default.readFileSync(ROOMS_FILE, "utf-8"));
    }
    catch {
        return [];
    }
};
// Helper to write rooms
const writeRooms = (rooms) => {
    fs_1.default.writeFileSync(ROOMS_FILE, JSON.stringify(rooms, null, 2));
};
const getRooms = () => readRooms();
exports.getRooms = getRooms;
const getRoom = (roomId) => {
    const rooms = readRooms();
    return rooms.find((r) => r.id === roomId);
};
exports.getRoom = getRoom;
const createRoom = (title, participants) => {
    const rooms = readRooms();
    const newRoom = {
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
exports.createRoom = createRoom;
const joinRoom = (roomId, userId, name) => {
    const rooms = readRooms();
    const roomIndex = rooms.findIndex((r) => r.id === roomId);
    if (roomIndex === -1)
        return { success: false, message: "Room not found" };
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
        return { success: false, message: "방이 꽉 찼습니다." };
    }
    // Add user
    room.users[userId] = { name };
    writeRooms(rooms);
    return { success: true, room };
};
exports.joinRoom = joinRoom;
const startDebate = (roomId, topic) => {
    const rooms = readRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
        room.status = 'selecting';
        room.topic = topic;
        room.selectionEndTime = Date.now() + 10000; // 10초 후 종료
        writeRooms(rooms);
    }
};
exports.startDebate = startDebate;
const startMainDebate = (roomId, duration = 5 * 60 * 1000) => {
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
exports.startMainDebate = startMainDebate;
const startFinalSelection = (roomId) => {
    const rooms = readRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
        room.status = 'final_selecting';
        room.finalSelectionEndTime = Date.now() + 10000; // 10초 후 종료
        writeRooms(rooms);
        return room;
    }
};
exports.startFinalSelection = startFinalSelection;
const endDebate = (roomId) => {
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
exports.endDebate = endDebate;
const selectSide = (roomId, userId, side) => {
    const rooms = readRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (room && room.users[userId]) {
        room.users[userId].side = side;
        writeRooms(rooms);
        return true;
    }
    return false;
};
exports.selectSide = selectSide;
const getUserSide = (roomId, userId) => {
    const room = (0, exports.getRoom)(roomId);
    return room?.users[userId]?.side;
};
exports.getUserSide = getUserSide;
const getHostId = (roomId) => {
    const room = (0, exports.getRoom)(roomId);
    if (room && room.users) {
        // 첫 번째 키를 방장으로 간주
        const userIds = Object.keys(room.users);
        return userIds.length > 0 ? userIds[0] : undefined;
    }
    return undefined;
};
exports.getHostId = getHostId;
const leaveRoom = (roomId, userId) => {
    console.log(`🗑️ leaveRoom called for Room: ${roomId}, User: ${userId}`);
    const rooms = readRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
        if (room.users[userId]) {
            delete room.users[userId];
            console.log(`✅ User ${userId} removed from room ${roomId}`);
            // 방에 남은 유저가 없으면 방 삭제
            if (Object.keys(room.users).length === 0) {
                const newRooms = rooms.filter((r) => r.id !== roomId);
                writeRooms(newRooms);
                console.log(`🗑️ Room ${roomId} deleted because it's empty`);
                // 채팅 로그 파일 삭제
                const LOGS_DIR = path_1.default.join(process.cwd(), "logs");
                const logFilePath = path_1.default.join(LOGS_DIR, `${roomId}.json`);
                if (fs_1.default.existsSync(logFilePath)) {
                    fs_1.default.unlinkSync(logFilePath);
                    console.log(`🗑️ Chat log for room ${roomId} deleted`);
                }
                return null;
            }
            writeRooms(rooms);
            return room;
        }
        else {
            console.log(`⚠️ User ${userId} not found in room ${roomId}`);
        }
    }
    else {
        console.log(`⚠️ Room ${roomId} not found`);
    }
    return null;
};
exports.leaveRoom = leaveRoom;
