#!/usr/bin/env node

import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { ApiStack } from "./api.stack";

type RustServerlessCDKTemplateProperties = {
  account: string;
};

class RustServerlessCDKTemplate extends cdk.Construct {
  constructor(
    scope: cdk.Construct,
    id: string,
    properties: RustServerlessCDKTemplateProperties
  ) {
    super(scope, id);
    new ApiStack(this, `RustServerlessCDKTemplate`, {
      env: {
        account: properties.account,
        region: "ap-southeast-2",
      },
    });
  }
}

const app = new cdk.App();

new RustServerlessCDKTemplate(app, "Dev", {
  account: "067289113644",
});
