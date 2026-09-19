from datetime import datetime, date, time
from decimal import Decimal
from os import name

from aiogram.types import venue
from django.utils import timezone

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Avg
from rest_framework.exceptions import ValidationError
from rest_framework.fields import (
    IntegerField,
    CharField,
    DecimalField,
    SerializerMethodField,
    ImageField,
    ListField,
)
from rest_framework.serializers import ModelSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.models import (
    Booking,
    Discount,
    Favorite,
    Payment,
    Review,
    SportType,
    Venue,
    VenueImage,
    UserCard,
)

User = get_user_model()


class UserModelSerializer(ModelSerializer):
    password = CharField(
        write_only=True, required=False, style={"input_type": "password"}
    )

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "password",
            "email",
            "phone",
            "first_name",
            "last_name",
            "role",
            "image",
        )
        read_only_fields = ("role",)
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
        write_only=True,
        required=False,
        default=[],
    )

    class Meta:
        model = Venue
        fields = [
            "sport",
            "name",
            "address",
            "latitude",
            "longitude",
            "width",
            "length",
            "price",
            "description",
            "start_time",
            "end_time",
            "has_wifi",
            "has_parking",
            "uploaded_images",
        ]

    def validate_uploaded_images(self, value):
        if value and len(value) > 10:
            raise ValidationError("Maksimum 10 tagacha rasm yuklash imkoniyati mavjud.")
        return value

    def create(self, validated_data):
        images_data = validated_data.pop("uploaded_images", [])
        user = self.context["request"].user
        with transaction.atomic():
            venue = Venue.objects.create(
                owner=user, status=Venue.Role.PENDING, **validated_data
            )
            if images_data:
                venue_images = [
                    VenueImage(venue=venue, image=image_data)
                    for image_data in images_data
                ]
                VenueImage.objects.bulk_create(venue_images)

        return venue


