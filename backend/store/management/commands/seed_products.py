from django.core.management.base import BaseCommand

from store.models import Product


class Command(BaseCommand):
    help = 'Seed the product catalog'

    def handle(self, *args, **options):
        Product.objects.all().delete()
        Product.objects.create(
            name='Velocity Pro Boots',
            price=129,
            category='Cleats',
            description='Lightweight boots designed for explosive sprints and precise control.',
            featured=True,
            tag='Best Seller',
        )
        Product.objects.create(
            name='Storm Keeper Gloves',
            price=79,
            category='Goalkeeper',
            description='Premium grip and shock absorption for confident dives and punches.',
            featured=True,
            tag='New Arrival',
        )
        Product.objects.create(
            name='Elite Training Ball',
            price=45,
            category='Ball',
            description='Tournament-ready ball with a durable cover and consistent flight.',
            featured=True,
            tag='Top Rated',
        )
        Product.objects.create(
            name='Match Day Kit',
            price=64,
            category='Apparel',
            description='Breathable jersey and shorts set for match-day comfort.',
            tag='Seasonal',
        )
        Product.objects.create(
            name='Power Cone Set',
            price=24,
            category='Training',
            description='A compact set of cones for agility and footwork drills.',
            tag='Training',
        )
        Product.objects.create(
            name='Grip Shield Shin Guards',
            price=38,
            category='Protection',
            description='Low-profile protection with secure straps and all-day comfort.',
            tag='Protective',
        )
        self.stdout.write(self.style.SUCCESS('Seeded products'))
