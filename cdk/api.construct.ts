import * as cdk from '@aws-cdk/core';
import { CfnOutput } from '@aws-cdk/core';
import { AddRoutesOptions, HttpApi } from '@aws-cdk/aws-apigatewayv2';
import { LambdaProxyIntegration, LambdaProxyIntegrationProps } from '@aws-cdk/aws-apigatewayv2-integrations';
import { RustFunction, RustFunctionProps } from './rust-function';

export type AddOperationOptions = {
  name: string;
  description?: string;
  function: RustFunctionProps;
  routes: RouteOptions;
  integration?: Omit<LambdaProxyIntegrationProps, 'handler'>;
};

export type RouteOptions = Omit<AddRoutesOptions, 'integration'>;
export type DefaultRouteOptions = Omit<AddRoutesOptions, 'path' | 'methods'>;

export class Api extends cdk.Construct {
  api: HttpApi;
  defaultFunctionProps?: Partial<RustFunctionProps>;
  defaultRouteOptions?: DefaultRouteOptions;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    this.api = new HttpApi(this, "ApiGateway");

    new CfnOutput(this, 'ApiGatewayUrl', {
      value: this.api.url!,
    });
  }

  setDefaultFunctionProps(props: Partial<RustFunctionProps>) {
    this.defaultFunctionProps = props;
  }

  setDefaultRouteOptions(options: DefaultRouteOptions) {
    this.defaultRouteOptions = options;
  }

  addOperation(opts: AddOperationOptions) {
    const { name } = opts;
    const functionProps = {
      ...this.defaultFunctionProps,
      ...(opts.function ?? {}),
      bundling: {
        ...(this.defaultFunctionProps?.bundling ?? {}),
        ...(opts.function.bundling ?? {}),
      },
    };
    const lambdaFunction = new RustFunction(this, `${name}Function`, functionProps);

    const routes = this.api.addRoutes({
      ...(this.defaultRouteOptions || {}),
      ...opts.routes,
      integration: new LambdaProxyIntegration({
        handler: lambdaFunction,
        ...opts.integration,
      }),
    });

    new CfnOutput(this, `${name}FunctionName`, {
      value: lambdaFunction.functionName,
      description: `${name} function name`,
    });

    new CfnOutput(this, `${name}ApiPath`, {
      value: routes[0].path!,
      description: `${name} API path`,
    });

    return {
      lambdaFunction,
      routes,
    };
  }
}
