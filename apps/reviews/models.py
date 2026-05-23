from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Model, ForeignKey, CASCADE
from django.db.models.constraints import UniqueConstraint
from django.db.models.fields import PositiveSmallIntegerField, TextField, DateTimeField


class Review(Model):

    user = ForeignKey(
        'users.User',
        on_delete=CASCADE
    )

    venue = ForeignKey(
        'venues.Venue',
        on_delete=CASCADE,
        related_name='reviews'
    )

    rating = PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5)
        ]
    )

    comment = TextField()

    created_at = DateTimeField(
        auto_now_add=True
    )

    class Meta:

        constraints = [
            UniqueConstraint(
                fields=['user', 'venue'],
                name='unique_review'
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.venue}"