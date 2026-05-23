from django.contrib.auth.models import AbstractUser
from django.db.models import ImageField, ManyToManyField
from django.db.models.fields import CharField


class User(AbstractUser):

    USER = 'user'
    OWNER = 'owner'
    ADMIN = 'admin'

    ROLE_CHOICES = (
        (USER,'User'),
        (OWNER,'Owner'),
        (ADMIN,'Admin'),
    )

    phone=CharField(
        max_length=20,
        unique=True
    )

    image=ImageField(
        upload_to='users/',
        blank=True,
        null=True
    )

    role=CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=USER
    )
    groups = ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True,
    )
    user_permissions = ManyToManyField(
        'auth.Permission',
        related_name='custom_user_permissions_set',
        blank=True,
    )

    def __str__(self):
        return self.username