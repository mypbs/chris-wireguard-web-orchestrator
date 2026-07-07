import Layout from "@/components/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateNode, getListNodesQueryKey } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Server, KeyRound, Lock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { cn } from "@/lib/utils";

const formSchema = z.discriminatedUnion("sshAuthMethod", [
  z.object({
    sshAuthMethod: z.literal("password"),
    name: z.string().min(1, "Name is required"),
    ipAddress: z.string().min(1, "IP Address is required"),
    sshUser: z.string().min(1, "SSH User is required"),
    sshPort: z.coerce.number().min(1).max(65535).optional().default(22),
    sshPassword: z.string().min(1, "SSH Password is required"),
    sshPrivateKey: z.string().optional(),
  }),
  z.object({
    sshAuthMethod: z.literal("private_key"),
    name: z.string().min(1, "Name is required"),
    ipAddress: z.string().min(1, "IP Address is required"),
    sshUser: z.string().min(1, "SSH User is required"),
    sshPort: z.coerce.number().min(1).max(65535).optional().default(22),
    sshPassword: z.string().optional(),
    sshPrivateKey: z.string().min(1, "Private key is required"),
  }),
]);

type FormValues = z.infer<typeof formSchema>;

export default function NodeNew() {
  const [, setLocation] = useLocation();
  const createNode = useCreateNode();
  const queryClient = useQueryClient();
  const [authMethod, setAuthMethod] = useState<"password" | "private_key">("password");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sshAuthMethod: "password",
      name: "",
      ipAddress: "",
      sshUser: "root",
      sshPassword: "",
      sshPrivateKey: "",
      sshPort: 22,
    },
  });

  const switchMethod = (method: "password" | "private_key") => {
    setAuthMethod(method);
    form.setValue("sshAuthMethod", method);
    form.clearErrors();
  };

  const onSubmit = (data: FormValues) => {
    createNode.mutate({ data: {
      name: data.name,
      ipAddress: data.ipAddress,
      sshUser: data.sshUser,
      sshPort: data.sshPort,
      sshAuthMethod: data.sshAuthMethod,
      sshPassword: data.sshAuthMethod === "password" ? data.sshPassword : undefined,
      sshPrivateKey: data.sshAuthMethod === "private_key" ? data.sshPrivateKey : undefined,
    }}, {
      onSuccess: (node) => {
        queryClient.invalidateQueries({ queryKey: getListNodesQueryKey() });
        setLocation(`/nodes/${node.id}`);
      },
      onError: (err: any) => {
        form.setError("root", { message: err?.message || "Failed to create node" });
      }
    });
  };

  return (
    <Layout>
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-mono text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          BACK TO DASHBOARD
        </Link>
        <h1 className="text-3xl font-mono font-bold tracking-tight">ADD NODE</h1>
        <p className="text-muted-foreground mt-1">Register a new server to manage its WireGuard installation</p>
      </div>

      <div className="max-w-xl">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-border">
            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded-lg">
              <Server className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-mono font-bold tracking-tight">SSH Credentials</h2>
              <p className="text-xs text-muted-foreground font-mono">Used to configure the node</p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs text-muted-foreground uppercase">Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Frankfurt Exit Node" className="font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="ipAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs text-muted-foreground uppercase">IP Address / Hostname</FormLabel>
                    <FormControl>
                      <Input placeholder="203.0.113.50" className="font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sshUser"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs text-muted-foreground uppercase">SSH User</FormLabel>
                      <FormControl>
                        <Input className="font-mono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sshPort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs text-muted-foreground uppercase">SSH Port</FormLabel>
                      <FormControl>
                        <Input type="number" className="font-mono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <span className="font-mono text-xs text-muted-foreground uppercase block mb-2">Auth Method</span>
                <div className="flex rounded-md border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => switchMethod("password")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono font-bold tracking-wider transition-colors",
                      authMethod === "password"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:bg-muted/30"
                    )}
                  >
                    <Lock className="w-3 h-3" />
                    PASSWORD
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMethod("private_key")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono font-bold tracking-wider transition-colors border-l border-border",
                      authMethod === "private_key"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:bg-muted/30"
                    )}
                  >
                    <KeyRound className="w-3 h-3" />
                    PRIVATE KEY
                  </button>
                </div>
              </div>

              {authMethod === "password" ? (
                <FormField
                  control={form.control}
                  name="sshPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs text-muted-foreground uppercase">SSH Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="sshPrivateKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs text-muted-foreground uppercase">SSH Private Key (PEM)</FormLabel>
                      <FormControl>
                        <Textarea
                          className="font-mono text-xs h-36 resize-none"
                          placeholder={"-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAA...\n-----END OPENSSH PRIVATE KEY-----"}
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        Paste your PEM private key. It is stored securely and never shown again.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.formState.errors.root && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive font-mono font-medium">
                  {form.formState.errors.root.message}
                </div>
              )}
              
              <div className="pt-4 flex justify-end">
                <Button type="submit" className="font-mono font-bold text-xs uppercase tracking-wider" disabled={createNode.isPending}>
                  {createNode.isPending ? "REGISTERING..." : "REGISTER NODE"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
}
