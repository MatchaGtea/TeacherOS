SHELL := /bin/bash

.PHONY: setup dev test build

setup:
	python3 -m venv backend/.venv
	backend/.venv/bin/python -m pip install --upgrade pip
	backend/.venv/bin/pip install -r backend/requirements.txt
	cd frontend && npm install

dev:
	@trap 'kill 0' INT TERM EXIT; \
	backend/.venv/bin/uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000 & \
	cd frontend && npm run dev -- --host 127.0.0.1 --port 5173

test:
	backend/.venv/bin/python -m pytest backend/tests -q
	cd frontend && npm test -- --run

build:
	cd frontend && npm run build

