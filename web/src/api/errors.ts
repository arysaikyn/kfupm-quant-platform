/**
 * One error type for everything the transport can fail at: HTTP status, an
 * unreadable body, a timeout, an unreachable backend. `status` is 0 when there
 * was no response at all.
 */
export class AiApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AiApiError'
    this.status = status
  }
}
