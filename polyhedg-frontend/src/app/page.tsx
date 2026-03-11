import Chat from "~/components/Chat";
import Sidebar from "~/components/Sidebar";

export default function HomePage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="main-content">
        <Chat />
      </main>
    </div>
  );
}
