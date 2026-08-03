from django.urls import path
from . import views

urlpatterns = [
    path('projects/', views.project_list_create, name='project_list_create'),
    path('projects/summary/', views.dashboard_summary, name='dashboard_summary'),
    path('projects/<str:project_id>/', views.project_detail, name='project_detail'),
]
