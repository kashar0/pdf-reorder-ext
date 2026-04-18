/* ── PDF.js worker ──────────────────────────────────────── */
pdfjsLib.GlobalWorkerOptions.workerSrc =
  typeof chrome !== 'undefined' && chrome.runtime
    ? chrome.runtime.getURL('libs/pdf.worker.min.js')
    : 'libs/pdf.worker.min.js'

/* ── DOM refs ───────────────────────────────────────────── */
const uploadZone       = document.getElementById('uploadZone')
const pdfUpload        = document.getElementById('pdfUpload')
const fileBar          = document.getElementById('fileBar')
const fileNameEl       = document.getElementById('fileName')
const pageCountBadge   = document.getElementById('pageCountBadge')
const clearBtn         = document.getElementById('clearBtn')
const loadingState     = document.getElementById('loadingState')
const loadingText      = document.getElementById('loadingText')
const previewContainer = document.getElementById('previewContainer')
const actionBar        = document.getElementById('actionBar')
const resetBtn         = document.getElementById('resetBtn')
const saveBtn          = document.getElementById('saveBtn')
const toastEl          = document.getElementById('toast')

/* ── State ──────────────────────────────────────────────── */
let originalPdfBytes  = null
let originalFileName  = ''
let sortableInstance  = null
let toastTimer        = null

/* ── Helpers ────────────────────────────────────────────── */
const showEl = (...els) => els.forEach(e => e.classList.remove('hidden'))
const hideEl = (...els) => els.forEach(e => e.classList.add('hidden'))

function showToast(message, duration = 2800) {
  clearTimeout(toastTimer)
  toastEl.textContent = message
  toastEl.classList.add('show')
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), duration)
}

function updatePageNumbers() {
  Array.from(previewContainer.children).forEach((thumb, i) => {
    const numEl = thumb.querySelector('.thumb-num')
    if (numEl) numEl.textContent = i + 1
  })
}

function truncate(name, max = 32) {
  return name.length > max ? name.slice(0, max - 1) + '…' : name
}

/* ── Upload Zone — drag & drop ──────────────────────────── */
uploadZone.addEventListener('dragover', e => {
  e.preventDefault()
  uploadZone.classList.add('dragover')
})

uploadZone.addEventListener('dragleave', e => {
  if (!uploadZone.contains(e.relatedTarget)) {
    uploadZone.classList.remove('dragover')
  }
})

uploadZone.addEventListener('drop', e => {
  e.preventDefault()
  uploadZone.classList.remove('dragover')
  const file = e.dataTransfer?.files?.[0]
  if (file?.type === 'application/pdf') {
    processPdf(file)
  } else if (file) {
    showToast('Please drop a valid PDF file')
  }
})

/* File input change */
pdfUpload.addEventListener('change', e => {
  const file = e.target.files?.[0]
  if (file) processPdf(file)
  e.target.value = '' // allow re-selecting the same file
})

/* ── Clear / Reset ──────────────────────────────────────── */
clearBtn.addEventListener('click', resetAll)

function resetAll() {
  originalPdfBytes = null
  originalFileName = ''
  if (sortableInstance) {
    sortableInstance.destroy()
    sortableInstance = null
  }
  previewContainer.innerHTML = ''
  hideEl(fileBar, loadingState, previewContainer, actionBar)
  showEl(uploadZone)
}

/* ── Reset Order ────────────────────────────────────────── */
resetBtn.addEventListener('click', () => {
  const thumbs = Array.from(previewContainer.children)
  thumbs.sort((a, b) =>
    parseInt(a.dataset.originalIndex) - parseInt(b.dataset.originalIndex)
  )
  thumbs.forEach(t => previewContainer.appendChild(t))
  updatePageNumbers()
  showToast('Order reset to original')
})

