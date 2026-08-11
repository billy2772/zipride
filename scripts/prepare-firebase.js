import fs from "node:fs";
import path from "node:path";

const publicDir = path.resolve(process.cwd(), ".output/public");
const assetsDir = path.join(publicDir, "assets");

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

let cssLink = "";
let jsModule = "";

if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  const cssFile = files.find((f) => f.endsWith(".css"));
  if (cssFile) {
    cssLink = `<link rel="stylesheet" href="/assets/${cssFile}" />`;
  }
  const mainJs =
    files.find((f) => f.startsWith("index-") && f.endsWith(".js")) ||
    files.find((f) => f.startsWith("router-") && f.endsWith(".js")) ||
    files.find((f) => f.startsWith("start-") && f.endsWith(".js")) ||
    files.find((f) => f.endsWith(".js"));

  if (mainJs) {
    jsModule = `<script type="module" src="/assets/${mainJs}"></script>`;
  }
}

const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ZipRide — Your City. Your Ride.</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="alternate icon" href="/favicon.ico" />
    ${cssLink}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Plus+Jakarta+Sans:ital,wght@0,400..800;1,400..800&family=Tinos:ital,wght@0,400;0,700;1,400;1,700&display=swap" />
  </head>
  <body>
    <script>
      window.$_TSR = window.$_TSR || {
        initialized: false,
        buffer: [],
        h: function() {},
        router: {
          matches: [],
          manifest: undefined,
          dehydratedData: undefined,
          lastMatchId: undefined
        }
      };
    </script>
    ${jsModule}
  </body>
</html>`;

fs.writeFileSync(path.join(publicDir, "index.html"), htmlContent, "utf-8");
console.log("Successfully created .output/public/index.html for Firebase Hosting!");
