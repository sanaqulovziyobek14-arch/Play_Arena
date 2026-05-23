from django.db.models import ImageField, Model
from django.db.models.fields import CharField


class SportType(Model):

    name=CharField(
        max_length=100
    )

    icon=ImageField(
        upload_to='sports/'
    )

    def __str__(self):
        return self.name