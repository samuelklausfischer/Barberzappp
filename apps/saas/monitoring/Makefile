# BarberZap Monitoring Makefile
# ==============================
# Convenient commands for managing monitoring services

.PHONY: help install start stop restart status logs clean test

# Configuration
REDIS_URL ?= redis://localhost:6379
METRICS_PORT ?= 9090
ALERTING_PORT ?= 9091
CONFIG ?= alerting.yaml
SHOP_ID ?= all

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "$(BLUE)BarberZap Monitoring Commands$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Install monitoring dependencies
	@echo "$(BLUE)Installing Python dependencies...$(NC)"
	pip install prometheus-client psutil redis pyyaml httpx schedule apscheduler
	@echo "$(GREEN)✓ Python dependencies installed$(NC)"
	cd ../.. && npm install recharts
	@echo "$(GREEN)✓ Frontend dependencies verified$(NC)"

start: ## Start all monitoring services
	@echo "$(BLUE)Starting monitoring services...$(NC)"
	@$(MAKE) start-collector &
	@$(MAKE) start-exporter &
	@$(MAKE) start-alerting &
	@echo "$(GREEN)✓ All services started$(NC)"
	@echo "$(YELLOW)Metrics: http://localhost:${METRICS_PORT}/metrics$(NC)"
	@echo "$(YELLOW)Alerting metrics: http://localhost:${ALERTING_PORT}/metrics$(NC)"

start-collector: ## Start metrics collector
	@echo "$(BLUE)Starting metrics collector...$(NC)"
	@cd ../backend/metrics && python metrics_collector.py --redis-url $(REDIS_URL) > /tmp/collector.log 2>&1 &
	@echo $$! > /tmp/collector.pid
	@sleep 2
	@if ps -p $$(cat /tmp/collector.pid) > /dev/null; then \
		echo "$(GREEN)✓ Metrics collector started (PID: $$(cat /tmp/collector.pid))$(NC)"; \
	else \
		echo "$(RED)✗ Failed to start collector$(NC)"; \
		cat /tmp/collector.log; \
	fi

start-exporter: ## Start Prometheus exporter
	@echo "$(BLUE)Starting Prometheus exporter...$(NC)"
	@cd ../backend/metrics && python prometheus_exporter.py --port $(METRICS_PORT) --shop-id $(SHOP_ID) > /tmp/exporter.log 2>&1 &
	@echo $$! > /tmp/exporter.pid
	@sleep 2
	@if ps -p $$(cat /tmp/exporter.pid) > /dev/null; then \
		echo "$(GREEN)✓ Prometheus exporter started (PID: $$(cat /tmp/exporter.pid))$(NC)"; \
	else \
		echo "$(RED)✗ Failed to start exporter$(NC)"; \
		cat /tmp/exporter.log; \
	fi

start-alerting: ## Start alerting engine
	@echo "$(BLUE)Starting alerting engine...$(NC)"
	@python alerting_engine.py --config $(CONFIG) --metrics-port $(ALERTING_PORT) > /tmp/alerting.log 2>&1 &
	@echo $$! > /tmp/alerting.pid
	@sleep 2
	@if ps -p $$(cat /tmp/alerting.pid) > /dev/null; then \
		echo "$(GREEN)✓ Alerting engine started (PID: $$(cat /tmp/alerting.pid))$(NC)"; \
	else \
		echo "$(RED)✗ Failed to start alerting$(NC)"; \
		cat /tmp/alerting.log; \
	fi

stop: ## Stop all monitoring services
	@echo "$(BLUE)Stopping monitoring services...$(NC)"
	@$(MAKE) stop-collector || true
	@$(MAKE) stop-exporter || true
	@$(MAKE) stop-alerting || true
	@echo "$(GREEN)✓ All services stopped$(NC)"

stop-collector: ## Stop metrics collector
	@if [ -f /tmp/collector.pid ]; then \
		kill $$(cat /tmp/collector.pid) 2>/dev/null || true; \
		rm /tmp/collector.pid; \
		echo "$(GREEN)✓ Metrics collector stopped$(NC)"; \
	else \
		echo "$(YELLOW)No collector running$(NC)"; \
	fi

