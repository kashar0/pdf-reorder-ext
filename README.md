# PDF Page Reorder

Rearrange the pages of any PDF file right in your browser. Load the file, drag the pages into the order you want, and download the result. Your file never leaves your computer.

## How it works

When you load a PDF the extension uses PDF.js to render a thumbnail preview of every page at reduced scale. The thumbnails are displayed in a grid and made draggable using SortableJS. You drag pages to their new positions with a smooth 150ms animation and a ghost element showing where the page will land. When you are happy with the order you click Save and pdf-lib reads the original file bytes, builds a new PDF document with the pages copied in your chosen order, and triggers a download of the result as reordered.pdf.

The entire process happens inside the browser. There is no server involved, no file size limit imposed by a backend, and no account required.

## How to install

Clone or download this repo, open Chrome and go to chrome://extensions, enable Developer Mode, click Load unpacked, and select this folder.

## Open source libraries

PDF.js from Mozilla renders the page previews. It is released under the Apache 2.0 license. pdf-lib handles loading the original PDF bytes and producing the reordered output. It is released under the MIT license. SortableJS powers the drag and drop interaction. It is also MIT licensed.

## Permissions

The extension only requests the storage permission to remember user preferences. No other permissions are needed because everything runs locally.
