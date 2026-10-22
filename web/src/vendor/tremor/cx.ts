// Vendored from tremorlabs/tremor — src/utils/cx.ts (Apache-2.0). Copied 2026-10-22, unmodified.
// Tremor cx [v0.0.0]

import clsx, { type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cx(...args: ClassValue[]) {
  return twMerge(clsx(...args))
}
