import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, X, Loader2 } from 'lucide-react'

/**
 * FileUploader — native drag/drop zone with progress per file.
 *
 * Parent is responsible for actually uploading the files via onFiles.
 * We show an inline progress indicator per file while the parent awaits.
 */

interface FileUploaderProps {
  onFiles: (files: File[]) => Promise<void> | void
  accept?: string
  disabled?: boolean
  multiple?: boolean
  hint?: string
}

export default function FileUploader({
  onFiles,
  accept = '.pdf',
  disabled = false,
  multiple = true,
  hint = 'PDF files up to 50MB. Drop here or click to pick.',
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [queue, setQueue] = useState<{ file: File; status: 'uploading' | 'done' | 'error'; error?: string }[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const accept_exts = accept.split(',').map(s => s.trim().toLowerCase())

  const isAccepted = (f: File) => {
    const name = f.name.toLowerCase()
    return accept_exts.some(ext => ext === '*' || name.endsWith(ext))
  }

  const handleFiles = useCallback(async (list: FileList | File[]) => {
    if (disabled) return
    const incoming = Array.from(list).filter(isAccepted)
    if (incoming.length === 0) return

    // Add to queue
    setQueue(prev => [
      ...prev,
      ...incoming.map(f => ({ file: f, status: 'uploading' as const })),
    ])

    try {
      await onFiles(incoming)
      setQueue(prev =>
        prev.map(q =>
          incoming.includes(q.file) ? { ...q, status: 'done' as const } : q
        )
      )
    } catch (err) {
      setQueue(prev =>
        prev.map(q =>
          incoming.includes(q.file)
            ? { ...q, status: 'error' as const, error: err instanceof Error ? err.message : 'Upload failed' }
            : q
        )
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, onFiles])

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setDragActive(true)
  }
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer?.files?.length) void handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-3">
      <motion.div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        animate={{
          borderColor: dragActive ? 'rgba(167, 139, 250, 0.5)' : 'rgba(148, 123, 220, 0.15)',
          backgroundColor: dragActive ? 'rgba(167, 139, 250, 0.04)' : 'rgba(21, 16, 31, 0.4)',
        }}
        transition={{ duration: 0.2 }}
        className={`relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer overflow-hidden ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {/* subtle orb when active */}
        {dragActive && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 orb orb-violet opacity-30 pointer-events-none"
            aria-hidden
          />
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="relative flex flex-col items-center gap-3">
          <div
            className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-colors ${
              dragActive
                ? 'bg-[rgba(167,139,250,0.12)] border-[rgba(167,139,250,0.3)]'
                : 'bg-[rgba(148,123,220,0.06)] border-[rgba(148,123,220,0.12)]'
            }`}
          >
            <Upload className={`w-5 h-5 ${dragActive ? 'text-[#c4b5fd]' : 'text-zinc-400'}`} strokeWidth={1.8} />
          </div>
          <div>
            <div className="text-[13px] font-medium text-zinc-200">
              {dragActive ? 'Drop to upload' : 'Drag & drop or click to browse'}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">{hint}</div>
          </div>
        </div>
      </motion.div>

      {/* Queue */}
      <AnimatePresence>
        {queue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5"
          >
            {queue.map((q, i) => (
              <motion.div
                key={`${q.file.name}-${i}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-2.5 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-[rgba(148,123,220,0.08)] border border-[rgba(148,123,220,0.12)] flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-[#c4b5fd]" strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] text-zinc-200 truncate">{q.file.name}</div>
                  <div className="text-[10.5px] text-zinc-600 mono mt-0.5">
                    {(q.file.size / 1024).toFixed(1)} KB
                    {q.error && <span className="text-rose-300 ml-2">· {q.error}</span>}
                  </div>
                </div>
                {q.status === 'uploading' && (
                  <Loader2 className="w-3.5 h-3.5 text-[#c4b5fd] animate-spin" strokeWidth={2} />
                )}
                {q.status === 'done' && (
                  <span className="chip chip-emerald">done</span>
                )}
                {q.status === 'error' && (
                  <span className="chip chip-rose">error</span>
                )}
                <button
                  onClick={() => setQueue(prev => prev.filter((_, idx) => idx !== i))}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-[rgba(148,123,220,0.05)]"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
