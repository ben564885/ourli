import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();
const WHOP_API = "https://api.whop.com/api/v1";

function b64url(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function rand(n: number) {
  return b64url(crypto.getRandomValues(new Uint8Array(n)));
}
async function sha256(s: string) {
  return b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))));
}
function redirect(to: string, params: Record<string, string>) {
  const url = new URL(to);
  for (const [k, val] of Object.entries(params)) url.searchParams.set(k, val);
  return new Response(null, { status: 302, headers: { Location: url.toString() } });
}
function callbackUrl() {
  return process.env.CONVEX_SITE_URL + "/whop/callback";
}

http.route({
  path: "/whop/start",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const u = new URL(req.url);
    const dayId = u.searchParams.get("dayId") as Id<"days">;
    const userId = u.searchParams.get("userId") as Id<"users">;
    const returnTo = u.searchParams.get("returnTo") ?? "ourli://";
    const clientId = process.env.WHOP_CLIENT_ID;
    if (!clientId) return redirect(returnTo, { whop: "not_configured" });
    const state = rand(16);
    const codeVerifier = rand(32);
    await ctx.runMutation(internal.creator.saveState, { state, codeVerifier, dayId, userId, returnTo });
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: callbackUrl(),
      scope: "openid profile",
      state,
      nonce: rand(16),
      code_challenge: await sha256(codeVerifier),
      code_challenge_method: "S256",
    });
    return new Response(null, { status: 302, headers: { Location: "https://api.whop.com/oauth/authorize?" + params } });
  }),
});

http.route({
  path: "/whop/callback",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const u = new URL(req.url);
    const state = u.searchParams.get("state") ?? "";
    const row = await ctx.runMutation(internal.creator.takeState, { state });
    if (!row) return new Response("This sign-in link expired. Go back to ourli and try again.", { status: 400 });
    const code = u.searchParams.get("code");
    if (!code) return redirect(row.returnTo, { whop: "cancelled" });
    try {
      const tokenRes = await fetch("https://api.whop.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code,
          redirect_uri: callbackUrl(),
          client_id: process.env.WHOP_CLIENT_ID,
          code_verifier: row.codeVerifier,
        }),
      });
      if (!tokenRes.ok) throw new Error("token " + tokenRes.status + " " + (await tokenRes.text()));
      const tokens = await tokenRes.json();
      const meRes = await fetch(WHOP_API + "/users/me", { headers: { Authorization: "Bearer " + tokens.access_token } });
      if (!meRes.ok) throw new Error("me " + meRes.status);
      const me = await meRes.json();
      const day = await ctx.runQuery(internal.creator.getDay, { dayId: row.dayId });
      const productId = day?.whopProductId || process.env.WHOP_PRODUCT_ID;
      const accessRes = await fetch(WHOP_API + "/users/" + me.id + "/access/" + productId, {
        headers: { Authorization: "Bearer " + process.env.WHOP_API_KEY },
      });
      if (!accessRes.ok) throw new Error("access " + accessRes.status + " " + (await accessRes.text()));
      const access = await accessRes.json();
      if (!access.has_access) return redirect(row.returnTo, { whop: "no_access", name: me.username ?? "" });
      await ctx.runMutation(internal.creator.addVerifiedFan, { dayId: row.dayId, userId: row.userId, whopUserId: me.id });
      return redirect(row.returnTo, { whop: "ok", name: me.username ?? me.name ?? "" });
    } catch (e) {
      console.error("whop callback failed", e);
      return redirect(row.returnTo, { whop: "error" });
    }
  }),
});

export default http;
