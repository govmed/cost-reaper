.PHONY: help setup up down restart test migrate seed logs build ps

help:
	@echo "cost-reaper — common commands (Linux/macOS; Windows users use scripts/*.ps1)"
	@echo "  make setup     Full setup: check Docker, create .env, build, migrate, seed"
	@echo "  make up        Start the stack (db + api + web)"
	@echo "  make down      Stop the stack"
	@echo "  make restart   Restart the stack"
	@echo "  make test      Run backend + frontend test suites"
	@echo "  make migrate   Apply database migrations"
	@echo "  make seed      (Re)seed reference data"
	@echo "  make logs      Tail service logs"
	@echo "  make build     Build all Docker images"
	@echo "  make ps        Show running services"

setup:
	./scripts/setup.sh

up:
	./scripts/start.sh

down:
	./scripts/stop.sh

restart: down up

test:
	./scripts/test.sh

migrate:
	./scripts/migrate.sh

seed:
	./scripts/seed.sh

logs:
	./scripts/logs.sh

build:
	docker compose build

ps:
	docker compose ps
