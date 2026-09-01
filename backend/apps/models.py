from decimal import Decimal

from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.db.models import (
    CharField,
    ImageField,
    Model,
    ForeignKey,
    CASCADE,
    SET_NULL,
    TextField,
    FloatField,
    DecimalField,
    TimeField,
    BooleanField,
    DateTimeField,
    DateField,
    OneToOneField,
    PositiveSmallIntegerField, PositiveIntegerField,
)
from django.db.models.enums import TextChoices
from django.utils import timezone


class User(AbstractUser):
    class Role(TextChoices):
        USER = "user", "👤 Foydalanuvchi"
        OWNER = "owner", "🏟 Egasi"
        ADMIN = "admin", "⚙ Administrator"

    phone_regex = RegexValidator(
        regex=r"^\+?1?\d{9,15}$",
        message="Telefon raqami formati: '+998901234567' ko'rinishida bo'lishi kerak.",
    )
    phone = CharField(
        validators=[phone_regex], max_length=20, unique=True, blank=True, null=True
    )
    image = ImageField(upload_to="users/%Y/%m/", blank=True, null=True)
    role = CharField(max_length=10, choices=Role, default=Role.USER)

    def __str__(self):
        return self.username

    class Meta:
        verbose_name = "Foydalanuvchi"
        verbose_name_plural = "Foydalanuvchilar"

    @property
    def is_owner(self):
        return self.role == self.Role.OWNER

    @property
    def is_user(self):
        return self.role == self.Role.USER

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN


# -------------------------------------------------------------------------------------------------------------


class Venue(Model):
    class Role(TextChoices):
        PENDING = 'pending', "Kutilmoqda"
        APPROVED = 'approved', "Tasdiqlandi"
        REJECTED = 'rejected', "Rad etildi"

    class Choices(TextChoices):
        ARTIFICIAL = 'suniy', "Sun'iy o't"
        NATURAL = 'tabiy', "Tabiy o't"

    size = CharField(max_length=50,blank=True,null=True,help_text="Masalan: 40x20 metr yoki 6x6 o'yin uchun")
    owner = ForeignKey("apps.User", CASCADE, related_name="venues")
    sport = ForeignKey("apps.SportType", CASCADE, related_name="venues")
    name = CharField("Maydon nomi", max_length=255)
    address = CharField("Manzil", max_length=255)

    latitude = FloatField("Geografik kenglik (Latitude)", null=True, blank=True, )
    longitude = FloatField("Geografik uzunlik (Longitude)", null=True, blank=True, )

    width = PositiveIntegerField("Maydon eni (metr)", default=20, )
    length = PositiveIntegerField("Maydon bo'yi (metr)", default=40, )

    price = DecimalField('Narxi', max_digits=12, decimal_places=2)
    description = TextField(verbose_name="Tavsif")
    start_time = TimeField(verbose_name="Boshlanish vaqti")
    end_time = TimeField(verbose_name="Tugash vaqti")
    has_wifi = BooleanField("Wi-Fi mavjud", default=False, )
    has_parking = BooleanField("Avtoturargoh mavjud", default=False, )
    status = CharField("Holati", max_length=10, choices=Role, default='pending', )
    created_at = DateTimeField("Ro'yxatga olingan vaqti", auto_now_add=True, )
    has_shower = BooleanField("Dush xonasi", default=False, )
    has_lighting = BooleanField("Yoritish tizimi", default=True, )
    has_dressing_room = BooleanField("Kiyinish xonasi", default=False, )
    has_equipment_rental = BooleanField("Koptok/Nimcha ijara", default=False, )

    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"

    class Meta:
        verbose_name = "Maydon"
        verbose_name_plural = "Maydonlar"


class VenueImage(Model):
    venue = ForeignKey('apps.Venue', CASCADE, related_name="images")
    image = ImageField(upload_to="venues/")

    def __str__(self):
        return self.venue.name

    class Meta:
        verbose_name = "Maydon rasm"
        verbose_name_plural = "Maydonlar rasmlari"


# --------------------------------------------------------------------------------


class Favorite(Model):
    user = ForeignKey("apps.User", CASCADE)
    venue = ForeignKey("apps.Venue", CASCADE)

    class Meta:
        unique_together = (("user", "venue"),)
        verbose_name = "Sevimli"
        verbose_name_plural = "Sevimlilar"


# --------------------------------------------------------------------------------------


