import * as fs from 'fs';
import * as path from 'path';
import * as lambda from '@aws-cdk/aws-lambda';
import { Bundling } from './bundling';
import { BundlingOptions } from './types';
import { findUp } from './util';
import { Construct } from '@aws-cdk/core';


export interface RustFunctionProps extends lambda.FunctionOptions {
  readonly bin: string;
  readonly debug?: boolean;
  readonly crateDir?: string;
  readonly bundling?: BundlingOptions;
}

export class RustFunction extends lambda.Function {
  constructor(scope: Construct, id: string, props: RustFunctionProps) {

    // Find the project root
    let crateDir: string;
    if (props.crateDir) {
      const parsedCrateDir = path.parse(props.crateDir);
      if (parsedCrateDir.base && parsedCrateDir.ext && parsedCrateDir.base === 'Cargo.toml') {
        if (!fs.existsSync(props.crateDir)) {
          throw new Error(`Cargo.toml file at ${props.crateDir} doesn't exist`);
        }
      } else if (parsedCrateDir.base && parsedCrateDir.ext && parsedCrateDir.base != 'Cargo.toml') {
        throw new Error('moduleDir is specifying a file that is not Cargo.toml');
      } else if (!fs.existsSync(path.join(props.crateDir, 'Cargo.toml'))) {
        throw new Error(`Cargo.toml file at ${props.crateDir} doesn't exist`);
      }
      crateDir = props.crateDir;
    } else {
      const cargoFile = findUp('Cargo.toml', __dirname);
      if (!cargoFile) {
        throw new Error ('Cannot find go.mod. Please specify it with `moduleDir`.');
      }
      crateDir = cargoFile;
    }

    const runtime = lambda.Runtime.PROVIDED_AL2;

    super(scope, id, {
      ...props,
      runtime,
      code: Bundling.bundle({
        ...props.bundling ?? {},
        bin: props.bin,
        runtime,
        crateDir,
      }),

      handler: 'bootstrap',
    });
  }
}
