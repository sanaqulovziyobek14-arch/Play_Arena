from django.db.models import Model, ForeignKey, CASCADE, ImageField
from django.db.models.fields import TextField, FloatField, DecimalField, TimeField, BooleanField, DateTimeField
from django.forms.fields import CharField

from apps.sports.models import SportType
from apps.users.models import User


class Venue(Model):

    owner=ForeignKey(
        User,
        on_delete=CASCADE
    )

    sport=ForeignKey(
        SportType,
        on_delete=CASCADE
    )

    name=CharField(
        max_length=255
    )

    address=TextField()

    latitude=FloatField()

    longitude=FloatField()

    price=DecimalField(
        max_digits=10,
        decimal_places=2
    )

    description=TextField()

    rating=FloatField(
        default=0
    )

    start_time=TimeField()

    end_time=TimeField()

    has_wifi=BooleanField(
        default=False
    )

    has_parking=BooleanField(
        default=False
    )

    created_at=DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.name


class VenueImage(Model):

    venue=ForeignKey(
        Venue,
        on_delete=CASCADE,
        related_name='images'
    )

    image=ImageField(
        upload_to='venues/'
    )