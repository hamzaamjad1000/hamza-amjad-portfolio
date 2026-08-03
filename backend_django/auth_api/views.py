from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.core.mail import send_mail, EmailMessage
from django.utils import timezone
from datetime import timedelta
import jwt
import random
import time
from google.auth.transport import requests
from google.oauth2 import id_token

from users.models import CustomUser, EmailVerification
from portfolio_config import settings

@api_view(['POST'])
def signup(request):
    """Standard email/password signup"""
    try:
        data = request.data
        name = data.get('name')
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')
        confirm_password = data.get('confirm_password')
        company = data.get('company')
        role = data.get('role')
        bio = data.get('bio')
        user_type = data.get('user_type', 'client')  # Default to 'client'
        
        # Validate user_type
        valid_user_types = ['client', 'admin', 'team_member']
        if user_type not in valid_user_types:
            user_type = 'client'
        
        if not all([name, email, username, password, confirm_password]):
            return Response({'success': False, 'message': 'All fields required'}, status=400)
        
        if password != confirm_password:
            return Response({'success': False, 'message': 'Passwords do not match'}, status=400)
        
        if len(password) < 8:
            return Response({'success': False, 'message': 'Password must be at least 8 characters'}, status=400)
        
        if CustomUser.objects.filter(email=email).exists():
            return Response({'success': False, 'message': 'Email already exists'}, status=409)
        
        if CustomUser.objects.filter(username=username).exists():
            return Response({'success': False, 'message': 'Username already exists'}, status=409)
        
        user = CustomUser.objects.create_user(
            username=username,
            email=email,
            password=password,
            name=name,
            company=company,
            role=role,
            bio=bio,
            user_type=user_type
        )
        
        # Send welcome email
        try:
            send_mail(
                f'Welcome to the Network, {name}!',
                f'Hi {name},\n\nWelcome to my professional network!\n\nUsername: {username}\nEmail: {email}\n\nBest regards,\nHamza Amjad',
                settings.EMAIL_HOST_USER,
                [email],
                fail_silently=True,
            )
        except:
            pass
        
        token = jwt.encode(
            {'id': str(user.id), 'username': user.username, 'email': user.email},
            settings.JWT_SECRET,
            algorithm='HS256'
        )
        
        return Response({
            'success': True,
            'message': 'Account created successfully!',
            'token': token,
            'user': {
                'id': str(user.id),
                'name': user.name,
                'email': user.email,
                'username': user.username,
                'user_type': user.user_type,
            }
        }, status=201)
        
    except Exception as e:
        return Response({'success': False, 'message': str(e)}, status=500)

@api_view(['POST'])
def signin(request):
    """Standard email/password signin"""
    try:
        data = request.data
        username_or_email = data.get('username_or_email')
        password = data.get('password')
        
        if not username_or_email or not password:
            return Response({'success': False, 'message': 'Username/Email and password required'}, status=400)
        
        user = CustomUser.objects.filter(
            username=username_or_email
        ).first() or CustomUser.objects.filter(
            email=username_or_email
        ).first()
        
        if not user or not user.check_password(password):
            return Response({'success': False, 'message': 'Invalid credentials'}, status=401)
        
        token = jwt.encode(
            {'id': str(user.id), 'username': user.username, 'email': user.email},
            settings.JWT_SECRET,
            algorithm='HS256'
        )
        
        return Response({
            'success': True,
            'message': 'Sign in successful!',
            'token': token,
            'user': {
                'id': str(user.id),
                'name': user.name,
                'email': user.email,
                'username': user.username,
                'company': user.company,
                'user_type': user.user_type,
            }
        }, status=200)
        
    except Exception as e:
        return Response({'success': False, 'message': str(e)}, status=500)

