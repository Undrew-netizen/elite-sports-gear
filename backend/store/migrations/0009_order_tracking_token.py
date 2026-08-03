import uuid

from django.db import migrations, models


def populate_tracking_tokens(apps, schema_editor):
    Order = apps.get_model('store', 'Order')
    for order in Order.objects.filter(tracking_token__isnull=True).iterator():
        order.tracking_token = uuid.uuid4()
        order.save(update_fields=['tracking_token'])


class Migration(migrations.Migration):
    dependencies = [
        ('store', '0008_alter_order_payment_method'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='tracking_token',
            field=models.UUIDField(editable=False, null=True),
        ),
        migrations.RunPython(populate_tracking_tokens, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='order',
            name='tracking_token',
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
    ]
