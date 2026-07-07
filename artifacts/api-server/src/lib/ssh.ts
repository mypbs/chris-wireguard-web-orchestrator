import { Client as SshClient } from "ssh2";

export interface SshConnectOptions {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
}

export async function sshExec(
  opts: SshConnectOptions,
  command: string,
  timeoutMs = 30000
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const conn = new SshClient();
    const timer = setTimeout(() => {
      conn.end();
      reject(new Error("SSH command timed out"));
    }, timeoutMs);

    conn.on("ready", () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          clearTimeout(timer);
          conn.end();
          return reject(err);
        }
        let stdout = "";
        let stderr = "";
        stream.on("data", (data: Buffer) => { stdout += data.toString(); });
        stream.stderr.on("data", (data: Buffer) => { stderr += data.toString(); });
        stream.on("close", (code: number) => {
          clearTimeout(timer);
          conn.end();
          resolve({ stdout, stderr, code: code ?? 0 });
        });
      });
    });

    conn.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    conn.connect({
      host: opts.host,
      port: opts.port,
      username: opts.username,
      ...(opts.privateKey
        ? { privateKey: opts.privateKey }
        : { password: opts.password }),
      readyTimeout: 15000,
      keepaliveInterval: 0,
    });
  });
}

export async function testSshConnection(opts: SshConnectOptions): Promise<{ success: boolean; message: string; latencyMs: number | null }> {
  const start = Date.now();
  try {
    const result = await sshExec(opts, "echo ok", 15000);
    const latencyMs = Date.now() - start;
    if (result.stdout.trim() === "ok") {
      return { success: true, message: "SSH connection successful", latencyMs };
    }
    return { success: false, message: `Unexpected output: ${result.stdout}`, latencyMs };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : String(err), latencyMs: null };
  }
}
