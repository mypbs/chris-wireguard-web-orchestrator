import Layout from "@/components/layout";
import { useGetDashboardSummary, useListNodes } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Server, Users, Activity, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'running':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">RUNNING</span>;
    case 'stopped':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">STOPPED</span>;
    case 'not_installed':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">UNINSTALLED</span>;
    default:
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">UNKNOWN</span>;
  }
}

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: nodes, isLoading: nodesLoading } = useListNodes();

  return (
    <Layout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">OVERVIEW</h1>
          <p className="text-muted-foreground mt-1">System status and node inventory</p>
        </div>
        <Link href="/nodes/new">
          <Button className="font-mono text-xs uppercase tracking-wider">
            <Plus className="w-4 h-4 mr-2" />
            Add Node
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center text-muted-foreground mb-4">
            <Server className="w-4 h-4 mr-2" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider">Total Nodes</span>
          </div>
          <div className="text-3xl font-mono">
            {summaryLoading ? <Skeleton className="h-9 w-16" /> : summary?.totalNodes}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center text-muted-foreground mb-4">
            <Activity className="w-4 h-4 mr-2" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider">Active WireGuard</span>
          </div>
          <div className="text-3xl font-mono">
            {summaryLoading ? <Skeleton className="h-9 w-16" /> : `${summary?.nodesWithWireguard} / ${summary?.totalNodes}`}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center text-muted-foreground mb-4">
            <Users className="w-4 h-4 mr-2" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider">Total Clients</span>
          </div>
          <div className="text-3xl font-mono">
            {summaryLoading ? <Skeleton className="h-9 w-16" /> : summary?.totalClients}
          </div>
        </div>
      </div>

      <h2 className="text-xl font-mono font-bold mb-4 tracking-tight">NODES</h2>
      
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {nodesLoading ? (
          <div className="p-8 flex justify-center">
            <span className="font-mono text-muted-foreground animate-pulse">Loading nodes...</span>
          </div>
        ) : nodes?.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Server className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-mono font-bold text-lg mb-2">No nodes registered</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md">Add a Linux server to begin managing WireGuard VPN configurations.</p>
            <Link href="/nodes/new">
              <Button variant="outline" className="font-mono text-xs uppercase tracking-wider">Register First Node</Button>
            </Link>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="font-mono text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Name</th>
                <th className="font-mono text-xs font-semibold text-muted-foreground uppercase px-4 py-3">IP Address</th>
                <th className="font-mono text-xs font-semibold text-muted-foreground uppercase px-4 py-3">Status</th>
                <th className="font-mono text-xs font-semibold text-muted-foreground uppercase px-4 py-3 text-right">Clients</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {nodes?.map((node) => (
                <tr key={node.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/nodes/${node.id}`} className="text-primary hover:underline font-bold">
                      {node.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{node.ipAddress}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={node.wireguardStatus} />
                  </td>
                  <td className="px-4 py-3 text-right">{node.clientCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
