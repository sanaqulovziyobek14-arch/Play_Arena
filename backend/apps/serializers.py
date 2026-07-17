from datetime import datetime
from decimal import Decimal
from django.utils import timezone

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Avg
from rest_framework.exceptions import ValidationError
from rest_framework.fields import IntegerField, CharField, DecimalField, SerializerMethodField, ImageField, \
    ListField
from rest_framework.serializers import ModelSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.models import Booking, Favorite, Payment, Review, SportType, Venue, VenueImage

User = get_user_model()


class UserModelSerializer(ModelSerializer):
    password = CharField(write_only=True, required=False, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ("id", "username", "password", "email", "phone", "first_name", "last_name", "role", "image")
        extra_kwargs = {
            "email": {"required": False},
            "username": {"min_length": 4},
        }

    def validate_password(self, value):
        if value and len(value) < 8:
            raise ValidationError("Parol kamida 8 ta belgidan iborat bo'lishi shart.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    @transaction.atomic
    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        data = cls.token_class.for_user(user)
        data.payload["role"] = user.role
        return data


class SportTypeModelSerializer(ModelSerializer):
    class Meta:
        model = SportType
        fields = ("id", "name", "icon")


class VenueImageModelSerializer(ModelSerializer):
    class Meta:
        model = VenueImage
        fields = ("id", "image")


class VenueCreateSerializer(ModelSerializer):
    uploaded_images = ListField(
        child=ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        write_only=True
    )

    class Meta:
        model = Venue
        fields = [
            'sport', 'name', 'address', 'latitude', 'longitude',
            'width', 'length', 'price', 'description', 'start_time',
            'end_time', 'has_wifi', 'has_parking', 'uploaded_images'
        ]

    def validate_uploaded_images(self, value):
        if len(value) < 2:
            raise ValidationError("Stadion saytga chiqishi uchun kamida 2 ta rasm yuklashingiz shart!")
        if len(value) > 10:
            raise ValidationError("Maksimum 10 tagacha rasm yuklash imkoniyati mavjud.")
        return value

    def create(self, validated_data):
        images_data = validated_data.pop('uploaded_images')
        user = self.context['request'].user
        with transaction.atomic():
            venue = Venue.objects.create(owner=user, status=Venue.Role.PENDING, **validated_data)
            venue_images = [
                VenueImage(venue=venue, image=image_data) for image_data in images_data
            ]
            VenueImage.objects.bulk_create(venue_images)

        return venue

class VenueModelSerializer(ModelSerializer):
    images = VenueImageModelSerializer(many=True,read_only=True)
    today_booked_hours = SerializerMethodField()
    weekly_booking_count = SerializerMethodField()
    rating = SerializerMethodField()
    review_count = SerializerMethodField()

    class Meta:
        model = Venue
        fields = [
            'id', 'owner', 'sport', 'name', 'address', 'latitude', 'longitude',
            'width', 'length', 'price', 'description', 'start_time', 'end_time',
            'has_wifi', 'has_parking', 'created_at', 'images','has_shower', 'has_lighting', 'has_dressing_room', 'has_equipment_rental',
            'today_booked_hours', 'weekly_booking_count', 'rating', 'review_count'
        ]

    def get_today_booked_hours(self, obj):
        try:
            try:
                today = timezone.now().date()
            except Exception:
                today = datetime.now().date()
            bookings_relation = getattr(obj, 'bookings', None) or getattr(obj, 'bronlar', None)
            if bookings_relation is None:
                return []
            today_bookings = bookings_relation.filter(date=today)
            booked_hours = []
            for booking in today_bookings:
                if hasattr(booking, 'start_time'):
                    time_str = booking.start_time.strftime('%H:%M') if hasattr(booking.start_time, 'strftime') else str(
                        booking.start_time)
                    booked_hours.append(time_str)
            return booked_hours

        except Exception as e:
            print(f"Kutilmagan xatolik get_today_booked_hours ichida: {e}")
            return []

    def get_weekly_booking_count(self, obj):
        try:
            try:
                today = timezone.now().date()
            except Exception:
                today = datetime.now().date()
            bookings_relation = getattr(obj, 'bookings', None) or getattr(obj, 'bronlar', None)
            if bookings_relation is None:
                return 0
            start_date = today - timezone.timedelta(days=7)
            return bookings_relation.filter(date__range=[start_date, today]).count()
        except Exception as e:
            print(f"Xato (weekly_booking_count): {e}")
            return 0

    def get_rating(self, obj):
        """Maydonning o'rtacha reytingi"""
        if hasattr(obj, 'rating') and obj.rating is not None:
            return round(obj.rating, 1)
        avg_rating = obj.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(avg_rating, 1) if avg_rating else 0.0

    def get_review_count(self, obj):
        """Izohlar soni"""
        if hasattr(obj, 'review_count'):
            return obj.review_count
        return obj.reviews.count()

class BookingModelSerializer(ModelSerializer):
    venue_name    = CharField(source="venue.name",    read_only=True)
    venue_address = CharField(source="venue.address", read_only=True)
    venue_price   = DecimalField(source="venue.price", max_digits=10, decimal_places=2, read_only=True)
    total_price   = SerializerMethodField()

    class Meta:
        model = Booking
        fields = (
            "id", "user", "venue", "venue_name", "venue_address", "venue_price",
            "date", "start_time", "end_time", "total_price", "status", "created_at"
        )
        read_only_fields = ("user", "status", "created_at")

    def get_total_price(self, obj) -> Decimal:
        import datetime
        start = datetime.datetime.combine(datetime.date.min, obj.start_time)
        end   = datetime.datetime.combine(datetime.date.min, obj.end_time)
        hours = Decimal((end - start).total_seconds()) / Decimal(3600)
        return round(obj.venue.price * hours, 2)

    def validate(self, data):
        venue      = data.get("venue")
        date       = data.get("date")
        start_time = data.get("start_time")
        end_time   = data.get("end_time")

        if start_time >= end_time:
            raise ValidationError("Tugash vaqti boshlanish vaqtidan katta bo'lishi shart.")

        if start_time < venue.start_time or end_time > venue.end_time:
            raise ValidationError(
                f"Maydon faqat {venue.start_time} — {venue.end_time} oralig'ida ishlaydi."
            )

        overlapping = Booking.objects.filter(
            venue=venue, date=date,
            status__in=["pending", "paid"],
            start_time__lt=end_time,
            end_time__gt=start_time,
        )
        if self.instance:
            overlapping = overlapping.exclude(pk=self.instance.pk)
        if overlapping.exists():
            raise ValidationError("Bu vaqt oralig'i allaqachon band!")

        return data


class PaymentModelSerializer(ModelSerializer):
    booking_id = IntegerField(source="booking.id", read_only=True)

    class Meta:
        model = Payment
        fields = ("id", "booking", "booking_id", "amount", "payment_method", "transaction_id", "status", "created_at")
        read_only_fields = ("transaction_id", "created_at", "status")

    def validate_amount(self, value):
        if value <= 0:
            raise ValidationError("To'lov summasi noldan katta bo'lishi shart.")
        return value


class ReviewModelSerializer(ModelSerializer):
    user_username = CharField(source="user.username", read_only=True)

    class Meta:
        model = Review
        fields = ("id", "user", "user_username", "venue", "rating", "comment", "created_at")
        read_only_fields = ("user", "created_at")

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise ValidationError("Reyting 1 dan 5 gacha bo'lishi mumkin.")
        return value

    def validate(self, data):
        request = self.context.get('request')
        if not request:
            return data
        user  = request.user
        venue = data.get('venue')
        has_booked = Booking.objects.filter(
            user=user, venue=venue, status__in=["paid", "pending"]
        ).exists()
        if not has_booked and not user.is_admin:
            raise ValidationError("Sharh qoldirish uchun avval bu maydonni bron qilishingiz kerak.")
        return data


class FavoriteModelSerializer(ModelSerializer):
    venue_name = CharField(source="venue.name", read_only=True)

    class Meta:
        model = Favorite
        fields = ("id", "user", "venue", "venue_name")
        read_only_fields = ("user",)

    def validate(self, data):
        request = self.context.get('request')
        if not request:
            return data
        if Favorite.objects.filter(user=request.user, venue=data.get('venue')).exists():
            raise ValidationError("Bu maydon allaqachon sevimlilar ro'yxatida bor.")
        return data