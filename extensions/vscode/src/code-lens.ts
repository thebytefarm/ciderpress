import type {
  CodeLens,
  CodeLensProvider,
  Disposable,
  EventEmitter,
  Range,
  TextDocument,
} from 'vscode'

import type { ManifestReader } from './manifest'

interface CodeLensDeps {
  readonly manifestReader: ManifestReader
  readonly EventEmitter: new () => EventEmitter<void>
  readonly Range: new (
    startLine: number,
    startCharacter: number,
    endLine: number,
    endCharacter: number
  ) => Range
}

/**
 * Provides a "View in ciderpress" CodeLens on tracked markdown files.
 */
function createCodeLensProvider(deps: CodeLensDeps): CodeLensProvider & Disposable {
  const emitter = new deps.EventEmitter()

  const subscription = deps.manifestReader.onDidChange(() => {
    emitter.fire()
  })

  return {
    onDidChangeCodeLenses: emitter.event,
    provideCodeLenses: (document: TextDocument): CodeLens[] => {
      const url = deps.manifestReader.getUrl(document.uri.fsPath)
      if (!url) {
        return []
      }

      return [
        {
          range: new deps.Range(0, 0, 0, 0),
          command: {
            title: '$(globe) View in ciderpress',
            command: 'ciderpress.preview',
            arguments: [url],
          },
          isResolved: true,
        },
      ]
    },
    dispose: (): void => {
      subscription.dispose()
      emitter.dispose()
    },
  }
}

export { createCodeLensProvider }
