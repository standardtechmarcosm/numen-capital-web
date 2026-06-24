// ============================================================
// FUNCION SERVERLESS — Tasa USDT/COP en vivo (CriptoYa)
// ============================================================
// Toma el precio de COMPRA (bid) de Binance P2P en Colombia
// desde CriptoYa y le suma el MARGEN ($30) = tu precio de venta.
// ============================================================

const MARGEN = 30;
const PRECIO_RESPALDO = 4150;

export async function onRequest(context) {
    const corsHeaders = {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
    };

  if (context.request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
  }

  try {
        const resp = await fetch("https://criptoya.com/api/USDT/COP/1", {
                headers: { "Accept": "application/json" }
        });
        if (!resp.ok) throw new Error("CriptoYa HTTP " + resp.status);

      const data = await resp.json();
        let precioCompra = null;
        let fuente = "";

      if (data.binancep2p && data.binancep2p.bid) {
              precioCompra = parseFloat(data.binancep2p.bid);
              fuente = "Binance P2P";
      } else {
              const keys = ["okexp2p","bybitp2p","kucoinp2p","bitgetp2p","bingxp2p","mexcp2p"];
              let mejor = 0;
              for (const k of keys) {
                        if (data[k] && data[k].bid) {
                                    const b = parseFloat(data[k].bid);
                                    if (b > mejor) { mejor = b; fuente = k; }
                        }
              }
              if (mejor > 0) precioCompra = mejor;
      }

      if (!precioCompra) throw new Error("Sin precio disponible");

      const precioVenta = Math.round(precioCompra + MARGEN);

      return new Response(JSON.stringify({
              ok: true,
              precio: precioVenta,
              base: Math.round(precioCompra),
              margen: MARGEN,
              fuente: fuente,
              moneda: "COP",
              par: "USDT/COP",
              enVivo: true,
              actualizado: new Date().toISOString()
      }), { headers: corsHeaders });

  } catch (err) {
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