class Booking(Model):
    class Status(TextChoices):
        PENDING = "pending", "⏳ Kutilmoqda"
        PAID = "paid", "💰 To‘langan"
        CANCELED = "canceled", "❌ Bekor qilingan"

    class PaymentType(TextChoices):
        DEPOSIT_50 = 'deposit_50', '50% Avans To\'lov'
        FULL_100 = 'full_100', '100% To\'liq To\'lov'

    user = ForeignKey("apps.User", CASCADE, related_name="bookings")
    venue = ForeignKey("apps.Venue", CASCADE, related_name="bookings")
    date = DateField()
    start_time = TimeField()
    end_time = TimeField()
    status = CharField(max_length=20, choices=Status, default=Status.PENDING)
    payment_type = CharField(max_length=20, choices=PaymentType, default=PaymentType.DEPOSIT_50)
    paid_amount = DecimalField(max_digits=12, decimal_places=2, default=0.0)
    remaining_amount = DecimalField(max_digits=12, decimal_places=2, default=0.0)
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (("venue", "date", "start_time"),)
        verbose_name = "Bron"
        verbose_name_plural = "Bronlar"

    def __str__(self):
        return f"{self.user} - {self.venue}"


# ---------------------------------------------------------------------------------------


class UserCard(Model):
    class Provider(TextChoices):
        CLICK = "click", "💳 Click"
        PAYME = "payme", "📱 Payme"

    user = ForeignKey("apps.User", CASCADE, related_name="cards")
    card_holder = CharField("Karta egasi", max_length=100)
    card_masked = CharField("Masklangan Karta (8600 **** **** 1234)", max_length=19)
    card_token = CharField("Token", max_length=255, unique=True)
    expire_month = PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(12)])
    expire_year = PositiveSmallIntegerField(validators=[MinValueValidator(24), MaxValueValidator(45)])
    provider = CharField(max_length=10, choices=Provider, default=Provider.CLICK)
    is_default = BooleanField(default=False)
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Foydalanuvchi Kartasi"
        verbose_name_plural = "Foydalanuvchilar Kartalari"
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f"{self.card_holder} | {self.card_masked}"

    def save(self, *args, **kwargs):
        if self.is_default:
            UserCard.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


# ---------------------------------------------------------------------------------------


class Payment(Model):
    class Method(TextChoices):
        CLICK = "click", "💳 Click to‘lov"
        PAYME = "payme", "📱 Payme to‘lov"

    class Status(TextChoices):
        PENDING = "pending", "Kutilmoqda"
        SUCCESS = "success", "Muvaffaqiyatli"
        FAILED = "failed", "Muvaffaqiyatsiz"

    booking = OneToOneField("apps.Booking", CASCADE, related_name="payment")
    user = ForeignKey("apps.User", CASCADE, related_name="payments", null=True, blank=True)
    card = ForeignKey("apps.UserCard", CASCADE, related_name="payments", null=True, blank=True)
    amount = DecimalField(max_digits=12, decimal_places=2)
    payment_method = CharField(max_length=20, choices=Method)
    transaction_id = CharField(max_length=255, blank=True, null=True)
    status = CharField(max_length=20, choices=Status, default=Status.PENDING)
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "To'lov"
        verbose_name_plural = "To'lovlar"

    def __str__(self):
        return f"{self.booking} - {self.amount} - {self.status}"



# -----------------------------------------------------------------------------------------


class Review(Model):
    user = ForeignKey("apps.User", CASCADE)
    venue = ForeignKey("apps.Venue", CASCADE, related_name="reviews")
    rating = PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = TextField()
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (("user", "venue"),)
        verbose_name = "Sharh"
        verbose_name_plural = "Sharhlar"


# -------------------------------------------------------------------------------