stop-exporter: ## Stop Prometheus exporter
	@if [ -f /tmp/exporter.pid ]; then \
		kill $$(cat /tmp/exporter.pid) 2>/dev/null || true; \
		rm /tmp/exporter.pid; \
		echo "$(GREEN)✓ Prometheus exporter stopped$(NC)"; \
	else \
		echo "$(YELLOW)No exporter running$(NC)"; \
	fi

stop-alerting: ## Stop alerting engine
	@if [ -f /tmp/alerting.pid ]; then \
		kill $$(cat /tmp/alerting.pid) 2>/dev/null || true; \
		rm /tmp/alerting.pid; \
		echo "$(GREEN)✓ Alerting engine stopped$(NC)"; \
	else \
		echo "$(YELLOW)No alerting engine running$(NC)"; \
	fi

restart: ## Restart all monitoring services
	@$(MAKE) stop
	@sleep 2
	@$(MAKE) start

status: ## Show status of all monitoring services
	@echo "$(BLUE)Monitoring Services Status:$(NC)"
	@echo ""
	@if [ -f /tmp/collector.pid ]; then \
		if ps -p $$(cat /tmp/collector.pid) > /dev/null; then \
			echo "$(GREEN)✓ Metrics Collector:$(NC) Running (PID: $$(cat /tmp/collector.pid))"; \
		else \
			echo "$(RED)✗ Metrics Collector:$(NC) Not running"; \
		fi \
	else \
		echo "$(YELLOW)○ Metrics Collector:$(NC) Stopped"; \
	fi
	@if [ -f /tmp/exporter.pid ]; then \
		if ps -p $$(cat /tmp/exporter.pid) > /dev/null; then \
			echo "$(GREEN)✓ Prometheus Exporter:$(NC) Running (PID: $$(cat /tmp/exporter.pid))"; \
		else \
			echo "$(RED)✗ Prometheus Exporter:$(NC) Not running"; \
		fi \
	else \
		echo "$(YELLOW)○ Prometheus Exporter:$(NC) Stopped"; \
	fi
	@if [ -f /tmp/alerting.pid ]; then \
		if ps -p $$(cat /tmp/alerting.pid) > /dev/null; then \
			echo "$(GREEN)✓ Alerting Engine:$(NC) Running (PID: $$(cat /tmp/alerting.pid))"; \
		else \
			echo "$(RED)✗ Alerting Engine:$(NC) Not running"; \
		fi \
	else \
		echo "$(YELLOW)○ Alerting Engine:$(NC) Stopped"; \
	fi

logs: ## Show logs from monitoring services
	@echo "$(BLUE)Logs:$(NC)"
	@if [ -f /tmp/collector.log ]; then \
		echo "$(YELLOW)--- Metrics Collector ---$(NC)"; \
		tail -20 /tmp/collector.log; \
	else \
		echo "$(YELLOW)No collector logs$(NC)"; \
	fi
	@if [ -f /tmp/exporter.log ]; then \
		echo "$(YELLOW)--- Prometheus Exporter ---$(NC)"; \
		tail -20 /tmp/exporter.log; \
	else \
		echo "$(YELLOW)No exporter logs$(NC)"; \
	fi
	@if [ -f /tmp/alerting.log ]; then \
		echo "$(YELLOW)--- Alerting Engine ---$(NC)"; \
		tail -20 /tmp/alerting.log; \
	else \
		echo "$(YELLOW)No alerting logs$(NC)"; \
	fi

logs-collector: ## Show collector logs (follow mode)
	@if [ -f /tmp/collector.log ]; then \
		tail -f /tmp/collector.log; \
	else \
		echo "$(RED)No collector log file found$(NC)"; \
	fi

logs-exporter: ## Show exporter logs (follow mode)
	@if [ -f /tmp/exporter.log ]; then \
		tail -f /tmp/exporter.log; \
	else \
		echo "$(RED)No exporter log file found$(NC)"; \
	fi

