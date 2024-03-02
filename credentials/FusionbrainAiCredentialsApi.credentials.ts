import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FusionbrainAiCredentialsApi implements ICredentialType {
	name = 'hapheusFusionbrainAiCredentialsApi';
	displayName = 'fusionbrain.ai API';
	icon = 'file:fusionbrain.ai.png';
	documentationUrl = 'https://fusionbrain.ai/docs/en/';
	properties: INodeProperties[] = [
		{
			displayName: 'Api Key',
			name: 'apiKey',
			// eslint-disable-next-line
			type: 'string',
			typeOptions: {
				password: false,
			},
			default: '',
		},
		{
			displayName: 'Secret Key',
			name: 'secretKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-Key': '={{"Key " + $credentials.apiKey}}',
				'X-Secret': '={{"Secret " + $credentials.secretKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api-key.fusionbrain.ai/key/api/v1/',
			url: 'models',
		},
	};
}
