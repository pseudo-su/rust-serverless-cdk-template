.PHONY: deps.install
deps.install:
	# Download packages in cargo.lock file
	cargo fetch --locked
	# Install NodeJS dependences
	npm ci

.PHONY: deps.update
deps.update:
	# Update go dependencies in go.mod and go.sum
	cargo fetch
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
	cargo test

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
package:
	npx cdk synth

.PHONY: deploy.dev
deploy.dev:
	npx cdk deploy --app=cdk.out 'Dev/*'
