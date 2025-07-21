import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { PDFDocument } from 'pdf-lib';
import { Buffer } from 'buffer';

export class GetPdfInfo implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Get PDF Info',
		name: 'getPdfInfo',
		group: ['transform'],
		version: 1,
		description: 'Extracts information from a PDF file',
		defaults: {
			name: 'Get PDF Info',
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
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex, 'data') as string;
				const item = items[itemIndex];
				if (!item.binary || !item.binary[binaryPropertyName]) {
					throw new NodeOperationError(this.getNode(), `No binary data property '${binaryPropertyName}' found on item`, { itemIndex });
				}
				const pdfBuffer = Buffer.from(item.binary[binaryPropertyName].data, 'base64');
				const pdfDoc = await PDFDocument.load(pdfBuffer);
				const pageCount = pdfDoc.getPageCount();
				returnData.push({ json: { pageCount }, pairedItem: itemIndex });
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