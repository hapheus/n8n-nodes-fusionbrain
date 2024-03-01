import {
	IExecuteFunctions,
	INodeExecutionData, INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import {ILoadOptionsFunctions} from "n8n-core";

export class ExampleNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Example Node',
		name: 'exampleNode',
		group: ['transform'],
		version: 1,
		description: 'Basic Example Node',
		defaults: {
			name: 'Example Node',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'hapheusFusionBrainAiApiCredentials',
				required: true,
			},
		],
		requestDefaults: {
			ignoreHttpStatusErrors: true,
			baseURL: 'https://api-key.fusionbrain.ai/key/api/v1/',
		},
		properties: [
			{
				displayName: 'Model',
				name: 'model_id',
				type: 'options',
				default: '',
				placeholder: 'Model',
				required: true,
				typeOptions: {
					loadOptionsMethod: 'loadModels',
				},
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				placeholder: 'Prompt',
				description: 'Enter your prompt, for example: a drawing of nature drawn with a brush and paints, the sea, mountains, pine trees, calm colors',
				required: true,
			},
			{
				displayName: 'Negative prompt',
				name: 'negative_prompt',
				type: 'string',
				default: '',
				placeholder: 'Negative prompt',
				description: 'Buches, red flowers, birds',
				required: false,
			},
		],
	};

	methods = {
		loadOptions: {
			async loadModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];

				const credentials = await this.getCredentials('hapheusFusionBrainAiApiCredentials');

				if (!credentials) throw new Error('Credentials are required');

				const responseData = await this.helpers.request({
					method: "GET",
					url: 'https://api-key.fusionbrain.ai/key/api/v1/models',
					headers: {
						'X-Key': `Key ${credentials.apiKey}`,
						'X-Secret': `Secret ${credentials.secretKey}`,
					}
				});

				const models = JSON.parse(responseData);

				for (const model of models) {
					returnData.push({
						name: `${model.name} (${model.version})`,
						value: model.id
					});
				}

				return returnData;
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;
		let myString: string;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				myString = this.getNodeParameter('myString', itemIndex, '') as string;
				item = items[itemIndex];

				item.json['myString'] = myString;
			} catch (error) {
				if (this.continueOnFail()) {
					items.push({json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex});
				} else {
					if (error.context) {
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return this.prepareOutputData(items);
	}
}
