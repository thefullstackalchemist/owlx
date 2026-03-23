"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/nav/Sidebar";
import ChatPanel from "@/components/chat/ChatPanel";

const AUTH_PATHS = ["/login"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth   = AUTH_PATHS.includes(pathname);

  if (isAuth) {
    return <div className="flex-1 h-full overflow-auto">{children}</div>;
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-auto min-w-0">{children}</main>
      <ChatPanel />
    </>
  );
}
