import json

from django.test import TestCase
from django.urls import reverse

from .models import Category, Order, Product


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

	def test_guest_can_track_only_their_order_with_its_token(self):
		product = Product.objects.first()
		payload = {
				'full_name': 'Jane Doe',
				'email': 'jane@example.com',
				'address': 'Nairobi',
				'phone': '0712345678',
				'payment_method': 'whatsapp',
				'items': [{'product_id': product.id, 'quantity': 2}],
		}
		response = self.client.post(reverse('order-create'), json.dumps(payload), content_type='application/json')

		self.assertEqual(response.status_code, 201)
		tracking_token = response.json()['tracking_token']
		tracked = self.client.get(reverse('guest-order-track', kwargs={'token': tracking_token}))
		self.assertEqual(tracked.status_code, 200)
		self.assertEqual(tracked.json()['total'], '258.00')

	def test_invalid_product_does_not_create_partial_order(self):
		payload = {
				'full_name': 'Jane Doe',
				'email': 'jane@example.com',
				'address': 'Nairobi',
				'phone': '0712345678',
				'payment_method': 'whatsapp',
				'items': [{'product_id': 999999, 'quantity': 1}],
		}
		response = self.client.post(reverse('order-create'), json.dumps(payload), content_type='application/json')

		self.assertEqual(response.status_code, 400)
		self.assertEqual(Order.objects.count(), 0)
