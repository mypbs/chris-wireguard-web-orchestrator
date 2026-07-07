import Layout from "@/components/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  useGetNode,
  useTestNodeConnection, 
  useSetupWireguard,
  getGetNodeQueryKey
} from "@workspace/api-client-react";
import { useLocation, Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Terminal, CheckCircle2, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { TerminalBox } from "@/components/terminal-box";
import { useState } from "react";

const formSchema = z.object({
  port: z.coerce.number().min(1024).max(65535).default(51820),
  interface: z.string().min(1).default("wg0"),
  subnet: z.string().min(1).default("10.8.0.0/24"),
});

export default function NodeSetup() {
  const params = useParams();
  const nodeId = parseInt(params.nodeId || "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [setupOutput, setSetupOutput] = useState<string | null>(null);
  const [connectionSuccess, setConnectionSuccess] = useState<boolean | null>(null);

  const { data: node } = useGetNode(nodeId, { query: { queryKey: getGetNodeQueryKey(nodeId), enabled: !!nodeId } });
  const testConnection = useTestNodeConnection();
  const setupWg = useSetupWireguard();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      port: 51820,
      interface: "wg0",
      subnet: "10.8.0.0/24",
    },
  });

  const handleTestConnection = () => {
    setTestOutput(null);
    setConnectionSuccess(null);
    testConnection.mutate({ nodeId }, {
      onSuccess: (res) => {
        setConnectionSuccess(res.success);
        setTestOutput(res.message);
      },
      onError: (err: any) => {
        setConnectionSuccess(false);
        setTestOutput(err?.message || "Connection failed");
      }
    });
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setSetupOutput(null);
    setupWg.mutate({ nodeId, data }, {
      onSuccess: (res) => {
        setSetupOutput(res.output || "Installation complete.");
        queryClient.invalidateQueries({ queryKey: getGetNodeQueryKey(nodeId) });
        // Give it a moment to show success before redirect
        setTimeout(() => {
          setLocation(`/nodes/${nodeId}`);
        }, 2000);
      },
      onError: (err: any) => {
        form.setError("root", { message: "Setup failed" });
        setSetupOutput(err?.message || "An error occurred during setup");
      }
    });
  };

  return (
    <Layout>
      <div className="mb-6">
        <Link href={`/nodes/${nodeId}`} className="inline-flex items-center text-sm font-mono text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          BACK TO NODE
        </Link>
        <h1 className="text-3xl font-mono font-bold tracking-tight">INSTALL WIREGUARD</h1>
        <p className="text-muted-foreground mt-1">Configure and deploy WireGuard to {node?.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-mono font-bold mb-4 flex items-center">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-2 text-xs">1</span>
              PRE-FLIGHT CHECK
            </h2>
            <p className="text-sm font-mono text-muted-foreground mb-4">Verify SSH connectivity and sudo privileges before installing.</p>
            
            <Button 
              onClick={handleTestConnection} 
              variant="outline" 
              className="font-mono text-xs font-bold tracking-wider"
              disabled={testConnection.isPending}
            >
              <Terminal className="w-4 h-4 mr-2" />
              {testConnection.isPending ? "TESTING..." : "TEST CONNECTION"}
            </Button>

            {connectionSuccess !== null && (
              <div className={`mt-4 p-3 rounded border font-mono text-sm flex items-start ${
                connectionSuccess 
                  ? "bg-green-500/10 border-green-500/20 text-green-500" 
                  : "bg-destructive/10 border-destructive/20 text-destructive"
              }`}>
                {connectionSuccess ? (
                  <CheckCircle2 className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                )}
                <div>{testOutput}</div>
              </div>
            )}
          </div>

          <div className={`bg-card border border-border rounded-lg p-6 transition-opacity ${connectionSuccess ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <h2 className="font-mono font-bold mb-4 flex items-center">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-2 text-xs">2</span>
              INSTALLATION OPTIONS
            </h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="interface"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs text-muted-foreground uppercase">Interface Name</FormLabel>
                        <FormControl>
                          <Input className="font-mono" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground font-mono mt-1">Linux kernel name — keep as wg0</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs text-muted-foreground uppercase">Listen Port</FormLabel>
                        <FormControl>
                          <Input type="number" className="font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="subnet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs text-muted-foreground uppercase">Client Subnet</FormLabel>
                      <FormControl>
                        <Input className="font-mono" {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground font-mono mt-1">CIDR notation for client IPs</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.formState.errors.root && (
                  <div className="text-sm text-destructive font-mono font-medium">
                    {form.formState.errors.root.message}
                  </div>
                )}
                
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full font-mono font-bold text-xs uppercase tracking-wider" 
                    disabled={setupWg.isPending || !connectionSuccess}
                  >
                    {setupWg.isPending ? "INSTALLING..." : "DEPLOY WIREGUARD"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>

        <div>
          <h3 className="font-mono font-bold text-sm text-muted-foreground uppercase tracking-wider mb-2">Setup Log</h3>
          <div className="bg-[#0a0a0a] border border-border rounded-md overflow-hidden flex flex-col h-[500px]">
            <div className="flex items-center px-4 py-2 border-b border-border/50 bg-black/40">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
              </div>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-words">
                {setupOutput || "Waiting for installation to begin..."}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
