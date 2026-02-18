import os
import sys

# Add the project root to the path so Django can find spotter_backend
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spotter_backend.settings')

from django.core.wsgi import get_wsgi_application
app = get_wsgi_application()