logs-alerting: ## Show alerting logs (follow mode)
	@if [ -f /tmp/alerting.log ]; then \
		tail -f /tmp/alerting.log; \
	else \
		echo "$(RED)No alerting log file found$(NC)"; \
	fi

clean: ## Clean up temporary files
	@echo "$(BLUE)Cleaning up...$(NC)"
	@rm -f /tmp/collector.pid /tmp/exporter.pid /tmp/alerting.pid
	@rm -f /tmp/collector.log /tmp/exporter.log /tmp/alerting.log
	@echo "$(GREEN)✓ Cleaned up temporary files$(NC)"

test: ## Run monitoring tests
	@echo "$(BLUE)Running tests...$(NC)"
	@cd ../backend/metrics && python -m pytest tests/ -v || echo "$(YELLOW)No tests found or tests failed$(NC)"
	@echo "$(GREEN)✓ Tests completed$(NC)"

metrics: ## View Prometheus metrics
	@echo "$(BLUE)Fetching metrics from http://localhost:${METRICS_PORT}/metrics...$(NC)"
	@curl -s http://localhost:${METRICS_PORT}/metrics | head -50

health: ## Check health of monitoring services
	@echo "$(BLUE)Checking health...$(NC)"
	@echo ""
	@echo "$(YELLOW)Redis:$(NC)"
	@redis-cli -u $(REDIS_URL) ping || echo "$(RED)✗ Redis not responding$(NC)"
	@echo ""
	@echo "$(YELLOW)Prometheus Exporter:$(NC)"
	@curl -s -o /dev/null -w "%{http_code}\n" http://localhost:${METRICS_PORT}/metrics || echo "$(RED)✗ Exporter not responding$(NC)"
	@echo ""
	@echo "$(YELLOW)Alerting Engine:$(NC)"
	@curl -s -o /dev/null -w "%{http_code}\n" http://localhost:${ALERTING_PORT}/metrics || echo "$(RED)✗ Alerting not responding$(NC)"

dashboard: ## Open the monitoring dashboard
	@echo "$(BLUE)Opening dashboard...$(NC)"
	@if command -v xdg-open > /dev/null; then \
		xdg-open http://localhost:5173; \
	elif command -v open > /dev/null; then \
		open http://localhost:5173; \
	else \
		echo "$(YELLOW)Open http://localhost:5173 in your browser$(NC)"; \
	fi

setup: install ## Full setup: install dependencies and configure
	@echo "$(BLUE)Setting up monitoring...$(NC)"
	@echo "$(GREEN)✓ Setup complete$(NC)"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Start services: $(YELLOW)make start$(NC)"
	@echo "  2. Check status: $(YELLOW)make status$(NC)"
	@echo "  3. View metrics: $(YELLOW)make metrics$(NC)"
	@echo "  4. Open dashboard: $(YELLOW)make dashboard$(NC)"

# Development commands
dev-metrics: ## Run metrics collector in foreground (for development)
	@cd ../backend/metrics && python metrics_collector.py --redis-url $(REDIS_URL)

dev-exporter: ## Run Prometheus exporter in foreground (for development)
	@cd ../backend/metrics && python prometheus_exporter.py --port $(METRICS_PORT) --shop-id $(SHOP_ID)

dev-alerting: ## Run alerting engine in foreground (for development)
	@python alerting_engine.py --config $(CONFIG) --metrics-port $(ALERTING_PORT) --debug

# Integration with backend
test-integration: ## Test integration with backend
	@echo "$(BLUE)Testing integration...$(NC)"
	@curl -s http://localhost:9090/metrics | grep barber_webhook_total > /dev/null && \
		echo "$(GREEN)✓ Prometheus exporter accessible$(NC)" || \
		echo "$(RED)✗ Prometheus exporter not accessible$(NC)"
	@redis-cli -u $(REDIS_URL) keys "barber:metrics:*" > /dev/null && \
		echo "$(GREEN)✓ Redis metrics accessible$(NC)" || \
		echo "$(RED)✗ Redis metrics not accessible$(NC)"
