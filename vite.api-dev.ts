import { existsSync, readdirSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import { loadEnv, type Plugin, type ViteDevServer } from 'vite'

/**
 * Roda as funções de api/ (as mesmas da Vercel) dentro do `npm run dev`.
 * Em produção, a Vercel serve api/ diretamente; este plugin só existe no desenvolvimento.
 */
/** Resolve /api/a/b para api/a/b.ts, api/a/b/index.ts ou api/a/[param].ts (como a Vercel). */
function resolveRoute(path: string): string | null {
  const parts = path.replace(/^\/api\/?/, '').split('/').filter(Boolean)
  if (!parts.length || parts.some((p) => p.startsWith('_') || p.includes('.'))) return null
  const dir = parts.slice(0, -1).join('/')
  const candidates = [`api/${parts.join('/')}.ts`, `api/${parts.join('/')}/index.ts`]
  const folder = join(process.cwd(), 'api', dir)
  if (existsSync(folder)) {
    const dynamic = readdirSync(folder).find((f) => /^\[[^\]]+\]\.ts$/.test(f))
    if (dynamic) candidates.push(`api/${dir ? `${dir}/` : ''}${dynamic}`)
  }
  const file = candidates.find((c) => existsSync(join(process.cwd(), c)))
  return file ? `/${file}` : null
}

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
  const cookies = response.headers.getSetCookie?.() ?? []
  if (cookies.length) res.setHeader('set-cookie', cookies)
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
        if (!path.startsWith('/api/')) return next()
        const file = resolveRoute(path)
        if (!file) return send(res, Response.json({ error: 'Rota não encontrada.' }, { status: 404 }))
        try {
          const mod = (await server.ssrLoadModule(file)) as Record<string, (r: Request) => Response | Promise<Response>>
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
