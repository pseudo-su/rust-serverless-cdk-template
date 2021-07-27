import * as os from "os";
import * as path from "path";
import { AssetCode, Code, Runtime } from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";
import { BundlingOptions } from "./types";
import { exec, findUp, chain, osPathJoin } from "./util";

/**
 * Options for bundling
 */
export interface BundlingProps extends BundlingOptions {
  /**
   * Directory containing your go.mod file
   *
   * This will accept either a directory path containing a `go.mod` file
   * or a filepath to your `go.mod` file (i.e. `path/to/go.mod`).
   *
   * This will be used as the source of the volume mounted in the Docker
   * container and will be the directory where it will run `go build` from.
   *
   * @default - the path is found by walking up parent directories searching for
   *  a `go.mod` file from the location of `entry`
   */
  readonly crateDir: string;

  readonly targetDir?: string;

  /**
   * The path to the folder or file that contains the main application entry point files for the project.
   *
   * This accepts either a path to a directory or file.
   *
   * If a directory path is provided then it will assume there is a Go entry file (i.e. `main.go`) and
   * will construct the build command using the directory path.
   *
   * For example, if you provide the entry as:
   *
   *     entry: 'my-lambda-app/cmd/api'
   *
   * Then the `go build` command would be:
   *
   *     `go build ./cmd/api`
   *
   * If a path to a file is provided then it will use the filepath in the build command.
   *
   * For example, if you provide the entry as:
   *
   *     entry: 'my-lambda-app/cmd/api/main.go'
   *
   * Then the `go build` command would be:
   *
   *     `go build ./cmd/api/main.go`
   */
  readonly bin: string;

  readonly debug?: boolean;

  /**
   * The runtime of the lambda function
   */
  readonly runtime: Runtime;
}

export class Bundling implements cdk.BundlingOptions {
  public static bundle(options: BundlingProps): AssetCode {
    const bundling = new Bundling(options);

    return Code.fromAsset(path.dirname(options.crateDir), {
      assetHashType: options.assetHashType ?? cdk.AssetHashType.OUTPUT,
      assetHash: options.assetHash,
      bundling: {
        image: bundling.image,
        command: bundling.command,
        environment: bundling.environment,
        local: bundling.local,
      },
    });
  }

  private static runsLocally?: boolean;

  // Core bundling options
  public readonly image: cdk.DockerImage;
  public readonly command: string[];
  public readonly environment?: { [key: string]: string };
  public readonly local?: cdk.ILocalBundling;

  private readonly bin: string;
  private readonly targetDir: string;
  private readonly debug: boolean;

  constructor(private readonly props: BundlingProps) {
    Bundling.runsLocally = true;

    const projectRoot = path.dirname(props.crateDir);

    this.bin = props.bin;
    this.targetDir = props.targetDir || 'target';
    this.debug = props.debug ?? true;

    const environment = {
      ...props.environment,
    };

    // Docker bundling
    // const shouldBuildImage = props.forcedDockerBundling || !Bundling.runsLocally;

    // this.image = shouldBuildImage
    //   ? props.dockerImage ?? cdk.DockerImage.fromBuild(path.join(__dirname, '../lib'), {
    //     buildArgs: {
    //       ...props.buildArgs ?? {},
    //       IMAGE: Runtime.PROVIDED_AL2.bundlingImage.image,
    //     },
    //   })
    //   : cdk.DockerImage.fromRegistry('dummy'); // Do not build if we don't need to

    // const dockerBundlingCommand = this.createBundlingCommand(
    //   cdk.AssetStaging.BUNDLING_INPUT_DIR,
    //   cdk.AssetStaging.BUNDLING_OUTPUT_DIR,
    // );

    // this.command = ['bash', '-c', dockerBundlingCommand];
    // this.environment = environment;

    // // Local bundling
    // if (!props.forcedDockerBundling) { // only if Docker is not forced

    const osPlatform = os.platform();
    const createLocalCommand = (outputDir: string) =>
      this.createBundlingCommand(projectRoot, outputDir, osPlatform);

    this.local = {
      tryBundle(outputDir: string) {
        if (Bundling.runsLocally == false) {
          process.stderr.write(
            "cargo build cannot run locally. Switching to Docker bundling.\n"
          );
          return false;
        }

        const localCommand = createLocalCommand(outputDir);
        exec(
          osPlatform === "win32" ? "cmd" : "bash",
          [osPlatform === "win32" ? "/c" : "-c", localCommand],
          {
            env: { ...process.env, ...(environment ?? {}) },
            stdio: [
              // show output
              "ignore", // ignore stdio
              process.stderr, // redirect stdout to stderr
              "inherit", // inherit stderr
            ],
            cwd: path.dirname(props.crateDir),
            windowsVerbatimArguments: osPlatform === "win32",
          }
        );
        return true;
      },
    };
    // }
  }

  public createBundlingCommand(
    inputDir: string,
    outputDir: string,
    osPlatform: NodeJS.Platform = "linux"
  ): string {
    const pathJoin = osPathJoin(osPlatform);

    const fullTargetDir = pathJoin(inputDir, this.targetDir);

    const target = "x86_64-unknown-linux-musl";

    const cargoBuildCommand: string = [
      // TODO: specifying the linker is required when building on MacOS
      // posibly needs to be different on other OS's. Find a better way to do this.
      `RUSTFLAGS="-C linker=x86_64-linux-musl-gcc"`,
      "cargo",
      "build",
      this.debug ? "" : "--release",
      `${this.props.rustBuildFlags ? this.props.rustBuildFlags.join(" ") : ""}`,
      `--bin`, `${this.bin}`,
      `--target ${target}`,
      `--target-dir`, `${fullTargetDir}`,
      // `-C`, `link-args=-target.x86_64-unknown-linux-musl.linker=`
    ]
      .filter(Boolean)
      .join(" ");
    console.log(cargoBuildCommand);
    const targetBinary = pathJoin(
      fullTargetDir,
      target,
      this.debug ? "debug" : "release",
      this.bin
    );
    const outputBinary = pathJoin(outputDir, "bootstrap");
    const copyOutputBinary = chain([
      `mkdir -p ${outputDir}`,
      `cp ${targetBinary} ${outputBinary}`,
    ]);
    console.log(targetBinary, outputBinary);

    return chain([
      ...(this.props.commandHooks?.beforeBundling(inputDir, outputDir) ?? []),
      cargoBuildCommand,
      copyOutputBinary,
      ...(this.props.commandHooks?.afterBundling(inputDir, outputDir) ?? []),
    ]);
  }
}
