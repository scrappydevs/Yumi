# Gunicorn configuration file for production deployment
import os

# Server socket - bind to PORT environment variable
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
backlog = 2048

# Worker processes - use 2 workers (good for Render Starter plan)
workers = int(os.getenv('WEB_CONCURRENCY', '2'))
worker_class = 'uvicorn.workers.UvicornWorker'
worker_connections = 1000
timeout = 120  # Increased timeout for AI processing
keepalive = 5

# Restart workers after this many requests (helps with memory leaks)
max_requests = 1000
max_requests_jitter = 50

# Logging
accesslog = '-'  # Log to stdout
errorlog = '-'   # Log to stderr
loglevel = 'info'

# Process naming
proc_name = 'yummy-backend'

# Server mechanics
daemon = False
pidfile = None
user = None
group = None
tmp_upload_dir = None

