CONTAINER=app

.env: .env.sample
	cp .env.sample .env

all: docker/destroy docker/clean docker/build db

docker/build:
	docker-compose build
	docker-compose up -d db
	sleep 5
	docker-compose stop

docker/clean:
	docker rm -f `docker ps -a -q -f name=run` 2>/dev/null || true
	docker rm -f `docker ps -a -q -f exited=137` 2>/dev/null || true
	docker rm -f `docker ps -a -q -f exited=1` 2>/dev/null || true
	docker rmi `docker images -f "dangling=true" -q` 2>/dev/null || true
	docker volume prune

docker/destroy:
	docker-compose down

clean:
	sudo rm -rf dist
	sudo rm -rf coverage
	sudo rm -rf .tmp
	sudo rm -rf .nyc_output

db:
	docker-compose run --rm ${CONTAINER} yarn db:reset
	docker-compose run --rm ${CONTAINER} yarn db:seed

db/migrate:
	docker-compose run --rm ${CONTAINER} yarn db:migrate

db/rollback:
	docker-compose run --rm ${CONTAINER} yarn db:rollback

test:
	docker-compose run --rm ${CONTAINER} yarn dev:test

coverage:
	docker-compose run --rm ${CONTAINER} yarn dev:coverage

start:
	docker-compose up

build:
	docker-compose run --rm ${CONTAINER} yarn build

.PHONY: docker/build docker/clean docker/destroy \
	start build test coverage clean \
	db db/migrate db/rollback
