import type { RenderPlan } from './lib/layout'

export type Locale = 'en' | 'ja' | 'ko' | 'zh-Hans' | 'vi' | 'id'

type AppStrings = {
  pageTitle: string
  languageLabel: string
  topPageAria: string
  headerSummary: string
  settingsTitle: string
  settingsDescription: string
  addImagesTitle: string
  imageCount: (count: number) => string
  dropzoneTitle: string
  dropzoneCopy: string
  appearanceTitle: string
  directionCaption: string
  directionHorizontal: string
  directionVertical: string
  normalizeLabelHorizontal: string
  normalizeLabelVertical: string
  normalizeSummaryOn: string
  normalizeSummaryOff: string
  gapLabel: string
  backgroundColorLabel: string
  invalidHex: string
  exportFormatLabel: string
  imageListTitle: string
  clearLabel: string
  imageListEmpty: string
  uploadedImagesAria: string
  moveUp: (name: string) => string
  moveDown: (name: string) => string
  removeItem: (name: string) => string
  deleteTitle: string
  previewTitle: string
  previewDescription: string
  currentStateAria: string
  summaryImages: string
  summaryLayout: string
  summaryOutputSize: string
  summaryBackground: string
  outputSizePending: string
  canvasTooLargeEdge: (max: number) => string
  canvasTooLargeArea: string
  resultTitle: string
  saveCurrentLabel: string
  noImagesTitle: string
  noImagesBody: string
  tipsHeading: string
  tipAddTitle: string
  tipAddBody: string
  tipGapTitle: string
  tipGapBody: string
  tipSaveTitle: string
  tipSaveBody: string
  previewMobileLabel: string
  previewDesktopLabel: string
}

export type LocaleOption = {
  flagCode: string
  label: string
  value: Locale
}

const APP_ORIGIN = 'https://zoochigames.com'
const STORAGE_KEY = 'auto-image-layout.locale'
const MAX_CANVAS_EDGE = 16384
const MAX_CANVAS_AREA = 134_217_728

const TOP_PAGE_PATH_BY_LOCALE: Record<Locale, string> = {
  en: '/index.en.html',
  ja: '/index.html',
  ko: '/index.ko.html',
  'zh-Hans': '/index.zh-Hans.html',
  vi: '/index.vi.html',
  id: '/index.id.html',
}

export const LOCALE_OPTIONS: LocaleOption[] = [
  { value: 'en', label: 'EN', flagCode: 'us' },
  { value: 'ja', label: 'JA', flagCode: 'jp' },
  { value: 'ko', label: 'KO', flagCode: 'kr' },
  { value: 'zh-Hans', label: 'ZH', flagCode: 'cn' },
  { value: 'vi', label: 'VI', flagCode: 'vn' },
  { value: 'id', label: 'ID', flagCode: 'id' },
]

