from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import CustomUser, TeamMember, ClientAssignment, AccessRequest, ActivityLog
from .serializers import UserSerializer, TeamMemberSerializer, ClientAssignmentSerializer, AccessRequestSerializer, ActivityLogSerializer
from portfolio_config import settings
import jwt
from datetime import datetime

def get_user_from_token(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=['HS256'])
        user = CustomUser.objects.get(id=payload['id'])
        return user
    except:
        return None

@api_view(['GET', 'PUT', 'PATCH'])
def profile_view(request):
    user = get_user_from_token(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response({'success': True, 'user': serializer.data})
    
    elif request.method in ['PUT', 'PATCH']:
        serializer = UserSerializer(user, data=request.data, partial=(request.method == 'PATCH'))
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'message': 'Profile updated successfully', 'user': serializer.data})
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

# ========== ADMIN ENDPOINTS ==========

@api_view(['GET'])
def admin_all_clients(request):
    """Admin: Get all clients"""
    user = get_user_from_token(request)
    if not user or user.user_type != 'admin':
        return Response({'success': False, 'message': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    clients = CustomUser.objects.filter(user_type='client')
    serializer = UserSerializer(clients, many=True)
    return Response({'success': True, 'clients': serializer.data})

@api_view(['GET', 'PUT'])
def admin_client_detail(request, client_id):
    """Admin: Get/Update specific client data"""
    user = get_user_from_token(request)
    if not user or user.user_type != 'admin':
        return Response({'success': False, 'message': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        client = CustomUser.objects.get(id=client_id, user_type='client')
    except CustomUser.DoesNotExist:
        return Response({'success': False, 'message': 'Client not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = UserSerializer(client)
        return Response({'success': True, 'client': serializer.data})
    
    elif request.method == 'PUT':
        serializer = UserSerializer(client, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Log activity
            ActivityLog.objects.create(
                user=user,
                client=client,
                action='update',
                field_name='profile',
                new_value=str(request.data)
            )
            
            return Response({'success': True, 'message': 'Client updated', 'client': serializer.data})
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
def admin_team_members(request):
    """Admin: Get all team members or create new one"""
    user = get_user_from_token(request)
    if not user or user.user_type != 'admin':
        return Response({'success': False, 'message': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if request.method == 'GET':
        team_members = TeamMember.objects.filter(admin=user)
        serializer = TeamMemberSerializer(team_members, many=True)
        return Response({'success': True, 'team_members': serializer.data})
    
    elif request.method == 'POST':
        # Create team member user first
        try:
            team_user = CustomUser.objects.create_user(
                username=request.data.get('username'),
                email=request.data.get('email'),
                name=request.data.get('name'),
                user_type='team_member',
                password=request.data.get('password')
            )
            
            team_member = TeamMember.objects.create(
                user=team_user,
                admin=user,
                department=request.data.get('department', '')
            )
            
            serializer = TeamMemberSerializer(team_member)
            return Response({'success': True, 'message': 'Team member created', 'team_member': serializer.data}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST', 'GET'])
def admin_assign_client(request):
    """Admin: Assign client to team member"""
    user = get_user_from_token(request)
    if not user or user.user_type != 'admin':
        return Response({'success': False, 'message': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if request.method == 'GET':
        assignments = ClientAssignment.objects.filter(assigned_by=user)
        serializer = ClientAssignmentSerializer(assignments, many=True)
        return Response({'success': True, 'assignments': serializer.data})
    
    elif request.method == 'POST':
        try:
            client = CustomUser.objects.get(id=request.data.get('client_id'))
            team_member = CustomUser.objects.get(id=request.data.get('team_member_id'))
            
            assignment, created = ClientAssignment.objects.get_or_create(
                client=client,
                team_member=team_member,
                assigned_by=user
            )
            
            if created:
                return Response({'success': True, 'message': 'Client assigned to team member'}, status=status.HTTP_201_CREATED)
            else:
                return Response({'success': False, 'message': 'Assignment already exists'}, status=status.HTTP_400_BAD_REQUEST)
        except CustomUser.DoesNotExist:
            return Response({'success': False, 'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET', 'PUT'])
def admin_access_requests(request):
    """Admin: Get access requests and approve/deny them"""
    user = get_user_from_token(request)
    if not user or user.user_type != 'admin':
        return Response({'success': False, 'message': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if request.method == 'GET':
        # Get access requests for clients under this admin
        team_members = TeamMember.objects.filter(admin=user).values_list('user_id', flat=True)
        requests = AccessRequest.objects.filter(team_member_id__in=team_members)
        serializer = AccessRequestSerializer(requests, many=True)
        return Response({'success': True, 'requests': serializer.data})
    
    elif request.method == 'PUT':
        # Review access request
        try:
            access_request = AccessRequest.objects.get(id=request.data.get('request_id'))
            access_request.status = request.data.get('status')  # 'approved' or 'denied'
            access_request.reviewed_at = datetime.now()
            access_request.reviewed_by = user
            access_request.save()
            
            # If approved, create assignment
            if access_request.status == 'approved':
                ClientAssignment.objects.get_or_create(
                    client=access_request.client,
                    team_member=access_request.team_member,
                    assigned_by=user
                )
            
            serializer = AccessRequestSerializer(access_request)
            return Response({'success': True, 'message': 'Access request reviewed', 'request': serializer.data})
        except AccessRequest.DoesNotExist:
            return Response({'success': False, 'message': 'Request not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def admin_activity_log(request, client_id):
    """Admin: View activity log for a specific client"""
    user = get_user_from_token(request)
    if not user or user.user_type != 'admin':
        return Response({'success': False, 'message': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        client = CustomUser.objects.get(id=client_id)
        logs = ActivityLog.objects.filter(client=client).order_by('-timestamp')[:100]
        serializer = ActivityLogSerializer(logs, many=True)
        return Response({'success': True, 'logs': serializer.data})
    except CustomUser.DoesNotExist:
        return Response({'success': False, 'message': 'Client not found'}, status=status.HTTP_404_NOT_FOUND)

# ========== TEAM MEMBER ENDPOINTS ==========

@api_view(['GET'])
def team_assigned_clients(request):
    """Team Member: Get assigned clients"""
    user = get_user_from_token(request)
    if not user or user.user_type != 'team_member':
        return Response({'success': False, 'message': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    assignments = ClientAssignment.objects.filter(team_member=user)
    clients = [assignment.client for assignment in assignments]
    serializer = UserSerializer(clients, many=True)
    return Response({'success': True, 'assigned_clients': serializer.data})

@api_view(['GET', 'PUT'])
def team_client_detail(request, client_id):
    """Team Member: View/Update assigned client data"""
    user = get_user_from_token(request)
    if not user or user.user_type != 'team_member':
        return Response({'success': False, 'message': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    # Check if team member is assigned to this client
    try:
        assignment = ClientAssignment.objects.get(team_member=user, client_id=client_id)
        client = assignment.client
    except ClientAssignment.DoesNotExist:
        return Response({'success': False, 'message': 'You do not have access to this client'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        serializer = UserSerializer(client)
        return Response({'success': True, 'client': serializer.data})
    
    elif request.method == 'PUT':
        # Team members can only update specific fields
        allowed_fields = ['role', 'bio', 'contact_number']
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        
        serializer = UserSerializer(client, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Log activity
            ActivityLog.objects.create(
                user=user,
                client=client,
                action='update',
                field_name=', '.join(data.keys()),
                new_value=str(data)
            )
            
            return Response({'success': True, 'message': 'Client updated', 'client': serializer.data})
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST', 'GET'])
def team_request_access(request):
    """Team Member: Request access to additional client"""
    user = get_user_from_token(request)
    if not user or user.user_type != 'team_member':
        return Response({'success': False, 'message': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if request.method == 'GET':
        requests = AccessRequest.objects.filter(team_member=user)
        serializer = AccessRequestSerializer(requests, many=True)
        return Response({'success': True, 'requests': serializer.data})
    
    elif request.method == 'POST':
        try:
            client = CustomUser.objects.get(id=request.data.get('client_id'))
            
            access_request, created = AccessRequest.objects.get_or_create(
                team_member=user,
                client=client,
                defaults={'reason': request.data.get('reason', '')}
            )
            
            if created:
                return Response({'success': True, 'message': 'Access request sent to admin'}, status=status.HTTP_201_CREATED)
            else:
                return Response({'success': False, 'message': 'Request already exists'}, status=status.HTTP_400_BAD_REQUEST)
        except CustomUser.DoesNotExist:
            return Response({'success': False, 'message': 'Client not found'}, status=status.HTTP_404_NOT_FOUND)

