import * as cdk from '@aws-cdk/core';
import { CfnOutput } from '@aws-cdk/core';
import { AddRoutesOptions, HttpApi, HttpMethod } from '@aws-cdk/aws-apigatewayv2';
// import { HttpLambdaAuthorizer } from "@aws-cdk/aws-apigatewayv2-authorizers";
import { LambdaProxyIntegration, LambdaProxyIntegrationProps } from '@aws-cdk/aws-apigatewayv2-integrations';
import { RetentionDays } from '@aws-cdk/aws-logs';
import { RustFunction, RustFunctionProps } from './rust-function';

type AddOperationOptions = {
  name: string;
  description?: string;
  function: RustFunctionProps;
  routes: RouteOptions;
  integration?: Omit<LambdaProxyIntegrationProps, 'handler'>;
};

type RouteOptions = Omit<AddRoutesOptions, 'integration'>;
type DefaultRouteOptions = Omit<AddRoutesOptions, 'path' | 'methods'>;

export class Api extends cdk.Construct {
  api: HttpApi;
  defaultFunctionProps?: RustFunctionProps;
  defaultRouteOptions?: DefaultRouteOptions;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    this.api = new HttpApi(this, "ApiGateway");

    new CfnOutput(this, 'ApiGatewayUrl', {
      value: this.api.url!,
    });
  }

  setDefaultFunctionProps(props: RustFunctionProps) {
    this.defaultFunctionProps = props;
  }

  setDefaultRouteOptions(options: DefaultRouteOptions) {
    this.defaultRouteOptions = options;
  }

  addOperation(opts: AddOperationOptions) {
    const { name } = opts;
    const functionProps = {
      ...this.defaultFunctionProps,
      ...(opts.function || {}),
      bundling: {
        ...(this.defaultFunctionProps?.bundling || {}),
        ...(opts.function.bundling || {}),
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

export class ApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, properties?: cdk.StackProps) {
    super(scope, id, properties);

    // const authorizer = new HttpLambdaAuthorizer({
    //   authorizerName: "UserAuthorizer",
    //   handler: new RustFunction(this, `UserAuthorizerFunction`, {
    //     entry: "lambda/authorizer"
    //   }),
    // });

    const api = new Api(this, "Api");

    api.addOperation({
      name: 'runDatabaseMigrations',
      description: 'Run database migrations',
      routes: {
        path: '/commands/runDatabaseMigrations',
        methods: [HttpMethod.POST],
        // authorizer,
      },
      function: {
        entry: 'tmp/runDatabaseMigrations',
        environment: {
          RUST_BACKTRACE: '1',
        },
        logRetention: RetentionDays.ONE_WEEK,
      },
    });

    // api.addOperation({
    //   name: 'searchLeagues',
    //   description: 'Search leagues',
    //   routes: {
    //     path: '/admin/leagues',
    //     methods: [HttpMethod.GET],
    //     authorizer,
    //   },
    //   function: {
    //     entry: 'lambda/queries/leagues/search',
    //   },
    // });

    // api.addOperation({
    //   name: 'getLeagueById',
    //   description: 'Get league by ID',
    //   routes: {
    //     path: '/admin/league/{leagueId}',
    //     methods: [HttpMethod.GET],
    //     authorizer: authorizer,
    //   },
    //   function: {
    //     entry: 'lambda/queries/leagues/search',
    //   },
    // });

    // api.addOperation({
    //   name: 'createLeague',
    //   description: 'Create league',
    //   routes: {
    //     path: '/commands/createLeague',
    //     methods: [HttpMethod.POST],
    //     authorizer: authorizer,
    //   },
    //   function: {
    //     entry: 'lambda/commands/createLeague',
    //   },
    // });

    // api.addOperation({
    //   name: 'deleteLeague',
    //   description: 'Delete league',
    //   routes: {
    //     path: '/commands/deleteLeague',
    //     methods: [HttpMethod.POST],
    //     authorizer: authorizer,
    //   },
    //   function: {
    //     entry: 'lambda/commands/deleteLeague',
    //   },
    // });

    // api.addOperation({
    //   name: 'updateLeague',
    //   description: 'Update league',
    //   routes: {
    //     path: '/commands/udpateLeague',
    //     methods: [HttpMethod.POST],
    //     authorizer: authorizer,
    //   },
    //   function: {
    //     entry: 'lambda/commands/updateLeague',
    //   },
    // });
  }
}
