"use client";

import { useContext } from "react";
import { UserContext } from "./appShell";

export default function UserStatus() {
    const user = useContext(UserContext);

    if (!user) return <div>Loading...</div>;

    return (
        <div className="font-medium text-blue-600">
            {user.name}
        </div>
    );
}
