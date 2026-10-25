import type { MessageItem } from '../../api/ai'

export type RefusalRule = 'execution' | 'guarantee' | 'advice'

export type RefusalHit = {
  rule: RefusalRule
  /** The exact phrase that crossed the product boundary. */
  trigger: string
}

export type RefusalReceipt = RefusalHit & {
  role: 'user' | 'assistant'
  at?: number
}

type Pattern = { rule: RefusalRule; re: RegExp; group?: number }

/**
 * Product boundary copy, not a legal opinion: this app does not place orders,
 * give buy/sell advice, or promise returns. Any request or answer that does
 * is receipted with the phrase that triggered it plus a compliant rewrite.
 */
const PATTERNS: Pattern[] = [
  // Execution: a concrete order, not a hypothetical.
  {
    rule: 'execution',
    re: /\b(?:place|submit|route|execute)\s+(?:an?\s+)?(?:market\s+|limit\s+)?(?:order|trade)\b/giu,
  },
  {
    rule: 'execution',
    re: /\b(?:buy|sell|short)\s+(?:me\s+)?(?:\d[\d,.]*\s*)?(?:shares?|units?|lots?|contracts?)\b/giu,
  },
  {
    rule: 'execution',
    re: /\b(?:i(?:'ve|\s+have)?\s+(?:placed|submitted|executed)\s+(?:the|your|an?)\s+(?:order|trade))\b/giu,
  },
  {
    rule: 'execution',
    re: /(?:帮我|给我|替我)?(?:买入|卖出|下单|挂单|买进|清仓|全部卖掉)/g,
  },
  {
    rule: 'execution',
    re: /(?:^|[\s،,.:؛;])(نفّذ|نفذ|ضع\s+أمر|أرسل\s+أمر|اشترِ|اشتر|بِع)(?=[\s،,.:؛;؟?]|$)/gu,
    group: 1,
  },

  // Guarantee: any promise of a certain outcome.
  {
    rule: 'guarantee',
    re: /\b(?:guaranteed?|guarantee[sd]?|risk[-\s]?free|sure\s+(?:thing|profit|return|win)|can(?:'|’)?t\s+lose|won(?:'|’)?t\s+lose|assured\s+(?:return|profit)|fixed\s+return)\b/giu,
  },
  {
    rule: 'guarantee',
    re: /(?:保本|保收益|稳赚|包赚|零风险|无风险|一定(?:会)?(?:涨|赚|盈利)|保证(?:收益|赚钱|盈利|回报)|稳赚不赔)/g,
  },
  {
    rule: 'guarantee',
    re: /(?:^|[\s،,.:؛;])(مضمون(?:ة)?|بلا\s+مخاطر|بدون\s+مخاطر|ربح\s+مؤكد|أرباح\s+مؤكدة|عائد\s+مضمون)(?=[\s،,.:؛;؟?]|$)/gu,
    group: 1,
  },

  // Advice: a personal buy/sell/hold call.
  {
    rule: 'advice',
    re: /\b(?:should\s+(?:i|we)\s+(?:buy|sell|hold|invest)|shouldn(?:'|’)?t\s+(?:i|we)\s+(?:buy|sell)|what\s+should\s+i\s+(?:buy|invest\s+in)|which\s+(?:stock|share|fund)s?\s+(?:should\s+i\s+)?(?:buy|to\s+buy)|best\s+(?:stock|share|fund)\s+(?:to\s+buy|right\s+now)|recommend\s+(?:me\s+)?(?:a\s+)?(?:stock|share|buy|sell|investment)|give\s+me\s+a\s+(?:buy|sell)\s+(?:signal|call)|is\s+(?:it|now)\s+(?:a\s+)?good\s+time\s+to\s+(?:buy|sell|invest)|worth\s+buying|you\s+should\s+(?:buy|sell)|i\s+recommend\s+(?:buying|selling)|buy\s+it\s+now)\b/giu,
  },
  {
    rule: 'advice',
    re: /(?:该不该买|该买|能不能买|能买吗|值得买吗|要不要买|买哪(?:只|个|支)|推荐(?:一?只|一?个)?(?:股票|基金|标的|股)|给我(?:一?个)?(?:买入|卖出)建议|是不是该买)/g,
  },
  {
    rule: 'advice',
    re: /(?:^|[\s،,.:؛;])(هل\s+(?:أشتري|أبيع)|أي\s+سهم\s+(?:أشتري|أشترى)|انصحني\s+بسهم|نصيحة\s+(?:شراء|بيع))(?=[\s،,.:؛;؟?]|$)/gu,
    group: 1,
  },
]

/** A denial in the same clause flips the phrase: "no return is guaranteed". */
const NEGATED_BEFORE =
  /\b(?:not|no|never|cannot|can(?:'|’)?t|won(?:'|’)?t|without|isn(?:'|’)?t|aren(?:'|’)?t|don(?:'|’)?t|doesn(?:'|’)?t|nothing|none)\b|不|没(?:有)?|无|未|非|别|无法|不会|不能|不要|لا|ليس|ليست|غير|بدون|دون|لن/iu

const DENIED_AFTER =
  /\b(?:impossible|no|never|not|do(?:es)?\s+not\s+exist|don(?:'|’)?t\s+exist|can(?:'|’)?t\s+be|not\s+possible)\b|不存在|不可能|做不到|不是绝对|لا\s+يمكن|غير\s+ممكن/iu

function triggerOf(match: RegExpExecArray, group = 0): string {
  const raw = (match[group] ?? match[0]).replace(/\s+/g, ' ').trim()
  return raw.length > 80 ? `${raw.slice(0, 77)}…` : raw
}

function clauseBefore(text: string, index: number): string {
  const window = text.slice(Math.max(0, index - 64), index)
  const parts = window.split(/[.!?。！？\n]/)
  return parts[parts.length - 1]
}

function contextualDenial(
  text: string,
  match: RegExpExecArray,
  pattern: Pattern,
  role: 'user' | 'assistant',
): boolean {
  // Advice questions often hedge with "not sure", so only the concrete rules
  // (an order, a promise) treat a nearby denial as disqualifying.
  if (pattern.rule === 'advice') return false
  if (NEGATED_BEFORE.test(clauseBefore(text, match.index))) return true
  if (role !== 'assistant') return false
  const after = text.slice(match.index + match[0].length, match.index + match[0].length + 48)
  return DENIED_AFTER.test(after)
}

/**
 * Pick the earliest crossing phrase. Ties keep the more specific rule so a
 * "buy 100 shares" order is receipted as execution, not as idle advice.
 */
export function classifyRefusal(
  text: string,
  role: 'user' | 'assistant' = 'user',
): RefusalHit | null {
  if (!text) return null
  let best: { hit: RefusalHit; index: number; order: number } | null = null
  for (const [order, pattern] of PATTERNS.entries()) {
    pattern.re.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = pattern.re.exec(text)) !== null) {
      if (contextualDenial(text, match, pattern, role)) continue
      const candidate = {
        hit: { rule: pattern.rule, trigger: triggerOf(match, pattern.group) },
        index: match.index,
        order,
      }
      if (!best || candidate.index < best.index || (candidate.index === best.index && order < best.order)) {
        best = candidate
      }
      break
    }
  }
  return best ? best.hit : null
}

/** One message's receipt, carrying the role that crossed the boundary. */
export function receiptFor(
  text: string,
  role: 'user' | 'assistant',
  at?: number,
): RefusalReceipt | null {
  const hit = classifyRefusal(text, role)
  return hit ? { ...hit, role, at } : null
}

const CONTEXT_PREAMBLE = /^App context selected by the user:\n(?:- [^\n]*\n)*\n/

/** `/runs` scans persisted messages; the app-context preamble is not the user's words. */
export function receiptsFromMessages(items: MessageItem[]): RefusalReceipt[] {
  const receipts: RefusalReceipt[] = []
  for (const item of items) {
    if (item.role !== 'user' && item.role !== 'assistant') continue
    const text = item.content.replace(CONTEXT_PREAMBLE, '')
    const at = Date.parse(item.created_at)
    const receipt = receiptFor(text, item.role, Number.isFinite(at) ? at : undefined)
    if (receipt) receipts.push(receipt)
  }
  return receipts
}
