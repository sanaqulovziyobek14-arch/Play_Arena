import datetime

from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import CreateAPIView
from rest_framework.mixins import CreateModelMixin, RetrieveModelMixin, UpdateModelMixin, ListModelMixin
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet, GenericViewSet
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.models import Booking, Favorite, Payment, Review, SportType, Venue, VenueImage
from apps.serializers import (
    BookingModelSerializer, FavoriteModelSerializer, PaymentModelSerializer,
    ReviewModelSerializer, SportTypeModelSerializer, CustomTokenObtainPairSerializer,
    UserModelSerializer, VenueModelSerializer, VenueImageModelSerializer, VenueCreateSerializer,
)
from .filters import BookingFilter, ReviewFilter

User = get_user_model()


# ══════════════════════════════════════════════════════
#  PERMISSIONS
# ══════════════════════════════════════════════════════

class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj == request.user or request.user.is_admin


class IsVenueOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user or request.user.is_admin


# ══════════════════════════════════════════════════════
#  AUTH
# ══════════════════════════════════════════════════════

@extend_schema(tags=['Auth'])
class CustomTokenObtainPairView(TokenObtainPairView):
    """Login — JWT token olish"""
    serializer_class = CustomTokenObtainPairSerializer


# ══════════════════════════════════════════════════════
#  USER
# ══════════════════════════════════════════════════════

@extend_schema(tags=['User'])
class UserCreateApiView(CreateAPIView):
    """Ro'yxatdan o'tish"""
    queryset = User.objects.all().order_by('id')
    serializer_class = UserModelSerializer
    permission_classes = [AllowAny]


@extend_schema(tags=['User'])
class UserViewSet(ModelViewSet):
    """Profil boshqaruvi"""
    serializer_class = UserModelSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return User.objects.all() if user.is_admin else User.objects.filter(pk=user.pk)

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        return [IsAuthenticated()]

    @extend_schema(exclude=True)
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(exclude=True)
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(exclude=True)
    def destroy(self, request, *args, **kwargs):
        if not request.user.is_admin:
            raise PermissionDenied("Foydalanuvchini o'chirish uchun admin bo'lishingiz kerak.")
        return super().destroy(request, *args, **kwargs)

    @extend_schema(
        summary="Profilni ko'rish",
        description="Foydalanuvchi o'z profilini ko'radi",
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Profilni yangilash",
        description="Foydalanuvchi o'z ma'lumotlarini (ism, telefon, parol) yangilaydi",
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)


# ══════════════════════════════════════════════════════
#  SPORT TYPE
# ══════════════════════════════════════════════════════

@extend_schema(tags=['Sport'])
class SportTypeViewSet(ModelViewSet):
    """Sport turlari"""
    queryset = SportType.objects.all().order_by('id')
    serializer_class = SportTypeModelSerializer
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def _check_admin(self, request):
        if not request.user.is_admin:
            raise PermissionDenied("Bu amalni bajarish uchun admin bo'lishingiz kerak.")

    @extend_schema(summary="Sport turlari ro'yxati")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(summary="Sport turi detail")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    # ── Admin only, swagger da ko'rsatilmaydi ──
    @extend_schema(exclude=True)
    def create(self, request, *args, **kwargs):
        self._check_admin(request)
        return super().create(request, *args, **kwargs)

    @extend_schema(exclude=True)
    def update(self, request, *args, **kwargs):
        self._check_admin(request)
        return super().update(request, *args, **kwargs)

    @extend_schema(exclude=True)
    def partial_update(self, request, *args, **kwargs):
        self._check_admin(request)
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(exclude=True)
    def destroy(self, request, *args, **kwargs):
        self._check_admin(request)
        return super().destroy(request, *args, **kwargs)


# ══════════════════════════════════════════════════════
#  VENUE
# ══════════════════════════════════════════════════════

