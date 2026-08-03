from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import serializers

from .models import Product, Order, OrderItem
from .models import Category
import re


class ProductSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()
    category_id = serializers.IntegerField(source='category.id', read_only=True, allow_null=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'category', 'category_id', 'description', 'featured', 'tag', 'image']

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def get_category(self, obj):
        if obj.category:
            return obj.category.name
        return None


class AdminProductSerializer(serializers.ModelSerializer):
    # accept either category id or category_name for creating new categories
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), required=False, allow_null=True)
    category_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'category', 'category_name', 'description', 'featured', 'tag', 'image']

    def create(self, validated_data):
        cat_name = validated_data.pop('category_name', None)
        if cat_name:
            cat, _ = Category.objects.get_or_create(name=cat_name)
            validated_data['category'] = cat
        return super().create(validated_data)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']



class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'unit_price']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'user',
            'customer_name',
            'customer_phone',
            'customer_email',
            'delivery_address',
            'payment_method',
            'status',
            'total',
            'created_at',
            'updated_at',
            'tracking_token',
            'items',
        ]


class OrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    address = serializers.CharField(max_length=500)
    phone = serializers.CharField(max_length=30, allow_blank=True, required=False)
    payment_method = serializers.ChoiceField(choices=[('whatsapp', 'WhatsApp')])
    items = OrderItemCreateSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('An order must include at least one item.')
        return value

    def validate_phone(self, value):
        if not value:
            return ''
        v = value.strip()
        m = re.match(r'^(?:\+?254|0)(7\d{8})$', v)
        if not m:
            raise serializers.ValidationError('Invalid Kenyan phone number. Use 07XXXXXXXX or 2547XXXXXXXX format.')
        normalized = '254' + m.group(1)
        return normalized

    def create(self, validated_data):
        user = self.context.get('user')
        items_data = validated_data.pop('items')
        product_ids = [item['product_id'] for item in items_data]
        products = Product.objects.in_bulk(product_ids)
        missing_ids = sorted(set(product_ids) - set(products))
        if missing_ids:
            raise serializers.ValidationError({'items': f"Product(s) not found: {', '.join(map(str, missing_ids))}."})

        with transaction.atomic():
            order = Order.objects.create(
                user=user if getattr(user, 'is_authenticated', False) else None,
                customer_name=validated_data.get('full_name', ''),
                customer_phone=validated_data.get('phone', ''),
                customer_email=validated_data.get('email', ''),
                delivery_address=validated_data.get('address', ''),
                payment_method=validated_data.get('payment_method', 'whatsapp'),
                total=0,
            )
            total = 0
            for item_data in items_data:
                product = products[item_data['product_id']]
                quantity = item_data['quantity']
                OrderItem.objects.create(order=order, product=product, quantity=quantity, unit_price=product.price)
                total += product.price * quantity
            order.total = total
            order.save(update_fields=['total'])
        return order


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User(username=validated_data['username'], email=validated_data['email'])
        user.set_password(validated_data['password'])
        user.save()
        return user
