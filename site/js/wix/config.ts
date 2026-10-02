// Written by install/deploy.mjs --stack static from .env.local's WIX_CLIENT_ID (what `wix env pull`
// writes; on a migration preview the site being migrated), else wix.config.json, or --client-id.
// The public OAuth client id — not a secret: it only mints anonymous visitor tokens.
export const WIX_CLIENT_ID: string = "ecf1b809-25e4-46d2-aa8d-f189d1126d13";
