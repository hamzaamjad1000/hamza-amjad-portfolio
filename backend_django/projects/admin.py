from django.contrib import admin
from .models import Project, ProjectFile

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'customer', 'status', 'progress', 'budget', 'timeline', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'customer__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Project Info', {
            'fields': ('id', 'customer', 'name', 'description')
        }),
        ('Timeline & Budget', {
            'fields': ('timeline', 'budget')
        }),
        ('Progress Tracking', {
            'fields': ('status', 'progress', 'notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

@admin.register(ProjectFile)
class ProjectFileAdmin(admin.ModelAdmin):
    list_display = ['project', 'file', 'uploaded_at']
    list_filter = ['uploaded_at']
    search_fields = ['project__name']
    readonly_fields = ['id', 'uploaded_at']
