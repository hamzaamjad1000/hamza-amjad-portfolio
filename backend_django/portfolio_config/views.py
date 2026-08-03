from django.shortcuts import render
from django.views.generic import TemplateView
from django.http import Http404

class HomeView(TemplateView):
    template_name = 'index.html'

class PageView(TemplateView):
    def get_template_names(self):
        # Get the page name from URL parameter
        page = self.kwargs.get('page', 'index.html')
        # Only allow .html files to prevent directory traversal
        if not page.endswith('.html'):
            page += '.html'
        return [page]

