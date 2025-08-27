import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
const { PDFDocument } = require('../../lib/pdf-lib/pdf-lib.min.js');
import { Buffer } from 'buffer';
const fs = require('fs');

export class PdfLib implements INodeType {
	/**
	 * Parse page ranges string into array of page numbers
	 * Examples: "1-3,5,7-10" -> [1,2,3,5,7,8,9,10]
	 */
	static parsePageRanges(rangesString: string, totalPages: number): { pages?: number[]; error?: string } {
		const pages: number[] = [];
		const ranges = rangesString.split(',').map(range => range.trim());
		
		for (const range of ranges) {
			if (range.includes('-')) {
				// Handle range like "1-3" or "7-10"
				const [start, end] = range.split('-').map(n => parseInt(n.trim()));
				if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
					return { error: `Invalid page range: ${range}. Pages must be between 1 and ${totalPages}` };
				}
				for (let i = start; i <= end; i++) {
					pages.push(i);
				}
			} else {
				// Handle single page like "5"
				const page = parseInt(range);
				if (isNaN(page) || page < 1 || page > totalPages) {
					return { error: `Invalid page number: ${range}. Pages must be between 1 and ${totalPages}` };
				}
				pages.push(page);
			}
		}
		
		// Remove duplicates and sort
		return { pages: [...new Set(pages)].sort((a, b) => a - b) };
	}

	/**
	 * Group consecutive pages into ranges for better organization
	 * Examples: [1,2,3,5,7,8,9,10] -> [[1,2,3], [5], [7,8,9,10]]
	 */
	static groupConsecutivePages(pages: number[]): number[][] {
		if (pages.length === 0) return [];
		
		const groups: number[][] = [];
		let currentGroup = [pages[0]];
		
		for (let i = 1; i < pages.length; i++) {
			if (pages[i] === pages[i-1] + 1) {
				// Consecutive page
				currentGroup.push(pages[i]);
			} else {
				// Non-consecutive, start new group
				groups.push(currentGroup);
				currentGroup = [pages[i]];
			}
		}
		groups.push(currentGroup);
		
		return groups;
	}

	description: INodeTypeDescription = {
		displayName: 'PDF-LIB',
		name: 'pdfLib',
		icon: 'file:PdfLib.svg',
		group: ['transform'],
		version: 1,
		description: 'Perform operations on PDF files (get info, split)',
		defaults: {
			name: 'PDF-LIB',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Get PDF Info',
						value: 'getInfo',
						description: 'Extract information from a PDF file',
						action: 'Get information from a PDF file',
					},
					{
						name: 'Split PDF',
						value: 'split',
						description: 'Split a PDF into chunks of pages',
						action: 'Split a PDF into chunks of pages',
					},
				],
				default: 'getInfo',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				description: 'Name of the binary property containing the PDF file',
				displayOptions: {
					show: {
						operation: ['getInfo', 'split'],
					},
				},
			},
			{
				displayName: 'Split Mode',
				name: 'splitMode',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'By Chunk Size',
						value: 'chunkSize',
						description: 'Split PDF into chunks of equal page size',
					},
					{
						name: 'By Page Ranges',
						value: 'pageRanges',
						description: 'Split PDF using specific page ranges',
					},
				],
				default: 'chunkSize',
				displayOptions: {
					show: {
						operation: ['split'],
					},
				},
			},
			{
				displayName: 'Chunk Size',
				name: 'chunkSize',
				type: 'number',
				default: 1,
				description: 'Number of pages per chunk',
				displayOptions: {
					show: {
						operation: ['split'],
						splitMode: ['chunkSize'],
					},
				},
			},
			{
				displayName: 'Page Ranges',
				name: 'pageRanges',
				type: 'string',
				default: '1-3,5,7-10',
				placeholder: '1-3,5,7-10',
				description: 'Comma-separated list of page ranges. Examples: "1-3,5,7-10" or "1,3,5" or "2-5".',
				displayOptions: {
					show: {
						operation: ['split'],
						splitMode: ['pageRanges'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			let pdfDoc;
			let fileBytes;
			let debugInfo = {};

			try {
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				const binaryPropertyName = this.getNodeParameter(
					'binaryPropertyName',
					itemIndex,
					'data',
				) as string;
				const item = items[itemIndex];

				if (!item.binary || !item.binary[binaryPropertyName]) {
					throw new NodeOperationError(
						this.getNode(),
						`No binary data property '${binaryPropertyName}' found on item`,
						{ itemIndex },
					);
				}

				// Get file bytes
				try {
					// Try to get file bytes from filesystem
					const binaryData = item.binary[binaryPropertyName];
					const filePath = `${binaryData.directory}/${binaryData.fileName}`;
					fileBytes = fs.readFileSync(filePath);
					pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
				} catch (filesystemError) {
					// Try to get file bytes from binary data buffer
					try {
						fileBytes = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
						pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
					} catch (binaryError) {
						throw new NodeOperationError(
							this.getNode(),
							`Failed to load PDF from both filesystem and binary data. Filesystem error: ${filesystemError.message}, Binary error: ${binaryError.message}`,
							{ itemIndex },
						);
					}
				}

				switch (operation) {
					case 'getInfo':
						// Get PDF Info operation
						const pageCount = pdfDoc.getPageCount();
						returnData.push({
							json: {
								pageCount,
								operation: 'getInfo',
								fileName: item.binary[binaryPropertyName].fileName || 'unknown.pdf',
							},
							pairedItem: itemIndex,
						});
						break;

					case 'split':
						// Split PDF operation
						const splitMode = this.getNodeParameter('splitMode', itemIndex, 'chunkSize') as string;
						const totalPages = pdfDoc.getPageCount();
						const pdfChunks: { data: string; pageRange: string }[] = [];

						if (splitMode === 'chunkSize') {
							// Original chunk-based splitting
							const chunkSize = this.getNodeParameter('chunkSize', itemIndex, 1) as number;
							
							for (let i = 0; i < totalPages; i += chunkSize) {
								const newPdf = await PDFDocument.create();
								const end = Math.min(i + chunkSize, totalPages);
								const copiedPages = await newPdf.copyPages(
									pdfDoc,
									Array.from({ length: end - i }, (_, idx) => i + idx),
								);
								copiedPages.forEach((page: any) => newPdf.addPage(page));
								const newPdfBytes = await newPdf.save();
								pdfChunks.push({
									data: Buffer.from(newPdfBytes).toString('base64'),
									pageRange: `${i + 1}-${end}`,
								});
							}
						} else if (splitMode === 'pageRanges') {
							// New range-based splitting
							const pageRangesString = this.getNodeParameter('pageRanges', itemIndex, '1') as string;
							
							// Parse and validate page ranges
							const parseResult = PdfLib.parsePageRanges(pageRangesString, totalPages);
							if (parseResult.error) {
								throw new NodeOperationError(
									this.getNode(),
									parseResult.error,
									{ itemIndex },
								);
							}
							
							const requestedPages = parseResult.pages!;
							
							// Group consecutive pages into ranges
							const pageGroups = PdfLib.groupConsecutivePages(requestedPages);
							
							// Create a PDF for each group
							for (const group of pageGroups) {
								const newPdf = await PDFDocument.create();
								
								// Convert 1-based page numbers to 0-based indices
								const pageIndices = group.map((page: number) => page - 1);
								
								const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
								copiedPages.forEach((page: any) => newPdf.addPage(page));
								
								const newPdfBytes = await newPdf.save();
								
								// Create readable page range string
								const rangeStr = group.length === 1 ? 
									`${group[0]}` : 
									`${group[0]}-${group[group.length - 1]}`;
								
								pdfChunks.push({
									data: Buffer.from(newPdfBytes).toString('base64'),
									pageRange: rangeStr,
								});
							}
						}

						returnData.push({
							json: {
								count: pdfChunks.length,
								pageRanges: pdfChunks.map((c) => c.pageRange),
								operation: 'split',
								splitMode,
								originalFileName: item.binary[binaryPropertyName].fileName || 'unknown.pdf',
							},
							binary: pdfChunks.reduce(
								(acc, chunk, idx) => {
									// Create more descriptive file names based on split mode
									const baseFileName = item.binary?.[binaryPropertyName]?.fileName?.replace('.pdf', '') || 'split';
									const fileName = splitMode === 'pageRanges' ? 
										`${baseFileName}_pages_${chunk.pageRange}.pdf` :
										`${baseFileName}_chunk_${idx + 1}.pdf`;
									
									acc[`pdf${idx + 1}`] = {
										data: chunk.data,
										fileName,
										mimeType: 'application/pdf',
									};
									return acc;
								},
								{} as Record<string, { data: string; fileName: string; mimeType: string }>,
							),
							pairedItem: itemIndex,
						});
						break;
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
							debugInfo: {
								...debugInfo,
								fileBytes,
							},
						},
						pairedItem: itemIndex,
					});
				} else {
					throw new NodeOperationError(this.getNode(), error, { itemIndex });
				}
			}
		}
		return [returnData];
	}
}