class VenueModelSerializer(ModelSerializer):
    image = SerializerMethodField()
    images = VenueImageModelSerializer(many=True, read_only=True)
    sport_name = SerializerMethodField()
    today_booked_hours = SerializerMethodField()
    weekly_booking_count = SerializerMethodField()
    rating = SerializerMethodField()
    review_count = SerializerMethodField()
    discount_start_time = SerializerMethodField()
    discount_percent = SerializerMethodField()
    active_discount = SerializerMethodField()
    discounted_price = SerializerMethodField()
    today_price = SerializerMethodField()
    today_badge = SerializerMethodField()

    class Meta:
        model = Venue
        fields = [
            "id",
            "owner",
            "sport",
            "sport_name",
            "name",
            "address",
            "image",
            "images",
            "latitude",
            "longitude",
            "width",
            "length",
            "price",
            "description",
            "start_time",
            "end_time",
            "status",
            "has_wifi",
            "has_parking",
            "created_at",
            "has_shower",
            "has_lighting",
            "has_dressing_room",
            "has_equipment_rental",
            "today_booked_hours",
            "weekly_booking_count",
            "rating",
            "review_count",
            "discount_start_time",
            "discount_percent",
            "active_discount",
            "discounted_price",
            "today_price",
            "today_badge",
        ]

    def get_sport_name(self, obj):
        return obj.sport.name if obj.sport else ""

    def get_discount_start_time(self, obj):
        return "20:00"

    def get_discount_percent(self, obj):
        return 20

    def _get_active_admin_discount(self, obj):
        """
        Bitta so'rov ichida bir necha marta bazaga murojaat qilmaslik uchun
        natijani obj ustida keshlab qo'yamiz (get_active_discount/get_discounted_price
        ikkalasi ham shu metoddan foydalanadi).
        """
        if not hasattr(obj, "_active_admin_discount_cache"):
            obj._active_admin_discount_cache = Discount.get_active_for_venue(obj)
        return obj._active_admin_discount_cache

    def get_image(self, obj):
        first_img = obj.images.first()
        if first_img and first_img.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(first_img.image.url)
            return first_img.image.url
        return None

    def get_active_discount(self, obj):
        """
        Admin panelidan qo'shilgan, hozirda amal qilayotgan chegirma/ustama haqida
        ma'lumot. Mavjud bo'lmasa — null qaytadi.
        """
        discount = self._get_active_admin_discount(obj)
        if not discount:
            return None
        return {
            "id": discount.id,
            "title": discount.title,
            "type": discount.discount_type,  # "increase" | "decrease"
            "percent": str(discount.percent),
            "scope": discount.scope,  # "all" | "sport" | "venue"
            "start_date": discount.start_date,
            "end_date": discount.end_date,
        }

    def get_discounted_price(self, obj):
        """
        Bugungi kun va admin chegirmalari hisobga olingan holdagi yakuniy 1 soatlik narx.
        """
        price, _badge, _flat = self._get_today_rate_cached(obj)
        return str(price)

    def _get_today_rate_cached(self, obj):
        """
        MUHIM: bu — arenalar ro'yxati kartochkasida ko'rsatiladigan narxning manbasi.
        _get_day_rate() orqali admin chegirmasi VA hafta oxiri (Bilyard/Futbol +25%)
        qoidasini birga hisoblaydi — xuddi ichki sahifada ko'rsatiladigan narx bilan
        BIR XIL funksiyadan foydalangani uchun ikkalasi hech qachon farq qilmaydi.
        """
        if not hasattr(obj, "_today_rate_cache"):
            obj._today_rate_cache = _get_day_rate(obj, timezone.now().date())
        return obj._today_rate_cache

    def get_today_price(self, obj):
        """Bugungi kun uchun samarali (admin chegirmasi + hafta oxiri qoidasi hisobga
        olingan) bir soatlik narx — ro'yxat kartochkasida shu ko'rsatiladi."""
        price, _badge, _flat = self._get_today_rate_cached(obj)
        return str(price)

    def get_today_badge(self, obj):
        """Bugungi narxga tegishli belgi (masalan '+25%' yoki '-30%'), bo'lmasa null."""
        _price, badge, _flat = self._get_today_rate_cached(obj)
        return badge

    def get_today_booked_hours(self, obj):
        try:
            today = timezone.now().date()
            bookings_relation = getattr(obj, "bookings", None) or getattr(
                obj, "bronlar", None
            )
            if bookings_relation is None:
                return []
            today_bookings = bookings_relation.filter(date=today)
            booked_hours = []
            for booking in today_bookings:
                if hasattr(booking, "start_time"):
                    time_str = (
                        booking.start_time.strftime("%H:%M")
                        if hasattr(booking.start_time, "strftime")
                        else str(booking.start_time)
                    )
                    booked_hours.append(time_str)
            return booked_hours

        except Exception as e:
            print(f"Kutilmagan xatolik get_today_booked_hours ichida: {e}")
            return []

    def get_weekly_booking_count(self, obj):
        try:
            today = timezone.now().date()
            bookings_relation = getattr(obj, "bookings", None) or getattr(
                obj, "bronlar", None
            )
            if bookings_relation is None:
                return 0
            start_date = today - timezone.timedelta(days=7)
            return bookings_relation.filter(date__range=[start_date, today]).count()
        except Exception as e:
            print(f"Xato (weekly_booking_count): {e}")
            return 0

    def get_rating(self, obj):
        """Maydonning o'rtacha reytingi"""
        if hasattr(obj, "rating") and obj.rating is not None:
            return round(obj.rating, 1)
        avg_rating = obj.reviews.aggregate(Avg("rating"))["rating__avg"]
        return round(avg_rating, 1) if avg_rating else 0.0

    def get_review_count(self, obj):
        """Izohlar soni"""
        if hasattr(obj, "review_count"):
            return obj.review_count
        return obj.reviews.count()



