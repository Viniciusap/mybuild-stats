'use client'
import { useState, useRef, useCallback } from 'react'
import useSWR from 'swr'
import GlowCard from './GlowCard'
import { Search, RefreshCw, X, Monitor, Upload, Check } from 'lucide-react'
import { clsx } from 'clsx'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface CaseConfig { name: string; hasImage: boolean }
interface ImageResult { imageUrl: string; thumbnailUrl: string; title: string }

type Tab = 'search' | 'upload'

export default function CaseSearchCard() {
  const { data: cfg, mutate } = useSWR<CaseConfig>('/api/case-search', fetcher)
  const [tab, setTab] = useState<Tab>('search')
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<ImageResult[]>([])
  const [noApi, setNoApi] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [ts, setTs] = useState(Date.now())
  const inputRef = useRef<HTMLInputElement>(null)

  const hasCase = cfg?.hasImage ?? false
  const caseName = cfg?.name ?? ''

  // ── Search ─────────────────────────────────────────────────────────────────
  const runSearch = useCallback(async () => {
    if (!query.trim()) return
    setSearching(true)
    setResults([])
    setNoApi(false)
    try {
      const res = await fetch(`/api/case-search?q=${encodeURIComponent(query.trim())}`)
      if (!res.ok) { setNoApi(true); return }
      const data = await res.json()
      if (data.error) { setNoApi(true); return }
      setResults(data.images ?? [])
    } finally {
      setSearching(false)
    }
  }, [query])

  const selectImage = useCallback(async (img: ImageResult) => {
    setSaving(img.imageUrl)
    try {
      await fetch('/api/case-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: query.trim(), imageUrl: img.imageUrl }),
      })
      setTs(Date.now())
      setResults([])
      await mutate()
    } finally {
      setSaving(null)
    }
  }, [query, mutate])

  // ── Upload ─────────────────────────────────────────────────────────────────
  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    try {
      // Save as case-image.jpg via pc-photo route reused approach
      const fd = new FormData()
      fd.append('file', file)
      await fetch('/api/pc-photo', { method: 'POST', body: fd })
      // Also update case config name if query is filled
      await fetch('/api/case-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: query.trim() || 'My Build' }),
      })
      // Copy pc-photo to case-image via the backend trick — use pc-photo as case-image
      // Actually: use pc-photo.jpg directly for the case display
      setTs(Date.now())
      await mutate()
    } finally {
      setUploading(false)
    }
  }, [query, mutate])

  const clearCase = useCallback(async () => {
    await fetch('/api/case-search', { method: 'DELETE' })
    setTs(Date.now())
    setQuery('')
    setResults([])
    await mutate()
  }, [mutate])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <GlowCard accent="cyan" className="p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Monitor size={14} className="text-cyber-cyan" />
        <span className="text-xs font-mono font-bold text-cyber-cyan tracking-widest uppercase">
          Your Case
        </span>
        {hasCase && (
          <button
            onClick={clearCase}
            className="ml-auto text-cyber-text-dim hover:text-cyber-red transition-colors"
            title="Remover"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {hasCase ? (
        /* ── Case image display ─────────────────────────────────────────── */
        <div className="relative rounded overflow-hidden border border-cyber-border group min-h-[160px]">
          {/* Scanline */}
          <div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.07) 3px,rgba(0,0,0,0.07) 4px)',
            }}
          />
          {/* Corner marks */}
          {[
            'top-2 left-2 border-t-2 border-l-2',
            'top-2 right-2 border-t-2 border-r-2',
            'bottom-2 left-2 border-b-2 border-l-2',
            'bottom-2 right-2 border-b-2 border-r-2',
          ].map((cls, i) => (
            <div key={i} className={`absolute w-3 h-3 border-cyber-cyan z-20 opacity-60 ${cls}`} />
          ))}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/case-image.jpg?t=${ts}`}
            alt={caseName || 'Gabinete'}
            className="w-full h-full object-cover min-h-[160px]"
            onError={() => {
              // fallback: try pc-photo
            }}
          />
          {/* Name badge */}
          {caseName && (
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-cyber-bg/85 backdrop-blur-sm z-20 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyber-cyan truncate">
                {caseName}
              </span>
              <button
                onClick={clearCase}
                className="text-xs font-mono text-cyber-text-dim hover:text-cyber-cyan transition-colors shrink-0 ml-2"
              >
                CHANGE
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── Search / Upload UI ─────────────────────────────────────────── */
        <div className="flex flex-col gap-3">
          {/* Tabs */}
          <div className="flex rounded overflow-hidden border border-cyber-border text-xs font-mono">
            {(['search', 'upload'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={clsx(
                  'flex-1 py-1.5 transition-colors',
                  tab === t
                    ? 'bg-cyber-cyan/15 text-cyber-cyan font-bold'
                    : 'text-cyber-text-dim hover:text-cyber-text'
                )}
              >
                {t === 'search' ? 'SEARCH MODEL' : 'UPLOAD PHOTO'}
              </button>
            ))}
          </div>

          {tab === 'search' ? (
            <>
              {/* Search input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void runSearch()}
                  placeholder="Ex: NZXT H510, Phanteks P400A…"
                  className={clsx(
                    'flex-1 bg-cyber-bg border rounded px-2.5 py-1.5',
                    'text-xs font-mono text-cyber-text placeholder-cyber-text-dim',
                    'focus:outline-none transition-colors',
                    'border-cyber-border focus:border-cyber-cyan'
                  )}
                />
                <button
                  onClick={() => void runSearch()}
                  disabled={searching || !query.trim()}
                  className={clsx(
                    'px-3 py-1.5 rounded border text-xs font-mono font-bold transition-colors',
                    'border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/10',
                    'disabled:opacity-40 disabled:cursor-not-allowed'
                  )}
                >
                  {searching ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <Search size={12} />
                  )}
                </button>
              </div>

              {noApi && (
                <p className="text-xs font-mono text-cyber-red text-center py-2">
                  Search unavailable — try again in a few seconds
                </p>
              )}

              {/* Thumbnail results */}
              {results.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {results.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => void selectImage(img)}
                      disabled={saving !== null}
                      className="relative rounded overflow-hidden border border-cyber-border hover:border-cyber-cyan transition-colors group/img aspect-square"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.thumbnailUrl || img.imageUrl}
                        alt={img.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-cyber-bg/65 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                        {saving === img.imageUrl ? (
                          <RefreshCw size={14} className="animate-spin text-cyber-cyan" />
                        ) : (
                          <Check size={14} className="text-cyber-cyan" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!searching && results.length === 0 && !noApi && (
                <div className="flex flex-col items-center justify-center py-5 gap-2 opacity-60">
                  <Monitor size={22} className="text-cyber-text-dim" />
                  <p className="text-xs font-mono text-cyber-text-dim text-center">
                    Search for your case model
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Upload tab */
            <div
              onDrop={(e) => {
                e.preventDefault()
                const f = e.dataTransfer.files[0]
                if (f) void uploadFile(f)
              }}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className={clsx(
                'flex flex-col items-center justify-center gap-2 py-8',
                'rounded border-2 border-dashed border-cyber-border',
                'hover:border-cyber-cyan/50 cursor-pointer transition-colors'
              )}
            >
              {uploading ? (
                <RefreshCw size={20} className="animate-spin text-cyber-cyan" />
              ) : (
                <>
                  <Upload size={20} className="text-cyber-text-dim" />
                  <p className="text-xs font-mono text-cyber-text-dim">
                    Drag or click to upload photo
                  </p>
                </>
              )}
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void uploadFile(f)
            }}
          />
        </div>
      )}
    </GlowCard>
  )
}
