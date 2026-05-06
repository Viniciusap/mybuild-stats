'use client'
import { useState, useRef, useCallback } from 'react'
import GlowCard from './GlowCard'
import { Camera, Upload, X, Monitor } from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  hasPhoto: boolean
  onUpload?: () => void
}

export default function PcPhotoCard({ hasPhoto: initialHasPhoto, onUpload }: Props) {
  const [hasPhoto, setHasPhoto] = useState(initialHasPhoto)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ts, setTs] = useState(Date.now())
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Images only (JPG, PNG, WEBP)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Max 10 MB')
      return
    }
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/pc-photo', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      setHasPhoto(true)
      setTs(Date.now())
      onUpload?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload error')
    } finally {
      setUploading(false)
    }
  }, [onUpload])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) upload(file)
    },
    [upload]
  )

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) upload(file)
    },
    [upload]
  )

  const clearPhoto = async () => {
    await fetch('/api/pc-photo', { method: 'DELETE' })
    setHasPhoto(false)
    setTs(Date.now())
  }

  return (
    <GlowCard accent="cyan" className="p-4 flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Monitor size={14} className="text-cyber-cyan" />
        <span className="text-xs font-mono font-bold text-cyber-cyan tracking-widest uppercase">
          Your Build
        </span>
        {hasPhoto && (
          <button
            onClick={clearPhoto}
            className="ml-auto text-cyber-text-dim hover:text-cyber-red transition-colors"
            title="Remove photo"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Photo or upload zone */}
      {hasPhoto ? (
        <div className="relative flex-1 min-h-[180px] rounded overflow-hidden border border-cyber-border group">
          {/* Photo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/pc-photo.jpg?t=${ts}`}
            alt="Your PC"
            className="w-full h-full object-cover"
          />
          {/* Replace overlay on hover */}
          <button
            onClick={() => inputRef.current?.click()}
            className={clsx(
              'absolute inset-0 z-30 flex flex-col items-center justify-center',
              'bg-cyber-bg/80 opacity-0 group-hover:opacity-100 transition-opacity',
              'text-cyber-cyan font-mono text-xs gap-1'
            )}
          >
            <Camera size={20} />
            CHANGE PHOTO
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
          className={clsx(
            'flex-1 min-h-[180px] rounded border-2 border-dashed cursor-pointer',
            'flex flex-col items-center justify-center gap-3 transition-all',
            dragging
              ? 'border-cyber-cyan bg-cyber-cyan/10'
              : 'border-cyber-border hover:border-cyber-cyan/50 hover:bg-cyber-cyan/5'
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-cyber-cyan">UPLOADING…</span>
            </div>
          ) : (
            <>
              <Upload size={28} className="text-cyber-text-dim" />
              <div className="text-center">
                <p className="text-xs font-mono text-cyber-text-dim">
                  Drag or click to
                </p>
                <p className="text-xs font-mono font-bold text-cyber-cyan">
                  ADD PC PHOTO
                </p>
              </div>
              <p className="text-xs font-mono text-cyber-text-dim opacity-60">
                JPG · PNG · WEBP · max 10MB
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs font-mono text-cyber-red text-center">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </GlowCard>
  )
}
