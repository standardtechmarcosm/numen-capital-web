// ============================================================
// FUNCIÓN SERVERLESS — Tasa USDT/COP desde Binance P2P
// ============================================================
// Esta función corre en el servidor de Cloudflare (no en el navegador),
// por eso Binance NO la bloquea como bloquea las consultas del navegador.
//
// Endpoint resultante: https://tudominio.co/api/tasa
//
// LÓGICA: toma el MAYOR precio de compra del P2P de Binance Colombia
//         y le suma el MARGEN ($30 COP) = tu precio de venta.
// ============================================================

const MARGEN = 30;          // <-- Tu margen: $30 COP sobre el mayor precio de compra
const PRECIO_RESPALDO = 4150; // <-- Precio de respaldo si Binance no responde

export async function onRequest(context) {
  // Headers para permitir que tu web llame a esta función
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };

  // Responder a preflight CORS
  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const payload = {
    asset: "USDT",
    fiat: "COP",
    tradeType: "BUY",   // anuncios de compra → tomamos el mayor (mejor bid)
    page: 1,
    rows: 10,
    payTypes: [],
    publisherType: null
  };

  try {
    const resp = await fetch(
      "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
          "Accept": "*/*",
          "Origin": "https://p2p.binance.com",
          "Referer": "https://p2p.binance.com/en/trade/all-payments/USDT?fiat=COP"
        },
        body: JSON.stringify(payload)
      }
    );

    if (!resp.ok) throw new Error("Binance HTTP " + resp.status);

    const data = await resp.json();
    if (!data.data || !data.data.length) throw new Error("Sin datos de Binance");

    // Extraer todos los precios y tomar el mayor (mejor precio de compra)
    const precios = data.data
      .map(item => parseFloat(item.adv && item.adv.price))
      .filter(p => !isNaN(p));

    if (!precios.length) throw new Error("Sin precios válidos");

    const mayorCompra = Math.max(...precios);
    const precioVenta = Math.round(mayorCompra + MARGEN);

    return new Response(JSON.stringify({
      ok: true,
      precio: precioVenta,
      base: Math.round(mayorCompra),
      margen: MARGEN,
      moneda: "COP",
      par: "USDT/COP",
      enVivo: true,
      actualizado: new Date().toISOString()
    }), { headers: corsHeaders });

  } catch (err) {
    // Si Binance falla, devolver precio de respaldo (la web nunca se rompe)
    return new Response(JSON.stringify({
      ok: false,
      precio: PRECIO_RESPALDO,
      moneda: "COP",
      par: "USDT/COP",
      enVivo: false,
      error: err.message,
      actualizado: new Date().toISOString()
    }), { headers: corsHeaders });
  }
}
