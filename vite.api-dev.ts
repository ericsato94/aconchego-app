import type { IncomingMessage, ServerResponse } from 'node:http'
import { loadEnv, type Plugin, type ViteDevServer } from 'vite'

/**
 * Roda as funções de api/ (as mesmas da Vercel) dentro do `npm run dev`.
 * Em produção, a Vercel serve api/ diretamente; este plugin só existe no desenvolvimento.
 */
const ROUTES: Array<[RegExp, string]> = [
  [/^\/api\/health$/, '/api/health.ts'],
  [/^\/api\/voices$/, '/api/voices/index.ts'],
  [/^\/api\/voices\/[^/]+$/, '/api/voices/[id].ts'],
  [/^\/api\/narration$/, '/api/narration.ts'],
]

async function toRequest(req: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const body = chunks.length ? Buffer.concat(chunks) : undefined
  return new Request(`http://${req.headers.host ?? 'localhost'}${req.url}`, {
    method: req.method,
    headers: req.headers as Record<string, string>,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
  })
}

async function send(res: ServerResponse, response: Response) {
  res.statusCode = response.status
  response.headers.forEach((value, key) => res.setHeader(key, value))
  res.end(Buffer.from(await response.arrayBuffer()))
}

export function apiDevServer(): Plugin {
  return {
    name: 'aconchego-api-dev',
    apply: 'serve',
    config(_, { mode }) {
      // Variáveis do .env (inclusive as sem prefixo VITE_) para as funções do servidor.
      Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? '').split('?')[0]
        const match = ROUTES.find(([pattern]) => pattern.test(path))
        if (!match) return next()
        try {
          const mod = (await server.ssrLoadModule(match[1])) as Record<string, (r: Request) => Response | Promise<Response>>
          const handler = mod[req.method ?? 'GET']
          if (!handler) return send(res, Response.json({ error: 'Método não permitido.' }, { status: 405 }))
          await send(res, await handler(await toRequest(req)))
        } catch (err) {
          server.ssrFixStacktrace(err as Error)
          console.error(err)
          await send(res, Response.json({ error: 'Erro no servidor de desenvolvimento.' }, { status: 500 }))
        }
      })
    },
  }
}