export const STRINGS: Record<Locale, AppStrings> = {
  en: {
    pageTitle: 'Auto Image Layout',
    languageLabel: 'Language',
    topPageAria: 'Go to the ZOOCHI top page',
    headerSummary: 'Combine multiple images into one file',
    settingsTitle: 'Settings & images',
    settingsDescription: 'Add images, reorder them, and prepare the export settings here.',
    addImagesTitle: 'Add images',
    imageCount: (count) => `${count} image${count === 1 ? '' : 's'}`,
    dropzoneTitle: 'Drag and drop, or click to choose files',
    dropzoneCopy: 'You can add multiple images at once.',
    appearanceTitle: 'Adjust the look',
    directionCaption: 'Layout direction',
    directionHorizontal: 'Horizontal',
    directionVertical: 'Vertical',
    normalizeLabelHorizontal: 'Match height',
    normalizeLabelVertical: 'Match width',
    normalizeSummaryOn: 'Align automatically',
    normalizeSummaryOff: 'Keep original ratios',
    gapLabel: 'Gap',
    backgroundColorLabel: 'Background',
    invalidHex: 'Enter a color as #RGB or #RRGGBB.',
    exportFormatLabel: 'Export format',
    imageListTitle: 'Image list',
    clearLabel: 'Clear',
    imageListEmpty: 'Your uploaded images will appear here.',
    uploadedImagesAria: 'Uploaded images',
    moveUp: (name) => `Move ${name} up`,
    moveDown: (name) => `Move ${name} down`,
    removeItem: (name) => `Remove ${name}`,
    deleteTitle: 'Remove',
    previewTitle: 'Preview',
    previewDescription: 'Check the output size and save it right away.',
    currentStateAria: 'Current output state',
    summaryImages: 'Images',
    summaryLayout: 'Layout',
    summaryOutputSize: 'Output size',
    summaryBackground: 'Background',
    outputSizePending: 'Size pending',
    canvasTooLargeEdge: (max) => `Output size is too large. Keep the longest edge within ${max}px.`,
    canvasTooLargeArea: 'The total pixel count is too large to render safely in the browser.',
    resultTitle: 'Result',
    saveCurrentLabel: 'Save with these settings',
    noImagesTitle: 'No images yet',
    noImagesBody: 'Add images from the left side to preview the result here.',
    tipsHeading: 'Tips',
    tipAddTitle: 'Add in batches',
    tipAddBody: 'Drop in several images at once, then fine-tune the order afterward.',
    tipGapTitle: 'Gap and background',
    tipGapBody: 'When working with transparent images, set a background color for stable results.',
    tipSaveTitle: 'Check before saving',
    tipSaveBody: 'If the size is too large to export, adjust the settings when the warning appears.',
    previewMobileLabel: 'Mobile',
    previewDesktopLabel: 'PC',
  },
  ja: {
    pageTitle: 'Auto Image Layout',
    languageLabel: '言語',
    topPageAria: 'ZOOCHIのトップページへ',
    headerSummary: '複数画像を1枚に連結して保存',
    settingsTitle: '設定と画像',
    settingsDescription: '追加、並び替え、書き出し設定をここで整えます。',
    addImagesTitle: '画像を追加',
    imageCount: (count) => `${count}枚`,
    dropzoneTitle: 'ドラッグ&ドロップ、またはクリックして選択',
    dropzoneCopy: '複数画像をまとめて追加できます。',
    appearanceTitle: '見た目を決める',
    directionCaption: '並び方向',
    directionHorizontal: '横並び',
    directionVertical: '縦並び',
    normalizeLabelHorizontal: '高さを揃える',
    normalizeLabelVertical: '幅を揃える',
    normalizeSummaryOn: '自動で揃える',
    normalizeSummaryOff: '元の比率を保つ',
    gapLabel: '間隔',
    backgroundColorLabel: '背景色',
    invalidHex: '#RGB または #RRGGBB で入力してください。',
    exportFormatLabel: '書き出し形式',
    imageListTitle: '画像一覧',
    clearLabel: 'クリア',
    imageListEmpty: '画像を追加するとここに一覧が表示されます。',
    uploadedImagesAria: 'アップロード画像一覧',
    moveUp: (name) => `${name} を上へ移動`,
    moveDown: (name) => `${name} を下へ移動`,
    removeItem: (name) => `${name} を削除`,
    deleteTitle: '削除',
    previewTitle: 'プレビュー',
    previewDescription: '仕上がりサイズを確認して、そのまま保存できます。',
    currentStateAria: '現在の状態',
    summaryImages: '画像',
    summaryLayout: '配置',
    summaryOutputSize: '出力サイズ',
    summaryBackground: '背景色',
    outputSizePending: 'サイズ未確定',
    canvasTooLargeEdge: (max) => `出力サイズが大きすぎます。最大辺は ${max}px までにしてください。`,
    canvasTooLargeArea: '出力ピクセル数が大きすぎるため、ブラウザで安全にレンダリングできません。',
    resultTitle: '仕上がり',
    saveCurrentLabel: 'この設定で保存',
    noImagesTitle: '画像がありません',
    noImagesBody: '左側から画像を追加すると、ここに仕上がりが表示されます。',
    tipsHeading: '使い方のヒント',
    tipAddTitle: 'まとめて追加',
    tipAddBody: '複数画像を一度に入れて、あとから順番を整えられます。',
    tipGapTitle: '間隔と背景色',
    tipGapBody: '透過画像を使うときは背景色を決めると仕上がりが安定します。',
    tipSaveTitle: '保存前に確認',
    tipSaveBody: 'サイズが大きすぎると保存できないので、警告が出たら設定を見直してください。',
    previewMobileLabel: 'Mobile',
    previewDesktopLabel: 'PC',
  },
  ko: {
    pageTitle: 'Auto Image Layout',
    languageLabel: '언어',
    topPageAria: 'ZOOCHI 상단 페이지로 이동',
    headerSummary: '여러 이미지를 한 장으로 합쳐 저장',
    settingsTitle: '설정과 이미지',
    settingsDescription: '이미지를 추가하고 순서를 바꾸고, 저장 설정을 여기에서 정리합니다.',
    addImagesTitle: '이미지 추가',
    imageCount: (count) => `${count}장`,
    dropzoneTitle: '드래그 앤 드롭 또는 클릭해서 선택',
    dropzoneCopy: '여러 이미지를 한 번에 추가할 수 있습니다.',
    appearanceTitle: '표시 방식 설정',
    directionCaption: '배치 방향',
    directionHorizontal: '가로',
    directionVertical: '세로',
    normalizeLabelHorizontal: '높이 맞추기',
    normalizeLabelVertical: '너비 맞추기',
    normalizeSummaryOn: '자동으로 맞춤',
    normalizeSummaryOff: '원본 비율 유지',
    gapLabel: '간격',
    backgroundColorLabel: '배경색',
    invalidHex: '#RGB 또는 #RRGGBB 형식으로 입력하세요.',
    exportFormatLabel: '저장 형식',
    imageListTitle: '이미지 목록',
    clearLabel: '지우기',
    imageListEmpty: '이미지를 추가하면 이곳에 목록이 표시됩니다.',
    uploadedImagesAria: '업로드한 이미지 목록',
    moveUp: (name) => `${name} 위로 이동`,
    moveDown: (name) => `${name} 아래로 이동`,
    removeItem: (name) => `${name} 삭제`,
    deleteTitle: '삭제',
    previewTitle: '미리보기',
    previewDescription: '완성 크기를 확인하고 바로 저장할 수 있습니다.',
    currentStateAria: '현재 상태',
    summaryImages: '이미지',
    summaryLayout: '배치',
    summaryOutputSize: '출력 크기',
    summaryBackground: '배경색',
    outputSizePending: '크기 미정',
    canvasTooLargeEdge: (max) => `출력 크기가 너무 큽니다. 긴 변을 ${max}px 이하로 줄여 주세요.`,
    canvasTooLargeArea: '총 픽셀 수가 너무 커서 브라우저에서 안전하게 렌더링할 수 없습니다.',
    resultTitle: '결과',
    saveCurrentLabel: '이 설정으로 저장',
    noImagesTitle: '아직 이미지가 없습니다',
    noImagesBody: '왼쪽에서 이미지를 추가하면 여기에 결과가 표시됩니다.',
    tipsHeading: '사용 팁',
    tipAddTitle: '한 번에 추가',
    tipAddBody: '여러 이미지를 한 번에 넣고 나중에 순서를 정리할 수 있습니다.',
    tipGapTitle: '간격과 배경색',
    tipGapBody: '투명 이미지를 쓸 때는 배경색을 정하면 결과가 더 안정적입니다.',
    tipSaveTitle: '저장 전 확인',
    tipSaveBody: '크기가 너무 크면 저장할 수 없으니 경고가 나오면 설정을 조정하세요.',
    previewMobileLabel: 'Mobile',
    previewDesktopLabel: 'PC',
  },
  'zh-Hans': {
    pageTitle: 'Auto Image Layout',
    languageLabel: '语言',
    topPageAria: '前往 ZOOCHI 顶部页面',
    headerSummary: '把多张图片合成为一张保存',
    settingsTitle: '设置与图片',
    settingsDescription: '在这里添加图片、调整顺序并整理导出设置。',
    addImagesTitle: '添加图片',
    imageCount: (count) => `${count} 张`,
    dropzoneTitle: '拖放到此处，或点击选择文件',
    dropzoneCopy: '可以一次添加多张图片。',
    appearanceTitle: '调整外观',
    directionCaption: '排列方向',
    directionHorizontal: '横向',
    directionVertical: '纵向',
    normalizeLabelHorizontal: '统一高度',
    normalizeLabelVertical: '统一宽度',
    normalizeSummaryOn: '自动对齐',
    normalizeSummaryOff: '保留原始比例',
    gapLabel: '间距',
    backgroundColorLabel: '背景色',
    invalidHex: '请输入 #RGB 或 #RRGGBB 格式。',
    exportFormatLabel: '导出格式',
    imageListTitle: '图片列表',
    clearLabel: '清空',
    imageListEmpty: '添加图片后，列表会显示在这里。',
    uploadedImagesAria: '已上传图片列表',
    moveUp: (name) => `将 ${name} 上移`,
    moveDown: (name) => `将 ${name} 下移`,
    removeItem: (name) => `删除 ${name}`,
    deleteTitle: '删除',
    previewTitle: '预览',
    previewDescription: '确认输出尺寸后即可直接保存。',
    currentStateAria: '当前状态',
    summaryImages: '图片',
    summaryLayout: '排列',
    summaryOutputSize: '输出尺寸',
    summaryBackground: '背景色',
    outputSizePending: '尺寸未确定',
    canvasTooLargeEdge: (max) => `输出尺寸过大，请将最长边控制在 ${max}px 以内。`,
    canvasTooLargeArea: '总像素数过大，浏览器无法安全渲染。',
    resultTitle: '效果',
    saveCurrentLabel: '按当前设置保存',
    noImagesTitle: '还没有图片',
    noImagesBody: '从左侧添加图片后，这里会显示合成结果。',
    tipsHeading: '使用提示',
    tipAddTitle: '批量添加',
    tipAddBody: '可以一次加入多张图片，之后再调整顺序。',
    tipGapTitle: '间距与背景色',
    tipGapBody: '使用透明图片时，先设置背景色会更稳定。',
    tipSaveTitle: '保存前确认',
    tipSaveBody: '如果尺寸过大无法保存，出现警告后请调整设置。',
    previewMobileLabel: 'Mobile',
    previewDesktopLabel: 'PC',
  },
  vi: {
    pageTitle: 'Auto Image Layout',
    languageLabel: 'Ngôn ngữ',
    topPageAria: 'Đi tới trang chủ ZOOCHI',
    headerSummary: 'Ghép nhiều ảnh thành một ảnh duy nhất để lưu',
    settingsTitle: 'Thiết lập và hình ảnh',
    settingsDescription: 'Thêm ảnh, sắp xếp lại thứ tự và chuẩn bị cài đặt xuất tại đây.',
    addImagesTitle: 'Thêm ảnh',
    imageCount: (count) => `${count} ảnh`,
    dropzoneTitle: 'Kéo thả hoặc bấm để chọn tệp',
    dropzoneCopy: 'Bạn có thể thêm nhiều ảnh cùng lúc.',
    appearanceTitle: 'Điều chỉnh hiển thị',
    directionCaption: 'Hướng sắp xếp',
    directionHorizontal: 'Ngang',
    directionVertical: 'Dọc',
    normalizeLabelHorizontal: 'Căn đều chiều cao',
    normalizeLabelVertical: 'Căn đều chiều rộng',
    normalizeSummaryOn: 'Căn tự động',
    normalizeSummaryOff: 'Giữ tỉ lệ gốc',
    gapLabel: 'Khoảng cách',
    backgroundColorLabel: 'Màu nền',
    invalidHex: 'Nhập màu theo dạng #RGB hoặc #RRGGBB.',
    exportFormatLabel: 'Định dạng xuất',
    imageListTitle: 'Danh sách ảnh',
    clearLabel: 'Xóa hết',
    imageListEmpty: 'Khi thêm ảnh, danh sách sẽ xuất hiện ở đây.',
    uploadedImagesAria: 'Danh sách ảnh đã tải lên',
    moveUp: (name) => `Di chuyển ${name} lên trên`,
    moveDown: (name) => `Di chuyển ${name} xuống dưới`,
    removeItem: (name) => `Xóa ${name}`,
    deleteTitle: 'Xóa',
    previewTitle: 'Xem trước',
    previewDescription: 'Kiểm tra kích thước đầu ra và lưu ngay.',
    currentStateAria: 'Trạng thái hiện tại',
    summaryImages: 'Ảnh',
    summaryLayout: 'Bố cục',
    summaryOutputSize: 'Kích thước đầu ra',
    summaryBackground: 'Màu nền',
    outputSizePending: 'Chưa xác định kích thước',
    canvasTooLargeEdge: (max) => `Kích thước đầu ra quá lớn. Hãy giữ cạnh dài nhất trong ${max}px.`,
    canvasTooLargeArea: 'Tổng số pixel quá lớn để trình duyệt kết xuất an toàn.',
    resultTitle: 'Kết quả',
    saveCurrentLabel: 'Lưu với thiết lập này',
    noImagesTitle: 'Chưa có ảnh',
    noImagesBody: 'Thêm ảnh ở bên trái để xem kết quả tại đây.',
    tipsHeading: 'Mẹo sử dụng',
    tipAddTitle: 'Thêm hàng loạt',
    tipAddBody: 'Bạn có thể thêm nhiều ảnh cùng lúc rồi sắp xếp lại sau.',
    tipGapTitle: 'Khoảng cách và nền',
    tipGapBody: 'Khi dùng ảnh trong suốt, đặt màu nền trước sẽ cho kết quả ổn định hơn.',
    tipSaveTitle: 'Kiểm tra trước khi lưu',
    tipSaveBody: 'Nếu kích thước quá lớn để lưu, hãy điều chỉnh khi cảnh báo xuất hiện.',
    previewMobileLabel: 'Mobile',
    previewDesktopLabel: 'PC',
  },
  id: {
    pageTitle: 'Auto Image Layout',
    languageLabel: 'Bahasa',
    topPageAria: 'Buka halaman utama ZOOCHI',
    headerSummary: 'Gabungkan banyak gambar menjadi satu file',
    settingsTitle: 'Pengaturan & gambar',
    settingsDescription: 'Tambahkan gambar, atur ulang urutannya, dan siapkan pengaturan ekspor di sini.',
    addImagesTitle: 'Tambahkan gambar',
    imageCount: (count) => `${count} gambar`,
    dropzoneTitle: 'Seret dan lepas, atau klik untuk memilih file',
    dropzoneCopy: 'Anda dapat menambahkan beberapa gambar sekaligus.',
    appearanceTitle: 'Atur tampilan',
    directionCaption: 'Arah tata letak',
    directionHorizontal: 'Horizontal',
    directionVertical: 'Vertikal',
    normalizeLabelHorizontal: 'Samakan tinggi',
    normalizeLabelVertical: 'Samakan lebar',
    normalizeSummaryOn: 'Selaraskan otomatis',
    normalizeSummaryOff: 'Pertahankan rasio asli',
    gapLabel: 'Jarak',
    backgroundColorLabel: 'Warna latar',
    invalidHex: 'Masukkan warna dalam format #RGB atau #RRGGBB.',
    exportFormatLabel: 'Format ekspor',
    imageListTitle: 'Daftar gambar',
    clearLabel: 'Bersihkan',
    imageListEmpty: 'Daftar akan muncul di sini setelah gambar ditambahkan.',
    uploadedImagesAria: 'Daftar gambar yang diunggah',
    moveUp: (name) => `Pindahkan ${name} ke atas`,
    moveDown: (name) => `Pindahkan ${name} ke bawah`,
    removeItem: (name) => `Hapus ${name}`,
    deleteTitle: 'Hapus',
    previewTitle: 'Pratinjau',
    previewDescription: 'Periksa ukuran hasil dan simpan langsung.',
    currentStateAria: 'Status saat ini',
    summaryImages: 'Gambar',
    summaryLayout: 'Tata letak',
    summaryOutputSize: 'Ukuran hasil',
    summaryBackground: 'Latar',
    outputSizePending: 'Ukuran belum pasti',
    canvasTooLargeEdge: (max) => `Ukuran hasil terlalu besar. Pastikan sisi terpanjang tidak lebih dari ${max}px.`,
    canvasTooLargeArea: 'Jumlah piksel terlalu besar untuk dirender dengan aman di browser.',
    resultTitle: 'Hasil',
    saveCurrentLabel: 'Simpan dengan pengaturan ini',
    noImagesTitle: 'Belum ada gambar',
    noImagesBody: 'Tambahkan gambar dari sisi kiri untuk melihat hasil di sini.',
    tipsHeading: 'Tips penggunaan',
    tipAddTitle: 'Tambahkan sekaligus',
    tipAddBody: 'Masukkan beberapa gambar sekaligus lalu rapikan urutannya nanti.',
    tipGapTitle: 'Jarak dan latar',
    tipGapBody: 'Saat memakai gambar transparan, tetapkan warna latar agar hasil lebih stabil.',
    tipSaveTitle: 'Periksa sebelum menyimpan',
    tipSaveBody: 'Jika ukuran terlalu besar untuk disimpan, sesuaikan pengaturannya saat peringatan muncul.',
    previewMobileLabel: 'Mobile',
    previewDesktopLabel: 'PC',
  },
}

