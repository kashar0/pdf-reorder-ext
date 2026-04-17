const input = document.getElementById("pdfUpload")
const previewContainer = document.getElementById("previewContainer")
const saveBtn = document.getElementById("saveBtn")

let originalPdfBytes = null

input.addEventListener("change", async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const buffer = await file.arrayBuffer()
  originalPdfBytes = buffer

  const loadingTask = pdfjsLib.getDocument({ data: buffer })
  const pdf = await loadingTask.promise

  previewContainer.innerHTML = ""

  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1)

    const viewport = page.getViewport({ scale: 0.3 })
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    canvas.height = viewport.height
    canvas.width = viewport.width

    const div = document.createElement("div")
    div.className = "page-thumbnail"
    div.setAttribute("data-page-index", i)
    div.appendChild(canvas)
    previewContainer.appendChild(div)

    await page.render({ canvasContext: context, viewport: viewport }).promise
  }

  Sortable.create(previewContainer, {
    animation: 150,
    ghostClass: "sortable-ghost"
  })

  saveBtn.disabled = false
})

saveBtn.addEventListener("click", async () => {
  const originalPdf = await PDFLib.PDFDocument.load(originalPdfBytes)
  const newPdf = await PDFLib.PDFDocument.create()

  const order = Array.from(previewContainer.children).map(
    div => parseInt(div.getAttribute("data-page-index"))
  )

  const pages = await newPdf.copyPages(originalPdf, order)
  pages.forEach(p => newPdf.addPage(p))

  const newPdfBytes = await newPdf.save()
  const blob = new Blob([newPdfBytes], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = "reordered.pdf"
  a.click()
  URL.revokeObjectURL(url)
})
