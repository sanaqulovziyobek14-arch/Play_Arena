from django_filters import NumberFilter, ModelChoiceFilter, CharFilter, DateFilter
from django_filters.rest_framework import FilterSet, BooleanFilter

from apps.models import Venue, Booking, Review, SportType


# =========================
# VENUE FILTER

class VenueFilter(FilterSet):
    min_price = NumberFilter(field_name="price", lookup_expr="gte")
    max_price = NumberFilter(field_name="price", lookup_expr="lte")
    sport = ModelChoiceFilter(queryset=SportType.objects.all())
    has_wifi = BooleanFilter()
    has_parking = BooleanFilter()

    name = CharFilter(field_name="name", lookup_expr="icontains")
    address = CharFilter(field_name="address", lookup_expr="icontains")

    class Meta:
        model = Venue
        fields = [
            "sport",
            "has_wifi",
            "has_parking",
            "name",
            "address",
        ]


# =========================
# BOOKING FILTER

class BookingFilter(FilterSet):
    date_from = DateFilter(field_name="date", lookup_expr="gte")
    date_to = DateFilter(field_name="date", lookup_expr="lte")

    status = CharFilter(field_name="status")

    class Meta:
        model = Booking
        fields = [
            "status",
            "date_from",
            "date_to",
        ]


# =========================
# REVIEW FILTER

class ReviewFilter(FilterSet):
    min_rating = NumberFilter(field_name="rating", lookup_expr="gte")
    max_rating = NumberFilter(field_name="rating", lookup_expr="lte")

    class Meta:
        model = Review
        fields = ["min_rating", "max_rating"]
