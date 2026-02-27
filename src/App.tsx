import { useMemo, useState } from 'react'
import './App.css'

type Algorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

const ALGORITHMS: Algorithm[] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function hashText(text: string, algorithm: Algorithm): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const digest = await crypto.subtle.digest(algorithm, data)
  return bytesToHex(new Uint8Array(digest))
}

function App() {
  const [input, setInput] = useState('')
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<Set<Algorithm>>(
    () => new Set(['SHA-256']),
  )
  const [results, setResults] = useState<Record<string, string>>({})
  const [isHashing, setIsHashing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const selectionSummary = useMemo(() => {
    return `${selectedAlgorithms.size} selected`
  }, [selectedAlgorithms])

  function toggleAlgorithm(algorithm: Algorithm): void {
    setSelectedAlgorithms((previous) => {
      const next = new Set(previous)
      if (next.has(algorithm)) {
        next.delete(algorithm)
      } else {
        next.add(algorithm)
      }
      return next
    })
  }

  async function handleGenerate(): Promise<void> {
    setErrorMessage('')
    setResults({})

    if (input.trim().length === 0) {
      setErrorMessage('Enter some text first.')
      return
    }

    if (selectedAlgorithms.size === 0) {
      setErrorMessage('Select at least one algorithm.')
      return
    }

    setIsHashing(true)

    try {
      const nextResults: Record<string, string> = {}
      const sortedAlgorithms = Array.from(selectedAlgorithms).sort()

      for (const algorithm of sortedAlgorithms) {
        nextResults[algorithm] = await hashText(input, algorithm)
      }

      setResults(nextResults)
    } catch {
      setErrorMessage('Hashing failed in this browser environment.')
    } finally {
      setIsHashing(false)
    }
  }

  async function copyToClipboard(value: string): Promise<void> {
    await navigator.clipboard.writeText(value)
  }

  return (
    <main className="app">
      <section className="card">
        <h1>Checksum Studio</h1>
        <p className="subtitle">
          Generate cryptographic hashes for text instantly in your browser.
        </p>

        <label htmlFor="input" className="label">
          Input text
        </label>
        <textarea
          id="input"
          className="textarea"
          placeholder="Paste text to hash..."
          value={input}
          onChange={(event) => {
            setInput(event.target.value)
          }}
          rows={8}
        />

        <div className="row">
          <span className="label">Algorithms</span>
          <span className="meta">{selectionSummary}</span>
        </div>

        <div className="algorithms">
          {ALGORITHMS.map((algorithm) => {
            const checked = selectedAlgorithms.has(algorithm)
            return (
              <label key={algorithm} className="check">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    toggleAlgorithm(algorithm)
                  }}
                />
                <span>{algorithm}</span>
              </label>
            )
          })}
        </div>

        <button className="button" onClick={handleGenerate} disabled={isHashing}>
          {isHashing ? 'Generating...' : 'Generate hashes'}
        </button>

        {errorMessage.length > 0 ? <p className="error">{errorMessage}</p> : null}

        <div className="results">
          {Object.entries(results).map(([algorithm, value]) => {
            return (
              <article key={algorithm} className="result">
                <header>
                  <strong>{algorithm}</strong>
                  <button
                    className="copy"
                    onClick={() => {
                      void copyToClipboard(value)
                    }}
                  >
                    Copy
                  </button>
                </header>
                <code>{value}</code>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

export default App
