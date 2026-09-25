// Static images live in /public so they're served from the site's base path.
// Replace public/logo.svg (and add public/signin-bg.png) with your own artwork.
const base = import.meta.env.BASE_URL;

export const logoUrl = `${base}logo.svg`;
export const signinBgUrl = `${base}signin-bg.png`;
