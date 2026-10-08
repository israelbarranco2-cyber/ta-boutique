// Prepara la carpeta docs/ (lo que se publica en GitHub Pages):
// cifra la app, copia los íconos y escribe la configuración pública.
import fs from "node:fs";
import { leerSecretos, leerConfig, llavePublica, cifrarApp } from "./comun.mjs";

const ORIGEN = new URL("../mi-tienda-app/", import.meta.url);
const DOCS = new URL("./docs/", import.meta.url);

const secretos = leerSecretos();
const config = leerConfig();

const html = fs.readFileSync(new URL("index.html", ORIGEN), "utf8");
fs.writeFileSync(new URL("app.enc", DOCS), cifrarApp(secretos, html));

for (const f of ["icon.svg", "icon-192.png", "icon-512.png", "icon-maskable-192.png", "icon-maskable-512.png"]) {
  fs.copyFileSync(new URL(f, ORIGEN), new URL(f, DOCS));
}

const publica = { llave: llavePublica(secretos), contactoWA: config.contactoWA || "", nombre: config.nombreVendedor || "Mi Tienda" };
fs.writeFileSync(new URL("config.js", DOCS), "window.LICENCIA = " + JSON.stringify(publica) + ";\n");

console.log("docs/ listo: app cifrada (" + Math.round(html.length / 1024) + " KB), íconos y config.js.");
