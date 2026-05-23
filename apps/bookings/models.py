from django.db.models import Model, ForeignKey, CASCADE
from django.db.models.constraints import UniqueConstraint
from django.db.models.fields import DateField, TimeField, CharField


class Booking(Model):

    PENDING='pending'
    PAID='paid'
    CANCELED='canceled'

    STATUS=(
        (PENDING,'Pending'),
        (PAID,'Paid'),
        (CANCELED,'Canceled')
    )

    user=ForeignKey(
        'users.User',
        on_delete=CASCADE
    )

    venue=ForeignKey(
        'venues.Venue',
        on_delete=CASCADE
    )

    date=DateField()

    start_time=TimeField()

    end_time=TimeField()

    status=CharField(
        max_length=20,
        choices=STATUS,
        default=PENDING
    )

    class Meta:

        constraints=[
            UniqueConstraint(
                fields=[
                    'venue',
                    'date',
                    'start_time'
                ],
                name='unique_booking'
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.venue}"