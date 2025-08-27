# n8n-nodes-pdf-lib

This is an n8n community node package. It lets you use PDF utilities in your n8n workflows.

PDF utilities for n8n allow you to extract information from PDF files and split PDFs into smaller documents, all within your workflow automation.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  
[Credits](#credits)  
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

This package provides the following node:

- **PDF-LIB**: A unified node that allows you to choose between different PDF operations:
  - **Get PDF Info**: Extracts comprehensive information from a PDF file including metadata, technical details, and page analysis
  - **Split PDF**: Splits a PDF into smaller documents with two modes:
    - **By Chunk Size**: Splits into chunks of a specified number of pages (default 1)
    - **By Page Ranges**: Splits based on specific page ranges (e.g., "1-3,5,7-10")

## Compatibility

- Requires n8n v1.0.0 or higher.
- Developed and tested with Node.js 20+.
- Uses the [pdf-lib](https://pdf-lib.js.org/) library for PDF processing.

## Usage

- **PDF-LIB**: Use this unified node to perform different PDF operations. Select the operation from the dropdown:
  - **Get PDF Info**: Extract comprehensive information from a PDF file. Pass the PDF as a binary property (default: `data`).
  - **Split PDF**: Split a PDF into smaller documents using one of two methods:
    - **By Chunk Size**: Enter a number to split the PDF into chunks of that many pages each
    - **By Page Ranges**: Enter specific page ranges in text format (e.g., "1-3,5,7-10") to create custom splits

### Get PDF Info - Detailed Output

The **Get PDF Info** operation extracts comprehensive information from PDF files and returns a structured JSON object with the following data:

#### Basic Information
- `pageCount`: Total number of pages in the PDF
- `fileName`: Name of the PDF file
- `fileSizeBytes`: File size in bytes
- `fileSizeMB`: File size in megabytes (rounded to 2 decimals)

#### Metadata
- `title`: Document title (if set)
- `author`: Document author (if set)
- `subject`: Document subject (if set)
- `creator`: Application that created the PDF (if set)
- `producer`: Application that produced the PDF (if set)
- `keywords`: Document keywords (if set)
- `creationDate`: When the document was created (ISO 8601 format)
- `modificationDate`: When the document was last modified (ISO 8601 format)

#### Technical Information
- `version`: PDF version (e.g., "1.4", "1.7")
- `isEncrypted`: Whether the PDF is password-protected
- `embeddedFonts`: Number of embedded fonts
- `hasImages`: Whether the PDF contains images
- `hasAnnotations`: Whether the PDF contains annotations/comments
- `hasAcroForm`: Whether the PDF contains interactive forms

#### Page Statistics
- `totalPages`: Total number of pages
- `landscapePages`: Number of pages in landscape orientation
- `portraitPages`: Number of pages in portrait orientation
- `rotatedPages`: Number of pages with non-zero rotation
- `hasUniformSize`: Whether all pages have the same dimensions
- `uniqueSizes`: Array of unique page sizes found in the document

#### Detailed Page Information
- `pageDetails`: Array with detailed information for each page:
  - `pageNumber`: Page number (1-indexed)
  - `width`: Page width in points
  - `height`: Page height in points
  - `orientation`: "portrait" or "landscape"
  - `rotation`: Rotation angle in degrees (0, 90, 180, or 270)

### Split PDF Page Ranges Format

When using the "By Page Ranges" option, you can specify pages using this format:
- Single pages: `5` (extracts page 5)
- Page ranges: `1-3` (extracts pages 1, 2, and 3)
- Multiple selections: `1-3,5,7-10` (extracts pages 1-3, page 5, and pages 7-10)
- Spaces are ignored: `1-3, 5, 7-10` works the same as `1-3,5,7-10`

The generated PDF files will be named descriptively based on the ranges (e.g., "pages-1-3.pdf", "pages-5.pdf", "pages-7-10.pdf").

The node expects the PDF input as a binary property. You can use n8n's built-in nodes to fetch or generate PDF files before processing them with this node.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [pdf-lib documentation](https://pdf-lib.js.org/)

## Credits

This project is based on the original [n8n-nodes-pdf-lib](https://github.com/vvcent/n8n-nodes-pdf-lib) by Vincent Wong. This improved version adds enhanced functionality including page ranges support for PDF splitting operations.

## Version history

- 0.3.0: **Major enhancement to Get PDF Info operation**. Now extracts comprehensive information including:
  - Complete metadata (title, author, subject, creator, producer, keywords, dates)
  - Technical details (PDF version, encryption status, embedded fonts, images, forms)
  - Page statistics (orientation counts, uniform sizing, rotation analysis)
  - Detailed per-page information (dimensions, orientation, rotation)
  - File size analysis
- 0.2.0: Added page ranges support to Split PDF operation. Now supports splitting by specific page ranges (e.g., "1-3,5,7-10") in addition to chunk size.
- 0.1.0: Initial release with GetPdfInfo and SplitPdf nodes.
