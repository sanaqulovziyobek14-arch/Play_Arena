from django.urls import path
from . import views

urlpatterns = [
    path('',          views.SportListView.as_view(),  name='sport-list'),
    path('<slug:slug>/', views.SportDetailView.as_view(), name='sport-detail'),
]