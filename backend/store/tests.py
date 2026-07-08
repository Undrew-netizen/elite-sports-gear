from django.test import TestCase
from django.urls import reverse

from .models import Category, Product


class ProductApiTests(TestCase):
	def setUp(self):
		cleats = Category.objects.create(name='Cleats')
		goalkeeper = Category.objects.create(name='Goalkeeper')
		ball = Category.objects.create(name='Ball')

		Product.objects.create(
			name='Velocity Pro Boots',
			price=129,
			category=cleats,
			description='Lightweight boots designed for explosive sprints and precise control.',
			featured=True,
			tag='Best Seller',
		)
		Product.objects.create(
			name='Storm Keeper Gloves',
			price=79,
			category=goalkeeper,
			description='Premium grip and shock absorption for confident dives and punches.',
			featured=True,
			tag='New Arrival',
		)
		Product.objects.create(
			name='Elite Training Ball',
			price=45,
			category=ball,
			description='Tournament-ready ball with a durable cover and consistent flight.',
			featured=True,
			tag='Top Rated',
		)

	def test_products_endpoint_returns_catalog(self):
		response = self.client.get(reverse('product-list'))

		self.assertEqual(response.status_code, 200)
		self.assertTrue(len(response.json()) >= 3)
