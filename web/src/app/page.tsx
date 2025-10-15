import Link from "next/link";

// Mock data for rooms, now including participant counts
const rooms = [
  { id: "1", name: "빠르게 한판", currentParticipants: 5, maxParticipants: 8 },
  { id: "2", name: "풀방 ㄱ", currentParticipants: 8, maxParticipants: 8 },
  { id: "3", name: "심심해", currentParticipants: 2, maxParticipants: 8 },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 font-sans">
      {/* Header */}
      <header className="my-6 sm:my-10 space-y-2 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-800">BalanceTalk</h1>
        <p className="text-gray-500 text-sm sm:text-base">즉흥적인 밸런스 토론 한 판, 지금 바로 들어가요</p>
      </header>

      <main className="flex flex-col gap-6 sm:gap-8">
        {/* Actions */}
        <section className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Join by code */}
            <div className="flex w-full sm:w-auto items-center gap-2">
              <input
                type="text"
                placeholder="방 코드 입력"
                className="w-full sm:w-56 rounded-lg border border-gray-300 px-3 py-2 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="whitespace-nowrap rounded-lg bg-gray-800 px-4 py-2 text-white font-semibold hover:bg-gray-900 transition-colors">
                입장
              </button>
            </div>

            {/* Divider on mobile */}
            <div className="sm:hidden h-px bg-gray-200" />

            {/* Create room */}
            <div className="flex justify-end">
              <Link href="/create" className="w-full sm:w-auto">
                <button className="w-full rounded-lg bg-blue-500 px-5 py-2 text-white font-semibold shadow-sm hover:bg-blue-600 transition-colors">
                  방 만들기
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Room list */}
        <section className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">토론 방 목록</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">총 {rooms.length}개</span>
          </div>

          <ul className="space-y-3">
            {rooms.map((room) => {
              const isFull = room.currentParticipants >= room.maxParticipants;
              return (
                <li key={room.id}>
                  <Link href={`/room/${room.id}`} className="block">
                    <div className="group flex items-center justify-between rounded-xl border px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
                      {/* Left: name */}
                      <div className="min-w-0">
                        <h3 className="truncate text-base sm:text-lg font-semibold text-gray-900 group-hover:text-gray-800">
                          {room.name}
                        </h3>
                        <p className="mt-0.5 text-xs text-gray-500">ID: {room.id}</p>
                      </div>

                      {/* Right: status */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          isFull ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
                        }`}>
                          {isFull ? "풀방" : "입장 가능"}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          👤 {room.currentParticipants} / {room.maxParticipants}
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
