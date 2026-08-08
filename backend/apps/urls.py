from django.urls import path
from rest_framework.routers import SimpleRouter
from rest_framework_simplejwt.views import TokenRefreshView

from apps.views import (
    UserViewSet, SportTypeViewSet, VenueViewSet, VenueImageViewSet,
    BookingViewSet, PaymentViewSet, ReviewViewSet, FavoriteViewSet,
    VenueBookedSlotsAPIView, UserCreateApiView, CustomTokenObtainPairView,
    MyVenueStatsAPIView,PlatformStatsAPIView,
)

router = SimpleRouter(trailing_slash=False)

router.register("users", UserViewSet, basename="users")
router.register("venues", VenueViewSet, basename="venues")
router.register("venue-images", VenueImageViewSet, basename="venue-images")
router.register("bookings", BookingViewSet, basename="bookings")
router.register("payments", PaymentViewSet, basename="payments")
router.register("reviews", ReviewViewSet, basename="reviews")
router.register("favorites", FavoriteViewSet, basename="favorites")
router.register("sport-types", SportTypeViewSet, basename="sport-types")

urlpatterns = [
                  path("venues/<int:venue_id>/booked-slots", VenueBookedSlotsAPIView.as_view()),
                  path("venues/my-stats", MyVenueStatsAPIView.as_view(), name="venue-my-stats"),
                  path("stats", PlatformStatsAPIView.as_view(), name="platform-stats"),
                  path("auth/register", UserCreateApiView.as_view()),
                  path("token", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
                  path("token/refresh", TokenRefreshView.as_view(), name="token_refresh"),
              ] + router.urls
