// =====================================================================
// jw.js  —  worker hope2 (reservado pro protótipo)
// ---------------------------------------------------------------------
// Proxy de CORS, só passthrough. O navegador não dá fetch direto na
// wol.jw.org (sem CORS); este worker busca a página e devolve com os
// cabeçalhos CORS. Não processa nada.
//
// Uso:  GET https://hope2.momentaneo2021.workers.dev/?url=<URL codificada>
//
// Deploy: push deste arquivo pro git -> o git publica no worker.
// (Se o deploy reclamar, confira no wrangler.toml: main = "jw.js" e um
//  compatibility_date recente.)
// =====================================================================

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

// Allowlist: só jw.org / WOL passam. Não vira um proxy aberto.
const HOSTS_OK = ["wol.jw.org", "www.jw.org", "b.jw-cdn.org"];

// Headers de navegador real, pra evitar bloqueio do lado da JW.
const HEADERS_ROBUSTOS = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9",
  "Cache-Control": "no-cache"
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    const alvo = new URL(request.url).searchParams.get("url");
    if (!alvo) {
      return new Response("Faltou o parâmetro ?url=", { status: 400, headers: CORS });
    }

    let destino;
    try {
      destino = new URL(alvo);
    } catch {
      return new Response("URL inválida.", { status: 400, headers: CORS });
    }

    if (!HOSTS_OK.includes(destino.hostname)) {
      return new Response(`Host não permitido: ${destino.hostname}`, {
        status: 403,
        headers: CORS
      });
    }

    try {
      const resp = await fetch(destino.toString(), {
        method: "GET",
        headers: HEADERS_ROBUSTOS,
        redirect: "follow"
      });
      const corpo = await resp.text();
      const tipo = resp.headers.get("content-type") || "text/html;charset=UTF-8";
      return new Response(corpo, {
        status: resp.status,
        headers: { ...CORS, "Content-Type": tipo }
      });
    } catch (e) {
      return new Response(`Erro no proxy: ${e.message}`, { status: 502, headers: CORS });
    }
  }
};
