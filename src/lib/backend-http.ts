import https from "node:https";
import { URL } from "node:url";

export type BackendHttpResult = {
  ok: boolean;
  status: number;
  data: unknown;
};

export function backendHttpRequest(input: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}): Promise<BackendHttpResult> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(input.url);
    const payload = input.body === undefined ? undefined : JSON.stringify(input.body);
    const headers: Record<string, string> = { ...input.headers };

    if (payload) {
      headers["Content-Length"] = String(Buffer.byteLength(payload));
    }

    const req = https.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: `${parsed.pathname}${parsed.search}`,
        method: input.method || "GET",
        headers,
        rejectUnauthorized: false,
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => chunks.push(chunk as Buffer));
        response.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let data: unknown = null;
          try {
            data = text ? JSON.parse(text) : null;
          } catch {
            data = text;
          }
          const status = response.statusCode ?? 0;
          resolve({
            ok: status >= 200 && status < 300,
            status,
            data,
          });
        });
      },
    );

    req.setTimeout(15000, () => {
      req.destroy(new Error("backend request timed out"));
    });
    req.on("error", reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}