@api_view(['POST'])
def google_signin(request):
    """Google OAuth Sign In"""
    try:
        data = request.data
        token = data.get('token')
        
        if not token:
            return Response({'success': False, 'message': 'Token required'}, status=400)
        
        # Verify Google token
        try:
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), settings.GOOGLE_CLIENT_ID)
            # Check that token is from the expected issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Invalid issuer')
        except Exception as e:
            return Response({'success': False, 'message': f'Invalid token: {str(e)}'}, status=401)
        
        email = idinfo.get('email')
        name = idinfo.get('name')
        google_id = idinfo.get('sub')
        
        # Try to find user by email or Google ID
        user = CustomUser.objects.filter(email=email).first()
        if not user:
            user = CustomUser.objects.filter(googleId=google_id).first()
        
        if not user:
            return Response({'success': False, 'message': 'User not found. Please sign up first.'}, status=404)
        
        # Update Google ID if not set
        if not user.googleId:
            user.googleId = google_id
            user.save()
        
        jwt_token = jwt.encode(
            {'id': str(user.id), 'username': user.username, 'email': user.email},
            settings.JWT_SECRET,
            algorithm='HS256'
        )
        
        return Response({
            'success': True,
            'message': 'Google sign in successful!',
            'token': jwt_token,
            'user': {
                'id': str(user.id),
                'name': user.name,
                'email': user.email,
                'username': user.username,
            }
        }, status=200)
        
    except Exception as e:
        return Response({'success': False, 'message': f'Google auth failed: {str(e)}'}, status=401)


@api_view(['POST'])
def google_signup(request):
    """Google OAuth Sign Up"""
    try:
        data = request.data
        token = data.get('token')
        username = data.get('username')
        
        if not token or not username:
            return Response({'success': False, 'message': 'Token and username required'}, status=400)
        
        # Verify Google token
        try:
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), settings.GOOGLE_CLIENT_ID)
            # Check that token is from the expected issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Invalid issuer')
        except Exception as e:
            return Response({'success': False, 'message': f'Invalid token: {str(e)}'}, status=401)
        
        email = idinfo.get('email')
        name = idinfo.get('name')
        google_id = idinfo.get('sub')
        
        # Check if user already exists
        if CustomUser.objects.filter(email=email).exists():
            return Response({'success': False, 'message': 'Email already registered. Please sign in instead.'}, status=409)
        if CustomUser.objects.filter(username=username).exists():
            return Response({'success': False, 'message': 'Username already taken'}, status=409)
        
        # Create new user
        user = CustomUser.objects.create_user(
            username=username,
            email=email,
            name=name,
            googleId=google_id
        )
        
        # Send welcome email
        try:
            send_mail(
                f'Welcome to the Network, {name}!',
                f'Hi {name},\n\nWelcome to my professional network!\n\nUsername: {username}\nEmail: {email}\n\nBest regards,\nHamza Amjad',
                settings.EMAIL_HOST_USER,
                [email],
                fail_silently=True,
            )
        except:
            pass
        
        jwt_token = jwt.encode(
            {'id': str(user.id), 'username': user.username, 'email': user.email},
            settings.JWT_SECRET,
            algorithm='HS256'
        )
        
        return Response({
            'success': True,
            'message': 'Google sign up successful!',
            'token': jwt_token,
            'user': {
                'id': str(user.id),
                'name': user.name,
                'email': user.email,
                'username': user.username,
            }
        }, status=201)
        
    except Exception as e:
        return Response({'success': False, 'message': f'Google auth failed: {str(e)}'}, status=401)


@api_view(['POST'])
def send_verification(request):
    """Send email verification code"""
    try:
        email = request.data.get('email')
        
        if not email:
            return Response({'success': False, 'message': 'Email required'}, status=400)
        
        code = str(random.randint(100000, 999999))
        expires_at = timezone.now() + timedelta(minutes=10)
        
        EmailVerification.objects.update_or_create(
            email=email,
            defaults={
                'code': code,
                'expires_at': expires_at,
                'attempts': 0
            }
        )
        
        # Send email
        send_mail(
            'Email Verification Code',
            f'Your verification code is: {code}\n\nThis code will expire in 10 minutes.',
            settings.EMAIL_HOST_USER,
            [email],
            fail_silently=False,
        )
        
        return Response({'success': True, 'message': 'Verification code sent'}, status=200)
        
    except Exception as e:
        return Response({'success': False, 'message': str(e)}, status=500)

@api_view(['POST'])
def check_email(request):
    """Check if email is available"""
    try:
        email = request.data.get('email')
        
        if not email:
            return Response({'success': False, 'message': 'Email required'}, status=400)
        
        if CustomUser.objects.filter(email=email).exists():
            return Response({'success': False, 'available': False, 'message': 'Email already registered'}, status=409)
        
        return Response({'success': True, 'available': True, 'message': 'Email is available'}, status=200)
        
    except Exception as e:
        return Response({'success': False, 'message': str(e)}, status=500)

