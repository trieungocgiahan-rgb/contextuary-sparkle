// Static images live in /public so they're served from the site's base path.
const base = import.meta.env.BASE_URL;

export const logoUrl = `${base}logo.png`;
export const signinBgUrl = `${base}signin-bg.jpg`;
