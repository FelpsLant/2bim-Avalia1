import { gerarDesenho } from "../../lib/desenho.js";

const SEM_CACHE = { "Cache-Control": "no-store" };

function erro(status, mensagem) {
  return Response.json({ erro: mensagem }, { status, headers: SEM_CACHE });
}

export async function onRequest(context) {
  const { request, env } = context;

  // 1. método (405)
  if (request.method !== "POST") {
    return new Response("Método não permitido", {
      status: 405,
      headers: { Allow: "POST", ...SEM_CACHE },
    });
  }

  // 2. corpo (400)
  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return erro(400, "Corpo ausente ou JSON inválido.");
  }
  const numero = corpo?.numero;
  if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
    return erro(400, "numero deve ser um inteiro entre 1 e 100.");
  }

  // 3. token (401)
  const cabecalho = request.headers.get("Authorization") || "";
  const m = cabecalho.match(/^Bearer\s+(.+)$/i);
  if (!m) return erro(401, "Token ausente.");

  let info;
  try {
    const resp = await fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" +
        encodeURIComponent(m[1].trim())
    );
    if (resp.status !== 200) return erro(401, "Token inválido ou expirado.");
    info = await resp.json();
  } catch {
    return erro(401, "Não foi possível validar o token.");
  }

  if (
    !env.GOOGLE_CLIENT_ID ||
    info.aud !== env.GOOGLE_CLIENT_ID ||
    String(info.email_verified) !== "true" ||
    !info.email
  ) {
    return erro(401, "Token não aceito.");
  }

  const svg = gerarDesenho(numero, info.email);
  return new Response(svg, {
    status: 200,
    headers: { "Content-Type": "image/svg+xml", ...SEM_CACHE },
  });
}
