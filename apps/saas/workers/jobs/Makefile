# BullMQ Jobs - BarberZap
# Convenient commands for development and operations

.PHONY: help install dev start test stats health clean lint

# Color output
BLUE	:= \033[0;34m
GREEN	:= \033[0;32m
YELLOW	:= \033[0;33m
RED	:= \033[0;31m
NC	:= \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)BullMQ Jobs - BarberZap$(NC)"
	@echo ""
	@echo "$(GREEN)Available targets:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""

install: ## Install dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	npm install

dev: ## Start development mode with watch
	@echo "$(BLUE)Starting development mode...$(NC)"
	npm run dev

start: ## Start the application
	@echo "$(BLUE)Starting BullMQ workers...$(NC)"
	npm run start

test: ## Run examples/demo
	@echo "$(BLUE)Running demo...$(NC)"
	npm run test

stats: ## Show queue statistics
	@echo "$(BLUE)Queue Statistics:$(NC)"
	npm run stats

health: ## Check system health
	@echo "$(BLUE)Health Check:$(NC)"
	npm run health

queue-dev: ## Show notifications queue stats
	@echo "$(BLUE)Notifications Queue:$(NC)"
	npm run queue notifications

queue-crm: ## Show CRM queue stats
	@echo "$(BLUE)CRM Queue:$(NC)"
	npm run queue crm

list-waiting: ## List waiting jobs
	@echo "$(BLUE)Waiting Jobs:$(NC)"
	npm run list notifications waiting 20

list-failed: ## List failed jobs
	@echo "$(RED)Failed Jobs:$(NC)"
	npm run list notifications failed 20

list-completed: ## List completed jobs
	@echo "$(GREEN)Completed Jobs:$(NC)"
	npm run list notifications completed 20

clean-all: ## Clean all queues
	@echo "$(YELLOW)Cleaning all queues...$(NC)"
	npm run clean notifications
	npm run clean crm

clean-dlq-all: ## Clean all dead letter queues
	@echo "$(YELLOW)Cleaning all DLQs...$(NC)"
	npm run clean-dlq notifications
	npm run clean-dlq crm

retry-failed: ## Retry all failed jobs
	@echo "$(BLUE)Retrying failed jobs...$(NC)"
	npm run retry-all notifications
	npm run retry-all crm

redis-bash: ## Open Redis CLI
	redis-cli

redis-flush: ## Flush Redis (CAREFUL!)
	@echo "$(RED)⚠️  This will delete all Redis data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [ $$REPLY = y ]; then \
		redis-cli FLUSHALL; \
		echo "$(RED)Redis flushed!$(NC)"; \
	else \
		echo "Aborted"; \
	fi

redis-monitor: ## Monitor Redis commands
	redis-cli MONITOR

build: ## Build TypeScript
	@echo "$(BLUE)Building TypeScript...$(NC)"
	npm run build

watch: ## Watch for changes and rebuild
	@echo "$(BLUE)Watching for changes...$(NC)"
	npm run watch

lint: ## Lint TypeScript files
	@echo "$(BLUE)Linting...$(NC)"
	npm run lint

env-example: ## Copy .env.example to .env
	@echo "$(BLUE)Creating .env file...$(NC)"
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(GREEN).env file created. Please edit it with your values.$(NC)"; \
	else \
		echo "$(YELLOW).env file already exists.$(NC)"; \
	fi

docker-redis: ## Start Redis with Docker
	@echo "$(BLUE)Starting Redis with Docker...$(NC)"
	docker run -d -p 6379:6379 --name redis-barberzap redis:7-alpine

docker-redis-stop: ## Stop Redis container
	@echo "$(YELLOW)Stopping Redis container...$(NC)"
	docker stop redis-barberzap
	docker rm redis-barberzap

logs: ## Show worker logs (if using systemd/journalctl)
	@echo "$(BLUE)Worker logs:$(NC)"
	journalctl -u barberzap-worker -f || echo "Logs not available via journalctl"

.DEFAULT_GOAL := help