def _get_day_rate(venue, on_date):
    base_price = Decimal(str(venue.price))
    badge = None

    sport_name = (
        getattr(venue.sport, "name", "").lower()
        if getattr(venue, "sport", None)
        else ""
    )
    is_bilyard = "bilyard" in sport_name or "billiard" in sport_name
    is_futbol = (
        "futbol" in sport_name or "fudbol" in sport_name or "football" in sport_name
    )
    is_weekend = bool(
        on_date and hasattr(on_date, "weekday") and on_date.weekday() in (5, 6)
    )
    is_flat_day = bool(is_weekend and (is_bilyard or is_futbol))
    end_data = (on_date - venue.created_at.date()).days
    is_new_venue = False
    active_discount = Discount.get_active_for_venue(venue, on_date=on_date)
    is_tennis = "tennis" in sport_name
    is_friday = bool(on_date and on_date.weekday() == 4)

    if is_futbol and 0 <= end_data <= 3:
        base_price = (base_price * Decimal("0.60")).quantize(Decimal("0.01"))
        badge = {
            "source": "weekend_rule",
            "type": "decrease",
            "percent": "40",
            "label": "-40%",
            "title": "Yangi fudbol maydon uchun! Maxsus chegirma",
        }


    if hasattr(venue, "created_at") and venue.created_at:
        venue_created_date = (
            venue.created_at.date()
            if hasattr(venue.created_at, "date")
            else venue.created_at
        )
        current_date = on_date if on_date else timezone.now().date()
        days_diff = (current_date - venue_created_date).days
        if 0 <= days_diff < 3:
            is_new_venue = True


    if is_new_venue:
        base_price = (base_price * Decimal("0.50")).quantize(Decimal("0.01"))
        badge = {
            "source": "new_venue_discount",
            "type": "decrease",
            "percent": "50",
            "label": "-50%",
            "title": "Yangi arena uchun chegirma",
        }
        return base_price, badge, False

    if active_discount:
        base_price = active_discount.apply_to_price(base_price)
        sign = (
            "+"
            if active_discount.discount_type == Discount.DiscountType.INCREASE
            else "-"
        )
        badge = {
            "source": "admin",
            "type": active_discount.discount_type,
            "percent": str(active_discount.percent),
            "label": f"{sign}{active_discount.percent}%",
            "title": active_discount.title,
        }
        return base_price, badge, is_flat_day

    if is_flat_day:
        base_price = (base_price * Decimal("1.25")).quantize(Decimal("0.01"))
        badge = {
            "source": "weekend_rule",
            "type": "increase",
            "percent": "25",
            "label": "+25%",
            "title": "Dam olish kuni narxi",
        }
        return base_price, badge, is_flat_day

    if is_tennis and is_friday:
        base_price = (base_price * Decimal("0.85")).quantize(Decimal("0.01"))
        badge = {
            "source": "tennis_rule",
            "type": "decrease",
            "percent": "15",
            "label": "-15%",
            "title": "Juma kungi chegirma",
        }

    return base_price, badge, is_flat_day


def calculate_booking_price(venue, booking_date, start_t: time, end_t: time) -> Decimal:

    if booking_date and isinstance(booking_date, str):
        try:
            booking_date = datetime.strptime(booking_date, "%Y-%m-%d").date()
        except Exception:
            pass

    base_price, _badge, _is_flat_day = _get_day_rate(
        venue, booking_date if isinstance(booking_date, date) else None
    )

    start_dt = datetime.combine(date.min, start_t)
    end_dt = datetime.combine(date.min, end_t)
    if end_dt <= start_dt:
        end_dt = datetime.combine(date.min + timezone.timedelta(days=1), end_t)

    duration_hours = Decimal(str((end_dt - start_dt).total_seconds())) / Decimal("3600")

    total = duration_hours * base_price
    return Decimal(str(round(total, 2)))


