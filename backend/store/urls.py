from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    LoginView,
    OrderCreateView,
    OrderViewSet,
    ProductViewSet,
    GuestOrderTrackingView,
    UserDetailView,
    CategoryViewSet,
)

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'categories', CategoryViewSet, basename='category')

urlpatterns = [
    path('orders/create/', OrderCreateView.as_view(), name='order-create'),
    path('orders/track/<uuid:token>/', GuestOrderTrackingView.as_view(), name='guest-order-track'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/me/', UserDetailView.as_view(), name='auth-me'),
    path('', include(router.urls)),
]
