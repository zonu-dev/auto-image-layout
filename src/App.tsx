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

  const normalizedBackgroundColor = normalizeHexColor(backgroundColor)
  const safeBackgroundColor = normalizedBackgroundColor ?? DEFAULT_BACKGROUND
  const activeFormat = FORMAT_OPTIONS.find((option) => option.value === format) ?? FORMAT_OPTIONS[0]
  const normalizeLabel = direction === 'horizontal' ? '高さを揃える' : '幅を揃える'
  const directionLabel = direction === 'horizontal' ? '横並び' : '縦並び'
  const normalizeSummary = normalizeCrossAxis ? '自動で揃える' : '元の比率を保つ'
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
  const backgroundLabel = safeBackgroundColor.toUpperCase()
  const previewSizeLabel = previewState
    ? `${previewState.width}×${previewState.height}px`
    : 'サイズ未確定'

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
    <main className="app-shell theme-auto">
      <header className="page-header">
        <section className="hero-card solid-shadow">
          <div className="page-toolbar">
            <a
              className="zoochi-link"
              href="https://zoochigames.com/index.html"
              aria-label="ZOOCHIのトップページへ"
            >
              <img src="/zoochi-logo.png" alt="ZOOCHI" />
            </a>

            <a className="page-toolbar__link toy-btn" href="https://zoochigames.com/index.html">
              トップページへ
            </a>
          </div>

          <div className="hero-card__hero">
            <div className="hero-card__badge-wrap" aria-hidden="true">
              <div className="hero-card__badge">
                <img src="/app-icon.png" alt="" className="hero-card__badge-icon" />
              </div>
            </div>

            <div className="hero-card__copy">
              <div className="meta-pills">
                <span className="meta-pill meta-pill--brand">AUTO IMAGE LAYOUT</span>
                <span className="meta-pill">ブラウザでそのまま保存</span>
                <span className="meta-pill">順番もすぐ入れ替え</span>
              </div>

              <h1 className="hero-title">画像を1枚につなげる</h1>

              <p className="hero-copy">
                複数の画像を横または縦に並べて、1枚の画像として保存できます。順番、間隔、背景色を変えると、仕上がりがその場で反映されます。
              </p>

              <ul className="feature-tags" aria-label="主な特徴">
                <li>ドラッグで並び替え</li>
                <li>横並びも縦並びも対応</li>
                <li>PNG / JPEG / WebPで保存</li>
              </ul>
            </div>
          </div>
        </section>
      </header>

      <div className="workspace">
        <section className="tool-panel solid-shadow">
          <div className="panel-heading">
            <span className="panel-heading__number">1</span>
            <div className="panel-heading__copy">
              <h2>設定と画像</h2>
              <p>追加、並び替え、書き出し設定をここで整えます。</p>
            </div>
          </div>

          <div className="panel-surface">
            <div className="subsection-header">
              <div className="title-with-icon">
                <Icon name="upload" size={18} />
                <h3>画像を追加</h3>
              </div>
              <span className="subtle-pill">{items.length}枚</span>
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
                <span className="dropzone-title">ドラッグ&amp;ドロップ、またはクリックして選択</span>
              </span>
              <span className="dropzone-copy">複数画像をまとめて追加できます。</span>
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
                <h3>見た目を決める</h3>
              </div>
            </div>

            <div className="settings-list">
              <div className="setting-block">
                <span className="setting-caption">並び方向</span>
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
                    <span className="direction-card-title">横並び</span>
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
                    <span className="direction-card-title">縦並び</span>
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
                    <span className="field-label">間隔</span>
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
                      <span className="field-label">背景色</span>
                      <span className="field-value">{backgroundLabel}</span>
                    </span>
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
                {normalizedBackgroundColor === null && (
                  <span className="field-help">#RGB または #RRGGBB で入力してください。</span>
                )}
              </div>

              <label className="setting-row">
                <span className="setting-label">
                  <Icon name="file-text" size={16} className="field-icon" />
                  <span className="field-copy">
                    <span className="field-label">書き出し形式</span>
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
                <h3>画像一覧</h3>
              </div>
              <button
                type="button"
                className="secondary-button toy-btn"
                onClick={clearItems}
                disabled={items.length === 0}
              >
                <Icon name="trash-2" size={16} />
                クリア
              </button>
            </div>

            {items.length === 0 ? (
              <div className="empty-card">
                <Icon name="image" className="empty-icon" size={28} />
                <p>画像を追加するとここに一覧が表示されます。</p>
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
                        className="icon-button"
                        onClick={() => moveItem(item.id, index - 1)}
                        disabled={index === 0}
                        aria-label={`${item.name} を上へ移動`}
                      >
                        <Icon name="arrow-up" size={16} />
                      </button>
                      <span className="image-card-index">{index + 1}</span>
                      <button
                        type="button"
                        className="icon-button"
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
                        className="icon-button"
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
          </div>
        </section>

        <section className="tool-panel solid-shadow">
          <div className="panel-heading">
            <span className="panel-heading__number">2</span>
            <div className="panel-heading__copy">
              <h2>プレビュー</h2>
              <p>仕上がりサイズを確認して、そのまま保存できます。</p>
            </div>
          </div>

          <div className="summary-grid" aria-label="現在の状態">
            <div className="summary-card">
              <span className="summary-card__label">画像</span>
              <strong>{items.length}枚</strong>
            </div>
            <div className="summary-card">
              <span className="summary-card__label">配置</span>
              <strong>{directionLabel}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-card__label">出力サイズ</span>
              <strong>{previewSizeLabel}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-card__label">背景色</span>
              <strong>{backgroundLabel}</strong>
            </div>
          </div>

          {previewError && <p className="error-banner">{previewError}</p>}

          <div className="panel-surface preview-surface">
            <div className="subsection-header subsection-header--preview">
              <div className="title-with-icon">
                <Icon name="eye" size={18} />
                <h3>仕上がり</h3>
              </div>
              <button
                type="button"
                className="action-button toy-btn"
                onClick={() => void handleDownload()}
                disabled={!canDownload}
              >
                <span className="action-button__label">この設定で保存</span>
                <span className="action-button__icon" aria-hidden="true">
                  <Icon name="arrow-right" size={16} />
                </span>
              </button>
            </div>

            <div className="preview-stage">
              {items.length === 0 ? (
                <div className="preview-placeholder">
                  <Icon name="image" className="empty-icon" size={32} />
                  <h3>画像がありません</h3>
                  <p>左側から画像を追加すると、ここに仕上がりが表示されます。</p>
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

      <footer className="tips-panel solid-shadow">
        <div className="tips-panel__orb" aria-hidden="true" />
        <h2 className="tips-panel__heading">使い方のヒント</h2>
        <div className="tips-grid">
          <article className="tip-card">
            <span className="tip-card__icon" aria-hidden="true">
              <Icon name="upload" size={18} />
            </span>
            <div className="tip-card__copy">
              <h3>まとめて追加</h3>
              <p>複数画像を一度に入れて、あとから順番を整えられます。</p>
            </div>
          </article>
          <article className="tip-card">
            <span className="tip-card__icon" aria-hidden="true">
              <Icon name="more-horizontal" size={18} />
            </span>
            <div className="tip-card__copy">
              <h3>間隔と背景色</h3>
              <p>透過画像を使うときは背景色を決めると仕上がりが安定します。</p>
            </div>
          </article>
          <article className="tip-card">
            <span className="tip-card__icon" aria-hidden="true">
              <Icon name="download" size={18} />
            </span>
            <div className="tip-card__copy">
              <h3>保存前に確認</h3>
              <p>サイズが大きすぎると保存できないので、警告が出たら設定を見直してください。</p>
            </div>
          </article>
        </div>
      </footer>
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
