import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import TopBar from "./TopBar";

/** Main app shell with top bar and bottom navigation */
const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-16 pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
