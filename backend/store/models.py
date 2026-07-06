from django.db import models


class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    category = models.ForeignKey('Category', on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField()
    featured = models.BooleanField(default=False)
    tag = models.CharField(max_length=100, blank=True)
    image = models.ImageField(upload_to='products/', null=True, blank=True)

    def __str__(self) -> str:
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self) -> str:
        return self.name


class Order(models.Model):
    STATUS_PLACED = 'placed'
    STATUS_CONFIRMED = 'confirmed'
    STATUS_COMPLETE = 'complete'

    STATUS_CHOICES = [
        (STATUS_PLACED, 'Placed'),
        (STATUS_CONFIRMED, 'Confirmed'),
        (STATUS_COMPLETE, 'Complete'),
    ]

    user = models.ForeignKey(
        'auth.User', on_delete=models.SET_NULL, null=True, blank=True
    )
    customer_name = models.CharField(max_length=200, blank=True)
    customer_email = models.EmailField(blank=True)
    customer_phone = models.CharField(max_length=30, blank=True)
    delivery_address = models.TextField(blank=True)
    payment_method = models.CharField(
        max_length=20,
        choices=[('card', 'Card'), ('mpesa', 'M-Pesa')],
        default='card',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PLACED)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    mpesa_checkout_request_id = models.CharField(max_length=120, blank=True, null=True)

    def __str__(self) -> str:
        return f"Order #{self.id} - {self.status}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self) -> str:
        return f"{self.quantity} x {self.product.name}"
