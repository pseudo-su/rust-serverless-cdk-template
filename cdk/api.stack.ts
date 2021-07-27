import * as cdk from '@aws-cdk/core';
import { HttpMethod } from '@aws-cdk/aws-apigatewayv2';
import { Api } from './api.construct';
// import { HttpLambdaAuthorizer } from "@aws-cdk/aws-apigatewayv2-authorizers";
import { RetentionDays } from '@aws-cdk/aws-logs';
// import { RustFunction } from './rust-function';


export class ApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, properties?: cdk.StackProps) {
    super(scope, id, properties);

    // const authorizer = new HttpLambdaAuthorizer({
    //   authorizerName: "UserAuthorizer",
    //   handler: new RustFunction(this, `UserAuthorizerFunction`, {
    //     bin: "authorizer"
    //   }),
    // });

    const api = new Api(this, "Api");

    api.setDefaultFunctionProps({
      environment: {
        RUST_BACKTRACE: '1',
      },
      logRetention: RetentionDays.ONE_WEEK,
      bundling: {
        debug: process.env.DEBUG === 'true',
      }
    })

    api.addOperation({
      name: 'RunDatabaseMigrations',
      description: 'Run database migrations',
      routes: {
        path: '/commands/runDatabaseMigrations',
        methods: [HttpMethod.POST],
        // authorizer,
      },
      function: {
        bin: 'run-database-migrations',
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