@api_view(['POST'])
def verify_email(request):
    """Verify email code"""
    try:
        email = request.data.get('email')
        code = request.data.get('code')
        
        if not email or not code:
            return Response({'success': False, 'message': 'Email and code required'}, status=400)
        
        verification = EmailVerification.objects.filter(email=email).first()
        
        if not verification:
            return Response({'success': False, 'message': 'No verification found'}, status=404)
        
        if timezone.now() > verification.expires_at:
            return Response({'success': False, 'message': 'Code expired'}, status=401)
        
        if verification.code != code:
            verification.attempts += 1
            verification.save()
            return Response({'success': False, 'message': 'Invalid code'}, status=401)
        
        verification.delete()
        
        return Response({'success': True, 'message': 'Email verified'}, status=200)
        
    except Exception as e:
        return Response({'success': False, 'message': str(e)}, status=500)

@api_view(['POST'])
def resend_verification(request):
    """Resend verification code"""
    try:
        email = request.data.get('email')
        
        if not email:
            return Response({'success': False, 'message': 'Email required'}, status=400)
        
        verification = EmailVerification.objects.filter(email=email).first()
        
        if not verification:
            return Response({'success': False, 'message': 'No verification found'}, status=404)
        
        code = str(random.randint(100000, 999999))
        verification.code = code
        verification.expires_at = timezone.now() + timedelta(minutes=10)
        verification.attempts = 0
        verification.save()
        
        # Send email
        send_mail(
            'New Email Verification Code',
            f'Your new verification code is: {code}\n\nThis code will expire in 10 minutes.',
            settings.EMAIL_HOST_USER,
            [email],
            fail_silently=False,
        )
        
        return Response({'success': True, 'message': 'New verification code sent'}, status=200)
        
    except Exception as e:
        return Response({'success': False, 'message': str(e)}, status=500)

@api_view(['GET'])
def dashboard_stats(request):
    """Get dashboard statistics"""
    try:
        total_users = CustomUser.objects.count()
        google_users = CustomUser.objects.exclude(googleId__isnull=True).exclude(googleId='').count()
        email_users = total_users - google_users
        pending_verifications = EmailVerification.objects.count()
        
        return Response({
            'success': True,
            'stats': {
                'totalUsers': total_users,
                'googleUsers': google_users,
                'emailUsers': email_users,
                'pendingVerifications': pending_verifications,
            }
        }, status=200)
        
    except Exception as e:
        return Response({'success': False, 'message': str(e)}, status=500)

@api_view(['GET'])
def list_users(request):
    """List all users"""
    try:
        users = CustomUser.objects.values('id', 'name', 'email', 'username', 'googleId', 'company', 'created_at')
        return Response({
            'success': True,
            'total': len(users),
            'users': list(users)
        }, status=200)
        
    except Exception as e:
        return Response({'success': False, 'message': str(e)}, status=500)

