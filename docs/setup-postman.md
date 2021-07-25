# Setup Postman

Postman is a desktop HTTP client application that makes it easier to build HTTP requests to send to our API. It can be useful for sending requests to your version of the API during development or to the production version to diagnose/test problems.

If you haven't already installed postman you can install it through homebrew

```sh
brew install --cask postman
```

## Import API Definition

You can import the [../openapi.yml](../openapi.yml) spec file into Postman by selecting "import" in the top left and following the prompts.

## Configure environments

When you first import the API spec there will be templated parts of the API definition that will attempt to pull config values from your environment (eg `{{baseUrl}}`). This is to make it easier to use the Same API definition to make requests against different versions of the API (eg `dev`, `prod`).

Create a new "Environment" in postman named `rust-serverless-cdk-local` by clicking on the "Add" button in the top right. Add a `baseUrl` variable to your environment and put the URL of your API as the value (eg `https://fsuibntfhg.execute-api.ap-southeast-2.amazonaws.com`)

NOTE: The URL of your API gets printed to the terminal when you run `make dev.start`
