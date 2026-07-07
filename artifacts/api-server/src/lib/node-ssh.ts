import { type SshConnectOptions } from "./ssh.js";

interface NodeSshFields {
  ipAddress: string;
  sshPort: number;
  sshUser: string;
  sshAuthMethod: string;
  sshPasswordEncrypted: string | null;
  sshPrivateKeyEncrypted: string | null;
}

export function buildSshOpts(node: NodeSshFields): SshConnectOptions {
  if (node.sshAuthMethod === "private_key" && node.sshPrivateKeyEncrypted) {
    return {
      host: node.ipAddress,
      port: node.sshPort,
      username: node.sshUser,
      privateKey: Buffer.from(node.sshPrivateKeyEncrypted, "base64").toString("utf8"),
    };
  }
  return {
    host: node.ipAddress,
    port: node.sshPort,
    username: node.sshUser,
    password: node.sshPasswordEncrypted
      ? Buffer.from(node.sshPasswordEncrypted, "base64").toString("utf8")
      : "",
  };
}
