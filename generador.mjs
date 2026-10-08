// Panel para generar códigos de activación. Corre SOLO en tu laptop: npm run generador
import fs from "node:fs";
import http from "node:http";
import crypto from "node:crypto";
import { exec } from "node:child_process";
import { CLIENTES, leerSecretos, leerConfig, firmarCodigo } from "./comun.mjs";

const PUERTO = 8090;
const secretos = leerSecretos();

const leerClientes = () => (fs.existsSync(CLIENTES) ? JSON.parse(fs.readFileSync(CLIENTES, "utf8")) : []);
const guardarClientes = (l) => fs.writeFileSync(CLIENTES, JSON.stringify(l, null, 2));

const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
function sumarMeses(desdeISO, meses) {
  const [y, m, d] = desdeISO.split("-").map(Number);
  const f = new Date(y, m - 1 + meses, 1);
  f.setDate(Math.min(d, new Date(f.getFullYear(), f.getMonth() + 1, 0).getDate()));
  return iso(f);
}

function emitir(c) {
  const config = leerConfig();
  const codigo = firmarCodigo(secretos, { i: c.id, n: c.cliente, v: c.vence, k: secretos.aes });
  const enlace = config.url + "#activar=" + codigo;
  const mensaje = `Hola ${c.cliente} 👋, aquí está tu acceso a ${config.nombreVendedor || "Ta Boutique"}, válido hasta el ${c.vence.split("-").reverse().join("/")}.\n\nÁbrelo desde tu celular con Chrome:\n${enlace}\n\nLuego en el menú ⋮ elige "Instalar aplicación". ¡Gracias!`;
  return { ...c, codigo, enlace, mensaje };
}

function acciones(datos) {
  const lista = leerClientes();
  const meses = Math.max(1, Math.min(24, Math.round(Number(datos.meses) || 1)));
  const hoy = iso(new Date());
  if (datos.accion === "nuevo") {
    const cliente = String(datos.cliente || "").trim();
    if (!cliente) throw new Error("Escribe el nombre del cliente");
    const c = { id: crypto.randomBytes(4).toString("hex"), cliente, tel: String(datos.tel || "").replace(/\D/g, ""), creado: hoy, vence: sumarMeses(hoy, meses), pagos: [{ fecha: hoy, meses }] };
    lista.push(c); guardarClientes(lista);
    return emitir(c);
  }
  const c = lista.find((x) => x.id === datos.id);
  if (!c) throw new Error("Cliente no encontrado");
  if (datos.accion === "renovar") {
    c.vence = sumarMeses(c.vence > hoy ? c.vence : hoy, meses);
    c.pagos.push({ fecha: hoy, meses });
    guardarClientes(lista);
    return emitir(c);
  }
  if (datos.accion === "reenviar") return emitir(c);
  if (datos.accion === "borrar") { guardarClientes(lista.filter((x) => x !== c)); return { ok: true }; }
  throw new Error("Acción desconocida");
}

http.createServer((req, res) => {
  const responder = (code, tipo, cuerpo) => { res.writeHead(code, { "Content-Type": tipo }); res.end(cuerpo); };
  if (req.method === "GET" && req.url === "/") return responder(200, "text/html; charset=utf-8", fs.readFileSync(new URL("./generador.html", import.meta.url)));
  if (req.method === "GET" && req.url === "/api/clientes") return responder(200, "application/json", JSON.stringify({ clientes: leerClientes(), config: leerConfig() }));
  if (req.method === "POST" && req.url === "/api/accion") {
    let b = "";
    req.on("data", (d) => (b += d));
    req.on("end", () => {
      try { responder(200, "application/json", JSON.stringify(acciones(JSON.parse(b)))); }
      catch (e) { responder(400, "application/json", JSON.stringify({ error: e.message })); }
    });
    return;
  }
  responder(404, "text/plain", "No encontrado");
}).listen(PUERTO, "127.0.0.1", () => {
  const url = `http://localhost:${PUERTO}`;
  console.log("Generador de códigos en " + url + "  (Ctrl+C para cerrar)");
  if (!process.env.SIN_NAVEGADOR) exec(`start "" "${url}"`);
});
