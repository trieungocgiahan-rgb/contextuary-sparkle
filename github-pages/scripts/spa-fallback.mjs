// GitHub Pages has no server-side routing: a deep link like /words would 404.
// Serving a copy of index.html as 404.html lets the client router take over.
import { copyFileSync } from "node:fs";

copyFileSync("dist/index.html", "dist/404.html");
console.log("Copied dist/index.html -> dist/404.html");
