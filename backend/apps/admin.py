from django.contrib import admin
from django.contrib.admin import ModelAdmin, TabularInline
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils import timezone
from django.utils.html import format_html
from apps.models import (
    Booking,
    Discount,
    Favorite,
    Payment,
    Review,
    SportType,
    User,
    Venue,
    VenueImage,
)


# =====================================================
# USER

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        "id",
        "username",
        "email",
        "phone",
        "role",
        "is_active",
        "is_staff",
    )
    search_fields = (
        "username",
        "email",
        "phone",
    )
    list_filter = (
        "role",
        "is_active",
        "is_staff",
    )
    ordering = ("id",)

    fieldsets = BaseUserAdmin.fieldsets + (
        ("Qo'shimcha ma'lumotlar", {"fields": ("phone", "role", "image")}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("Qo'shimcha ma'lumotlar", {"fields": ("phone", "role", "image")}),
    )


# =====================================================
# SPORT TYPE

@admin.register(SportType)
class SportTypeAdmin(ModelAdmin):
    list_display = (
        "id",
        "name",
    )
    search_fields = ("name",)
    ordering = ("name",)


# =====================================================
# VENUE IMAGE INLINE

class VenueImageInline(TabularInline):
    model = VenueImage
    extra = 1


# =====================================================
# VENUE

@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'sport', 'address', 'price', 'start_time', 'end_time', 'size', 'status')
    list_display_links = ('id', 'name')
    list_filter = ('status', 'sport')
    search_fields = ('name', 'address')
    actions = ['approve_venues', 'reject_venues']
    fieldsets = (
        ("Asosiy ma'lumotlar", {
            'fields': ('name', 'owner', 'sport', 'price', 'description', 'start_time', 'end_time', 'status', 'address')
        }),
        ("O'lcham va Yuza", {
            'fields': ('size',)
        }),
        ("Qulayliklar (Ikonkalar uchun)", {
            'fields': ('has_wifi', 'has_parking', 'has_shower', 'has_lighting', 'has_dressing_room',
                       'has_equipment_rental')
        }),
    )
    inlines = [
        VenueImageInline,
    ]

    @admin.action(description="✅ Tanlangan maydonlarni TASDIQLASH")
    def approve_venues(self, request, queryset):
        updated = queryset.update(status=Venue.Role.APPROVED)
        self.message_user(request, f"{updated} ta maydon tasdiqlandi va saytda ko'rinadigan bo'ldi.")

    @admin.action(description="❌ Tanlangan maydonlarni RAD ETISH")
    def reject_venues(self, request, queryset):
        updated = queryset.update(status=Venue.Role.REJECTED)
        self.message_user(request, f"{updated} ta maydon rad etildi va saytda ko'rinmaydi.")


# =====================================================
# VENUE IMAGE

@admin.register(VenueImage)
class VenueImageAdmin(ModelAdmin):
    list_display = (
        "id",
        "venue",
    )
    search_fields = ("venue__name",)


# =====================================================
# DISCOUNT (Chegirmalar)

@admin.register(Discount)
class DiscountAdmin(ModelAdmin):
    list_display = (
        "id",
        "title",
        "scope_badge",
        "target_display",
        "type_badge",
        "percent",
        "start_date",
        "end_date",
        "status_badge",
    )
    list_display_links = ("id", "title")
    list_filter = ("scope", "discount_type", "is_active", "sport")
    search_fields = ("title", "venue__name", "sport__name")
    ordering = ("-created_at",)
    autocomplete_fields = ("venue",)

    fieldsets = (
        ("Asosiy ma'lumotlar", {
            "fields": ("title", "is_active"),
        }),
        ("Qamrov — kimga tegishli bo'lishini tanlang", {
            "fields": ("scope", "venue", "sport"),
            "description": (
                "• Barcha maydonlar uchun — venue va sportni bo'sh qoldiring.<br>"
                "• Sport turi bo'yicha — faqat 'Sport turi' maydonini tanlang (masalan: Futbol).<br>"
                "• Bitta maydon uchun — faqat 'Maydon' maydonini tanlang."
            ),
        }),
        ("Chegirma / Ustama qiymati", {
            "fields": ("discount_type", "percent"),
            "description": "🔻 Chegirma — narxni kamaytiradi. 🔺 Ustama — narxni oshiradi (masalan bayram kunlari).",
        }),
        ("Amal qilish muddati", {
            "fields": ("start_date", "end_date"),
        }),
    )

    @admin.display(description="Qamrovi")
    def scope_badge(self, obj):
        colors = {"all": "#2563eb", "sport": "#7c3aed", "venue": "#059669"}
        color = colors.get(obj.scope, "#6b7280")
        return format_html(
            '<span style="background:{}1a;color:{};padding:2px 8px;border-radius:6px;'
            'font-size:11px;font-weight:700;border:1px solid {}40;">{}</span>',
            color, color, color, obj.get_scope_display(),
        )

    @admin.display(description="Kimga tegishli")
    def target_display(self, obj):
        if obj.scope == Discount.Scope.VENUE and obj.venue_id:
            return obj.venue.name
        if obj.scope == Discount.Scope.SPORT and obj.sport_id:
            return obj.sport.name
        return "— Barchasi —"

    @admin.display(description="Turi")
    def type_badge(self, obj):
        if obj.discount_type == Discount.DiscountType.INCREASE:
            return format_html('<span style="color:#dc2626;font-weight:700;">🔺 +{}%</span>', obj.percent)
        return format_html('<span style="color:#16a34a;font-weight:700;">🔻 -{}%</span>', obj.percent)

    @admin.display(description="Holati")
    def status_badge(self, obj):
        today = timezone.now().date()
        if not obj.is_active:
            return format_html('<span style="color:#9ca3af;">{}</span>', "⛔ Nofaol")
        if obj.start_date > today:
            return format_html('<span style="color:#d97706;">{}</span>', "🕒 Hali boshlanmagan")
        if obj.end_date < today:
            return format_html('<span style="color:#dc2626;">{}</span>', "🔴 Muddati tugagan")
        return format_html('<span style="color:#16a34a;font-weight:700;">{}</span>', "🟢 Hozir amal qiladi")


# =====================================================
# BOOKING

@admin.register(Booking)
class BookingAdmin(ModelAdmin):
    list_display = (
        "id",
        "user",
        "venue",
        "date",
        "start_time",
        "end_time",
        "status",
    )
    search_fields = (
        "user__username",
        "venue__name",
    )
    list_filter = (
        "status",
        "date",
    )


# =====================================================
# PAYMENT

@admin.register(Payment)
class PaymentAdmin(ModelAdmin):
    list_display = (
        "id",
        "booking",
        "amount",
        "payment_method",
        "status",
    )
    search_fields = (
        "booking__user__username",
        "booking__venue__name",
    )
    list_filter = (
        "payment_method",
        "status",
    )


# =====================================================
# REVIEW
@admin.register(Review)
class ReviewAdmin(ModelAdmin):
    list_display = (
        "id",
        "user",
        "venue",
        "rating",
    )
    search_fields = (
        "user__username",
        "venue__name",
        "comment",
    )
    list_filter = ("rating",)


# =====================================================
# FAVORITE

@admin.register(Favorite)
class FavoriteAdmin(ModelAdmin):
    list_display = (
        "id",
        "user",
        "venue",
    )
    search_fields = (
        "user__username",
        "venue__name",
    )