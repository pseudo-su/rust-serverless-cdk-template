import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';

export interface RustBundlingOptions {}

export interface RustFunctionProps extends lambda.FunctionOptions {
  readonly entry: string;
  readonly bundling?: RustBundlingOptions;
}

export class RustFunction extends lambda.Function {
  constructor(scope: cdk.Construct, id: string, rustFunctionProps: RustFunctionProps) {

    // TODO: make RustFunction know how to build the binary just like `GoFunction`
    const functionProps = {
      ...rustFunctionProps,
      runtime: lambda.Runtime.PROVIDED_AL2,
      code: lambda.Code.fromAsset(
        rustFunctionProps.entry,
      ),
      // TODO: implement bundling of the rust lambda instead of expecting to point to a folder with an already built binary
      // code: Bundling.bundle({
      //   ...props.bundling ?? {},
      //   entry,
      //   runtime,
      //   moduleDir,
      // }),
      handler: "not.required",
    };

    super(scope, id, functionProps);
  }
}