@extend_schema(tags=['Venue'])
class VenueViewSet(ModelViewSet):
    """Sport maydonlari"""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["sport", "has_wifi", "has_parking"]
    search_fields = ["name", "address", "description"]
    ordering_fields = ["price", "created_at", "rating"]
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """
        Mukammallik: Bazadan ma'lumotlarni optimallashgan holda tortamiz.
        Foydalanuvchilarga faqat tasdiqlangan (tasdiqlandi) maydonlar ko'rinadi.
        Sizning maydoningiz bo'lsa yoki admin bo'lsangiz, kutilayotganlarini ham ko'ra olasiz.
        """
        user = self.request.user

        base_queryset = Venue.objects.select_related("owner", "sport") \
            .prefetch_related("images") \
            .annotate(
            rating=Avg("reviews__rating"),
            review_count=Count("reviews"),
        )

        if self.action in ['list', 'retrieve']:
            # Agar foydalanuvchi tizimga kirmagan bo'lsa (Anonim), faqat tasdiqlanganlarni ko'radi
            if not user.is_authenticated:
                return base_queryset.filter(status=Venue.Role.APPROVED)

            # Agar admin bo'lsa, barcha maydonlarni (kutilmoqda, tasdiqlandi, bekor qilingan) ko'ra oladi
            if getattr(user, 'role', None) == 'admin' or user.is_staff:
                return base_queryset

            # Agar oddiy owner bo'lsa, o'ziga tegishli barcha maydonlarni + boshqalarning faqat 'tasdiqlandi' bo'lganlarini ko'radi
            return base_queryset.filter(Q(status=Venue.Role.APPROVED) | Q(owner=user))

        return base_queryset

    def get_serializer_class(self):
        """
        Mukammallik: Maydon yaratishda rasmlarni qabul qiladigan serializer,
        ko'rishda esa oddiy serializer ishlaydi.
        """
        if self.action == 'create':
            return VenueCreateSerializer
        return VenueModelSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        if self.action == 'create':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsVenueOwnerOrAdmin()]

    def perform_create(self, serializer):
        if getattr(self.request.user, 'role', None) not in ["owner", "admin"]:
            raise PermissionDenied("Maydon yaratish uchun 'owner' yoki 'admin' roliga ega bo'lishingiz kerak.")
        serializer.save(owner=self.request.user)

    @extend_schema(summary="Maydonlar ro'yxati", description="Filtr: sport, has_wifi, has_parking, search, ordering")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(summary="Maydon detail")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(summary="Yangi maydon qo'shish (faqat owner/admin)")
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(exclude=True)
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(exclude=True)
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(exclude=True)
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


class VenueImageViewSet(ModelViewSet):
    """Maydon rasmlari — admin panelda boshqariladi"""
    queryset = VenueImage.objects.select_related("venue__owner")
    serializer_class = VenueImageModelSerializer
    permission_classes = [AllowAny]

    def get_permissions(self):
        return [AllowAny()] if self.action in ['list', 'retrieve'] else [IsAuthenticated()]

    def _check_venue_owner(self, venue):
        if venue.owner != self.request.user and not self.request.user.is_admin:
            raise PermissionDenied("Bu amalni bajarish huquqingiz yo'q.")

    def perform_create(self, serializer):
        self._check_venue_owner(serializer.validated_data["venue"])
        serializer.save()

    def perform_destroy(self, instance):
        self._check_venue_owner(instance.venue)
        instance.delete()


# ══════════════════════════════════════════════════════
#  BOOKING
# ══════════════════════════════════════════════════════

@extend_schema(tags=['Booking'])
class BookingViewSet(CreateModelMixin, RetrieveModelMixin,
                     UpdateModelMixin, ListModelMixin, GenericViewSet):
    """Bron tizimi"""
    serializer_class = BookingModelSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = BookingFilter
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        qs = Booking.objects.select_related("user", "venue")
        if user.is_admin:
            return qs
        if user.is_owner:
            return qs.filter(venue__owner=user)
        return qs.filter(user=user)

    def perform_create(self, serializer):
        if self.request.user.is_owner:
            raise PermissionDenied("Maydon egalari bron qila olmaydi.")
        serializer.save(user=self.request.user)

    @extend_schema(summary="Bronlarim ro'yxati")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(summary="Yangi bron yaratish")
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(summary="Bron detail")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(summary="Bronni bekor qilish (status=canceled)")
    def partial_update(self, request, *args, **kwargs):
        booking = self.get_object()
        if booking.user != request.user and not request.user.is_admin:
            raise PermissionDenied("Bu bronni bekor qilish huquqingiz yo'q.")
        if request.data.get("status") not in ("canceled", None):
            raise PermissionDenied("Faqat 'canceled' statusini o'rnatish mumkin.")
        return super().partial_update(request, *args, **kwargs)


