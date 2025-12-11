import React from 'react';

type DebateTeamListProps = {
    topic: string;
    users: Record<string, { name: string; side?: 'A' | 'B' }>;
};

export default function DebateTeamList({ topic, users }: DebateTeamListProps) {
    // Parse topic format: "Main Topic|Option A vs Option B" or just "Option A vs Option B"
    const parts = topic.split('|');
    const debateStr = parts.length > 1 ? parts[1] : parts[0];

    const sides = debateStr.split(/vs/i).map(s => s.trim());
    const sideA = sides[0] || "A";
    const sideB = sides[1] || "B";

    const teamA = Object.values(users).filter(u => u.side === 'A');
    const teamB = Object.values(users).filter(u => u.side === 'B');
    const unassigned = Object.values(users).filter(u => !u.side);

    return (
        <div className="px-4 py-2 flex flex-col gap-4">
            <div className="flex flex-col gap-4"> {/* 👈 flex gap-4 -> flex flex-col gap-4 */}
                {/* Team A */}
                <div className="flex-1 bg-amber-50 rounded-xl p-3 border border-amber-100">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-amber-200">
                        <span className="font-bold text-amber-800 text-sm truncate">{sideA}</span>
                        <span className="bg-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">
                            {teamA.length}
                        </span>
                    </div>
                    <ul className="space-y-1 max-h-32 overflow-y-auto">
                        {teamA.map((u, i) => (
                            <li key={i} className="text-sm text-amber-900 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                {u.name}
                            </li>
                        ))}
                        {teamA.length === 0 && (
                            <li className="text-xs text-amber-400 italic">참가자 없음</li>
                        )}
                    </ul>
                </div>

                {/* Team B */}
                <div className="flex-1 bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-blue-200">
                        <span className="font-bold text-blue-800 text-sm truncate">{sideB}</span>
                        <span className="bg-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">
                            {teamB.length}
                        </span>
                    </div>
                    <ul className="space-y-1 max-h-32 overflow-y-auto">
                        {teamB.map((u, i) => (
                            <li key={i} className="text-sm text-blue-900 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                {u.name}
                            </li>
                        ))}
                        {teamB.length === 0 && (
                            <li className="text-xs text-blue-400 italic">참가자 없음</li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Unassigned */}
            {unassigned.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                        <span className="font-bold text-gray-600 text-sm">미선택 / 관전</span>
                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full font-bold">
                            {unassigned.length}
                        </span>
                    </div>
                    <ul className="space-y-1 max-h-32 overflow-y-auto grid grid-cols-2 gap-x-4">
                        {unassigned.map((u, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                {u.name}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
