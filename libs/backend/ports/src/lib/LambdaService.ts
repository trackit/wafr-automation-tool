export interface LambdaServicePort {
  asyncInvokeLambda(args: {
    lambdaArn: string;
    payload?: string;
  }): Promise<void>;
}
