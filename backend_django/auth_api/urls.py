from django.urls import path
from . import views

urlpatterns = [
    # Auth endpoints
    path('auth/signup/', views.signup, name='signup'),
    path('auth/signin/', views.signin, name='signin'),
    path('auth/google-signin/', views.google_signin, name='google-signin'),
    path('auth/google-signup/', views.google_signup, name='google-signup'),
    path('auth/check-email/', views.check_email, name='check-email'),
    
    # Email verification
    path('auth/send-verification/', views.send_verification, name='send-verification'),
    path('auth/verify-email/', views.verify_email, name='verify-email'),
    path('auth/resend-verification/', views.resend_verification, name='resend-verification'),
    
    # Password reset
    path('auth/forgot-password/', views.forgot_password, name='forgot-password'),
    path('auth/reset-password/', views.reset_password, name='reset-password'),
    
    # Admin stats
    path('admin/dashboard/', views.dashboard_stats, name='dashboard'),
    path('admin/users/', views.list_users, name='list-users'),
    
    # Contact form
    path('contact/', views.contact, name='contact'),
]
