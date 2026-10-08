// Prepara la carpeta docs/ (lo que se publica en GitHub Pages):
// docs/app/ = la app cifrada con sus íconos; docs/ = la página de venta.
import fs from "node:fs";
import { leerSecretos, leerConfig, llavePublica, cifrarApp } from "./comun.mjs";

const ORIGEN = new URL("../mi-tienda-app/", import.meta.url);
const DOCS = new URL("./docs/app/", import.meta.url);
const SITIO = new URL("./docs/", import.meta.url);

const secretos = leerSecretos();
const config = leerConfig();

// La capacitación se agrega a la app justo antes de </body>, y se cifra junto con ella.
const base = fs.readFileSync(new URL("index.html", ORIGEN), "utf8");
const curso = fs.readFileSync(new URL("./capacitacion.html", import.meta.url), "utf8");
const corte = base.lastIndexOf("</body>");
if (corte < 0) throw new Error("No encontré </body> en la app");
const html = base.slice(0, corte) + curso + "\n" + base.slice(corte);
fs.writeFileSync(new URL("app.enc", DOCS), cifrarApp(secretos, html));

for (const f of ["icon.svg", "icon-192.png", "icon-512.png", "icon-maskable-192.png", "icon-maskable-512.png"]) {
  fs.copyFileSync(new URL(f, ORIGEN), new URL(f, DOCS));
}

const publica = { llave: llavePublica(secretos), contactoWA: config.contactoWA || "", nombre: config.nombreVendedor || "Mi Tienda" };
fs.writeFileSync(new URL("config.js", DOCS), "window.LICENCIA = " + JSON.stringify(publica) + ";\n");

// Datos para la página de venta (docs/index.html)
const venta = { contactoWA: config.contactoWA || "", precio: config.precioMensual || "", nombre: config.nombreVendedor || "Mi Tienda" };
fs.writeFileSync(new URL("datos.js", SITIO), "window.VENTA = " + JSON.stringify(venta) + ";\n");

console.log("docs/ listo: app cifrada (" + Math.round(html.length / 1024) + " KB), íconos, config.js y datos.js.");
