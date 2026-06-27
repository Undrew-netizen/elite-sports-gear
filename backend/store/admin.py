from django.contrib import admin

from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'price', 'featured', 'tag')
    list_filter = ('category', 'featured', 'tag')
    search_fields = ('name', 'description', 'tag')
    ordering = ('id',)
    list_editable = ('price', 'featured', 'tag')

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'total', 'created_at')
    list_filter = ('status', 'created_at')
    inlines = [OrderItemInline]
from django.contrib import admin

# Register your models here.
