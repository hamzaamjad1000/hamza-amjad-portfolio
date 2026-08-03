from django.contrib import admin
from .models import CustomUser, EmailVerification

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'username', 'get_auth_type', 'company', 'created_at')
    list_filter = ('created_at', 'role')
    search_fields = ('name', 'email', 'username', 'company')
    readonly_fields = ('id', 'created_at', 'password')
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('id', 'name', 'email', 'username')
        }),
        ('Authentication', {
            'fields': ('password', 'googleId')
        }),
        ('Professional', {
            'fields': ('company', 'role', 'bio')
        }),
        ('Metadata', {
            'fields': ('created_at', 'is_active', 'is_staff')
        }),
    )
    
    def get_auth_type(self, obj):
        if obj.googleId:
            return '🔵 Google'
        return '📧 Email'
    get_auth_type.short_description = 'Auth Type'

@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ('email', 'get_status', 'attempts', 'expires_at', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('email',)
    readonly_fields = ('id', 'code', 'created_at')
    
    def get_status(self, obj):
        from django.utils import timezone
        if timezone.now() > obj.expires_at:
            return '❌ Expired'
        return '⏳ Active'
    get_status.short_description = 'Status'
