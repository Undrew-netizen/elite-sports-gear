from django.core.management.base import BaseCommand

from store.models import Category, Product


class Command(BaseCommand):
    help = 'Create canonical categories and merge duplicates (case-insensitive).'

    def handle(self, *args, **options):
        desired = ['Jerseys', 'Tracky', 'Jackets', 'Boots', 'Balls', 'Accessories']
        for name in desired:
            qs = Category.objects.filter(name__iexact=name)
            # also consider singular form for plural desired names
            if name.endswith('s'):
                singular = name[:-1]
                qs = qs | Category.objects.filter(name__iexact=singular)

            qs = qs.distinct()
            if qs.exists():
                # prefer an existing exact-case match as canonical
                exact = qs.filter(name__exact=name).first()
                if exact:
                    canonical = exact
                else:
                    canonical = qs.first()
                # if canonical's name differs in case but another record already has the target name,
                # skip renaming to avoid unique constraint; otherwise rename
                already = Category.objects.filter(name=name).exclude(pk=canonical.pk).exists()
                if canonical.name != name and not already:
                    canonical.name = name
                    canonical.save()
                # merge duplicates
                duplicates = qs.exclude(pk=canonical.pk)
                for dup in duplicates:
                    Product.objects.filter(category=dup).update(category=canonical)
                    dup.delete()
                self.stdout.write(self.style.SUCCESS(f'Normalized category: {name} (kept id={canonical.id})'))
            else:
                c = Category.objects.create(name=name)
                self.stdout.write(self.style.SUCCESS(f'Created category: {name} (id={c.id})'))

        self.stdout.write(self.style.SUCCESS('Category normalization complete'))
