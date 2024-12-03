import {
	IExecuteFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { ILoadOptionsFunctions } from 'n8n-core';
import { OptionsWithUri } from 'request-promise-native';

export class FusionbrainAiNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'fusionbrain.ai',
		name: 'fusionbrainAiNode',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-icon-not-svg
		icon: 'file:fusionbrain.ai.png',
		group: ['transform'],
		version: 1,
		description: 'fusionbrain.ai Text2Image',
		defaults: {
			name: 'fusionbrain.ai',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'hapheusFusionbrainAiCredentialsApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'text2image',
				required: true,
				options: [
					{
						name: 'Generate Image',
						value: 'text2image',
					},
					{
						name: 'List Models',
						value: 'listModels',
					},
					{
						name: 'List Styles',
						value: 'listStyles',
					},
				],
			},
			{
				displayName: 'Model Name or ID',
				name: 'model_id',
				type: 'options',
				description:
					'Choose from the list. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				default: '',
				placeholder: 'Model',
				required: true,
				typeOptions: {
					loadOptionsMethod: 'loadModels',
				},
				displayOptions: {
					show: {
						operation: ['text2image'],
					},
				},
			},
			{
				displayName: 'Style Name or ID',
				name: 'style',
				type: 'options',
				description:
					'Choose from the list. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				// eslint-disable-next-line
				default: 'DEFAULT',
				placeholder: 'Style',
				required: true,
				typeOptions: {
					loadOptionsMethod: 'loadStyles',
				},
				displayOptions: {
					show: {
						operation: ['text2image'],
					},
				},
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				placeholder: 'Prompt',
				description:
					'Enter your prompt, for example: a drawing of nature drawn with a brush and paints, the sea, mountains, pine trees, calm colors',
				required: true,
				displayOptions: {
					show: {
						operation: ['text2image'],
					},
				},
			},
			{
				displayName: 'Negative Prompt',
				name: 'negative_prompt',
				type: 'string',
				default:
					'worst quality, normal quality, low quality, low res, blurry, text, watermark, logo, banner, extra digits, cropped, jpeg artifacts, signature, username, error, sketch ,duplicate, ugly, monochrome, geometry, mutation, disgusting',
				placeholder: 'Negative prompt',
				description: 'Enter your negative prompt, for example: bushes, red flowers, birds',
				displayOptions: {
					show: {
						operation: ['text2image'],
					},
				},
			},
			{
				displayName: 'Width',
				name: 'width',
				type: 'number',
				default: 1024,
				placeholder: 'Width',
				description: 'Enter the width (integer between 1 and 1024)',
				required: true,
				typeOptions: {
					minValue: 1,
					maxValue: 1024,
				},
				displayOptions: {
					show: {
						operation: ['text2image'],
					},
				},
			},
			{
				displayName: 'Height',
				name: 'height',
				type: 'number',
				default: 1024,
				placeholder: 'Height',
				description: 'Enter the height (integer between 1 and 1024)',
				required: true,
				typeOptions: {
					minValue: 1,
					maxValue: 1024,
				},
				displayOptions: {
					show: {
						operation: ['text2image'],
					},
				},
			},
		],
	};

	methods = {
		loadOptions: {
			async loadModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];

				const options: OptionsWithUri = {
					method: 'GET',
					uri: 'https://api-key.fusionbrain.ai/key/api/v1/models',
					json: true,
				};
				const models = await this.helpers.requestWithAuthentication.call(
					this,
					'hapheusFusionbrainAiCredentialsApi',
					options,
				);

				for (const model of models) {
					returnData.push({
						name: `${model.name} (${model.version})`,
						value: model.id,
					});
				}

				return returnData;
			},
			async loadStyles(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];

				const options: OptionsWithUri = {
					method: 'GET',
					uri: 'https://cdn.fusionbrain.ai/static/styles/key',
					json: true,
				};
				const styles = await this.helpers.request(options);

				for (const style of styles) {
					returnData.push({
						name: style.titleEn,
						value: style.name,
					});
				}

				return returnData;
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const dataPropertyName: string = 'data';

		let modelId: number;
		let style: string;
		let prompt: string;
		let negativePrompt: string;
		let width: number;
		let height: number;
		let operation: string;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const newItems: INodeExecutionData[] = [];
			try {
				operation = this.getNodeParameter('operation', itemIndex, '') as string;

				if (operation === 'text2image') {
					modelId = this.getNodeParameter('model_id', itemIndex, '') as number;
					style = this.getNodeParameter('style', itemIndex, '') as string;
					prompt = this.getNodeParameter('prompt', itemIndex, '') as string;
					negativePrompt = this.getNodeParameter('negative_prompt', itemIndex, '') as string;
					width = this.getNodeParameter('width', itemIndex, '') as number;
					height = this.getNodeParameter('height', itemIndex, '') as number;

					const data = {
						type: 'GENERATE',
						style: style,
						width: width,
						height: height,
						negativePromptUnclip: negativePrompt,
						generateParams: {
							query: prompt,
						},
					};

					const options: OptionsWithUri = {
						method: 'POST',
						uri: 'https://api-key.fusionbrain.ai/key/api/v1/text2image/run',
						json: true,
						headers: {
							'Content-Type': 'multipart/form-data',
						},
						formData: {
							model_id: modelId,
							params: {
								value: JSON.stringify(data),
								options: {
									contentType: 'application/json',
								},
							},
						},
					};

					const initialResponse = await this.helpers.requestWithAuthentication.call(
						this,
						'hapheusFusionbrainAiCredentialsApi',
						options,
					);

					const checkStatusOptions: OptionsWithUri = {
						method: 'GET',
						uri:
							'https://api-key.fusionbrain.ai/key/api/v1/text2image/status/' + initialResponse.uuid,
						json: true,
					};

					let response = undefined;
					do {
						await new Promise((resolve) => setTimeout(resolve, 250));
						response = await this.helpers.requestWithAuthentication.call(
							this,
							'hapheusFusionbrainAiCredentialsApi',
							checkStatusOptions,
						);
					} while (response.status !== 'DONE');

					for (let i = 0; i < response.images.length; i++) {
						const binaryData = await this.helpers.prepareBinaryData(
							Buffer.from(response.images[i], 'base64'),
						);
						binaryData.mimeType = 'image/jpg';
						binaryData.fileExtension = 'jpg';
						binaryData.fileType = 'image';
						binaryData.fileName = 'image.jpg';

						newItems.push({
							binary: {
								[dataPropertyName]: binaryData,
							},
							json: {
								censored: response.censored,
							},
							pairedItem: {
								item: itemIndex,
							},
						});
					}

					returnData.push(...newItems);
				} else if (operation === 'listModels') {
					const models = await this.helpers.requestWithAuthentication.call(
						this,
						'hapheusFusionbrainAiCredentialsApi',
						{
							method: 'GET',
							uri: 'https://api-key.fusionbrain.ai/key/api/v1/models',
							json: true,
						},
					);

					for (const model of models) {
						newItems.push({
							json: {
								id: model.id,
								name: model.name,
								version: model.version,
							},
							pairedItem: {
								item: itemIndex,
							},
						});
					}

					returnData.push(...newItems);
				} else if (operation === 'listStyles') {
					const styles = await this.helpers.request({
						method: 'GET',
						uri: 'https://cdn.fusionbrain.ai/static/styles/key',
						json: true,
					});

					for (const style of styles) {
						newItems.push({
							json: {
								name: style.name,
								title: style.titleEn,
							},
							pairedItem: {
								item: itemIndex,
							},
						});
					}

					returnData.push(...newItems);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					newItems.push({
						json: this.getInputData(itemIndex)[0].json,
						error,
						pairedItem: itemIndex,
					});
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

		return this.prepareOutputData(returnData);
	}
}