@extend_schema(
    tags=['Booking'],
    summary="Maydonning band soatlari",
    description="Berilgan sanada qaysi soatlar band ekanini qaytaradi",
    parameters=[OpenApiParameter(
        name='date', type=OpenApiTypes.DATE,
        location=OpenApiParameter.QUERY, required=True,
        description="Sana formati: YYYY-MM-DD"
    )]
)
class VenueBookedSlotsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, venue_id):
        date_str = request.GET.get("date")
        if not date_str:
            return Response({"error": "date parametri kerak"}, status=400)
        try:
            valid_date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"error": "Sana formati noto'g'ri. YYYY-MM-DD formatida yuboring."}, status=400)
        if not Venue.objects.filter(pk=venue_id).exists():
            return Response({"error": "Maydon topilmadi"}, status=404)

        booked = Booking.objects.filter(
            venue_id=venue_id, date=valid_date
        ).values("start_time", "end_time")

        return Response({"booked": [
            {"start": str(b["start_time"]), "end": str(b["end_time"])}
            for b in booked
        ]})


# ══════════════════════════════════════════════════════
#  PAYMENT — Swagger dan yashirilgan
# ══════════════════════════════════════════════════════

@extend_schema(exclude=True)
class PaymentViewSet(ModelViewSet):
    """To'lovlar — hozir frontend ishlatmaydi"""
    serializer_class = PaymentModelSerializer
    permission_classes = [IsAuthenticated]
    queryset = Payment.objects.select_related("booking__user", "booking__venue")

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        return qs if user.is_admin else qs.filter(booking__user=user)

    def perform_create(self, serializer):
        booking = serializer.validated_data["booking"]
        if booking.user != self.request.user and not self.request.user.is_admin:
            raise PermissionDenied("Bu bron uchun to'lov qila olmaysiz.")
        serializer.save()


# ══════════════════════════════════════════════════════
#  REVIEW
# ══════════════════════════════════════════════════════

@extend_schema(tags=['Review'])
class ReviewViewSet(ModelViewSet):
    """Sharhlar"""
    queryset = Review.objects.select_related("user", "venue")
    serializer_class = ReviewModelSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_class = ReviewFilter

    def _check_author(self, user, obj_user):
        if obj_user != user and not user.is_admin:
            raise PermissionDenied("Bu amalni bajarish huquqingiz yo'q.")

    def perform_create(self, serializer):
        user = self.request.user
        venue = serializer.validated_data["venue"]
        has_booking = Booking.objects.filter(
            user=user, venue=venue, status__in=["paid", "pending"]
        ).exists()
        if not has_booking and not user.is_admin:
            raise PermissionDenied("Sharh yozish uchun avval bu maydonni bron qilishingiz kerak.")
        if Review.objects.filter(user=user, venue=venue).exists():
            raise PermissionDenied("Siz bu maydon uchun allaqachon sharh yozgansiz.")
        serializer.save(user=user)

    def perform_update(self, serializer):
        self._check_author(self.request.user, serializer.instance.user)
        serializer.save()

    def perform_destroy(self, instance):
        self._check_author(self.request.user, instance.user)
        instance.delete()

    @extend_schema(summary="Sharhlar ro'yxati")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(summary="Yangi sharh qoldirish")
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(summary="Sharh detail")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    # ── Frontend ishlatmaydi ──
    @extend_schema(exclude=True)
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(exclude=True)
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(exclude=True)
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


# ══════════════════════════════════════════════════════
#  FAVORITE
# ══════════════════════════════════════════════════════

@extend_schema(tags=['Favorite'])
class FavoriteViewSet(ModelViewSet):
    """Sevimli maydonlar"""
    serializer_class = FavoriteModelSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.select_related("venue")

    def perform_create(self, serializer):
        venue = serializer.validated_data["venue"]
        if Favorite.objects.filter(user=self.request.user, venue=venue).exists():
            raise PermissionDenied("Bu maydon allaqachon sevimlilaringizda bor.")
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        if instance.user != self.request.user:
            raise PermissionDenied("Bu sevimlini o'chirish huquqingiz yo'q.")
        instance.delete()

    @extend_schema(summary="Sevimli maydonlar ro'yxati")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(summary="Sevimlilarga qo'shish")
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(summary="Sevimlilardan o'chirish")
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
