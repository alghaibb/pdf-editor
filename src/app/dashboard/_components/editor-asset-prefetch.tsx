import { WEBVIEWER_PATH } from "@/lib/webviewer/constants"

/**
 * Warms the browser HTTP cache with WebViewer's boot chain (~4 MB) while the
 * user is on the dashboard, so the first editor open skips the download.
 * rel="prefetch" fetches at idle priority, and the assets are served with
 * immutable cache headers, so repeat visits cost nothing.
 *
 * Only the deterministic files are listed. The wasm workers are excluded
 * because WebViewer picks a variant (lean/full, threaded, br/gz) at runtime
 * based on browser capabilities, and guessing wrong wastes megabytes.
 */
export function EditorAssetPrefetch() {
  return (
    <>
      <link
        rel="prefetch"
        href={`${WEBVIEWER_PATH}/ui/index.html`}
        as="document"
      />
      <link
        rel="prefetch"
        href={`${WEBVIEWER_PATH}/ui/webviewer-ui.min.js`}
        as="script"
      />
      <link rel="prefetch" href={`${WEBVIEWER_PATH}/ui/style.css`} as="style" />
      <link
        rel="prefetch"
        href={`${WEBVIEWER_PATH}/core/webviewer-core.min.js`}
        as="script"
      />
    </>
  )
}
