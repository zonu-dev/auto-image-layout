import {
  type CSSProperties,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useDeferredValue,
  useEffect,
  useId,
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

type HsvColor = {
  h: number
  s: number
  v: number
}

type ScrollCueState = {
  hasOverflow: boolean
  canScrollLeft: boolean
  canScrollRight: boolean
}

const DEFAULT_BACKGROUND = '#000000'
const DEFAULT_GAP = 0
const DOWNLOAD_PREFIX = 'auto-image-layout'
const APP_VERSION = __APP_VERSION__
const ASSET_BASE = import.meta.env.BASE_URL
const CONTACT_EMAIL = 'contact@zoochigames.com'
const MARSHMALLOW_URL =
  'https://marshmallow-qa.com/4q8wumfpc9uj4w6?t=WQvBkW&utm_medium=url_text&utm_source=promotion'
const FORMAT_OPTIONS: Array<{
  extension: string
  label: string
  value: ExportFormat
}> = [
  { label: 'PNG', value: 'image/png', extension: 'png' },
  { label: 'JPEG', value: 'image/jpeg', extension: 'jpg' },
  { label: 'WebP', value: 'image/webp', extension: 'webp' },
]

const BACKGROUND_COLOR_SWATCHES = [
  '#000000',
  '#1f2937',
  '#475569',
  '#94a3b8',
  '#e2e8f0',
  '#ffffff',
  '#7f1d1d',
  '#dc2626',
  '#fb923c',
  '#facc15',
  '#84cc16',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#d946ef',
  '#ec4899',
  '#7c2d12',
  '#b45309',
  '#365314',
  '#166534',
  '#0f766e',
  '#1d4ed8',
] as const

function App() {
  const [items, setItems] = useState<UploadedImage[]>([])
  const [direction, setDirection] = useState<Direction>('horizontal')
  const [normalizeCrossAxis, setNormalizeCrossAxis] = useState(true)
  const [gap, setGap] = useState(DEFAULT_GAP)
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND)
  const [pickerColor, setPickerColor] = useState<HsvColor>(() => hexToHsv(DEFAULT_BACKGROUND))
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const [isFormatMenuOpen, setIsFormatMenuOpen] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('image/png')
  const [isFileDragActive, setIsFileDragActive] = useState(false)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [locale, setLocale] = useState<Locale>(() => resolveInitialLocale())
  const [isLocalPreview] = useState(() => isLocalPreviewHost())
  const [isMobilePreview, setIsMobilePreview] = useState(() => hasMobilePreviewQuery())
  const [isCompactViewport, setIsCompactViewport] = useState(() => matchesMobileViewport())
  const [imageStripCue, setImageStripCue] = useState<ScrollCueState>({
    hasOverflow: false,
    canScrollLeft: false,
    canScrollRight: false,
  })
  const [, startTransition] = useTransition()

  const formatMenuId = useId()
  const contactDialogTitleId = useId()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const canvasWrapRef = useRef<HTMLDivElement | null>(null)
  const colorPickerRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const imageStripRef = useRef<HTMLDivElement | null>(null)
  const formatButtonRef = useRef<HTMLButtonElement | null>(null)
  const formatPickerRef = useRef<HTMLDivElement | null>(null)
  const formatOptionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map())
  const itemsRef = useRef<UploadedImage[]>([])

  const deferredItems = useDeferredValue(items)
  const deferredDirection = useDeferredValue(direction)
  const deferredNormalizeCrossAxis = useDeferredValue(normalizeCrossAxis)
  const deferredGap = useDeferredValue(Number.isFinite(gap) ? Math.max(0, gap) : 0)

  const normalizedBackgroundColor = normalizeHexColor(backgroundColor)
  const safeBackgroundColor = normalizedBackgroundColor ?? DEFAULT_BACKGROUND
  const activeFormatIndex = Math.max(
    0,
    FORMAT_OPTIONS.findIndex((option) => option.value === format),
  )
  const activeFormat = FORMAT_OPTIONS[activeFormatIndex] ?? FORMAT_OPTIONS[0]
  const t = STRINGS[locale]
  const isCompactLayout = isMobilePreview || isCompactViewport
  const normalizeLabel =
    direction === 'horizontal' ? t.normalizeLabelHorizontal : t.normalizeLabelVertical
  const previewPlan =
    deferredItems.length > 0
      ? buildRenderPlan(deferredItems, {
          direction: deferredDirection,
          gap: deferredGap,
          normalizeCrossAxis: deferredNormalizeCrossAxis,
        })
      : null
  const previewError = previewPlan ? describeCanvasLimitForLocale(previewPlan, locale) : null
  const canDownload = items.length > 0 && previewPlan !== null && !previewError
  const backgroundLabel = safeBackgroundColor.toUpperCase()
  const hueSliderStyle = { '--mini-color-thumb': safeBackgroundColor } as CSSProperties
  const topPageHref = getTopPageHref(locale, isMobilePreview)

  function commitPickerColor(nextColor: HsvColor) {
    setPickerColor(nextColor)
    setBackgroundColor(hsvToHex(nextColor))
  }

  function syncBackgroundColorInput(nextValue: string) {
    setBackgroundColor(nextValue)

    const normalized = normalizeHexColor(nextValue)
    if (!normalized) {
      return
    }

    setPickerColor((current) => syncPickerColorWithHex(current, normalized))
  }

  function updateColorFromPlane(element: HTMLDivElement, clientX: number, clientY: number) {
    const bounds = element.getBoundingClientRect()
    const saturation = clamp((clientX - bounds.left) / bounds.width, 0, 1)
    const value = 1 - clamp((clientY - bounds.top) / bounds.height, 0, 1)

    commitPickerColor({
      h: pickerColor.h,
      s: saturation,
      v: value,
    })
  }

  function handleColorPlanePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault()

    const element = event.currentTarget
    const pointerId = event.pointerId

    updateColorFromPlane(element, event.clientX, event.clientY)

    try {
      element.setPointerCapture(pointerId)
    } catch {
      // setPointerCapture may fail on some browsers when the pointer isn't capturable.
    }

    function cleanup() {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)

      try {
        element.releasePointerCapture(pointerId)
      } catch {
        // Ignore release failures for browsers that don't support pointer capture here.
      }
    }

    function handlePointerMove(moveEvent: PointerEvent) {
      updateColorFromPlane(element, moveEvent.clientX, moveEvent.clientY)
    }

    function handlePointerUp(moveEvent: PointerEvent) {
      if (moveEvent.pointerId !== pointerId) {
        return
      }

      cleanup()
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
  }

  function handleHueChange(event: ChangeEvent<HTMLInputElement>) {
    commitPickerColor({
      h: Number(event.target.value),
      s: pickerColor.s,
      v: pickerColor.v,
    })
  }

  function focusFormatOption(index: number) {
    const nextIndex = (index + FORMAT_OPTIONS.length) % FORMAT_OPTIONS.length
    formatOptionRefs.current[nextIndex]?.focus()
  }

  function openFormatMenu(index = activeFormatIndex) {
    setIsColorPickerOpen(false)
    setIsFormatMenuOpen(true)
    window.requestAnimationFrame(() => focusFormatOption(index))
  }

  function closeFormatMenu(focusButton = true) {
    setIsFormatMenuOpen(false)

    if (focusButton) {
      window.requestAnimationFrame(() => formatButtonRef.current?.focus())
    }
  }

  function chooseFormat(nextFormat: ExportFormat) {
    if (nextFormat !== format) {
      setFormat(nextFormat)
    }

    closeFormatMenu(false)
    window.requestAnimationFrame(() => formatButtonRef.current?.focus())
  }

  function handleFormatButtonKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      openFormatMenu(activeFormatIndex)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      openFormatMenu(activeFormatIndex - 1)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (isFormatMenuOpen) {
        closeFormatMenu(false)
      } else {
        openFormatMenu(activeFormatIndex)
      }
    }
  }

  function handleFormatOptionKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusFormatOption(index + 1)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusFormatOption(index - 1)
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      focusFormatOption(0)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      focusFormatOption(FORMAT_OPTIONS.length - 1)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      closeFormatMenu()
      return
    }

    if (event.key === 'Tab') {
      closeFormatMenu(false)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      chooseFormat(FORMAT_OPTIONS[index].value)
    }
  }

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
    if (!isColorPickerOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (!colorPickerRef.current?.contains(event.target as Node)) {
        setIsColorPickerOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsColorPickerOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isColorPickerOpen])

  useEffect(() => {
    if (!isFormatMenuOpen) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (!formatPickerRef.current || formatPickerRef.current.contains(event.target as Node)) {
        return
      }

      setIsFormatMenuOpen(false)
    }

    function handleDocumentKeydown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()
      closeFormatMenu()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleDocumentKeydown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleDocumentKeydown)
    }
  }, [isFormatMenuOpen])

  useEffect(() => {
    if (!isContactModalOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleDocumentKeydown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()
      setIsContactModalOpen(false)
    }

    document.addEventListener('keydown', handleDocumentKeydown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleDocumentKeydown)
    }
  }, [isContactModalOpen])

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
    const mediaQuery = window.matchMedia('(max-width: 720px)')

    function syncViewportMatch(event?: MediaQueryListEvent) {
      setIsCompactViewport(event?.matches ?? mediaQuery.matches)
    }

    syncViewportMatch()

    mediaQuery.addEventListener('change', syncViewportMatch)
    return () => {
      mediaQuery.removeEventListener('change', syncViewportMatch)
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

  useEffect(() => {
    const canvasNode = canvasRef.current
    const wrapNode = canvasWrapRef.current

    if (!canvasNode || !wrapNode) {
      return
    }

    const canvasElement = canvasNode
    const wrapElement = wrapNode

    function syncCanvasDisplaySize() {
      if (!previewPlan || previewError || canvasElement.width <= 1 || canvasElement.height <= 1) {
        canvasElement.style.width = ''
        canvasElement.style.height = ''
        return
      }

      const styles = window.getComputedStyle(wrapElement)
      const availableWidth =
        wrapElement.clientWidth -
        Number.parseFloat(styles.paddingLeft) -
        Number.parseFloat(styles.paddingRight)
      const availableHeight =
        wrapElement.clientHeight -
        Number.parseFloat(styles.paddingTop) -
        Number.parseFloat(styles.paddingBottom)

      if (availableWidth <= 0 || availableHeight <= 0) {
        return
      }

      const scale = Math.min(
        availableWidth / canvasElement.width,
        availableHeight / canvasElement.height,
        1,
      )
      canvasElement.style.width = `${Math.max(1, Math.floor(canvasElement.width * scale))}px`
      canvasElement.style.height = `${Math.max(1, Math.floor(canvasElement.height * scale))}px`
    }

    syncCanvasDisplaySize()

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncCanvasDisplaySize) : null
    resizeObserver?.observe(wrapElement)
    window.addEventListener('resize', syncCanvasDisplaySize)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', syncCanvasDisplaySize)
    }
  }, [previewError, previewPlan])

  useEffect(() => {
    const stripNode = imageStripRef.current

    if (!stripNode) {
      return
    }

    const stripElement = stripNode

    function syncImageStripCue() {
      const maxScrollLeft = Math.max(0, stripElement.scrollWidth - stripElement.clientWidth)
      const nextCue = {
        hasOverflow: maxScrollLeft > 6,
        canScrollLeft: stripElement.scrollLeft > 6,
        canScrollRight: stripElement.scrollLeft < maxScrollLeft - 6,
      }

      setImageStripCue((current) =>
        current.hasOverflow === nextCue.hasOverflow &&
        current.canScrollLeft === nextCue.canScrollLeft &&
        current.canScrollRight === nextCue.canScrollRight
          ? current
          : nextCue,
      )
    }

    syncImageStripCue()

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncImageStripCue) : null

    resizeObserver?.observe(stripElement)
    stripElement.addEventListener('scroll', syncImageStripCue, { passive: true })
    window.addEventListener('resize', syncImageStripCue)

    return () => {
      resizeObserver?.disconnect()
      stripElement.removeEventListener('scroll', syncImageStripCue)
      window.removeEventListener('resize', syncImageStripCue)
    }
  }, [items.length, isCompactLayout])

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
        <div className="document-toolbar enter-stage enter-stage--1">
          <div className="document-toolbar__controls">
            <a
              className="document-home-link"
              href={topPageHref}
              aria-label={t.topPageAria}
            >
              <img src={`${ASSET_BASE}zoochi-logo.png`} alt="ZOOCHI" className="brand-logo" />
            </a>

            <LanguageSwitcher ariaLabel={t.languageLabel} locale={locale} onChange={setLocale} />
          </div>
        </div>

        <section className="header-card solid-shadow enter-stage enter-stage--2">
          <div className="header-card__hero">
            <div className="wobble-container app-card__wobble app-card__wobble--positive" aria-hidden="true">
              <div className="wobble-target app-badge app-badge--auto">
                <img src={`${ASSET_BASE}app-icon.png`} alt="" className="app-badge__icon" />
              </div>
            </div>

            <div className="header-card__copy">
              <h1>Auto Image Layout</h1>
              <p>{t.headerSummary}</p>
            </div>
          </div>
        </section>
      </header>

      <div className="workspace workspace--compact">
        <section className="settings-column">
          <section className="compact-panel compact-panel--images solid-shadow enter-stage enter-stage--3">
            <div className="compact-panel__heading">
              <div className="compact-panel__title">
                <Icon name="image" size={18} className="compact-panel__lead-icon" />
                <h2>{t.summaryImages}</h2>
              </div>
              {items.length > 0 ? (
                <button
                  type="button"
                  className="secondary-button secondary-button--ghost secondary-button--accent-hover"
                  onClick={clearItems}
                >
                  <Icon name="trash-2" size={14} />
                  {t.clearLabel}
                </button>
              ) : null}
            </div>

            <button
              type="button"
              className={`dropzone dropzone--compact toy-btn ${isFileDragActive ? 'is-active' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleFileDrop}
              onDragOver={handleFileDragOver}
              onDragEnter={handleFileDragOver}
              onDragLeave={() => setIsFileDragActive(false)}
            >
              <span className="dropzone-icon-wrap dropzone-icon-wrap--compact">
                <Icon name="upload" className="dropzone-icon empty-icon" size={24} />
              </span>
              <span className="dropzone-copy-block">
                <span className="dropzone-title">{t.dropzoneTitle}</span>
                {t.dropzoneCopy ? <span className="dropzone-copy">{t.dropzoneCopy}</span> : null}
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="visually-hidden"
              onChange={handleFileInput}
            />

            {items.length > 0 ? (
              <div className="image-strip-shell">
                <div
                  ref={imageStripRef}
                  className="image-strip"
                  role="list"
                  aria-label={t.uploadedImagesAria}
                >
                  {items.map((item, index) => (
                    <article
                      key={item.id}
                      role="listitem"
                      className={`image-tile ${draggedItemId === item.id ? 'is-dragging' : ''}`}
                      draggable
                      onDragStart={(event) => {
                        setDraggedItemId(item.id)
                        event.dataTransfer.effectAllowed = 'move'
                        event.dataTransfer.setData('text/plain', item.id)
                      }}
                      onDragEnd={() => setDraggedItemId(null)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault()
                        const sourceId = event.dataTransfer.getData('text/plain') || draggedItemId
                        if (sourceId) {
                          reorderItems(sourceId, item.id)
                        }
                        setDraggedItemId(null)
                      }}
                    >
                      <div className="image-tile__media">
                        <img src={item.url} alt="" className="image-tile__thumb" loading="lazy" />
                        <button
                          type="button"
                          className="image-tile__remove"
                          onClick={() => removeItem(item.id)}
                          aria-label={t.removeItem(item.name)}
                          title={t.deleteTitle}
                        >
                          <Icon name="x" size={12} strokeWidth={2.6} />
                        </button>
                        <button
                          type="button"
                          className="image-tile__handle"
                          onKeyDown={(event) => {
                            if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                              event.preventDefault()
                              moveItem(item.id, index - 1)
                            }

                            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                              event.preventDefault()
                              moveItem(item.id, index + 1)
                            }
                          }}
                          aria-label={t.dragHandleLabel(item.name)}
                          title={t.dragHandleLabel(item.name)}
                        >
                          <Icon name="more-horizontal" size={16} strokeWidth={2.8} />
                        </button>
                      </div>
                    </article>
                  ))}

                  <button
                    type="button"
                    className="image-tile image-tile--adder"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label={t.addImagesTitle}
                  >
                    <span className="image-tile__plus" aria-hidden="true">
                      +
                    </span>
                  </button>
                </div>

                {imageStripCue.hasOverflow ? (
                  <>
                    <span
                      className={`image-strip-fade image-strip-fade--left ${
                        imageStripCue.canScrollLeft ? 'is-visible' : ''
                      }`}
                      aria-hidden="true"
                    />
                    <span
                      className={`image-strip-fade image-strip-fade--right ${
                        imageStripCue.canScrollRight ? 'is-visible' : ''
                      }`}
                      aria-hidden="true"
                    />
                    {imageStripCue.canScrollLeft ? (
                      <span className="image-strip-cue image-strip-cue--left" aria-hidden="true">
                        <Icon
                          name="arrow-right"
                          size={14}
                          strokeWidth={2.6}
                          className="image-strip-cue__icon image-strip-cue__icon--left"
                        />
                      </span>
                    ) : null}
                    {imageStripCue.canScrollRight ? (
                      <span className="image-strip-cue image-strip-cue--right" aria-hidden="true">
                        <Icon
                          name="arrow-right"
                          size={14}
                          strokeWidth={2.6}
                          className="image-strip-cue__icon"
                        />
                      </span>
                    ) : null}
                  </>
                ) : null}
              </div>
            ) : null}
          </section>

          <section
            className={`compact-panel compact-panel--controls solid-shadow enter-stage enter-stage--4 ${
              isColorPickerOpen || isFormatMenuOpen ? 'is-popover-open' : ''
            }`}
          >
            <div className="compact-panel__heading compact-panel__heading--simple">
              <Icon name="sliders" size={18} className="compact-panel__lead-icon" />
              <h2>{t.appearanceTitle}</h2>
            </div>

            <div className="control-stack">
              <div className="field-block">
                <label className="field-block__label">{t.directionCaption}</label>
                <div
                  className={`direction-picker direction-picker--segmented ${
                    direction === 'vertical' ? 'is-vertical' : 'is-horizontal'
                  }`}
                >
                  <button
                    type="button"
                    className={`direction-card direction-card--segmented ${
                      direction === 'horizontal' ? 'is-selected' : ''
                    }`}
                    onClick={() => setDirection('horizontal')}
                    aria-pressed={direction === 'horizontal'}
                  >
                    <Icon name="arrow-right" size={14} className="direction-icon" />
                    <span className="direction-card-title">{t.directionHorizontal}</span>
                  </button>
                  <button
                    type="button"
                    className={`direction-card direction-card--segmented ${
                      direction === 'vertical' ? 'is-selected' : ''
                    }`}
                    onClick={() => setDirection('vertical')}
                    aria-pressed={direction === 'vertical'}
                  >
                    <Icon name="arrow-down" size={14} className="direction-icon" />
                    <span className="direction-card-title">{t.directionVertical}</span>
                  </button>
                </div>
              </div>

              <div className="control-grid">
                <div className="mini-card mini-card--switch">
                  <div className="mini-card__copy">
                    <span className="mini-card__label">{normalizeLabel}</span>
                  </div>
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

                <label className="mini-card">
                  <span className="mini-card__label">{t.gapLabel}</span>
                  <input
                    className="mini-input mini-input--gap"
                    type="number"
                    min={0}
                    step={1}
                    value={gap}
                    onChange={(event) => setGap(Number(event.target.value))}
                  />
                </label>
              </div>

              <div className="control-grid control-grid--bordered">
                <div className="mini-card mini-card--background">
                  <span className="mini-card__label">{t.backgroundColorLabel}</span>
                  <div className="mini-color-field" ref={colorPickerRef}>
                    <div
                      className={`mini-color-row ${isColorPickerOpen ? 'is-open' : ''}`}
                      onClick={() => {
                        setIsFormatMenuOpen(false)
                        setIsColorPickerOpen(true)
                      }}
                    >
                      <button
                        type="button"
                        className={`mini-color-swatch-button ${isColorPickerOpen ? 'is-open' : ''}`}
                        style={{ backgroundColor: safeBackgroundColor }}
                        aria-label={`${t.backgroundColorLabel}: ${backgroundLabel}`}
                        aria-expanded={isColorPickerOpen}
                        aria-haspopup="dialog"
                        onClick={(event) => {
                          event.stopPropagation()
                          setIsFormatMenuOpen(false)
                          setIsColorPickerOpen((current) => !current)
                        }}
                      >
                        <span className="visually-hidden">{backgroundLabel}</span>
                      </button>
                      <input
                        className="mini-input--hex mini-color-row__display"
                        type="text"
                        value={backgroundLabel}
                        readOnly
                        aria-label={`${t.backgroundColorLabel}: ${backgroundLabel}`}
                        aria-expanded={isColorPickerOpen}
                        aria-haspopup="dialog"
                        spellCheck={false}
                        onClick={(event) => {
                          event.stopPropagation()
                          setIsFormatMenuOpen(false)
                          setIsColorPickerOpen(true)
                        }}
                        onFocus={() => {
                          setIsFormatMenuOpen(false)
                          setIsColorPickerOpen(true)
                        }}
                      />
                      <button
                        type="button"
                        className="mini-color-row__toggle"
                        aria-label={t.backgroundColorLabel}
                        aria-expanded={isColorPickerOpen}
                        aria-haspopup="dialog"
                        onClick={(event) => {
                          event.stopPropagation()
                          setIsFormatMenuOpen(false)
                          setIsColorPickerOpen((current) => !current)
                        }}
                      >
                        <span className="field-chevron" aria-hidden="true">
                          <svg viewBox="0 0 24 24" strokeWidth="3">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m19.5 8.25-7.5 7.5-7.5-7.5"
                            />
                          </svg>
                        </span>
                      </button>
                    </div>

                    {isColorPickerOpen ? (
                      <div className="mini-color-popover" role="dialog" aria-label={t.backgroundColorLabel}>
                        <div className="mini-color-popover__preview">
                          <span
                            className="mini-color-popover__preview-swatch"
                            style={{ backgroundColor: safeBackgroundColor }}
                            aria-hidden="true"
                          />
                          <input
                            className="mini-input mini-input--hex mini-color-popover__hex"
                            type="text"
                            value={backgroundColor}
                            onChange={(event) => syncBackgroundColorInput(event.target.value.trim())}
                            placeholder="#FFFFFF"
                            spellCheck={false}
                            autoFocus
                          />
                        </div>
                        <div
                          className="mini-color-plane"
                          style={{ backgroundColor: hsvToHex({ h: pickerColor.h, s: 1, v: 1 }) }}
                          onPointerDown={handleColorPlanePointerDown}
                        >
                          <span
                            className="mini-color-plane__pointer"
                            style={{
                              left: `${pickerColor.s * 100}%`,
                              top: `${(1 - pickerColor.v) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="mini-color-hue-wrap">
                          <input
                            className="mini-color-hue"
                            type="range"
                            min={0}
                          max={360}
                          step={1}
                          value={Math.round(pickerColor.h)}
                          style={hueSliderStyle}
                          onChange={handleHueChange}
                          aria-label={t.backgroundColorLabel}
                        />
                        </div>
                        <div className="mini-color-popover__swatches">
                          {BACKGROUND_COLOR_SWATCHES.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`mini-color-option ${safeBackgroundColor === color ? 'is-selected' : ''}`}
                              style={{ backgroundColor: color }}
                              aria-label={`${t.backgroundColorLabel}: ${color.toUpperCase()}`}
                              title={color.toUpperCase()}
                              onClick={() => {
                                syncBackgroundColorInput(color)
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mini-card">
                  <span className="mini-card__label">{t.exportFormatLabel}</span>
                  <div
                    ref={formatPickerRef}
                    className={`format-picker ${isFormatMenuOpen ? 'is-open' : ''}`}
                  >
                    <button
                      ref={formatButtonRef}
                      type="button"
                      className="format-picker__button toy-btn"
                      aria-haspopup="listbox"
                      aria-expanded={isFormatMenuOpen}
                      aria-controls={formatMenuId}
                      aria-label={`${t.exportFormatLabel}: ${activeFormat.label}`}
                      onClick={() => {
                        if (isFormatMenuOpen) {
                          closeFormatMenu(false)
                        } else {
                          openFormatMenu(activeFormatIndex)
                        }
                      }}
                      onKeyDown={handleFormatButtonKeyDown}
                    >
                      <span className="format-picker__label">{activeFormat.label}</span>
                      <span className="format-picker__icon field-chevron" aria-hidden="true">
                        <svg viewBox="0 0 24 24" strokeWidth="3">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m19.5 8.25-7.5 7.5-7.5-7.5"
                          />
                        </svg>
                      </span>
                    </button>

                    <div
                      id={formatMenuId}
                      className="language-picker__menu format-picker__menu"
                      role="listbox"
                      aria-label={t.exportFormatLabel}
                      hidden={!isFormatMenuOpen}
                    >
                      <div className="language-picker__options format-picker__options">
                        {FORMAT_OPTIONS.map((option, index) => (
                          <button
                            key={option.value}
                            ref={(node) => {
                              formatOptionRefs.current[index] = node
                            }}
                            type="button"
                            className="language-picker__option format-picker__option"
                            role="option"
                            aria-selected={option.value === format}
                            onClick={() => chooseFormat(option.value)}
                            onKeyDown={(event) => handleFormatOptionKeyDown(event, index)}
                          >
                            <span className="language-picker__option-label format-picker__option-label">
                              {option.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {normalizedBackgroundColor === null ? (
                <span className="field-help field-help--compact">{t.invalidHex}</span>
              ) : null}
            </div>
          </section>
        </section>

        <section className="preview-column">
          <section className="compact-panel compact-panel--preview solid-shadow enter-stage enter-stage--5">
            <div className="preview-toolbar">
              <div className="preview-toolbar__title">
                <Icon name="eye" size={18} className="compact-panel__lead-icon" />
                <h2>{t.previewTitle}</h2>
              </div>

              <div className="preview-toolbar__actions">
                <button
                  type="button"
                  className="action-button action-button--compact toy-btn"
                  onClick={() => void handleDownload()}
                  disabled={!canDownload}
                  aria-label={t.saveCurrentLabel}
                >
                  <span className="action-button__label">{t.saveCurrentLabel}</span>
                  <span className="action-button__icon" aria-hidden="true">
                    <Icon name="download" size={18} />
                  </span>
                </button>
              </div>
            </div>

            {previewError ? <p className="error-banner">{previewError}</p> : null}

            <div className={`preview-stage preview-stage--compact ${items.length === 0 ? 'is-empty' : 'has-content'}`}>
              {items.length === 0 ? (
                <div className="preview-placeholder preview-placeholder--compact">
                  <Icon name="image" className="empty-icon" size={28} />
                  <h3>{t.noImagesTitle}</h3>
                  {t.noImagesBody ? <p>{t.noImagesBody}</p> : null}
                </div>
              ) : (
                <div ref={canvasWrapRef} className="canvas-wrap canvas-wrap--compact">
                  <canvas ref={canvasRef} className="result-canvas" />
                </div>
              )}
            </div>
          </section>
        </section>
      </div>

      <footer className="app-footer enter-stage enter-stage--6">
        <button
          type="button"
          className="secondary-button app-footer__contact-button btn-wobble-group"
          onClick={() => setIsContactModalOpen(true)}
        >
          <span className="wobble-container" aria-hidden="true">
            <span className="wobble-target app-footer__contact-symbol">
              <ContactGlyph />
            </span>
          </span>
          {t.contactButtonLabel}
        </button>
      </footer>

      {isContactModalOpen ? (
        <div
          className="contact-modal-backdrop"
          role="presentation"
          onClick={() => setIsContactModalOpen(false)}
        >
          <section
            className="contact-modal solid-shadow"
            role="dialog"
            aria-modal="true"
            aria-labelledby={contactDialogTitleId}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="contact-modal__header">
              <div className="contact-modal__title-wrap">
                <span className="wobble-container" aria-hidden="true">
                  <span className="wobble-target contact-modal__title-icon">
                    <ContactGlyph />
                  </span>
                </span>
                <div className="contact-modal__title-copy">
                  <h2 id={contactDialogTitleId}>{t.contactDialogTitle}</h2>
                  <p>{t.contactDialogDescription}</p>
                </div>
              </div>
              <button
                type="button"
                className="icon-button contact-modal__close"
                aria-label={t.contactDialogCloseLabel}
                onClick={() => setIsContactModalOpen(false)}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="contact-modal__links">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="toy-btn btn-wobble-group contact-modal__link contact-modal__link--email"
              >
                <span className="wobble-container" aria-hidden="true">
                  <span className="wobble-target contact-modal__link-icon contact-modal__link-icon--email">
                    <EmailGlyph />
                  </span>
                </span>
                <span className="contact-modal__link-copy">
                  <span className="contact-modal__link-title">{t.contactEmailTitle}</span>
                  <span className="contact-modal__link-text">{CONTACT_EMAIL}</span>
                </span>
              </a>

              <a
                href={MARSHMALLOW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="toy-btn btn-wobble-group contact-modal__link contact-modal__link--marshmallow"
              >
                <span className="wobble-container" aria-hidden="true">
                  <span className="wobble-target contact-modal__link-icon contact-modal__link-icon--marshmallow">
                    <img
                      src={`${ASSET_BASE}marshmallow-logo.svg`}
                      alt=""
                      className="contact-modal__marshmallow-logo"
                    />
                  </span>
                </span>
                <span className="contact-modal__link-copy">
                  <span className="contact-modal__link-title">{t.contactMarshmallowTitle}</span>
                  <span className="contact-modal__link-text">{t.contactMarshmallowText}</span>
                </span>
              </a>
            </div>

            <div className="contact-modal__meta" aria-label={`${t.versionLabel} v${APP_VERSION}`}>
              <span className="contact-modal__meta-label">{t.versionLabel}</span>
              <code className="contact-modal__meta-value">v{APP_VERSION}</code>
            </div>
          </section>
        </div>
      ) : null}

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

function ContactGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M12 2.25c-2.429 0-4.817.178-7.152.521C2.87 3.061 1.5 4.795 1.5 6.741v6.018c0 1.946 1.37 3.68 3.348 3.97.877.129 1.761.234 2.652.316V21a.75.75 0 0 0 1.28.53l4.184-4.183a.39.39 0 0 1 .266-.112c2.006-.05 3.982-.22 5.922-.506 1.978-.29 3.348-2.023 3.348-3.97V6.741c0-1.947-1.37-3.68-3.348-3.97A49.145 49.145 0 0 0 12 2.25ZM8.25 8.625a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Zm2.625 1.125a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875-1.125a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function EmailGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67z" />
      <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908z" />
    </svg>
  )
}

function isLocalPreviewHost() {
  const host = window.location.hostname.toLowerCase()
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]'
}

function hasMobilePreviewQuery() {
  return new URLSearchParams(window.location.search).get('view') === 'mobile'
}

function matchesMobileViewport() {
  return window.matchMedia('(max-width: 720px)').matches
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function normalizeHue(value: number) {
  const nextValue = value % 360
  return nextValue < 0 ? nextValue + 360 : nextValue
}

function hexToRgb(value: string) {
  const normalized = normalizeHexColor(value)
  if (!normalized) {
    return null
  }

  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  }
}

function hexToHsv(value: string): HsvColor {
  const rgb = hexToRgb(value)
  if (!rgb) {
    return { h: 0, s: 0, v: 0 }
  }

  const red = rgb.r / 255
  const green = rgb.g / 255
  const blue = rgb.b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min

  let hue = 0
  if (delta !== 0) {
    if (max === red) {
      hue = ((green - blue) / delta) % 6
    } else if (max === green) {
      hue = (blue - red) / delta + 2
    } else {
      hue = (red - green) / delta + 4
    }
  }

  return {
    h: normalizeHue(hue * 60),
    s: max === 0 ? 0 : delta / max,
    v: max,
  }
}

function hsvToRgb(value: HsvColor) {
  const hue = normalizeHue(value.h)
  const saturation = clamp(value.s, 0, 1)
  const brightness = clamp(value.v, 0, 1)
  const chroma = brightness * saturation
  const segment = hue / 60
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1))

  let red = 0
  let green = 0
  let blue = 0

  if (segment >= 0 && segment < 1) {
    red = chroma
    green = secondary
  } else if (segment < 2) {
    red = secondary
    green = chroma
  } else if (segment < 3) {
    green = chroma
    blue = secondary
  } else if (segment < 4) {
    green = secondary
    blue = chroma
  } else if (segment < 5) {
    red = secondary
    blue = chroma
  } else {
    red = chroma
    blue = secondary
  }

  const match = brightness - chroma

  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255),
  }
}

function hsvToHex(value: HsvColor) {
  const rgb = hsvToRgb(value)
  return `#${[rgb.r, rgb.g, rgb.b]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`
}

function syncPickerColorWithHex(current: HsvColor, value: string): HsvColor {
  const next = hexToHsv(value)

  if (next.s === 0 || next.v === 0) {
    return {
      h: current.h,
      s: next.s,
      v: next.v,
    }
  }

  return next
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
