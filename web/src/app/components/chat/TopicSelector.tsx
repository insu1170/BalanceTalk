"use client";

import React, { useState } from "react";

interface TopicSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (topic: string) => void;
    topics: Record<string, string>;
}

export default function TopicSelector({
    isOpen,
    onClose,
    onSelect,
    topics,
}: TopicSelectorProps) {
    const [customTopic, setCustomTopic] = useState("");
    const [optionA, setOptionA] = useState("");
    const [optionB, setOptionB] = useState("");
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (selectedPreset) {
            onSelect(topics[selectedPreset]);
        } else if (optionA.trim() && optionB.trim()) {
            const topicStr = customTopic.trim()
                ? `${customTopic.trim()}|${optionA.trim()} vs ${optionB.trim()}`
                : `${optionA.trim()} vs ${optionB.trim()}`;
            onSelect(topicStr);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
                    <h3 className="text-lg font-bold text-white">토론 주제 선택</h3>
                    <p className="text-indigo-100 text-sm">토론할 주제를 선택하거나 직접 입력하세요.</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Preset Topics */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700 block">추천 주제</label>
                        <div className="grid gap-2">
                            {Object.entries(topics).map(([key, topic]) => {
                                const [main, options] = topic.includes('|') ? topic.split('|') : [null, topic];
                                return (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setSelectedPreset(key);
                                            setCustomTopic("");
                                            setOptionA("");
                                            setOptionB("");
                                        }}
                                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${selectedPreset === key
                                            ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200"
                                            : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50 text-gray-700"
                                            }`}
                                    >
                                        {main && <span className="block text-xs font-bold text-indigo-500 mb-0.5">{main}</span>}
                                        <span className="block font-medium">{options}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">또는</span>
                        </div>
                    </div>

                    {/* Custom Topic Inputs */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 block">메인 주제 (선택)</label>
                            <input
                                type="text"
                                value={customTopic}
                                onChange={(e) => {
                                    setCustomTopic(e.target.value);
                                    setSelectedPreset(null);
                                }}
                                placeholder="예: 점심 메뉴 추천"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-amber-700 block">옵션 A</label>
                                <input
                                    type="text"
                                    value={optionA}
                                    onChange={(e) => {
                                        setOptionA(e.target.value);
                                        setSelectedPreset(null);
                                    }}
                                    placeholder="예: 짜장면"
                                    className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all bg-amber-50/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-blue-700 block">옵션 B</label>
                                <input
                                    type="text"
                                    value={optionB}
                                    onChange={(e) => {
                                        setOptionB(e.target.value);
                                        setSelectedPreset(null);
                                    }}
                                    placeholder="예: 짬뽕"
                                    className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-blue-50/50"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-200 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedPreset && (!optionA.trim() || !optionB.trim())}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
                    >
                        토론 시작하기
                    </button>
                </div>
            </div>
        </div>
    );
}
