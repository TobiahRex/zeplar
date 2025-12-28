# Zeplar Makefile
# ================
# Common development commands for the Zeplar learning application.
# Run from the project root: ~/code/domains/me/zeplar/

.PHONY: help start dev build preview lint format clean clean-ports test test-watch test-coverage
.PHONY: transform type-check install

# Default port
PORT ?= 5173

# Default target
help:
	@echo "Zeplar Commands"
	@echo "==============="
	@echo ""
	@echo "Server Commands:"
	@echo "  make start             - Start dev server (port $(PORT))"
	@echo "  make dev               - Alias for start"
	@echo "  make build             - Build for production"
	@echo "  make preview           - Preview production build"
	@echo "  make remote            - Start with ngrok for remote access"
	@echo ""
	@echo "Testing:"
	@echo "  make test              - Run tests"
	@echo "  make test-watch        - Run tests in watch mode"
	@echo "  make test-coverage     - Run tests with coverage report"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint              - Run ESLint checks"
	@echo "  make format            - Format code with Prettier"
	@echo "  make type-check        - Run TypeScript type checking"
	@echo ""
	@echo "Data Pipeline:"
	@echo "  make transform         - Transform pattern corpus to JSON"
	@echo ""
	@echo "Utilities:"
	@echo "  make install           - Install dependencies"
	@echo "  make clean             - Clean build artifacts and caches"
	@echo "  make clean-ports       - Kill processes on dev ports"

# =============================================================================
# Server Commands
# =============================================================================

# Start dev server
start:
	@echo "Starting Zeplar dev server on port $(PORT)..."
	npm run dev

# Alias for start
dev: start

# Build for production
build:
	@echo "Building for production..."
	npm run build

# Preview production build
preview:
	@echo "Starting preview server..."
	npm run preview

# Clean up orphan server processes
clean-ports:
	@echo "Cleaning up ports..."
	@lsof -ti:$(PORT) | xargs kill -9 2>/dev/null || true
	@lsof -ti:4173 | xargs kill -9 2>/dev/null || true
	@echo "Done."

# Start with ngrok for remote access (phone/tablet testing)
remote: clean-ports
	@echo "Starting Zeplar with ngrok..."
	@command -v ngrok >/dev/null 2>&1 || { echo "Error: ngrok not installed. Install from https://ngrok.com"; exit 1; }
	@echo "Starting dev server in background..."
	@npm run dev &
	@sleep 2
	@echo "Starting ngrok tunnel..."
	ngrok http $(PORT)

# =============================================================================
# Testing Commands
# =============================================================================

# Run tests
test:
	@echo "Running tests..."
	npm run test

# Run tests in watch mode
test-watch:
	@echo "Running tests in watch mode..."
	npm run test -- --watch

# Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	npm run test -- --coverage

# =============================================================================
# Code Quality Commands
# =============================================================================

# Run linting
lint:
	@echo "Running ESLint..."
	npm run lint

# Format code (requires prettier to be installed)
format:
	@echo "Formatting code..."
	@command -v npx >/dev/null 2>&1 && npx prettier --write "src/**/*.{ts,tsx,css}" || echo "Prettier not configured"

# TypeScript type checking
type-check:
	@echo "Running TypeScript type check..."
	npx tsc --noEmit

# =============================================================================
# Data Pipeline Commands
# =============================================================================

# Transform pattern corpus to JSON (Phase 0.2)
transform:
	@echo "Transforming pattern corpus..."
	@if [ -f scripts/transform-corpus.ts ]; then \
		npx tsx scripts/transform-corpus.ts; \
	else \
		echo "Transform script not yet created (Phase 0.2)"; \
	fi

# =============================================================================
# Utility Commands
# =============================================================================

# Install dependencies
install:
	@echo "Installing dependencies..."
	npm install

# Clean build artifacts and caches
clean:
	@echo "Cleaning up..."
	rm -rf dist/
	rm -rf node_modules/.vite/
	rm -rf coverage/
	@echo "Done."
