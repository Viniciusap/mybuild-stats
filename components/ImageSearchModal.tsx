'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Search, RefreshCw, Check } from 'lucide-react'
import { clsx } from 'clsx'

interface ImageResult {
  imageUrl: string
  thumbnailUrl: string
  title: string
}

interface Props {
  isOpen: boolean
  title: string
  componentId: 'cpu' | 'gpu' | 'ram' | 'storage'
  defaultQuery: string
  onClose: () => void
  onSaved: () => void
}

export default function ImageSearchModal({
  isOpen,
  title,
  componentId,
  defaultQuery,
  onClose,
  onSaved,
}: Props) {
  const [query, setQuery] = useState(defaultQuery)
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<ImageResult[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return
    setSearching(true)
    setResults([])
    setError(null)
    try {
      const res = await fetch(`/api/image-search?q=${encodeURIComponent(q.trim())}`)
      const data = await res.json()
      const imgs = (data.images ?? []) as ImageResult[]
      setResults(imgs)
      if (imgs.length === 0) setError('No results found. Try a different search term.')
    } catch {
      setError('Error fetching images.')
    } finally {
      setSearching(false)
    }
  }, [])

  // Auto-search when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery(defaultQuery)
      setResults([])
      setError(null)
      void runSearch(defaultQuery)
      // Focus input after animation
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectImage = useCallback(async (img: ImageResult) => {
    setSaving(img.imageUrl)
    setError(null)
    try {
      const res = await fetch('/api/component-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: componentId, imageUrl: img.imageUrl }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Could not download this image. Try another.')
        return
      }
      onSaved()
      onClose()
    } catch {
      setError('Error saving image.')
    } finally {
      setSaving(null)
    }
  }, [componentId, onSaved, onClose])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg bg-cyber-panel border border-cyber-cyan/30 rounded-xl shadow-neon-cyan animate-slide-up flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-cyber-border">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono font-bold text-cyber-cyan tracking-widest uppercase">
              Change Image
            </p>
            <p className="text-sm font-mono font-bold text-cyber-text truncate">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-cyber-text-dim hover:text-cyber-red transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search bar */}
        <div className="flex gap-2 px-4 pt-3 pb-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void runSearch(query)}
            placeholder="Search image…"
            className={clsx(
              'flex-1 bg-cyber-bg border border-cyber-border rounded px-3 py-2',
              'text-xs font-mono text-cyber-text placeholder-cyber-text-dim',
              'focus:outline-none focus:border-cyber-cyan transition-colors'
            )}
          />
          <button
            onClick={() => void runSearch(query)}
            disabled={searching || !query.trim()}
            className={clsx(
              'px-3 py-2 rounded border font-mono text-xs font-bold transition-colors',
              'border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/10',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            {searching
              ? <RefreshCw size={14} className="animate-spin" />
              : <Search size={14} />
            }
          </button>
        </div>

        {/* Status */}
        {searching && (
          <p className="text-xs font-mono text-cyber-text-dim text-center py-2 px-4">
            Searching via DuckDuckGo…
          </p>
        )}
        {error && !searching && (
          <p className="text-xs font-mono text-cyber-amber text-center py-2 px-4">{error}</p>
        )}

        {/* Image grid */}
        <div className="overflow-y-auto px-4 pb-4 flex-1">
          {results.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-1">
              {results.map((img, i) => (
                <button
                  key={i}
                  onClick={() => void selectImage(img)}
                  disabled={saving !== null}
                  className={clsx(
                    'relative rounded-lg overflow-hidden border aspect-square group/img',
                    'border-cyber-border hover:border-cyber-cyan transition-all',
                    'disabled:cursor-not-allowed'
                  )}
                  title={img.title}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.thumbnailUrl || img.imageUrl}
                    alt={img.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Hover overlay */}
                  <div className={clsx(
                    'absolute inset-0 flex flex-col items-center justify-center gap-1',
                    'bg-cyber-bg/75 transition-opacity',
                    saving === img.imageUrl ? 'opacity-100' : 'opacity-0 group-hover/img:opacity-100'
                  )}>
                    {saving === img.imageUrl
                      ? <RefreshCw size={20} className="animate-spin text-cyber-cyan" />
                      : <Check size={20} className="text-cyber-cyan" />
                    }
                    <span className="text-xs font-mono text-cyber-cyan">
                      {saving === img.imageUrl ? 'Saving…' : 'Select'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!searching && results.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-50">
              <Search size={28} className="text-cyber-text-dim" />
              <p className="text-xs font-mono text-cyber-text-dim">
                Type a term and press Enter
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-cyber-border">
          <p className="text-xs font-mono text-cyber-text-dim text-center">
            Click an image to set it as the component photo
          </p>
        </div>
      </div>
    </div>
  )
}
