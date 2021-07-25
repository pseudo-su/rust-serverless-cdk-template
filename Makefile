.PHONY: deps.install
deps.install:
	# Download packages in cargo.lock file
	cargo install
	# Install NodeJS dependences
	npm ci

.PHONY: deps.update
deps.update:
	# Update go dependencies in go.mod and go.sum
	go get -u ./lambda/...
	go get -u ./internal/...
	go mod tidy
	# Update package.json dependencies and lockfile
	npm update;

.PHONY: verify
verify:
	# Lint OpenAPI spec
	./node_modules/.bin/spectral lint --fail-severity=warn ./openapi.yml

.PHONY: verify.fix
verify.fix:
	echo 'TODO: add go code verification autofixing where possible'

.PHONY: test
test:
	npx dotenv -c -- go test -v -p=1 ./lambda/...
	npx dotenv -c -- go test -v -p=1 ./internal/...

.PHONY: devstack.start
devstack.start:
	docker-compose up -d --remove-orphans devstack

.PHONY: devstack.stop
devstack.stop:
	docker-compose down --remove-orphans

.PHONY: devstack.clean
devstack.clean:
	rm -rf ./devstack/postgres/data/*
	docker-compose rm --stop --force

.PHONY: devstack.restart
devstack.restart: devstack.stop devstack.start

.PHONY: devstack.recreate
devstack.recreate: devstack.clean devstack.restart

.PHONY: dev
dev:
	sam-beta-cdk local start-api

.PHONY: package
package: build.release
	npx cdk synth

.PHONY: deploy.dev
deploy.dev:
	npx cdk deploy --app=cdk.out 'Dev/*'

.PHONY: build.debug
build.debug:
	rm -rf ./tmp
	cargo build --target x86_64-unknown-linux-musl
	mkdir -p ./tmp/runDatabaseMigrations
	cp target/x86_64-unknown-linux-musl/debug/run-database-migrations ./tmp/runDatabaseMigrations/bootstrap

.PHONY: build.release
build.release:
	rm -rf ./tmp
	cargo build --release --target x86_64-unknown-linux-musl
	mkdir -p ./tmp/runDatabaseMigrations
	cp target/x86_64-unknown-linux-musl/release/run-database-migrations ./tmp/runDatabaseMigrations/bootstrap
