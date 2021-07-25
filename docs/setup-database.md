# Setup Database

## Local dev

### Configuring

For local development a preconfigured database running in docker will get created when you starr the "Devstack" using `make devstack.start`.

If you ever want to do a complete reset of the DB and data inside it you can run `make devstack.recreate` which will stop the db, delete the db files and containers and re-create them from scratch.

### Accessing

When the "Devstack" is running (`make devstack.start`) it also runs PgAdmin, which you can login to by opening the link [http://localhost:5050](http://localhost:5050).

```sh
# User details
username: root@devstack.com
password: 1234

# DB Connection Details
host: localhost
port: 5432
name: rust_serverless_cdk_localdev
username: root
password: 1234
```

Alternatively you can use a free desktop application tool like [DBeaver](https://dbeaver.io/)

```sh
# Install DBeaver
brew install --cask dbeaver-community
```

## Remote environments

TODO: add docs when we have a remote `dev` environment.
