"""
URL configuration for portfolio_config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from .views import HomeView, PageView

urlpatterns = [
    path('', HomeView.as_view(), name='home'),
    re_path(r'^(?P<page>[\w-]+)\.html$', PageView.as_view(), name='page'),
    path('admin/', admin.site.urls),
    path('api/', include('auth_api.urls')),
    path('api/', include('projects.urls')),
    path('api/users/', include('users.urls')),
    path('api/chatbot/', include('chatbot.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    # Serve frontend static files
    urlpatterns += static('/src/', document_root=settings.BASE_DIR.parent / 'frontend' / 'src')
    urlpatterns += static('/public/', document_root=settings.BASE_DIR.parent / 'frontend' / 'public')
    # Serve profile image and other frontend files
    urlpatterns += static('/', document_root=settings.BASE_DIR.parent / 'frontend')

