"use client";

import { createContext, useEffect, useState } from "react";

interface UserContextValue {
  userId: string;
  name: string;
}

export const UserContext = createContext<UserContextValue | null>(null);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserContextValue | null>(null);

  useEffect(() => {
    let uid = localStorage.getItem("user-id");
    let uname = localStorage.getItem("user-name");

    if (!uid || !uname) {
      const random = Math.floor(Math.random() * 10000);
      uid = `user-${random}`;
      uname = `사용자 ${random}`;
      localStorage.setItem("user-id", uid);
      localStorage.setItem("user-name", uname);
    }

    setUser({ userId: uid, name: uname });
  }, []);

  if (!user) return null; // 초기 로딩 중에는 아무 것도 안 그리기

  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  );
}
