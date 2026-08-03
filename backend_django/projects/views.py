from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
import jwt
from django.conf import settings
from .models import Project, ProjectFile
from .serializers import ProjectSerializer, ProjectCreateSerializer, ProjectUpdateSerializer

def get_user_from_token(request):
    """Extract user from JWT token in Authorization header"""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=['HS256'])
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.get(id=payload['id'])
        return user
    except:
        return None

@api_view(['GET', 'POST'])
@parser_classes((MultiPartParser, FormParser))
def project_list_create(request):
    """Get all projects for authenticated user or create new project"""
    user = get_user_from_token(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if request.method == 'GET':
        projects = Project.objects.filter(customer=user)
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ProjectCreateSerializer(data=request.data)
        if serializer.is_valid():
            project = serializer.save(customer=user)
            
            # Handle file uploads
            files = request.FILES.getlist('files')
            for file in files:
                ProjectFile.objects.create(project=project, file=file)
            
            return Response(ProjectSerializer(project).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
def project_detail(request, project_id):
    """Get, update, or delete a specific project"""
    user = get_user_from_token(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        project = Project.objects.get(id=project_id, customer=user)
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = ProjectSerializer(project)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = ProjectUpdateSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(ProjectSerializer(project).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        project.delete()
        return Response({'message': 'Project deleted'}, status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
def dashboard_summary(request):
    """Get dashboard summary for authenticated user"""
    user = get_user_from_token(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    projects = Project.objects.filter(customer=user)
    total_projects = projects.count()
    completed_projects = projects.filter(status='completed').count()
    in_progress = projects.filter(status='in_progress').count()
    total_budget = sum(p.budget for p in projects)
    avg_progress = sum(p.progress for p in projects) / total_projects if total_projects > 0 else 0
    
    return Response({
        'total_projects': total_projects,
        'completed_projects': completed_projects,
        'in_progress': in_progress,
        'total_budget': float(total_budget),
        'average_progress': int(avg_progress),
    })
