// Vendored from tremorlabs/tremor — src/hooks/useOnWindowResize.ts (Apache-2.0). Copied 2026-10-22, unmodified.
// Tremor useOnWindowResize [v0.0.2]

import * as React from "react"

export const useOnWindowResize = (handler: () => void) => {
  React.useEffect(() => {
    const handleResize = () => {
      handler()
    }
    handleResize()
    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [handler])
}
