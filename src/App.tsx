import {
  type ChangeEvent,
  type DragEvent,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react'
import './App.css'
import {
  buildRenderPlan,
  type Direction,
  type ExportFormat,
  type LayoutImage,
} from './lib/layout'
import Icon from './components/Icon'
import LanguageSwitcher from './components/LanguageSwitcher'
import {
  describeCanvasLimitForLocale,
  getTopPageHref,
  readLocaleFromLocation,
  resolveInitialLocale,
  STRINGS,
  syncLocaleState,
  type Locale,
} from './i18n'

type UploadedImage = LayoutImage & {
  name: string
  size: number
  type: string
  url: string
}

type LoadedImage = {
  element: HTMLImageElement
  item: UploadedImage
}

const DEFAULT_BACKGROUND = '#000000'
const DEFAULT_GAP = 0
const DOWNLOAD_PREFIX = 'auto-image-layout'
const FORMAT_OPTIONS: Array<{
  extension: string
  label: string
  value: ExportFormat
}> = [
  { label: 'PNG', value: 'image/png', extension: 'png' },
  { label: 'JPEG', value: 'image/jpeg', extension: 'jpg' },
  { label: 'WebP', value: 'image/webp', extension: 'webp' },
]

function App() {
  const [items, setItems] = useState<UploadedImage[]>([])
  const [direction, setDirection] = useState<Direction>('horizontal')
  const [normalizeCrossAxis, setNormalizeCrossAxis] = useState(true)
  const [gap, setGap] = useState(DEFAULT_GAP)
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND)
  const [format, setFormat] = useState<ExportFormat>('image/png')
  const [isFileDragActive, setIsFileDragActive] = useState(false)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [locale, setLocale] = useState<Locale>(() => resolveInitialLocale())
  const [isLocalPreview] = useState(() => isLocalPreviewHost())
  const [isMobilePreview, setIsMobilePreview] = useState(() => hasMobilePreviewQuery())
  const [, startTransition] = useTransition()

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map())
  const itemsRef = useRef<UploadedImage[]>([])

  const deferredItems = useDeferredValue(items)
  const deferredDirection = useDeferredValue(direction)
  const deferredNormalizeCrossAxis = useDeferredValue(normalizeCrossAxis)
  const deferredGap = useDeferredValue(Number.isFinite(gap) ? Math.max(0, gap) : 0)

  const normalizedBackgroundColor = normalizeHexColor(backgroundColor)
  const safeBackgroundColor = normalizedBackgroundColor ?? DEFAULT_BACKGROUND
  const activeFormat = FORMAT_OPTIONS.find((option) => option.value === format) ?? FORMAT_OPTIONS[0]
  const t = STRINGS[locale]
  const normalizeLabel =
    direction === 'horizontal' ? t.normalizeLabelHorizontal : t.normalizeLabelVertical
  const directionLabel =
    direction === 'horizontal' ? t.directionHorizontal : t.directionVertical
  const normalizeSummary = normalizeCrossAxis ? t.normalizeSummaryOn : t.normalizeSummaryOff
  const previewPlan =
    deferredItems.length > 0
      ? buildRenderPlan(deferredItems, {
          direction: deferredDirection,
          gap: deferredGap,
          normalizeCrossAxis: deferredNormalizeCrossAxis,
        })
      : null
  const previewError = previewPlan ? describeCanvasLimitForLocale(previewPlan, locale) : null
  const previewState = previewPlan
    ? { width: previewPlan.width, height: previewPlan.height }
    : null
  const canDownload = items.length > 0 && previewPlan !== null && !previewError
  const backgroundLabel = safeBackgroundColor.toUpperCase()
  const previewSizeLabel = previewState
    ? `${previewState.width}×${previewState.height}px`
    : t.outputSizePending
  const topPageHref = getTopPageHref(locale, isMobilePreview)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    document.body.classList.toggle('mobile-preview', isMobilePreview)
    document.body.classList.toggle('is-local-preview', isLocalPreview)

    return () => {
      document.body.classList.remove('mobile-preview')
      document.body.classList.remove('is-local-preview')
    }
  }, [isLocalPreview, isMobilePreview])

  useEffect(() => {
    syncLocaleState(locale, isMobilePreview, t.pageTitle)
  }, [isMobilePreview, locale, t.pageTitle])

  useEffect(() => {
    function handlePopState() {
      setIsMobilePreview(hasMobilePreviewQuery())
      const nextLocale = readLocaleFromLocation()

      if (nextLocale) {
        setLocale(nextLocale)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    const cache = imageCacheRef.current
    return () => {
      for (const item of itemsRef.current) {
        releaseImage(item, cache)
      }
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    if (!previewPlan || previewError) {
      canvas.width = 1
      canvas.height = 1
      context.clearRect(0, 0, 1, 1)
      return
    }

    for (const entry of previewPlan.items) {
      if (!imageCacheRef.current.has(entry.id)) {
        return
      }
    }

    canvas.width = previewPlan.width
    canvas.height = previewPlan.height
    context.clearRect(0, 0, previewPlan.width, previewPlan.height)
    context.fillStyle = safeBackgroundColor
    context.fillRect(0, 0, previewPlan.width, previewPlan.height)
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'

    for (const entry of previewPlan.items) {
      const image = imageCacheRef.current.get(entry.id)
      if (!image) {
        continue
      }
      context.drawImage(image, entry.x, entry.y, entry.width, entry.height)
    }
  }, [previewError, previewPlan, safeBackgroundColor])

  async function addFiles(source: FileList | File[]) {
    const selectedFiles = Array.from(source).filter((file) =>
      file.type.startsWith('image/'),
    )

    if (selectedFiles.length === 0) {
      return
    }

    const results = await Promise.allSettled(selectedFiles.map(loadImageFile))
    const nextItems: UploadedImage[] = []
    let failedCount = 0

    for (const result of results) {
      if (result.status === 'fulfilled') {
        nextItems.push(result.value.item)
        imageCacheRef.current.set(result.value.item.id, result.value.element)
        continue
      }
      failedCount += 1
    }

    if (nextItems.length > 0) {
      startTransition(() => {
        setItems((current) => [...current, ...nextItems])
      })
    }

    if (failedCount > 0 && nextItems.length > 0) {
      return
    }

    if (failedCount > 0) {
      return
    }
  }

  function moveItem(itemId: string, nextIndex: number) {
    setItems((current) => {
      const currentIndex = current.findIndex((item) => item.id === itemId)
      if (currentIndex === -1 || nextIndex < 0 || nextIndex >= current.length) {
        return current
      }

      const reordered = [...current]
      const [movedItem] = reordered.splice(currentIndex, 1)
      reordered.splice(nextIndex, 0, movedItem)
      return reordered
    })
  }

  function reorderItems(sourceId: string, targetId: string) {
    if (sourceId === targetId) {
      return
    }

    setItems((current) => {
      const sourceIndex = current.findIndex((item) => item.id === sourceId)
      const targetIndex = current.findIndex((item) => item.id === targetId)
      if (sourceIndex === -1 || targetIndex === -1) {
        return current
      }

      const reordered = [...current]
      const [movedItem] = reordered.splice(sourceIndex, 1)
      reordered.splice(targetIndex, 0, movedItem)
      return reordered
    })
  }

  function removeItem(itemId: string) {
    setItems((current) => {
      const item = current.find((entry) => entry.id === itemId)
      if (item) {
        releaseImage(item, imageCacheRef.current)
      }
      return current.filter((entry) => entry.id !== itemId)
    })
  }

  function clearItems() {
    for (const item of itemsRef.current) {
      releaseImage(item, imageCacheRef.current)
    }
    setItems([])
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const { files } = event.target
    if (files && files.length > 0) {
      void addFiles(files)
    }
    event.target.value = ''
  }

  function handleFileDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsFileDragActive(false)
    if (event.dataTransfer.files.length > 0) {
      void addFiles(event.dataTransfer.files)
    }
  }

  function handleFileDragOver(event: DragEvent<HTMLButtonElement>) {
    if (!containsDraggedFiles(event)) {
      return
    }
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setIsFileDragActive(true)
  }

  async function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas || !canDownload) {
      return
    }

    const blob = await new Promise<Blob | null>((resolve) => {
      const quality = format === 'image/png' ? undefined : 0.92
      canvas.toBlob(resolve, format, quality)
    })

    if (!blob) {
      return
    }

    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = `${DOWNLOAD_PREFIX}-${createTimestamp()}.${activeFormat.extension}`
    anchor.click()
    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl)
    }, 0)
  }

  return (
    <main className={`app-shell theme-auto ${isMobilePreview ? 'is-mobile-preview' : ''}`}>
      <header className="page-header">
        <div className="document-toolbar">
          <div className="document-toolbar__controls">
            <a
              className="document-home-link"
              href={topPageHref}
              aria-label={t.topPageAria}
            >
              <img src="/zoochi-logo.png" alt="ZOOCHI" className="brand-logo" />
            </a>

            <LanguageSwitcher ariaLabel={t.languageLabel} locale={locale} onChange={setLocale} />
          </div>
        </div>

        <section className="header-card solid-shadow">
          <div className="header-card__hero">
            <div className="wobble-container app-card__wobble app-card__wobble--positive" aria-hidden="true">
              <div className="wobble-target app-badge app-badge--auto">
                <img src="/app-icon.png" alt="" className="app-badge__icon" />
              </div>
            </div>

            <div className="header-card__copy">
              <h1>Auto Image Layout</h1>
              <p>{t.headerSummary}</p>
            </div>
          </div>
        </section>
      </header>

      <div className="workspace">
        <section className="tool-panel solid-shadow">
          <div className="panel-heading">
            <span className="panel-heading__number">1</span>
            <div className="panel-heading__copy">
              <h2>{t.settingsTitle}</h2>
              <p>{t.settingsDescription}</p>
            </div>
          </div>

          <div className="panel-surface">
            <div className="subsection-header">
              <div className="title-with-icon">
                <Icon name="upload" size={18} />
                <h3>{t.addImagesTitle}</h3>
              </div>
              <span className="subtle-pill">{t.imageCount(items.length)}</span>
            </div>

            <button
              type="button"
              className={`dropzone toy-btn ${isFileDragActive ? 'is-active' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleFileDrop}
              onDragOver={handleFileDragOver}
              onDragEnter={handleFileDragOver}
              onDragLeave={() => setIsFileDragActive(false)}
            >
                <span className="dropzone-head">
                  <span className="dropzone-icon-wrap">
                    <Icon name="upload" className="dropzone-icon" size={20} />
                  </span>
                <span className="dropzone-title">{t.dropzoneTitle}</span>
                </span>
              <span className="dropzone-copy">{t.dropzoneCopy}</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="visually-hidden"
              onChange={handleFileInput}
            />
          </div>

          <div className="panel-surface">
            <div className="subsection-header">
              <div className="title-with-icon">
                <Icon name="sliders" size={18} />
                <h3>{t.appearanceTitle}</h3>
              </div>
            </div>

            <div className="settings-list">
              <div className="setting-block">
                <span className="setting-caption">{t.directionCaption}</span>
                <div className="direction-picker">
                  <button
                    type="button"
                    className={`direction-card toy-btn ${
                      direction === 'horizontal' ? 'is-selected' : ''
                    }`}
                    onClick={() => setDirection('horizontal')}
                    aria-pressed={direction === 'horizontal'}
                  >
                    <span className="direction-icon-wrap">
                      <Icon name="arrow-right" size={18} className="direction-icon" />
                    </span>
                    <span className="direction-card-title">{t.directionHorizontal}</span>
                  </button>
                  <button
                    type="button"
                    className={`direction-card toy-btn ${
                      direction === 'vertical' ? 'is-selected' : ''
                    }`}
                    onClick={() => setDirection('vertical')}
                    aria-pressed={direction === 'vertical'}
                  >
                    <span className="direction-icon-wrap">
                      <Icon name="arrow-down" size={18} className="direction-icon" />
                    </span>
                    <span className="direction-card-title">{t.directionVertical}</span>
                  </button>
                </div>
              </div>

              <div className="setting-row">
                <span className="setting-label">
                  <Icon name="maximize-2" size={16} className="field-icon" />
                  <span className="field-copy">
                    <span className="field-label">{normalizeLabel}</span>
                    <span className="field-value">{normalizeSummary}</span>
                  </span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={normalizeCrossAxis}
                  className={`toggle ${normalizeCrossAxis ? 'is-on' : ''}`}
                  onClick={() => setNormalizeCrossAxis((current) => !current)}
                >
                  <span className="toggle-thumb" />
                </button>
              </div>

              <label className="setting-row">
                <span className="setting-label">
                  <Icon name="more-horizontal" size={16} className="field-icon" />
                  <span className="field-copy">
                        <span className="field-label">{t.gapLabel}</span>
                        <span className="field-value">{gap}px</span>
                  </span>
                </span>
                <input
                  className="compact-input"
                  type="number"
                  min={0}
                  step={1}
                  value={gap}
                  onChange={(event) => setGap(Number(event.target.value))}
                />
              </label>

              <div className="setting-stack">
                <div className="setting-row">
                  <span className="setting-label">
                    <Icon name="droplet" size={16} className="field-icon" />
                    <span className="field-copy">
                      <span className="field-label">{t.backgroundColorLabel}</span>
                      <span className="field-value">{backgroundLabel}</span>
                    </span>
                  </span>
                  <div className="color-inline">
                    <input
                      type="color"
                      value={safeBackgroundColor}
                      onChange={(event) => setBackgroundColor(event.target.value)}
                      aria-label={t.backgroundColorLabel}
                    />
                    <input
                      className="compact-input color-text-input"
                      type="text"
                      value={backgroundColor}
                      onChange={(event) => setBackgroundColor(event.target.value.trim())}
                      placeholder="#FFFFFF"
                      spellCheck={false}
                    />
                  </div>
                </div>
                {normalizedBackgroundColor === null && (
                  <span className="field-help">{t.invalidHex}</span>
                )}
              </div>

              <label className="setting-row">
                <span className="setting-label">
                  <Icon name="file-text" size={16} className="field-icon" />
                  <span className="field-copy">
                    <span className="field-label">{t.exportFormatLabel}</span>
                    <span className="field-value">{activeFormat.label}</span>
                  </span>
                </span>
                <select
                  className="compact-select"
                  value={format}
                  onChange={(event) => setFormat(event.target.value as ExportFormat)}
                >
                  {FORMAT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="panel-surface">
            <div className="subsection-header">
              <div className="title-with-icon">
                <Icon name="image" size={18} />
                <h3>{t.imageListTitle}</h3>
              </div>
              <button
                type="button"
                className="secondary-button toy-btn"
                onClick={clearItems}
                disabled={items.length === 0}
              >
                <Icon name="trash-2" size={16} />
                {t.clearLabel}
              </button>
            </div>

            {items.length === 0 ? (
              <div className="empty-card">
                <Icon name="image" className="empty-icon" size={28} />
                <p>{t.imageListEmpty}</p>
              </div>
            ) : (
              <div className="image-list" role="list" aria-label={t.uploadedImagesAria}>
                {items.map((item, index) => (
                  <article
                    key={item.id}
                    role="listitem"
                    className={`image-card ${draggedItemId === item.id ? 'is-dragging' : ''}`}
                    draggable
                    onDragStart={() => setDraggedItemId(item.id)}
                    onDragEnd={() => setDraggedItemId(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      if (draggedItemId) {
                        reorderItems(draggedItemId, item.id)
                      }
                      setDraggedItemId(null)
                    }}
                  >
                    <div className="image-card-order">
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => moveItem(item.id, index - 1)}
                        disabled={index === 0}
                        aria-label={t.moveUp(item.name)}
                      >
                        <Icon name="arrow-up" size={16} />
                      </button>
                      <span className="image-card-index">{index + 1}</span>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => moveItem(item.id, index + 1)}
                        disabled={index === items.length - 1}
                        aria-label={t.moveDown(item.name)}
                      >
                        <Icon name="arrow-down" size={16} />
                      </button>
                    </div>

                    <img src={item.url} alt="" className="image-thumb" loading="lazy" />

                    <div className="image-card-body">
                      <div className="image-card-header">
                        <strong title={item.name}>{item.name}</strong>
                      </div>
                      <p>
                        {item.width}×{item.height}px
                      </p>
                      <p>{formatBytes(item.size)}</p>
                    </div>

                    <div className="image-card-actions">
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => removeItem(item.id)}
                        aria-label={t.removeItem(item.name)}
                        title={t.deleteTitle}
                      >
                        <Icon name="trash-2" size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="tool-panel solid-shadow">
          <div className="panel-heading">
            <span className="panel-heading__number">2</span>
            <div className="panel-heading__copy">
              <h2>{t.previewTitle}</h2>
              <p>{t.previewDescription}</p>
            </div>
          </div>

          <div className="summary-grid" aria-label={t.currentStateAria}>
            <div className="summary-card">
              <span className="summary-card__label">{t.summaryImages}</span>
              <strong>{t.imageCount(items.length)}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-card__label">{t.summaryLayout}</span>
              <strong>{directionLabel}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-card__label">{t.summaryOutputSize}</span>
              <strong>{previewSizeLabel}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-card__label">{t.summaryBackground}</span>
              <strong>{backgroundLabel}</strong>
            </div>
          </div>

          {previewError && <p className="error-banner">{previewError}</p>}

          <div className="panel-surface preview-surface">
            <div className="subsection-header subsection-header--preview">
              <div className="title-with-icon">
                <Icon name="eye" size={18} />
                <h3>{t.resultTitle}</h3>
              </div>
              <button
                type="button"
                className="action-button toy-btn"
                onClick={() => void handleDownload()}
                disabled={!canDownload}
              >
                <span className="action-button__label">{t.saveCurrentLabel}</span>
                <span className="action-button__icon" aria-hidden="true">
                  <Icon name="arrow-right" size={16} />
                </span>
              </button>
            </div>

            <div className="preview-stage">
              {items.length === 0 ? (
                <div className="preview-placeholder">
                  <Icon name="image" className="empty-icon" size={32} />
                  <h3>{t.noImagesTitle}</h3>
                  <p>{t.noImagesBody}</p>
                </div>
              ) : (
                <div className="canvas-wrap">
                  <canvas ref={canvasRef} className="result-canvas" />
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {isLocalPreview ? (
        <button
          type="button"
          className="view-toggle"
          aria-pressed={isMobilePreview}
          onClick={() => setIsMobilePreview((current) => !current)}
        >
          <span className="view-toggle__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" strokeWidth="2.5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
              />
            </svg>
          </span>
          <span className="view-toggle__label">
            {isMobilePreview ? t.previewDesktopLabel : t.previewMobileLabel}
          </span>
        </button>
      ) : null}
    </main>
  )
}

function containsDraggedFiles(event: DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer.types).includes('Files')
}

function isLocalPreviewHost() {
  const host = window.location.hostname.toLowerCase()
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]'
}

function hasMobilePreviewQuery() {
  return new URLSearchParams(window.location.search).get('view') === 'mobile'
}

function createImageId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
  )
}

function createTimestamp() {
  const now = new Date()
  const parts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ]
  return `${parts[0]}${parts[1]}${parts[2]}-${parts[3]}${parts[4]}${parts[5]}`
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function normalizeHexColor(value: string) {
  const trimmed = value.trim()
  if (!/^#([\da-fA-F]{3}|[\da-fA-F]{6})$/.test(trimmed)) {
    return null
  }

  if (trimmed.length === 4) {
    const [hash, red, green, blue] = trimmed
    return `${hash}${red}${red}${green}${green}${blue}${blue}`.toLowerCase()
  }

  return trimmed.toLowerCase()
}

async function loadImageFile(file: File): Promise<LoadedImage> {
  const url = URL.createObjectURL(file)

  try {
    const element = await readImage(url)
    return {
      element,
      item: {
        id: createImageId(),
        name: file.name,
        size: file.size,
        type: file.type,
        url,
        width: element.naturalWidth,
        height: element.naturalHeight,
      },
    }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

function readImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load image.'))
    image.decoding = 'async'
    image.src = url
  })
}

function releaseImage(item: UploadedImage, cache: Map<string, HTMLImageElement>) {
  cache.delete(item.id)
  URL.revokeObjectURL(item.url)
}

export default App
