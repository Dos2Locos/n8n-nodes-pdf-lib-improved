# n8n-nodes-pdf-lib

This is an n8n community node package. It lets you use PDF utilities in your n8n workflows.

PDF utilities for n8n allow you to extract information from PDF files and split PDFs into smaller documents, all within your workflow automation.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  
[Version history](#version-history)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

This package provides the following nodes:

- **Get PDF Info**: Extracts information from a PDF file, such as the page count. Input: binary PDF. Output: JSON with pageCount.
- **Split PDF**: Splits a PDF into chunks of pages. Input: binary PDF and chunk size (default 1). Output: multiple binary PDFs, each with the specified number of pages.

## Compatibility

- Requires n8n v1.0.0 or higher.
- Developed and tested with Node.js 20+.
- Uses the [pdf-lib](https://pdf-lib.js.org/) library for PDF processing.

## Usage

- **Get PDF Info**: Use this node to extract the number of pages from a PDF file. Pass the PDF as a binary property (default: `data`).
- **Split PDF**: Use this node to split a PDF into multiple files, each containing a specified number of pages. Set the chunk size as needed.

Both nodes expect the PDF input as a binary property. You can use n8n's built-in nodes to fetch or generate PDF files before processing them with these nodes.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [pdf-lib documentation](https://pdf-lib.js.org/)

## Version history

- 0.1.0: Initial release with GetPdfInfo and SplitPdf nodes.
