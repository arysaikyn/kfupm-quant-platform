import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Agent answers are Markdown (tables, lists, code). Rendering them as plain
 * text loses the structure the model used to show its evidence.
 */
export function AgentMarkdown({ text }: { text: string }) {
  return (
    <div className="agent-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
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
