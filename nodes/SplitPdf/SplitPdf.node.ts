import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { PDFDocument } from 'pdf-lib';
import { Buffer } from 'buffer';

export class SplitPdf implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Split PDF',
		name: 'splitPdf',
		group: ['transform'],
		version: 1,
		description: 'Splits a PDF into chunks of pages',
		defaults: {
			name: 'Split PDF',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				description: 'Name of the binary property containing the PDF file',
			},
			{
				displayName: 'Chunk Size',
				name: 'chunkSize',
				type: 'number',
				default: 1,
				description: 'Number of pages per chunk',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex, 'data') as string;
				const chunkSize = this.getNodeParameter('chunkSize', itemIndex, 1) as number;
				const item = items[itemIndex];
				if (!item.binary || !item.binary[binaryPropertyName]) {
					throw new NodeOperationError(this.getNode(), `No binary data property '${binaryPropertyName}' found on item`, { itemIndex });
				}
				const pdfBuffer = Buffer.from(item.binary[binaryPropertyName].data, 'base64');
				const pdfDoc = await PDFDocument.load(pdfBuffer);
				const totalPages = pdfDoc.getPageCount();
				const pdfChunks: { data: string; pageRange: string }[] = [];

				for (let i = 0; i < totalPages; i += chunkSize) {
					const newPdf = await PDFDocument.create();
					const end = Math.min(i + chunkSize, totalPages);
					const copiedPages = await newPdf.copyPages(pdfDoc, Array.from({ length: end - i }, (_, idx) => i + idx));
					copiedPages.forEach((page) => newPdf.addPage(page));
					const newPdfBytes = await newPdf.save();
					pdfChunks.push({
						data: Buffer.from(newPdfBytes).toString('base64'),
						pageRange: `${i + 1}-${end}`,
					});
				}

				returnData.push({
					json: { count: pdfChunks.length, pageRanges: pdfChunks.map(c => c.pageRange) },
					binary: pdfChunks.reduce((acc, chunk, idx) => {
						acc[`pdf${idx + 1}`] = {
							data: chunk.data,
							fileName: `split_${idx + 1}.pdf`,
							mimeType: 'application/pdf',
						};
						return acc;
					}, {} as Record<string, { data: string; fileName: string; mimeType: string }>),
					pairedItem: itemIndex,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message }, pairedItem: itemIndex });
				} else {
					throw new NodeOperationError(this.getNode(), error, { itemIndex });
				}
			}
		}
		return [returnData];
	}
} 