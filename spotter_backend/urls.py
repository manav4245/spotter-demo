from django.urls import path, include

urlpatterns = [
    path('api/', include('hos_engine.urls')),
]
