import os
import sys

# On Vercel, api/index.py lives at /var/task/api/index.py
# The project root (containing spotter_backend/) is one level up
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root not in sys.path:
    sys.path.insert(0, root)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spotter_backend.settings')

from django.core.wsgi import get_wsgi_application
app = get_wsgi_application()