/* ── Export PDF ─────────────────────────────────────────── */
saveBtn.addEventListener('click', async () => {
  if (!originalPdfBytes) return

  saveBtn.disabled = true
  const savedHTML = saveBtn.innerHTML
  saveBtn.innerHTML = '<span style="font-size:13px;font-weight:600">Exporting…</span>'

  try {
    const originalPdf = await PDFLib.PDFDocument.load(originalPdfBytes)
    const newPdf = await PDFLib.PDFDocument.create()

    const order = Array.from(previewContainer.children).map(div =>
      parseInt(div.dataset.originalIndex)
    )

    const pages = await newPdf.copyPages(originalPdf, order)
    pages.forEach(p => newPdf.addPage(p))

    const newPdfBytes = await newPdf.save()
    const blob = new Blob([newPdfBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = originalFileName.replace(/\.pdf$/i, '_reordered.pdf')
    a.click()
    URL.revokeObjectURL(url)

    showToast('✓ PDF exported successfully')
  } catch (err) {
    showToast('Export failed — please try again')
    console.error(err)
  } finally {
    saveBtn.disabled = false
    saveBtn.innerHTML = savedHTML
  }
})

/* ── Process PDF ────────────────────────────────────────── */
async function processPdf(file) {
  originalFileName = file.name
  originalPdfBytes = await file.arrayBuffer()

  hideEl(uploadZone)
  showEl(loadingState)
  loadingText.textContent = 'Loading PDF…'

  try {
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(originalPdfBytes) }).promise
    const total = pdf.numPages

    fileNameEl.textContent = truncate(file.name)
    pageCountBadge.textContent = `${total} page${total !== 1 ? 's' : ''}`

    previewContainer.innerHTML = ''

    for (let i = 0; i < total; i++) {
      loadingText.textContent = `Rendering page ${i + 1} of ${total}…`

      const page = await pdf.getPage(i + 1)
      const viewport = page.getViewport({ scale: 0.35 })

      const canvas = document.createElement('canvas')
      canvas.height = viewport.height
      canvas.width  = viewport.width
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise

      const numEl = document.createElement('div')
      numEl.className = 'thumb-num'
      numEl.textContent = i + 1

      const delBtn = document.createElement('button')
      delBtn.className = 'thumb-delete'
      delBtn.title = `Remove page ${i + 1}`
      delBtn.setAttribute('aria-label', `Remove page ${i + 1}`)
      delBtn.textContent = '×'

      const thumb = document.createElement('div')
      thumb.className = 'page-thumb'
      thumb.dataset.originalIndex = i
      thumb.appendChild(canvas)
      thumb.appendChild(numEl)
      thumb.appendChild(delBtn)

      delBtn.addEventListener('click', e => {
        e.stopPropagation()
        deletePage(thumb)
      })

      previewContainer.appendChild(thumb)
    }

    /* Init Sortable — destroy previous instance first */
    if (sortableInstance) sortableInstance.destroy()
    sortableInstance = Sortable.create(previewContainer, {
      animation: 200,
      ghostClass: 'thumb-ghost',
      chosenClass: 'thumb-chosen',
      onEnd: updatePageNumbers,
    })

    hideEl(loadingState)
    showEl(fileBar, previewContainer, actionBar)

  } catch (err) {
    hideEl(loadingState)
    showEl(uploadZone)
    const msg = err.message?.includes('password')
      ? 'This PDF is password-protected'
      : 'Could not read PDF — is it corrupted?'
    showToast(msg)
    console.error(err)
    originalPdfBytes = null
  }
}

/* ── Delete Page ────────────────────────────────────────── */
function deletePage(thumb) {
  thumb.style.transition = 'transform 0.14s ease, opacity 0.14s ease'
  thumb.style.transform = 'scale(0.85)'
  thumb.style.opacity = '0'
  setTimeout(() => {
    thumb.remove()
    updatePageNumbers()
    const remaining = previewContainer.children.length
    pageCountBadge.textContent = `${remaining} page${remaining !== 1 ? 's' : ''}`
    if (remaining === 0) resetAll()
  }, 145)
}
