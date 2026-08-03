from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('store', '0009_order_tracking_token'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='order',
            name='mpesa_checkout_request_id',
        ),
        migrations.AlterField(
            model_name='order',
            name='payment_method',
            field=models.CharField(choices=[('whatsapp', 'WhatsApp')], default='whatsapp', max_length=20),
        ),
    ]
