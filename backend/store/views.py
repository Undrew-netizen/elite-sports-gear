from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.core.mail import send_mail
from django.utils import timezone
import base64
import requests
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

    def get_permissions(self):
        # only admins can list/retrieve/update orders
        if self.action in ['list', 'retrieve', 'partial_update', 'update', 'destroy']:
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

            # if MPesa selected, attempt STK push
            mpesa_result = None
            if serializer.validated_data.get('payment_method') == 'mpesa':
                phone = serializer.validated_data.get('phone')
                try:
                    mpesa_result = self._initiate_stk_push(order, phone, int(order.total), str(order.id))
                except Exception as e:
                    mpesa_result = {'error': str(e)}

            result = OrderSerializer(order, context={'request': request}).data
            if mpesa_result is not None:
                result['_mpesa'] = mpesa_result

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

    def _initiate_stk_push(self, order, phone, amount, account_ref):
        # Validate MPesa settings
        key = getattr(settings, 'MPESA_CONSUMER_KEY', '')
        secret = getattr(settings, 'MPESA_CONSUMER_SECRET', '')
        shortcode = getattr(settings, 'MPESA_SHORTCODE', '')
        passkey = getattr(settings, 'MPESA_PASSKEY', '')
        callback = getattr(settings, 'MPESA_CALLBACK_URL', '')
        env = getattr(settings, 'MPESA_ENV', 'sandbox')

        if not (key and secret and shortcode and passkey and callback):
            return {'status': 'skipped', 'detail': 'MPesa credentials not configured.'}

        base_url = 'https://sandbox.safaricom.co.ke' if env == 'sandbox' else 'https://api.safaricom.co.ke'

        # Get OAuth token
        oauth_url = f'{base_url}/oauth/v1/generate?grant_type=client_credentials'
        auth = (key, secret)
        resp = requests.get(oauth_url, auth=auth, timeout=10)
        resp.raise_for_status()
        access_token = resp.json().get('access_token')

        timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
        password_str = f"{shortcode}{passkey}{timestamp}"
        password = base64.b64encode(password_str.encode()).decode()

        stk_url = f'{base_url}/mpesa/stkpush/v1/processrequest'
        payload = {
            'BusinessShortCode': shortcode,
            'Password': password,
            'Timestamp': timestamp,
            'TransactionType': 'CustomerPayBillOnline',
            'Amount': amount,
            'PartyA': phone,
            'PartyB': shortcode,
            'PhoneNumber': phone,
            'CallBackURL': callback,
            'AccountReference': account_ref,
            'TransactionDesc': f'Order {account_ref} payment',
        }
        headers = {'Authorization': f'Bearer {access_token}', 'Content-Type': 'application/json'}
        r = requests.post(stk_url, json=payload, headers=headers, timeout=10)
        r.raise_for_status()
        data = r.json()
        # store CheckoutRequestID if present to correlate callback
        checkout_id = data.get('CheckoutRequestID') or data.get('checkoutRequestID')
        if checkout_id:
            order.mpesa_checkout_request_id = checkout_id
            order.save()
        return data

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

        if result_code == 0:
            order.status = Order.STATUS_CONFIRMED
            order.save()
            # send confirmation email with details
            self._send_payment_confirmation_email(order)
        else:
            # keep order as placed; optionally store failure info
            order.status = Order.STATUS_PLACED
            order.save()

        return Response({'status': 'ok'})


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
