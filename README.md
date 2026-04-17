# PDF Page Reorder

Ever needed to rearrange the pages of a PDF and ended up fighting with some slow online tool that wants you to create an account first? This extension lets you do it right in your browser. Load the PDF, drag the pages around, and download the result. Your file never leaves your computer.

## How it works

When you open a PDF the extension renders thumbnail previews of every page so you can see what you are working with. From there you just drag pages to where you want them. When you are happy with the order you download the new PDF and you are done.

## How to install

Clone or download this repo, open Chrome and go to chrome://extensions, enable Developer Mode, click Load unpacked, and select this folder.

## Privacy

Everything runs locally in your browser using open source libraries. No file is ever uploaded to any server. You do not need an account. There are no file size limits imposed by a backend because there is no backend.

## Open source libraries used

PDF.js from Mozilla handles rendering the page previews. pdf-lib handles reading and rebuilding the PDF with the new page order. SortableJS powers the drag and drop interface. All three are open source.

## Built with

Manifest V3, vanilla JavaScript and CSS, PDF.js, pdf-lib, and SortableJS.
