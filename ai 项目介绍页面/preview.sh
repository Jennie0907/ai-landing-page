#!/usr/bin/env bash
# 本地预览 MEXC 落地页
cd "$(dirname "$0")"
PORT="${PORT:-8765}"
echo "预览地址: http://127.0.0.1:${PORT}/"
echo "按 Ctrl+C 停止服务"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
