from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.core.mail import send_mail
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
    RegisterSerializer,
    CategorySerializer,
)

User = get_user_model()


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
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data, context={'user': request.user})
        if serializer.is_valid():
            order = serializer.save()
            # send emails
            self._send_order_emails(order, serializer.validated_data)

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


class MpesaCallbackView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.data or {}
        # STK callback nested under Body.stkCallback
        stk = payload.get('Body', {}).get('stkCallback') if isinstance(payload, dict) else None
        if not stk:
            return Response({'detail': 'Invalid callback payload'}, status=status.HTTP_400_BAD_REQUEST)

        checkout_request_id = stk.get('CheckoutRequestID')
        result_code = stk.get('ResultCode')
        result_desc = stk.get('ResultDesc')

        order = None
        if checkout_request_id:
            order = Order.objects.filter(mpesa_checkout_request_id=checkout_request_id).first()

        if not order:
            return Response({'detail': 'Order not found for checkout id'}, status=status.HTTP_404_NOT_FOUND)

        if str(result_code) == '0':
            order.status = Order.STATUS_CONFIRMED
            order.save()
            # send confirmation email with details
            self._send_payment_confirmation_email(order)
        else:
            # keep order as placed; optionally store failure info
            order.status = Order.STATUS_PLACED
            order.save()

        return Response({'status': 'ok'})

    def _send_payment_confirmation_email(self, order):
        subject = f'Payment received for order #{order.id}'
        lines = [
            f'Payment received for Order #{order.id}',
            f'Name: {order.customer_name}',
            f'Phone: {order.customer_phone}',
            f'Email: {order.customer_email}',
            f'Address: {order.delivery_address}',
            f'Payment method: {order.payment_method}',
            '',
            'Items:',
        ]
        for item in order.items.all():
            lines.append(f'{item.quantity} x {item.product.name} @ KES {item.unit_price}')
        lines.append('')
        lines.append(f'Total: KES {order.total}')
        body = '\n'.join(lines)

        recipient_list = [order.customer_email]
        business_email = getattr(settings, 'BUSINESS_EMAIL', None)
        if business_email:
            recipient_list.append(business_email)

        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, recipient_list)


class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({'username': user.username, 'email': user.email, 'is_staff': user.is_staff})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        if not username or not email:
            return Response({'detail': 'Username and email are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'detail': 'Username already taken.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exists():
            return Response({'detail': 'Email already registered.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({'token': token.key, 'username': user.username, 'email': user.email}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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

        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'username': user.username, 'email': user.email})
