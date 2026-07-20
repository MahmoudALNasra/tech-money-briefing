import { loadLocalEnv } from "../lib/load-env";

loadLocalEnv();

const REDIRECT_URI = "http://localhost";

function getScope() {
  if (process.argv.includes("--write")) {
    return "https://www.googleapis.com/auth/webmasters";
  }

  return "https://www.googleapis.com/auth/webmasters.readonly";
}

function getArg(name: string) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg?.slice(prefix.length).trim();
}

function getOauthConfig() {
  const clientId =
    process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() ||
    process.env.GSC_OAUTH_CLIENT_ID?.trim();
  const clientSecret =
    process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() ||
    process.env.GSC_OAUTH_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      "Add GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET to .env.local first."
    );
  }

  return { clientId, clientSecret };
}

async function exchangeCodeForRefreshToken(code: string) {
  const { clientId, clientSecret } = getOauthConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code"
    })
  });

  const json = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(
      `OAuth code exchange failed (${response.status}): ${JSON.stringify(json)}`
    );
  }

  console.log(
    JSON.stringify(
      {
        GOOGLE_OAUTH_REFRESH_TOKEN: json.refresh_token,
        note:
          "Copy GOOGLE_OAUTH_REFRESH_TOKEN into .env.local. If refresh_token is missing, revoke app access and retry with prompt=consent."
      },
      null,
      2
    )
  );
}

async function run() {
  const code = getArg("code");

  if (code) {
    await exchangeCodeForRefreshToken(code);
    return;
  }

  const { clientId } = getOauthConfig();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", getScope());
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");

  console.log("Open this URL, approve access, then copy the code= value:");
  console.log(url.toString());
  console.log("");
  console.log(
    process.argv.includes("--write")
      ? "Then run: npm run gsc:oauth-token -- --write --code=PASTE_CODE_HERE"
      : "Then run: npm run gsc:oauth-token -- --code=PASTE_CODE_HERE"
  );
}

run().catch((error) => {
  console.error("[gsc-oauth-token] Failed", error);
  process.exitCode = 1;
});