@api_view(['POST'])
def forgot_password(request):
    """Send password reset code to email"""
    try:
        data = request.data
        email = data.get('email')
        
        if not email:
            return Response({'success': False, 'message': 'Email is required'}, status=400)
        
        user = CustomUser.objects.filter(email=email).first()
        if not user:
            # Don't reveal if email exists
            return Response({'success': True, 'message': 'If email exists, a reset code will be sent'}, status=200)
        
        # Generate reset code
        reset_code = str(random.randint(100000, 999999))
        verification = EmailVerification.objects.create(
            user=user,
            code=reset_code,
            purpose='password_reset'
        )
        
        # Send email
        send_mail(
            'Password Reset Code',
            f'Your password reset code is: {reset_code}\n\nThis code expires in 1 hour.',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        
        return Response({
            'success': True,
            'message': 'Password reset code sent to email',
            'email': email
        }, status=200)
        
    except Exception as e:
        return Response({'success': False, 'message': str(e)}, status=500)

@api_view(['POST'])
def reset_password(request):
    """Reset password using code"""
    try:
        data = request.data
        email = data.get('email')
        code = data.get('code')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')
        
        if not all([email, code, new_password, confirm_password]):
            return Response({'success': False, 'message': 'All fields required'}, status=400)
        
        if new_password != confirm_password:
            return Response({'success': False, 'message': 'Passwords do not match'}, status=400)
        
        if len(new_password) < 8:
            return Response({'success': False, 'message': 'Password must be at least 8 characters'}, status=400)
        
        user = CustomUser.objects.filter(email=email).first()
        if not user:
            return Response({'success': False, 'message': 'User not found'}, status=400)
        
        # Verify code
        verification = EmailVerification.objects.filter(
            user=user,
            code=code,
            purpose='password_reset',
            verified=False
        ).first()
        
        if not verification:
            return Response({'success': False, 'message': 'Invalid or expired reset code'}, status=400)
        
        # Check if expired (1 hour)
        if timezone.now() - verification.created_at > timedelta(hours=1):
            return Response({'success': False, 'message': 'Reset code expired'}, status=400)
        
        # Update password
        user.set_password(new_password)
        user.save()
        
        # Mark code as used
        verification.verified = True
        verification.save()
        
        return Response({
            'success': True,
            'message': 'Password reset successfully!'
        }, status=200)
        
    except Exception as e:
        return Response({'success': False, 'message': str(e)}, status=500)

@api_view(['POST'])
def contact(request):
    """Handle contact form submissions and send email"""
    try:
        data = request.data
        # Logging for server terminal
        print("\n" + "="*40)
        print("NEW CONTACT REQUEST RECEIVED")
        print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"From: {data.get('name')} <{data.get('email')}>")
        print(f"Message: {data.get('message')}")
        print("="*40 + "\n")
        
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        subject = data.get('subject', '').strip()
        message = data.get('message', '').strip()
        
        # Validation
        if not all([name, email, subject, message]):
            return Response({'success': False, 'message': 'All fields are required'}, status=400)
        
        if '@' not in email:
            return Response({'success': False, 'message': 'Invalid email address'}, status=400)
        
        ts = time.strftime("%H:%M:%S")
        unique_id = random.randint(1000, 9999)
        
        # 1. SEND SINGLE NOTIFICATION TO PRIMARY EMAIL
        owner_body = (
            f"NOTIFICATION: NEW PORTFOLIO INQUIRY\n"
            f"====================================\n"
            f"Name:    {name}\n"
            f"Email:   {email}\n"
            f"Subject: {subject}\n"
            f"Time:    {ts}\n\n"
            f"MESSAGE:\n"
            f"{message}\n"
            f"===================================="
        )
        
        try:
            msg_owner = EmailMessage(
                subject=f"🔴 [INQUIRY] {name} - {subject} (#{unique_id})",
                body=owner_body,
                from_email=settings.EMAIL_HOST_USER,
                to=['sheikh.hamza2905@gmail.com'],
                cc=['hamza.amjad.careers@gmail.com'],
                reply_to=[email],
                headers={'X-Priority': '1'}
            )
            msg_owner.send(fail_silently=False)
            print("✅ Owner notification email sent successfully to sheikh.hamza2905@gmail.com")
            print("✅ CC sent to hamza.amjad.careers@gmail.com")
        except Exception as email_error:
            print(f"❌ FAILED to send owner email: {str(email_error)}")
            raise
        
        # 2. SEND SINGLE CONFIRMATION TO USER
        user_subject = "Message Received - Hamza Amjad"
        user_body = f"Hello {name},\n\nThank you for reaching out! I have received your message regarding \"{subject}\".\n\nI will review your inquiry and get back to you at {email} as soon as possible.\n\n---\nYour Message:\n{message}\n\nBest regards,\nHamza Amjad"
        
        try:
            send_mail(
                user_subject,
                user_body,
                settings.EMAIL_HOST_USER,
                [email],
                fail_silently=False,
            )
            print(f"✅ User confirmation email sent successfully to {email}")
        except Exception as email_error:
            print(f"❌ FAILED to send user email: {str(email_error)}")
            raise
        
        return Response({
            'success': True, 
            'message': 'Your message has been sent successfully!'
        }, status=200)
        
    except Exception as e:
        print(f"CRITICAL ERROR in Contact View: {str(e)}")
        return Response({'success': False, 'message': f'Server Error: {str(e)}'}, status=500)
