
#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

BACKEND_PID=""
FRONTEND_PID=""

echo -e "${BLUE}[FinRecon DX] Initializing boot sequence...${NC}"

cleanup() {
    echo -e "\n${RED}[FinRecon DX] Initiating shutdown sequence...${NC}"

    # Prevent repeated cleanup calls
    trap - SIGINT SIGTERM

    if [[ -n "$FRONTEND_PID" ]]; then
        echo "Stopping Next.js Frontend (Process Group: $FRONTEND_PID)..."
        kill -TERM -- "-$FRONTEND_PID" 2>/dev/null || true
    fi

    if [[ -n "$BACKEND_PID" ]]; then
        echo "Stopping FastAPI Backend (Process Group: $BACKEND_PID)..."
        kill -TERM -- "-$BACKEND_PID" 2>/dev/null || true
    fi

    # Wait for the process-group leaders to exit
    [[ -n "$FRONTEND_PID" ]] && wait "$FRONTEND_PID" 2>/dev/null || true
    [[ -n "$BACKEND_PID" ]] && wait "$BACKEND_PID" 2>/dev/null || true

    echo -e "${GREEN}All services stopped. Goodbye!${NC}"
    exit 0
}

# Register cleanup before starting services
trap cleanup SIGINT SIGTERM

# Start FastAPI Backend
echo -e "${GREEN}[1/2] Booting FastAPI Backend...${NC}"

setsid bash -c '
    cd "$1" && exec uv run uvicorn main:app --reload --port 8000
' _ "$ROOT_DIR/backend" &

BACKEND_PID=$!

sleep 1

# Start Next.js Frontend
echo -e "${GREEN}[2/2] Booting Next.js Frontend...${NC}"

setsid bash -c '
    cd "$1" && exec npm run dev
' _ "$ROOT_DIR/frontend" &

FRONTEND_PID=$!

echo -e "\n${BLUE}===================================================${NC}"
echo -e "${GREEN}🚀 FINRECON IS LIVE${NC}"
echo -e "UI: http://localhost:3000"
echo -e "API: http://localhost:8000"
echo -e "${BLUE}===================================================${NC}"
echo -e "${RED}Press Ctrl+C to safely shutdown all services.${NC}"

wait
