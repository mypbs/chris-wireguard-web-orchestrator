import { Link, useLocation } from "wouter";
import { Server, Activity, LogOut } from "lucide-react";
import { useLogout, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/login");
      }
    });
  };

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex">
        <div className="h-14 flex items-center px-4 border-b border-border">
          <Server className="w-5 h-5 mr-2 text-primary" />
          <span className="font-mono font-bold tracking-tight text-sm">WG ORCHESTRATOR</span>
        </div>
        
        <nav className="flex-1 py-4 px-2 space-y-1">
          <Link href="/dashboard" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${location === "/dashboard" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}`}>
            <Activity className="w-4 h-4 mr-3" />
            Overview
          </Link>
          <Link href="/nodes/new" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${location === "/nodes/new" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}`}>
            <Server className="w-4 h-4 mr-3" />
            Add Node
          </Link>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-mono text-muted-foreground">USER</span>
              <span className="text-sm font-medium">{user?.username}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="h-14 border-b border-border bg-card flex items-center px-4 md:hidden">
          <Server className="w-5 h-5 mr-2 text-primary" />
          <span className="font-mono font-bold tracking-tight flex-1 text-sm">WG ORCHESTRATOR</span>
          <button onClick={handleLogout} className="text-muted-foreground">
            <LogOut className="w-4 h-4" />
          </button>
        </header>
        
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