class SportType(Model):
    name = CharField(max_length=100, unique=True)
    icon = ImageField(upload_to="sports/", blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Sport turi"
        verbose_name_plural = "Sport turlari"

# ----------------------------------------------------------------------------------


class Discount(Model):
    """
    Admin panel orqali boshqariladigan narx chegirmasi/ustamasi.

    Qamrov (scope) 3 xil bo'lishi mumkin:
      - ALL   -> saytdagi barcha (tasdiqlangan) maydonlarga qo'llanadi
      - SPORT -> faqat tanlangan sport turiga tegishli barcha maydonlarga qo'llanadi
      - VENUE -> faqat bitta, aniq tanlangan maydonga qo'llanadi

    Bir vaqtning o'zida bir nechta chegirma amal qilishi mumkin bo'lgan holatda,
    ENG ANIQ (spetsifik) chegirma ustunlik qiladi: VENUE > SPORT > ALL.
    (get_active_for_venue() shu tartibda tanlaydi)
    """

    class Scope(TextChoices):
        ALL = "all", "🌍 Barcha maydonlar uchun"
        SPORT = "sport", "⚽ Sport turi bo'yicha"
        VENUE = "venue", "🏟 Bitta maydon uchun"

    class DiscountType(TextChoices):
        DECREASE = "decrease", "🔻 Chegirma (narxni kamaytirish)"
        INCREASE = "increase", "🔺 Ustama (narxni oshirish)"

    title = CharField(
        "Nomi",
        max_length=150,
        help_text="Masalan: 'Yangi yil aksiyasi' yoki 'Bayram narxi'. Faqat admin uchun, foydalanuvchiga ko'rinadi.",
    )
    scope = CharField("Qamrovi", max_length=10, choices=Scope, default=Scope.ALL)
    venue = ForeignKey(
        "apps.Venue", CASCADE, related_name="discounts",
        null=True, blank=True, verbose_name="Maydon",
        help_text="Faqat qamrov 'Bitta maydon uchun' bo'lsa tanlanadi.",
    )
    sport = ForeignKey(
        "apps.SportType", SET_NULL, related_name="discounts",
        null=True, blank=True, verbose_name="Sport turi",
        help_text="Faqat qamrov 'Sport turi bo'yicha' bo'lsa tanlanadi.",
    )
    discount_type = CharField("Turi", max_length=10, choices=DiscountType, default=DiscountType.DECREASE)
    percent = DecimalField(
        "Foizi (%)", max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0.01), MaxValueValidator(500)],
        help_text="Masalan: 25.00 yoki 30.00",
    )
    start_date = DateField("Boshlanish sanasi", help_text="Chegirma shu sanadan boshlab amal qiladi")
    end_date = DateField("Tugash sanasi", help_text="Chegirma shu sanada (kiritilgan kun ham) tugaydi")
    is_active = BooleanField("Faol", default=True, help_text="O'chirilsa, muddati tugamagan bo'lsa ham qo'llanmaydi")
    created_at = DateTimeField("Yaratilgan vaqti", auto_now_add=True)

    class Meta:
        verbose_name = "Chegirma"
        verbose_name_plural = "Chegirmalar"
        ordering = ("-created_at",)

    def __str__(self):
        sign = "+" if self.discount_type == self.DiscountType.INCREASE else "-"
        return f"{self.title} ({sign}{self.percent}%)"

    def clean(self):
        if self.scope == self.Scope.VENUE and not self.venue_id:
            raise ValidationError("Qamrov 'Bitta maydon uchun' bo'lganda, Maydon tanlanishi shart.")
        if self.scope == self.Scope.SPORT and not self.sport_id:
            raise ValidationError("Qamrov 'Sport turi bo'yicha' bo'lganda, Sport turi tanlanishi shart.")
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValidationError("Boshlanish sanasi tugash sanasidan kech bo'lishi mumkin emas.")

    def save(self, *args, **kwargs):
        # Qamrovga mos kelmaydigan FK larni avtomatik tozalaymiz (ma'lumot chalkashmasligi uchun)
        if self.scope == self.Scope.ALL:
            self.venue = None
            self.sport = None
        elif self.scope == self.Scope.VENUE:
            self.sport = None
        elif self.scope == self.Scope.SPORT:
            self.venue = None
        super().save(*args, **kwargs)

    @property
    def is_currently_valid(self):
        today = timezone.now().date()
        return bool(self.is_active and self.start_date <= today <= self.end_date)

    @classmethod
    def get_active_for_venue(cls, venue, on_date=None):
        """
        Berilgan maydon uchun aynan shu kunda amal qiladigan ENG ANIQ chegirmani qaytaradi.
        Ustunlik tartibi: VENUE > SPORT > ALL. Topilmasa None qaytadi.
        """
        if venue is None:
            return None
        target_date = on_date or timezone.now().date()
        base_qs = cls.objects.filter(
            is_active=True,
            start_date__lte=target_date,
            end_date__gte=target_date,
        )

        venue_discount = base_qs.filter(scope=cls.Scope.VENUE, venue_id=venue.id).order_by("-created_at").first()
        if venue_discount:
            return venue_discount

        if venue.sport_id:
            sport_discount = (
                base_qs.filter(scope=cls.Scope.SPORT, sport_id=venue.sport_id)
                .order_by("-created_at")
                .first()
            )
            if sport_discount:
                return sport_discount

        return base_qs.filter(scope=cls.Scope.ALL).order_by("-created_at").first()

    def apply_to_price(self, price: Decimal) -> Decimal:
        """Berilgan narxga ushbu chegirma/ustamani qo'llab, yangi narxni qaytaradi."""
        price = Decimal(str(price))
        pct = Decimal(str(self.percent))
        if self.discount_type == self.DiscountType.INCREASE:
            result = price * (Decimal("1") + pct / Decimal("100"))
        else:
            result = price * (Decimal("1") - pct / Decimal("100"))
        return max(Decimal("0"), result).quantize(Decimal("0.01"))

# ----------------------------------------------------------------------------------