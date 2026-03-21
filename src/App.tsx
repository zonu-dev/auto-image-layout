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
  describeCanvasLimit,
  type Direction,
  type ExportFormat,
  type LayoutImage,
} from './lib/layout'
import Icon from './components/Icon'

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
  const [, startTransition] = useTransition()

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map())
  const itemsRef = useRef<UploadedImage[]>([])

  const deferredItems = useDeferredValue(items)
  const deferredDirection = useDeferredValue(direction)
  const deferredNormalizeCrossAxis = useDeferredValue(normalizeCrossAxis)
  const deferredGap = useDeferredValue(Number.isFinite(gap) ? Math.max(0, gap) : 0)

  const safeBackgroundColor = normalizeHexColor(backgroundColor) ?? DEFAULT_BACKGROUND
  const activeFormat = FORMAT_OPTIONS.find((option) => option.value === format) ?? FORMAT_OPTIONS[0]
  const normalizeLabel = direction === 'horizontal' ? '高さを揃える' : '幅を揃える'
  const previewPlan =
    deferredItems.length > 0
      ? buildRenderPlan(deferredItems, {
          direction: deferredDirection,
          gap: deferredGap,
          normalizeCrossAxis: deferredNormalizeCrossAxis,
        })
      : null
  const previewError = previewPlan ? describeCanvasLimit(previewPlan) : null
  const previewState = previewPlan
    ? { width: previewPlan.width, height: previewPlan.height }
    : null
  const canDownload = items.length > 0 && previewPlan !== null && !previewError

  useEffect(() => {
    itemsRef.current = items
  }, [items])

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
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <h1>画像連結ツール</h1>
          <p className="hero-copy">
            複数の画像を並べて、1枚の画像として保存できます。設定を変えると仕上がりをすぐに確認できます。
          </p>
        </div>
      </section>

      <div className="workspace">
        <section className="panel controls-panel">
          <div className="panel-header">
            <div className="title-with-icon">
              <Icon name="sliders" size={18} />
              <h2>設定</h2>
            </div>
          </div>

          <div className="settings-list">
            <div className="setting-block">
              <div className="direction-picker">
                <button
                  type="button"
                  className={`direction-card ${direction === 'horizontal' ? 'is-selected' : ''}`}
                  onClick={() => setDirection('horizontal')}
                  aria-pressed={direction === 'horizontal'}
                >
                  <Icon name="arrow-right" size={18} className="direction-icon" />
                  <span className="direction-card-title">横並び</span>
                </button>
                <button
                  type="button"
                  className={`direction-card ${direction === 'vertical' ? 'is-selected' : ''}`}
                  onClick={() => setDirection('vertical')}
                  aria-pressed={direction === 'vertical'}
                >
                  <Icon name="arrow-down" size={18} className="direction-icon" />
                  <span className="direction-card-title">縦並び</span>
                </button>
              </div>
            </div>

            <div className="setting-row">
              <span className="setting-label">
                <Icon name="maximize-2" size={15} className="field-icon" />
                <span className="field-label">{normalizeLabel}</span>
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
                <Icon name="more-horizontal" size={15} className="field-icon" />
                <span className="field-label">間隔</span>
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
                  <Icon name="droplet" size={15} className="field-icon" />
                  <span className="field-label">背景色</span>
                </span>
                <div className="color-inline">
                  <input
                    type="color"
                    value={safeBackgroundColor}
                    onChange={(event) => setBackgroundColor(event.target.value)}
                    aria-label="背景色"
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
              {normalizeHexColor(backgroundColor) === null && (
                <span className="field-help">#RGB または #RRGGBB で入力してください。</span>
              )}
            </div>

            <label className="setting-row">
              <span className="setting-label">
                <Icon name="file-text" size={15} className="field-icon" />
                <span className="field-label">書き出し形式</span>
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

          <div className="section-header">
            <div className="section-header-main">
              <div className="title-with-icon">
                <Icon name="image" size={18} />
                <h3>画像一覧</h3>
              </div>
            </div>
            <button
              type="button"
              className="text-button"
              onClick={clearItems}
              disabled={items.length === 0}
            >
              <Icon name="trash-2" size={16} className="button-icon" />
              クリア
            </button>
          </div>

          <button
            type="button"
            className={`dropzone ${isFileDragActive ? 'is-active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleFileDrop}
            onDragOver={handleFileDragOver}
            onDragEnter={handleFileDragOver}
            onDragLeave={() => setIsFileDragActive(false)}
          >
            <span className="dropzone-head">
              <Icon name="upload" className="dropzone-icon" size={20} />
              <span className="dropzone-title">画像を追加</span>
            </span>
            <span className="dropzone-copy">ドラッグ&amp;ドロップ、またはクリックして選択</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="visually-hidden"
            onChange={handleFileInput}
          />

          {items.length === 0 ? (
            <div className="empty-card">
              <Icon name="image" className="empty-icon" size={28} />
              <p>画像を追加すると一覧が表示されます。</p>
            </div>
          ) : (
            <div className="image-list" role="list" aria-label="アップロード画像一覧">
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
                      onClick={() => moveItem(item.id, index - 1)}
                      disabled={index === 0}
                      aria-label={`${item.name} を上へ移動`}
                    >
                      <Icon name="arrow-up" size={16} />
                    </button>
                    <span className="image-card-index">{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => moveItem(item.id, index + 1)}
                      disabled={index === items.length - 1}
                      aria-label={`${item.name} を下へ移動`}
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
                      className="danger-button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`${item.name} を削除`}
                      title="削除"
                    >
                      <Icon name="trash-2" size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel preview-panel">
          <div className="panel-header">
            <div className="title-with-icon">
              <Icon name="eye" size={18} />
              <h2>プレビュー</h2>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => void handleDownload()}
              disabled={!canDownload}
            >
              <Icon name="download" size={16} className="button-icon" />
              ダウンロード
            </button>
          </div>

          <div className="preview-meta">
            <span>
              <Icon name="image" size={14} className="meta-icon" />
              {items.length}枚
            </span>
            <span>
              <Icon name="maximize-2" size={14} className="meta-icon" />
              {previewState ? `${previewState.width}×${previewState.height}px` : 'サイズ未確定'}
            </span>
            <span>
              <Icon
                name={direction === 'horizontal' ? 'arrow-right' : 'arrow-down'}
                size={14}
                className="meta-icon"
              />
              {direction === 'horizontal' ? '横並び' : '縦並び'}
            </span>
          </div>

          {previewError && <p className="error-banner">{previewError}</p>}

          <div className="preview-stage">
            {items.length === 0 ? (
              <div className="preview-placeholder">
                <Icon name="image" className="empty-icon" size={32} />
                <h3>画像がありません</h3>
                <p>画像を追加するとここに表示されます。</p>
              </div>
            ) : (
              <div className="canvas-wrap">
                <canvas ref={canvasRef} className="result-canvas" />
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

function containsDraggedFiles(event: DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer.types).includes('Files')
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
    image.onerror = () => reject(new Error('画像を読み込めませんでした。'))
    image.decoding = 'async'
    image.src = url
  })
}

function releaseImage(item: UploadedImage, cache: Map<string, HTMLImageElement>) {
  cache.delete(item.id)
  URL.revokeObjectURL(item.url)
}

export default App
