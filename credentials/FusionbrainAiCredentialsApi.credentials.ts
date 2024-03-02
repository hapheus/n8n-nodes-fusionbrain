import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FusionbrainAiCredentialsApi implements ICredentialType {
	name = 'fusionbrainAiCredentialsApi';
	displayName = 'fusionbrain.ai API';
	documentationUrl = 'https://fusionbrain.ai/docs/en/';
	properties: INodeProperties[] = [
		{
			displayName: 'Api Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
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
				"X-Key": '={{"Key " + $credentials.apiKey}}',
				"X-Secret": '={{"Secret " + $credentials.secretKey}}',
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
