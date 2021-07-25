use log::LevelFilter;
use simple_logger::SimpleLogger;

use lambda_http::{handler, lambda_runtime::{self, Context, Error}, IntoResponse, Request, RequestExt};

#[tokio::main]
async fn main() -> Result<(), Error> {
    SimpleLogger::new()
      .with_level(LevelFilter::Info)
      .init()
      .unwrap();

    lambda_runtime::run(handler(hello)).await?;
    Ok(())
}

async fn hello(
    request: Request,
    _: Context
) -> Result<impl IntoResponse, Error> {


  log::info!("Event {} {}: {:?}", request.method(), request.uri(), request);

  let response = format!(
    "hello {}",
    request
        .query_string_parameters()
        .get("name")
        .unwrap_or_else(|| "stranger")
  );

  log::info!("{}", response);

  Ok(response)
}
