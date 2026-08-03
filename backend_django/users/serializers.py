from rest_framework import serializers
from .models import CustomUser, TeamMember, ClientAssignment, AccessRequest, ActivityLog

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'name', 'company', 'role', 'bio', 'profile_image', 'address', 'contact_number', 'location', 'payment_info', 'user_type']
        read_only_fields = ['id', 'username', 'email']

class TeamMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = TeamMember
        fields = ['id', 'user', 'department', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class ClientAssignmentSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    team_member_name = serializers.CharField(source='team_member.name', read_only=True)
    
    class Meta:
        model = ClientAssignment
        fields = ['id', 'client', 'client_name', 'team_member', 'team_member_name', 'assigned_at']
        read_only_fields = ['id', 'assigned_at']

class AccessRequestSerializer(serializers.ModelSerializer):
    team_member_name = serializers.CharField(source='team_member.name', read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True)
    
    class Meta:
        model = AccessRequest
        fields = ['id', 'team_member', 'team_member_name', 'client', 'client_name', 'status', 'reason', 'requested_at', 'reviewed_at']
        read_only_fields = ['id', 'requested_at', 'reviewed_at']

class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'user_name', 'client', 'client_name', 'action', 'field_name', 'old_value', 'new_value', 'timestamp']
        read_only_fields = ['id', 'timestamp']