def get_venue_slot_prices(venue, on_date):
    """
    Berilgan sana uchun venue ish vaqti ichidagi HAR BIR standart (1 soatlik) slotning
    narxi va ko'rsatiladigan belgisini qaytaradi. Frontend bu ro'yxatni to'g'ridan-to'g'ri
    ekranga chiqaradi — o'zi HECH QANDAY qo'shimcha hisob-kitob qilmaydi.

    Qaytaradi: (slots: list[dict], day_price: str, day_badge: dict|None)
    """
    if not venue.start_time or not venue.end_time:
        return [], None, None

    day_price, day_badge, is_flat_day = _get_day_rate(venue, on_date)

    slots = []
    h = venue.start_time.hour
    m = venue.start_time.minute
    end_h = venue.end_time.hour
    while h < end_h:
        start_t = time(h, m)
        next_h = h + 1
        end_t = time(next_h if next_h < 24 else 0, m)
        slot_price = calculate_booking_price(venue, on_date, start_t, end_t)

        if is_flat_day:
            badge = day_badge
        elif h >= 20:
            sport_name_lower = (
                getattr(venue.sport, "name", "").lower()
                if getattr(venue, "sport", None)
                else ""
            )
            is_basketbol_slot = (
                "basketbol" in sport_name_lower or "basketbool" in sport_name_lower
            )

            if is_basketbol_slot:
                slot_price = (Decimal(slot_price) * Decimal("0.50")).quantize(
                    Decimal("0.01")
                )
                badge = {
                    "source": "basketbol",
                    "type": "decrease",
                    "percent": "50",
                    "label": "-50",
                    "title": "Kechki chegirma",
                }
            else:
                slot_price = (Decimal(slot_price) * Decimal("0.50")).quantize(
                    Decimal("0.01")
                )
                badge = {
                    "source": "basketbol",
                    "type": "decrease",
                    "percent": "50",
                    "label": "-50",
                    "title": "Kechki chegirma",
                }

        else:
            badge = day_badge

        slots.append(
            {
                "start": start_t.strftime("%H:%M"),
                "end": end_t.strftime("%H:%M"),
                "price": str(slot_price),
                "badge": badge,
            }
        )
        h += 1

    return slots, str(day_price), day_badge


class BookingModelSerializer(ModelSerializer):
    venue_name = CharField(source="venue.name", read_only=True)
    venue_address = CharField(source="venue.address", read_only=True)
    venue_price = DecimalField(
        source="venue.price", max_digits=10, decimal_places=2, read_only=True
    )
    total_price = SerializerMethodField()

    class Meta:
        model = Booking
        fields = (
            "id",
            "user",
            "venue",
            "venue_name",
            "venue_address",
            "venue_price",
            "date",
            "start_time",
            "end_time",
            "total_price",
            "payment_type",
            "paid_amount",
            "remaining_amount",
            "status",
            "created_at",
        )
        read_only_fields = (
            "user",
            "status",
            "created_at",
            "paid_amount",
            "remaining_amount",
        )

    def get_total_price(self, obj) -> Decimal:
        """
        MUHIM: bu yerda venue narxini yoki aktiv chegirmani QAYTA hisoblamaymiz —
        aks holda admin keyinchalik chegirmani o'zgartirsa/o'chirsa, foydalanuvchi
        allaqachon TO'LAGAN summadan farqli raqamni ko'rib qolishi mumkin edi.
        Buning o'rniga bron yaratilgan paytda `create()` ichida hisoblab, `paid_amount`
        va `remaining_amount`ga SAQLANGAN (snapshot qilingan) qiymatni qaytaramiz —
        bu har doim foydalanuvchi haqiqatda ko'rgan/to'lagan narx bilan mos keladi.
        """
        if obj.paid_amount is not None and obj.remaining_amount is not None:
            return obj.paid_amount + obj.remaining_amount
        return calculate_booking_price(
            obj.venue, obj.date, obj.start_time, obj.end_time
        )

    def validate(self, data):
        venue = data.get("venue")
        req_date = data.get("date")
        start_time = data.get("start_time")
        end_time = data.get("end_time")

        today = timezone.now().date()
        current_time = timezone.now().time()

        if req_date < today:
            raise ValidationError("O'tib ketgan sanaga bron qilib bo'lmaydi.")
        if req_date == today and start_time < current_time:
            raise ValidationError(
                "Bugungi kun uchun o'tib ketgan soatga bron qilib bo'lmaydi."
            )
        if start_time >= end_time:
            raise ValidationError(
                "Tugash vaqti boshlanish vaqtidan katta bo'lishi shart."
            )

        if start_time < venue.start_time or end_time > venue.end_time:
            raise ValidationError(
                f"Maydon faqat {venue.start_time} — {venue.end_time} oralig'ida ishlaydi."
            )
        return data

    @transaction.atomic
    def create(self, validated_data):
        user = validated_data.pop("user", None)
        if not user and "request" in self.context:
            user = self.context["request"].user

        venue = validated_data["venue"]
        req_date = validated_data["date"]
        start_time = validated_data["start_time"]
        end_time = validated_data["end_time"]
        payment_type = validated_data.get("payment_type", "full")

        calculated_total = calculate_booking_price(
            venue, req_date, start_time, end_time
        )

        if payment_type == "deposit_50":
            paid_amount = Decimal(str(round(calculated_total / Decimal("2"), 2)))
            remaining_amount = calculated_total - paid_amount
        else:
            paid_amount = calculated_total
            remaining_amount = Decimal("0.00")

        booking = Booking.objects.create(
            user=user,
            paid_amount=paid_amount,
            remaining_amount=remaining_amount,
            **validated_data,
        )
        return booking


