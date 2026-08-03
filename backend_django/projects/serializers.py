from rest_framework import serializers
from .models import Project, ProjectFile, ProjectPhase, ProjectActivity

class ProjectFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectFile
        fields = ['id', 'file', 'uploaded_at']

class ProjectPhaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectPhase
        fields = ['id', 'name', 'description', 'status', 'order']

class ProjectActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectActivity
        fields = ['id', 'description', 'activity_type', 'timestamp']

class ProjectSerializer(serializers.ModelSerializer):
    files = ProjectFileSerializer(many=True, read_only=True)
    phases = ProjectPhaseSerializer(many=True, read_only=True)
    activities = ProjectActivitySerializer(many=True, read_only=True)
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'timeline', 'budget', 'progress', 'status', 'notes', 'current_phase', 'files', 'phases', 'activities', 'created_at', 'updated_at']

class ProjectCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['name', 'description', 'timeline', 'budget']

class ProjectUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['progress', 'status', 'notes', 'current_phase']
