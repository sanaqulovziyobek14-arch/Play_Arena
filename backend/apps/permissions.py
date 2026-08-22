from rest_framework import permissions


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission: Maydon egasiga va Adminlarga to'liq huquq (Edit/Delete),
    boshqalarga esa faqat ko'rish (ReadOnly) ruxsatini beradi.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user or getattr(request.user, "role", None) == "admin" or getattr(request.user, "is_staff", False)


class IsAdminUser(permissions.BasePermission):
    """
    Faqat platforma adminlariga ruxsat berish
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            getattr(request.user, "role", None) == "admin" or getattr(request.user, "is_staff", False)
        )