export function getTopPageHref(locale: Locale, isMobilePreview: boolean) {
  const url = new URL(TOP_PAGE_PATH_BY_LOCALE[locale], APP_ORIGIN)

  if (isMobilePreview) {
    url.searchParams.set('view', 'mobile')
  } else {
    url.searchParams.delete('view')
  }

  return url.toString()
}

export function resolveInitialLocale() {
  return (
    readLocaleFromLocation() ??
    readStoredLocale() ??
    readBrowserLocale() ??
    'ja'
  )
}

export function readLocaleFromLocation() {
  return normalizeLocale(new URLSearchParams(window.location.search).get('lang'))
}

export function syncLocaleState(locale: Locale, isMobilePreview: boolean, pageTitle: string) {
  document.documentElement.lang = locale
  document.title = pageTitle
  window.localStorage.setItem(STORAGE_KEY, locale)

  const url = new URL(window.location.href)

  url.searchParams.set('lang', locale)

  if (isMobilePreview) {
    url.searchParams.set('view', 'mobile')
  } else {
    url.searchParams.delete('view')
  }

  window.history.replaceState(null, '', url)
}

export function describeCanvasLimitForLocale(plan: RenderPlan, locale: Locale) {
  const strings = STRINGS[locale]

  if (plan.width > MAX_CANVAS_EDGE || plan.height > MAX_CANVAS_EDGE) {
    return strings.canvasTooLargeEdge(MAX_CANVAS_EDGE)
  }

  if (plan.width * plan.height > MAX_CANVAS_AREA) {
    return strings.canvasTooLargeArea
  }

  return null
}

function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) {
    return null
  }

  const normalized = value.trim()

  if (normalized === 'en' || normalized === 'ja' || normalized === 'ko' || normalized === 'vi' || normalized === 'id') {
    return normalized
  }

  if (normalized === 'zh-Hans' || normalized.toLowerCase() === 'zh' || normalized.toLowerCase() === 'zh-cn') {
    return 'zh-Hans'
  }

  return null
}

function readStoredLocale() {
  return normalizeLocale(window.localStorage.getItem(STORAGE_KEY))
}

function readBrowserLocale() {
  const candidates = [...(window.navigator.languages ?? []), window.navigator.language]

  for (const candidate of candidates) {
    const lowered = candidate.toLowerCase()

    if (lowered.startsWith('ja')) {
      return 'ja'
    }

    if (lowered.startsWith('ko')) {
      return 'ko'
    }

    if (lowered.startsWith('zh')) {
      return 'zh-Hans'
    }

    if (lowered.startsWith('vi')) {
      return 'vi'
    }

    if (lowered === 'id' || lowered.startsWith('id-')) {
      return 'id'
    }

    if (lowered.startsWith('en')) {
      return 'en'
    }
  }

  return null
}
