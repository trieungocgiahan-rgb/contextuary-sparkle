// Thin wrapper around Lovable's asset pipeline so landing components can just import
// `{ logoUrl }` without each one knowing the underlying .asset.json shape.
import logoAsset from "@/assets/contextuary-logo.jpeg.asset.json";
import signinBgAsset from "@/assets/signin-bg.png.asset.json";

export const logoUrl = logoAsset.url;
export const signinBgUrl = signinBgAsset.url;
