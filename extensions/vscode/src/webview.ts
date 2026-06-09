import crypto from 'node:crypto'

import type {
  Disposable,
  Event,
  EventEmitter,
  Uri,
  WebviewPanel,
  WebviewPanelOptions,
  WebviewOptions,
} from 'vscode'

type ServerStatus = 'stopped' | 'starting' | 'running' | 'stopping'

interface PreviewPanel extends Disposable {
  readonly open: (url: string) => void
  readonly updateStatus: (status: ServerStatus) => void
  readonly onNavigate: Event<string>
  readonly onEdit: Event<string>
}

interface PreviewPanelDeps {
  readonly createPanel: (
    viewType: string,
    title: string,
    showOptions: number,
    options: WebviewPanelOptions & WebviewOptions
  ) => WebviewPanel
  readonly asExternalUri: (uri: Uri) => Thenable<Uri>
  readonly parseUri: (value: string) => Uri
  readonly iconPath: Uri
  readonly EventEmitter: new <T>() => EventEmitter<T>
  readonly onError: (message: string) => void
  readonly onStart: () => void
}

function escapeHtml(str: string): string {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function getStoppedHtml(_cspSource: string): string {
  const nonce = crypto.randomBytes(16).toString('hex')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';"
  >
  <style nonce="${nonce}">
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: var(--vscode-editor-background); color: var(--vscode-foreground); font-family: var(--vscode-font-family); display: flex; align-items: center; justify-content: center; }
    .cp-message { text-align: center; max-width: 400px; }
    .cp-message h1 { font-size: 18px; font-weight: 700; margin: 0 0 6px 0; }
    .cp-message p { font-size: 13px; color: var(--vscode-descriptionForeground); margin: 0 0 16px 0; line-height: 1.5; }
    .cp-message .cp-btn { display: inline-block; padding: 6px 14px; font-size: 13px; font-family: var(--vscode-font-family); color: var(--vscode-button-foreground); background: var(--vscode-button-background); border: none; border-radius: 2px; cursor: pointer; text-decoration: none; }
    .cp-message .cp-btn:hover { background: var(--vscode-button-hoverBackground); }
  </style>
</head>
<body>
  <div class="cp-message">
    <h1>ciderpress</h1>
    <p>Preview and navigate your docs without leaving the editor.</p>
    <button class="cp-btn" id="start-btn">Start Server</button>
  </div>
  <script nonce="${nonce}">
    var vscode = acquireVsCodeApi();
    document.getElementById('start-btn').addEventListener('click', function() {
      vscode.postMessage({ command: 'start' });
    });
  </script>
</body>
</html>`
}

function getStartingHtml(_cspSource: string): string {
  const nonce = crypto.randomBytes(16).toString('hex')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'nonce-${nonce}';"
  >
  <style nonce="${nonce}">
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: var(--vscode-editor-background); color: var(--vscode-foreground); font-family: var(--vscode-font-family); display: flex; align-items: center; justify-content: center; }
    .cp-message { text-align: center; max-width: 400px; }
    .cp-message h1 { font-size: 18px; font-weight: 700; margin: 0 0 6px 0; }
    .cp-message p { font-size: 13px; color: var(--vscode-descriptionForeground); margin: 0; }
    .cp-spinner { margin: 0 auto 16px; width: 32px; height: 32px; border: 3px solid var(--vscode-progressBar-background); border-top-color: var(--vscode-button-background); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="cp-message">
    <div class="cp-spinner"></div>
    <h1>Starting server...</h1>
    <p>Building your docs site.</p>
  </div>
</body>
</html>`
}

