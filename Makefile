.PHONY: build browser format install lint server test

install:
	uv sync
	npm --prefix browser ci

server:
	uv run uvicorn server.web:app --reload --port 8000

browser:
	npm --prefix browser run dev

test:
	uv run pytest
	npm --prefix browser test

lint:
	uv run ruff check .
	uv run ruff format --check .
	npm --prefix browser run format:check

format:
	uv run ruff check --fix .
	uv run ruff format .
	npm --prefix browser run format

build:
	npm --prefix browser run build
