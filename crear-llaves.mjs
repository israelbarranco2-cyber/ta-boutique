// Crea las llaves secretas UNA sola vez. Si las cambias, todos los códigos ya vendidos dejan de servir.
import fs from "node:fs";
import crypto from "node:crypto";
import { SECRETOS, b64url } from "./comun.mjs";

if (fs.existsSync(SECRETOS)) {
  console.error("Ya existen llaves en .secretos.json. No se sobrescriben (invalidaría los códigos vendidos).");
  process.exit(1);
}
const { privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
const secretos = {
  creado: new Date().toISOString(),
  privada: privateKey.export({ format: "jwk" }),
  aes: b64url(crypto.randomBytes(32)),
};
fs.writeFileSync(SECRETOS, JSON.stringify(secretos, null, 2));
console.log("Llaves creadas en .secretos.json — guarda una copia en un lugar seguro y NUNCA la subas a GitHub.");
