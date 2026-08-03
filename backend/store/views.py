from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.core.mail import send_mail
import logging
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Order, Product
from .models import Category
from .serializers import (
    OrderCreateSerializer,
    OrderSerializer,
    ProductSerializer,
    CategorySerializer,
)

User = get_user_model()
logger = logging.getLogger(__name__)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('id')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdminUser()]

    def get_serializer_class(self):
        from .serializers import AdminProductSerializer

        if self.action in ['create', 'update', 'partial_update']:
            return AdminProductSerializer
        return ProductSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdminUser()]


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return self.queryset
        if user.is_authenticated:
            return self.queryset.filter(user=user)
        return self.queryset.none()

    def get_permissions(self):
        if self.action == 'retrieve':
            return [IsAuthenticated()]
        # only admins can list/update/delete orders
        if self.action in ['list', 'partial_update', 'update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.AllowAny()]


class OrderCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data, context={'user': request.user})
        if serializer.is_valid():
            order = serializer.save()
            try:
                self._send_order_emails(order, serializer.validated_data)
            except Exception:
                logger.exception('Order %s was created but its confirmation email could not be sent.', order.id)

            result = OrderSerializer(order, context={'request': request}).data

            return Response(result, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _send_order_emails(self, order, validated_data):
        subject = f'Elite Sports Gear order confirmation #{order.id}'
        lines = [
            f'Order #{order.id}',
            f'Name: {validated_data.get("full_name")}',
            f'Phone: {validated_data.get("phone", "")}',
            f'Email: {validated_data.get("email")}',
            f'Address: {validated_data.get("address")}',
            f'Payment method: {validated_data.get("payment_method")}',
            '',
            'Items:',
        ]
        for item in order.items.all():
            lines.append(f'{item.quantity} x {item.product.name} @ KES {item.unit_price}')
        lines.append('')
        lines.append(f'Total: KES {order.total}')
        body = '\n'.join(lines)

        recipient_list = [validated_data.get('email')]
        business_email = getattr(settings, 'BUSINESS_EMAIL', None)
        if business_email:
            recipient_list.append(business_email)

        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, recipient_list)


class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({'username': user.username, 'email': user.email, 'is_staff': user.is_staff})


class GuestOrderTrackingView(APIView):
    """Returns an order only when the customer presents its unguessable tracking token."""
    permission_classes = [AllowAny]

    def get(self, request, token):
        order = Order.objects.filter(tracking_token=token).first()
        if not order:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrderSerializer(order, context={'request': request}).data)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username') or request.data.get('email')
        password = request.data.get('password')

        if not username or not password:
            return Response({'detail': 'Username/email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=username, password=password)
        if user is None:
            if '@' in username:
                possible = User.objects.filter(email=username).first()
                if possible and possible.check_password(password):
                    user = possible

        if user is None:
            return Response({'detail': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_staff:
            return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'username': user.username, 'email': user.email})
