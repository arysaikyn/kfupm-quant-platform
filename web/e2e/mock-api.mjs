import http from 'node:http'

const PORT = 8010
const sessions = new Map()
const streams = new Map()
let seq = 0

function send(res, status, body) {
  const text = JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(text) })
  res.end(text)
}

function sse(res, event, data, id) {
  res.write(`${id ? `id: ${id}\n` : ''}event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

function emit(sessionId, event, data, id) {
  const list = streams.get(sessionId) ?? []
  for (const res of list) sse(res, event, data, id)
}

function answerFor(text) {
  return `## Result\n\nBacktest complete for the test universe.\n\n| Metric | Value |\n|---|---|\n| Total return | 12.30% |\n| Sharpe | 1.20 |\n\nAsk: ${text}`
}

function runTurn(sessionId, text) {
  const attempt = `attempt-${++seq}`
  let i = 0
  const steps = [
    ['attempt.started', { attempt_id: attempt, started_at: Date.now() / 1000 }],
    ['tool_call', { attempt_id: attempt, tool: 'get_market_data', call_id: 'c1', arguments: { symbol: 'AAPL' } }],
    ['tool_result', { attempt_id: attempt, tool: 'get_market_data', call_id: 'c1', status: 'ok', preview: '{"rows": 252}', elapsed_ms: 1240 }],
  ]
  for (const [event, data] of steps) emit(sessionId, event, data, `${attempt}-${++i}`)
  const answer = answerFor(text)
  const chunks = answer.match(/[\s\S]{1,24}/g) ?? [answer]
  let n = i
  const timer = setInterval(() => {
    const next = chunks.shift()
    if (next) {
      emit(sessionId, 'text_delta', { attempt_id: attempt, delta: next }, `${attempt}-${++n}`)
      return
    }
    clearInterval(timer)
    const session = sessions.get(sessionId)
    if (session) {
      session.messages.push({
        message_id: `m-${++seq}`,
        session_id: sessionId,
        role: 'assistant',
        content: answer,
        created_at: new Date().toISOString(),
        linked_attempt_id: attempt,
        metadata: {
          run_id: 'run_1',
          status: 'completed',
          elapsed_ms: 4200,
          model: 'test-model',
        },
        tool_trail: [{
          tool: 'get_market_data',
          status: 'ok',
          elapsed_ms: 1240,
          preview: '{"rows": 252}',
        }],
      })
    }
    emit(sessionId, 'attempt.completed', {
      attempt_id: attempt,
      status: 'completed',
      summary: answer,
      run_dir: '/runs/run_1',
      elapsed_ms: 4200,
      model: 'test-model',
    }, `${attempt}-${++n}`)
    emit(sessionId, 'done', {}, `${attempt}-${++n}`)
  }, 60)
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)
  const path = url.pathname
  if (path === '/api/ai/health') return send(res, 200, { ok: true, upstream: 'mock' })

  if (path === '/api/ai/sessions' && req.method === 'GET') {
    return send(res, 200, [...sessions.values()].map((s) => ({
      session_id: s.id, title: s.title, status: 'active',
      created_at: s.created, updated_at: s.created, last_attempt_id: null,
    })))
  }
  if (path === '/api/ai/sessions' && req.method === 'POST') {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      let title = 'Test session'
      try { title = JSON.parse(body).title || title } catch {}
      const session = { id: 'mock-session', title, created: new Date().toISOString(), messages: [] }
      sessions.set(session.id, session)
      send(res, 201, {
        session_id: session.id, title, status: 'active',
        created_at: session.created, updated_at: session.created, last_attempt_id: null,
      })
    })
    return
  }

  const messages = path.match(/^\/api\/ai\/sessions\/([^/]+)\/messages$/)
  if (messages && req.method === 'GET') {
    const session = sessions.get(messages[1])
    return send(res, 200, session?.messages ?? [])
  }
  if (messages && req.method === 'POST') {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      const text = JSON.parse(body).content ?? ''
      const session = sessions.get(messages[1])
      if (session) {
        session.messages.push({
          message_id: `m-${++seq}`, session_id: session.id, role: 'user', content: text,
          created_at: new Date().toISOString(), linked_attempt_id: null, metadata: null, tool_trail: [],
        })
      }
      send(res, 200, { message_id: `m-${seq}`, attempt_id: `attempt-${seq + 1}` })
      const delay = /slow/i.test(text) ? 5000 : 80
      setTimeout(() => runTurn(messages[1], text), delay)
    })
    return
  }

  const events = path.match(/^\/api\/ai\/sessions\/([^/]+)\/events$/)
  if (events) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    res.write(': connected\n\n')
    const list = streams.get(events[1]) ?? []
    list.push(res)
    streams.set(events[1], list)
    req.on('close', () => {
      streams.set(events[1], (streams.get(events[1]) ?? []).filter((item) => item !== res))
    })
    return
  }

  const cancel = path.match(/^\/api\/ai\/sessions\/([^/]+)\/cancel$/)
  if (cancel && req.method === 'POST') {
    emit(cancel[1], 'attempt.cancelled', { attempt_id: 'attempt-cancel', status: 'cancelled' }, `cancel-${++seq}`)
    emit(cancel[1], 'done', {}, `done-${++seq}`)
    return send(res, 200, { status: 'cancelled' })
  }

  if (path === '/api/ai/runs/run_1/preview') {
    return send(res, 200, {
      metrics: {
        final_value: 11230,
        total_return: 0.123,
        annual_return: 0.11,
        sharpe: 1.2,
        max_drawdown: -0.08,
        win_rate: 0.55,
        trade_count: 12,
      },
      equity_curve: [10000, 10120, 10080, 10450, 10800, 11230].map((equity, i) => ({
        time: `2024-0${i + 1}-01`, equity,
      })),
      report_worthy: true,
    })
  }

  send(res, 404, { detail: 'not found' })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`mock api on http://127.0.0.1:${PORT}`)
})
