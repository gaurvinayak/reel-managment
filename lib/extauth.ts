import { NextRequest } from "next/server";

/** Validate the shared EXTENSION_TOKEN sent by the Chrome extension. */
export function extensionAuthorized(req: NextRequest): boolean {
  const expected = process.env.EXTENSION_TOKEN || "";
  if (!expected) return false;
  const header =
    req.headers.get("x-extension-token") ||
    (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  return header === expected;
}
