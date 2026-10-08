// Funciones compartidas por crear-llaves, preparar y generador. Solo corren en tu laptop.
import fs from "node:fs";
import crypto from "node:crypto";

export const SECRETOS = new URL("./.secretos.json", import.meta.url);
export const CONFIG = new URL("./config.json", import.meta.url);
export const CLIENTES = new URL("./clientes.json", import.meta.url);

export const b64url = (buf) => Buffer.from(buf).toString("base64url");

export function leerSecretos() {
  if (!fs.existsSync(SECRETOS)) {
    console.error("No existe .secretos.json. Ejecuta primero:  npm run llaves");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(SECRETOS, "utf8"));
}

export function leerConfig() {
  return JSON.parse(fs.readFileSync(CONFIG, "utf8"));
}

export function llavePublica(secretos) {
  const { kty, crv, x, y } = secretos.privada;
  return { kty, crv, x, y };
}

// Código de activación = datos (base64url) + "." + firma ECDSA P-256 (base64url)
export function firmarCodigo(secretos, datos) {
  const cuerpo = b64url(JSON.stringify(datos));
  const llave = crypto.createPrivateKey({ key: secretos.privada, format: "jwk" });
  const firma = crypto.sign("sha256", Buffer.from(cuerpo), { key: llave, dsaEncoding: "ieee-p1363" });
  return cuerpo + "." + b64url(firma);
}

export function cifrarApp(secretos, html) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", Buffer.from(secretos.aes, "base64url"), iv);
  const datos = Buffer.concat([c.update(html, "utf8"), c.final(), c.getAuthTag()]);
  return Buffer.concat([iv, datos]);
}
