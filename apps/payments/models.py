from django.db.models import Model, OneToOneField, CASCADE
from django.db.models.fields import DecimalField, CharField, DateTimeField


class Payment(Model):

    PENDING = 'pending'
    SUCCESS = 'success'
    FAILED = 'failed'

    STATUS_CHOICES = (
        (PENDING, 'Pending'),
        (SUCCESS, 'Success'),
        (FAILED, 'Failed'),
    )

    CLICK = 'click'
    PAYME = 'payme'
    CARD = 'card'

    PAYMENT_METHODS = (
        (CLICK, 'Click'),
        (PAYME, 'Payme'),
        (CARD, 'Card'),
    )

    booking = OneToOneField(
        'bookings.Booking',
        on_delete=CASCADE,
        related_name='payment'
    )

    amount = DecimalField(
        max_digits=10,
        decimal_places=2
    )

    payment_method = CharField(
        max_length=20,
        choices=PAYMENT_METHODS
    )

    status = CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=PENDING
    )

    transaction_id = CharField(
        max_length=255,
        blank=True,
        null=True
    )

    created_at = DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.booking} - {self.status}"