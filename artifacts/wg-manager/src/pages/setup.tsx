import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSetupAdmin, getGetSetupStatusQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ShieldAlert } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Setup() {
  const [, setLocation] = useLocation();
  const setup = useSetupAdmin();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "admin", password: "", confirmPassword: "" },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setup.mutate({ data: { username: data.username, password: data.password } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSetupStatusQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        form.setError("root", { message: err?.message || "Setup failed" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-destructive/20 flex items-center justify-center rounded-lg mb-4">
            <ShieldAlert className="w-6 h-6 text-destructive" />
          </div>
          <h1 className="text-2xl font-mono font-bold tracking-tight">INITIAL SETUP</h1>
          <p className="text-sm text-muted-foreground mt-2 text-center">Create the first admin account to secure the control plane.</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs text-muted-foreground uppercase">Admin Username</FormLabel>
                    <FormControl>
                      <Input className="font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs text-muted-foreground uppercase">Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs text-muted-foreground uppercase">Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.root && (
                <div className="text-sm text-destructive font-medium">
                  {form.formState.errors.root.message}
                </div>
              )}
              <Button type="submit" className="w-full font-mono font-bold" variant="destructive" disabled={setup.isPending}>
                {setup.isPending ? "INITIALIZING..." : "INITIALIZE INSTANCE"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
