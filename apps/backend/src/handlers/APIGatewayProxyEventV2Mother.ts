import type { APIGatewayProxyEventV2 } from 'aws-lambda';

export class APIGatewayProxyEventV2Mother {
  private data: APIGatewayProxyEventV2;

  private constructor(data: APIGatewayProxyEventV2) {
    this.data = data;
  }

  public static basic(): APIGatewayProxyEventV2Mother {
    return new APIGatewayProxyEventV2Mother({
      version: '2.0',
      routeKey: 'GET /',
      rawPath: '/',
      rawQueryString: '',
      headers: {},
      requestContext: {
        accountId: '123456789012',
        apiId: 'api-id',
        domainName: 'trackit.io',
        domainPrefix: 'trackit',
        http: {
          method: 'GET',
          path: '/',
          protocol: 'HTTP/1.1',
          sourceIp: '111.111.111.111',
          userAgent: 'vitest',
        },
        requestId: 'request-id',
        stage: 'test',
        routeKey: 'GET /',
        time: '12/Mar/2023:12:00:00 +0000',
        timeEpoch: 1678627200000,
      },
      isBase64Encoded: false,
    });
  }

  public withBody(
    body: APIGatewayProxyEventV2['body']
  ): APIGatewayProxyEventV2Mother {
    this.data.body = body;
    return this;
  }

  public withHeaders(
    headers: APIGatewayProxyEventV2['headers']
  ): APIGatewayProxyEventV2Mother {
    this.data.headers = headers;
    return this;
  }

  public build(): APIGatewayProxyEventV2 {
    return this.data;
  }
}
