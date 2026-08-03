from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from openai import OpenAI
from decouple import config
import json

# Initialize OpenRouter with OpenAI-compatible client
api_key = config('OPENROUTER_API_KEY', '')
client = OpenAI(
    api_key=api_key,
    base_url="https://openrouter.io/api/v1",
    default_headers={
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Hamza Portfolio",
    }
)

SYSTEM_PROMPT = """You are Hamza Amjad's Portfolio Assistant. You are knowledgeable about:
- Hamza's professional background and skills
- His projects and technical expertise
- AI, Machine Learning, Full Stack Development
- His education and experience
- Contact information: hamza.amjad.careers@gmail.com

Always be helpful, professional, and direct visitors to contact Hamza for detailed discussions.
Keep responses concise and relevant to portfolio inquiries."""

@csrf_exempt
@require_http_methods(["POST"])
def chat(request):
    """Chat endpoint powered by OpenRouter (free models)"""
    try:
        data = json.loads(request.body)
        message = data.get('message', '').strip()
        
        if not message:
            return JsonResponse({
                'success': False,
                'message': 'Message cannot be empty'
            }, status=400)
        
        if not api_key:
            return JsonResponse({
                'success': False,
                'message': 'AI service not configured'
            }, status=503)
        
        # Call OpenRouter API with free model (Google Gemini 2B Flash)
        response = client.chat.completions.create(
            model='google/gemini-2b-flash-exp:free',
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': message}
            ],
            max_tokens=150,
            temperature=0.7
        )
        
        reply = response.choices[0].message.content.strip()
        
        return JsonResponse({
            'success': True,
            'message': reply
        }, status=200)
        
    except Exception as e:
        error_msg = str(e)
        print(f"Chatbot error: {error_msg}")
        print(f"Error type: {type(e).__name__}")
        return JsonResponse({
            'success': False,
            'message': error_msg
        }, status=500)
