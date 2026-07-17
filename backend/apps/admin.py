from django.contrib import admin
from django.contrib.admin import ModelAdmin, TabularInline
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from apps.models import (
    Booking,
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