class UserCardModelSerializer(ModelSerializer):
    class Meta:
        model = UserCard
        fields = (
            "id",
            "card_holder",
            "card_masked",
            "expire_month",
            "expire_year",
            "provider",
            "is_default",
        )


class AddUserCardSerializer(ModelSerializer):
    card_number = CharField(write_only=True, max_length=19)

    class Meta:
        model = UserCard
        fields = (
            "id",
            "card_number",
            "card_holder",
            "expire_month",
            "expire_year",
            "provider",
            "is_default",
        )

    def validate_card_number(self, value):
        import re

        clean_number = re.sub(r"\D", "", value)
        if len(clean_number) != 16:
            raise ValidationError("Karta raqami 16 ta raqamdan iborat bo'lishi kerak!")
        if not (
            clean_number.startswith("8600")
            or clean_number.startswith("5614")
            or clean_number.startswith("9860")
        ):
            raise ValidationError(
                "Faqat Uzcard (8600, 5614) va Humo (9860) kartalari qo'llab-quvvatlanadi!"
            )
        return clean_number

    def create(self, validated_data):
        user = self.context["request"].user
        clean_number = validated_data.pop("card_number")
        masked_number = f"{clean_number[:4]} **** **** {clean_number[-4:]}"
        simulated_token = f"tok_{clean_number[:6]}_{clean_number[-4:]}_{int(timezone.now().timestamp())}"

        card, created = UserCard.objects.get_or_create(
            user=user,
            card_masked=masked_number,
            defaults={
                "card_holder": validated_data["card_holder"].upper(),
                "card_token": simulated_token,
                "expire_month": validated_data["expire_month"],
                "expire_year": validated_data["expire_year"],
                "provider": validated_data.get("provider", UserCard.Provider.CLICK),
                "is_default": not UserCard.objects.filter(user=user).exists(),
            },
        )
        return card


class InitiatePaymentSerializer(ModelSerializer):
    booking_id = IntegerField(source="booking.id")
    payment_option = CharField(default="deposit_50")

    class Meta:
        model = Payment
        fields = ("booking_id", "payment_option")


class PaymentModelSerializer(ModelSerializer):
    booking_id = IntegerField(source="booking.id", read_only=True)

    class Meta:
        model = Payment
        fields = (
            "id",
            "booking",
            "booking_id",
            "amount",
            "payment_method",
            "transaction_id",
            "status",
            "created_at",
        )
        read_only_fields = ("transaction_id", "created_at", "status")

    def validate_amount(self, value):
        if value <= 0:
            raise ValidationError("To'lov summasi noldan katta bo'lishi shart.")
        return value


class ReviewModelSerializer(ModelSerializer):
    user_username = CharField(source="user.username", read_only=True)

    class Meta:
        model = Review
        fields = (
            "id",
            "user",
            "user_username",
            "venue",
            "rating",
            "comment",
            "created_at",
        )
        read_only_fields = ("user", "created_at")

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise ValidationError("Reyting 1 dan 5 gacha bo'lishi mumkin.")
        return value

    def validate(self, data):
        return data


class FavoriteModelSerializer(ModelSerializer):
    venue_name = CharField(source="venue.name", read_only=True)

    class Meta:
        model = Favorite
        fields = ("id", "user", "venue", "venue_name")
        read_only_fields = ("user",)

    def validate(self, data):
        request = self.context.get("request")
        if not request:
            return data
        if Favorite.objects.filter(user=request.user, venue=data.get("venue")).exists():
            raise ValidationError("Bu maydon allaqachon sevimlilar ro'yxatida bor.")
        return data
