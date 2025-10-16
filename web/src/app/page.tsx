import Link from "next/link";

// Mock data for rooms, now including participant counts
const rooms = [
  { id: "1", name: "빠르게 한판", currentParticipants: 5, maxParticipants: 8 },
  { id: "2", name: "풀방 ㄱ", currentParticipants: 8, maxParticipants: 8 },
  { id: "3", name: "심심해", currentParticipants: 2, maxParticipants: 8 },
  { id: "4", name: "심심해", currentParticipants: 2, maxParticipants: 8 },
  { id: "5", name: "심심해", currentParticipants: 2, maxParticipants: 8 },
  { id: "32", name: "심심해", currentParticipants: 2, maxParticipants: 8 },
  { id: "33", name: "심심해", currentParticipants: 2, maxParticipants: 8 },
];

export default function Home() {
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
              <button className="whitespace-nowrap rounded-xl bg-gray-800 px-5 py-2.5 text-white font-bold hover:bg-gray-900 transition-all duration-200 ease-in-out transform hover:scale-105 cursor-pointer">
                참여
              </button>
            </div>

            {/* Divider */}
            <div className="hidden sm:block h-8 border-l border-gray-200" />

            {/* Create room */}
            <div className="flex">
              <Link href="/create" className="w-full sm:w-auto">
                <button className="w-full rounded-xl bg-indigo-600 px-6 py-2.5 text-white font-bold shadow-lg hover:bg-indigo-700 transition-all duration-200 ease-in-out transform hover:scale-105 cursor-pointer">
                  새 토론방 만들기
                </button>
              </Link>
            </div>
          </div>
        </section>

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
                      {/* Left: name and ID */}
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                          {room.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">ID: {room.id}</p>
                      </div>

                      {/* Right: status and participants */}
                      <div className="flex items-center gap-3 text-sm">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            isFull
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : "bg-green-100 text-green-800 border border-green-200"
                          }`}
                        >
                          {isFull ? "참여불가" : "참여가능"}
                        </span>
                        <span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0010 9c-1.55 0-2.98.5-4.07 1.33A6.97 6.97 0 004 16c0 .34.024.673.07 1h8.86zM12 18a5 5 0 005-5c0-2.76-2.24-5-5-5s-5 2.24-5 5c0 2.76 2.24 5 5 5z" />
                          </svg>
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