function getRunningHtml(serverUri: string, cspSource: string): string {
  const nonce = crypto.randomBytes(16).toString('hex')

  const safeUrl = escapeHtml(serverUri)
  const safeOrigin = escapeHtml(new URL(serverUri).origin)
  const safeCspSource = escapeHtml(cspSource)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; frame-src ${safeOrigin} ${safeCspSource}; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';"
  >
  <style nonce="${nonce}">
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
    iframe { border: none; width: 100%; height: 100vh; display: block; }
  </style>
</head>
<body>
  <!--
    allow-same-origin is safe here: the VS Code webview and the iframe are
    cross-origin, so same-origin access between them is already blocked. The
    iframe needs its own origin for cookies, HMR WebSocket connections, and
    fetch requests to function correctly.
  -->
  <iframe sandbox="allow-scripts allow-same-origin" src="${safeUrl}"></iframe>
  <script nonce="${nonce}">
    var vscode = acquireVsCodeApi();
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'ciderpress:navigate') {
        vscode.postMessage({ command: 'navigate', path: e.data.path, title: e.data.title });
      }
      if (e.data && e.data.type === 'ciderpress:edit') {
        vscode.postMessage({ command: 'edit', path: e.data.path });
      }
    });
  </script>
</body>
</html>`
}

/**
 * Creates a reusable webview panel that renders the ciderpress dev server in an iframe.
 */
function createPreviewPanel(deps: PreviewPanelDeps): PreviewPanel {
  /*
   * VS Code extension state: mutable panel reference is unavoidable
   * when reusing a single webview panel across multiple opens.
   */
  const navigateEmitter = new deps.EventEmitter<string>()
  const editEmitter = new deps.EventEmitter<string>()

  const state = {
    panel: null as WebviewPanel | null,
    currentUrl: null as string | null,
    currentStatus: 'stopped' as ServerStatus,
  }

  function updatePanel(): void {
    if (!state.panel) {
      return
    }

    const { cspSource } = state.panel.webview

    if (state.currentStatus === 'stopped' || state.currentStatus === 'stopping') {
      state.panel.webview.html = getStoppedHtml(cspSource)
    } else if (state.currentStatus === 'starting') {
      state.panel.webview.html = getStartingHtml(cspSource)
    } else if (state.currentStatus === 'running' && state.currentUrl) {
      state.panel.webview.html = getRunningHtml(state.currentUrl, cspSource)
    }
  }

  function open(url: string): void {
    function showPanel(serverUri: Uri): void {
      const uriString = serverUri.toString()
      state.currentUrl = uriString

      if (state.panel) {
        state.panel.reveal()
        updatePanel()
        return
      }

      state.panel = deps.createPanel('ciderpressPreview', 'ciderpress', 1 /* ViewColumn.One */, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [],
      })

      state.panel.iconPath = deps.iconPath

      state.panel.webview.onDidReceiveMessage(
        (message: {
          readonly command: string
          readonly path?: string
          readonly title?: string
        }) => {
          if (message.command === 'start') {
            deps.onStart()
          }
          if (message.command === 'navigate' && message.path) {
            navigateEmitter.fire(message.path)
          }
          if (message.command === 'navigate' && message.title && state.panel) {
            state.panel.title = message.title
          }
          if (message.command === 'edit' && message.path) {
            editEmitter.fire(message.path)
          }
        }
      )

      updatePanel()
      state.panel.onDidDispose(() => {
        state.panel = null
      })
    }

    const uri = deps.parseUri(url)
    const thenable = deps.asExternalUri(uri)
    // oxlint-disable-next-line prefer-catch, prefer-await-to-callbacks -- Thenable (not Promise) lacks .catch()
    thenable.then(showPanel, (error: unknown) => {
      const message = (() => {
        if (error instanceof Error) {
          return error.message
        }
        return String(error)
      })()
      deps.onError(`Failed to resolve external URI: ${message}`)
    })
  }

  function updateStatus(status: ServerStatus): void {
    state.currentStatus = status
    updatePanel()
  }

  return {
    open,
    updateStatus,
    onNavigate: navigateEmitter.event,
    onEdit: editEmitter.event,
    dispose: (): void => {
      navigateEmitter.dispose()
      editEmitter.dispose()
      if (state.panel) {
        state.panel.dispose()
      }
    },
  }
}

export { createPreviewPanel }
export type { PreviewPanel, PreviewPanelDeps }
