import type { DramaScript } from "../types";

export function encodeDramaForShare(drama: DramaScript): string {
  const json = JSON.stringify(drama);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeDramaFromShare(token: string): DramaScript | null {
  try {
    let base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as DramaScript;
  } catch {
    return null;
  }
}

export function buildShareUrl(drama: DramaScript): string {
  const token = encodeDramaForShare(drama);
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = `share=${token}`;
  return url.toString();
}

export function parseShareFromUrl(): DramaScript | null {
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  const token = params.get("share");
  if (!token) return null;
  return decodeDramaFromShare(token);
}
