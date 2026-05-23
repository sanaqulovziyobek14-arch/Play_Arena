from rest_framework import serializers

from .models import SportType


class SportSerializer(serializers.ModelSerializer):
    venue_count = serializers.IntegerField(read_only=True)

    class Meta:
        model  = SportType
        fields = ('id', 'name', 'icon',  'venue_count')