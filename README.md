# Numen Capital — Sitio web

Landing page de Numen Capital con tasa USDT/COP en vivo desde Binance P2P.

## Estructura

```
/
├── index.html              → La página web
└── functions/
    └── api/
        └── tasa.js         → Función que trae la tasa de Binance (corre en el servidor)
```

## Cómo funciona la tasa en vivo

1. La web (`index.html`) llama a `/api/tasa`
2. Esa ruta ejecuta `functions/api/tasa.js` en el servidor de Cloudflare
3. La función consulta el P2P de Binance (mayor precio de compra USDT/COP + $30)
4. Devuelve el precio a la web, que lo muestra y refresca cada 30 segundos

## Dónde cambiar valores

**Tu margen y precio de respaldo** → en `functions/api/tasa.js`:
- `MARGEN = 30` (los $30 COP sobre el mayor precio de compra)
- `PRECIO_RESPALDO = 4150` (precio si Binance no responde)

**Tu WhatsApp** → en `index.html`, busca `WHATSAPP_NUM = "573104661300"`

## Publicar en Cloudflare Pages

1. Sube esta carpeta a un repositorio de GitHub
2. En Cloudflare Pages → "Create a project" → conecta el repositorio
3. Build settings: deja todo vacío (no hay build), output directory: `/`
4. Deploy
5. Conecta tu dominio numencapital.co en la pestaña "Custom domains"

© 2026 Numen Capital
