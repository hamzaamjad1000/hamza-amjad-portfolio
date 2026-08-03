from django.urls import path
from .views import (
    profile_view,
    # Admin endpoints
    admin_all_clients,
    admin_client_detail,
    admin_team_members,
    admin_assign_client,
    admin_access_requests,
    admin_activity_log,
    # Team member endpoints
    team_assigned_clients,
    team_client_detail,
    team_request_access,
)

urlpatterns = [
    path('profile/', profile_view, name='profile'),
    
    # Admin routes
    path('admin/clients/', admin_all_clients, name='admin_all_clients'),
    path('admin/clients/<str:client_id>/', admin_client_detail, name='admin_client_detail'),
    path('admin/team-members/', admin_team_members, name='admin_team_members'),
    path('admin/assign-client/', admin_assign_client, name='admin_assign_client'),
    path('admin/access-requests/', admin_access_requests, name='admin_access_requests'),
    path('admin/activity-log/<str:client_id>/', admin_activity_log, name='admin_activity_log'),
    
    # Team member routes
    path('team/assigned-clients/', team_assigned_clients, name='team_assigned_clients'),
    path('team/client/<str:client_id>/', team_client_detail, name='team_client_detail'),
    path('team/request-access/', team_request_access, name='team_request_access'),
]

