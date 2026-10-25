import type { ComponentProps, KeyboardEvent, MouseEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { normalizeNumeral, scanNumbers } from './numerals'
import { METRIC_ORDER } from './metrics'
import type { MetricKey } from './metrics'

export type NumeralTrace = {
  /** Comparison-form metric strings, built by `metricRegistry`. */
  metrics: Map<string, MetricKey[]>
  tracedLabel: string
  untracedLabel: string
  onTrace?: (metric: MetricKey) => void
}

type HastNode = {
  type: string
  value?: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

/** Code and links are not claims about this run. */
const SKIP_TAGS: Record<string, true> = {
  a: true,
  code: true,
  pre: true,
  script: true,
  style: true,
}

const TRACED_CLASS =
  'numeral cursor-pointer underline decoration-dotted underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
const UNTRACED_CLASS = 'numeral text-muted line-through decoration-line'
const UNTRACED_INTEGER_CLASS = 'numeral text-muted'

function textToNodes(value: string, trace: NumeralTrace): HastNode[] {
  const { tokens } = scanNumbers(value)
  if (tokens.length === 0) return [{ type: 'text', value }]
  const nodes: HastNode[] = []
  let cursor = 0
  for (const token of tokens) {
    if (token.start > cursor) nodes.push({ type: 'text', value: value.slice(cursor, token.start) })
    const metricKeys = trace.metrics.get(normalizeNumeral(token.text)) ?? []
    const bound = metricKeys.length > 0
    // Integers are usually counts, not claims; dim them without striking.
    const className = bound
      ? TRACED_CLASS
      : token.kind === 'integer'
        ? UNTRACED_INTEGER_CLASS
        : UNTRACED_CLASS
    const properties: Record<string, unknown> = {
      className: [className],
      title: bound ? trace.tracedLabel : trace.untracedLabel,
    }
    if (bound) {
      properties.role = 'button'
      properties.tabIndex = 0
      properties['data-metric'] = metricKeys[0]
    }
    nodes.push({
      type: 'element',
      tagName: 'span',
      properties,
      children: [{ type: 'text', value: value.slice(token.start, token.end) }],
    })
    cursor = token.end
  }
  if (cursor < value.length) nodes.push({ type: 'text', value: value.slice(cursor) })
  return nodes
}

function walk(node: HastNode, trace: NumeralTrace): void {
  if (!node.children) return
  const next: HastNode[] = []
  for (const child of node.children) {
    if (child.type === 'text' && typeof child.value === 'string') {
      next.push(...textToNodes(child.value, trace))
      continue
    }
    if (child.type === 'element' && child.tagName && SKIP_TAGS[child.tagName]) {
      next.push(child)
      continue
    }
    walk(child, trace)
    next.push(child)
  }
  node.children = next
}

function numeralPlugin(trace: NumeralTrace) {
  return (tree: HastNode): void => walk(tree, trace)
}

type RehypePlugins = NonNullable<ComponentProps<typeof ReactMarkdown>['rehypePlugins']>

/**
 * Agent answers are Markdown (tables, lists, code). Rendering them as plain
 * text loses the structure the model used to show its evidence.
 *
 * `trace` is only passed for a finished turn: streaming text stays plain so
 * a half-written number never shows a verdict.
 */
export function AgentMarkdown({ text, trace }: { text: string; trace?: NumeralTrace }) {
  function activate(event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) {
    const target = event.target
    const value =
      target instanceof Element
        ? target.closest('[data-metric]')?.getAttribute('data-metric')
        : null
    const metric = METRIC_ORDER.find((key) => key === value)
    if (!metric || !trace?.onTrace) return
    if ('key' in event && event.key !== 'Enter' && event.key !== ' ') return
    if ('key' in event) event.preventDefault()
    trace.onTrace(metric)
  }

  return (
    <div
      className="agent-md"
      onClick={trace?.onTrace ? activate : undefined}
      onKeyDown={trace?.onTrace ? activate : undefined}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={
          // unified's Pluggable tuple types a plugin's settings as unknown[];
          // this closure is only ever invoked as (tree) => void.
          trace ? ([[numeralPlugin, trace]] as unknown as RehypePlugins) : undefined
        }
        components={{
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="underline decoration-line underline-offset-2 hover:decoration-fg"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
