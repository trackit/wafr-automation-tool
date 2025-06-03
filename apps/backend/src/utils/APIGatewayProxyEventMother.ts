import type { APIGatewayProxyEvent } from 'aws-lambda';

export class APIGatewayProxyEventMother {
  private data: APIGatewayProxyEvent;

  private constructor(data: APIGatewayProxyEvent) {
    this.data = data;
  }

  public static basic(): APIGatewayProxyEventMother {
    return new APIGatewayProxyEventMother({
      resource: '/',
      path: '/',
      httpMethod: 'GET',
      headers: {},
      multiValueHeaders: {},
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      pathParameters: null,
      stageVariables: null,
      requestContext: {
        authorizer: {
          claims: {
            sub: 'user-id',
            email: 'user-id@test.io',
          },
        },
        resourceId: 'x9w4og',
        resourcePath: '/',
        httpMethod: 'GET',
        extendedRequestId: 'K9q0pGGNPHcF5kw=',
        requestTime: '22/May/2025:09:43:18 +0000',
        path: '/',
        accountId: '999999999999',
        protocol: 'HTTP/1.1',
        stage: 'test-invoke-stage',
        domainPrefix: 'testPrefix',
        requestTimeEpoch: 1747906998974,
        requestId: '0b326214-280e-427b-9f48-999999999999',
        identity: {
          cognitoIdentityPoolId: null,
          cognitoIdentityId: null,
          apiKey: 'test-invoke-api-key',
          principalOrgId: null,
          cognitoAuthenticationType: null,
          userArn: 'test-invoke-user-arn',
          apiKeyId: 'test-invoke-api-key-id',
          userAgent: 'Test',
          accountId: '999999999999',
          caller: 'AROAYMUCOBDHSNGTGWG2G:test-invoke-caller',
          sourceIp: 'test-invoke-source-ip',
          accessKey: 'ASIAYMUCOBDHQMVM6TCL',
          cognitoAuthenticationProvider: null,
          user: 'AROAYMUCOBDHSNGTGWG2G:test-invoke-caller',
          clientCert: null,
        },
        domainName: 'testPrefix.testDomainName',
        apiId: '4vk9g4ph96',
      },
      body: null,
      isBase64Encoded: false,
    });
  }

  public withBody(
    body: APIGatewayProxyEvent['body']
  ): APIGatewayProxyEventMother {
    this.data.body = body;
    return this;
  }

  public withHeaders(
    headers: APIGatewayProxyEvent['headers']
  ): APIGatewayProxyEventMother {
    this.data.headers = headers;
    return this;
  }

  public withUserClaims(userClaims?: {
    sub: string;
    email: string;
  }): APIGatewayProxyEventMother {
    this.data.requestContext.authorizer = { claims: userClaims };
    return this;
  }

  public withPathParameters(
    pathParameters: APIGatewayProxyEvent['pathParameters']
  ): APIGatewayProxyEventMother {
    this.data.pathParameters = pathParameters;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    return this.data;
  }
}
