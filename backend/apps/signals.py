import os
from threading import Thread

import requests
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.models import Booking, Venue

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
OWNER_CHAT_ID = os.getenv("OWNER_CHAT_ID", "")


def sync_send_telegram(chat_id, text):
    """Xabarlarni xavfsiz va asinxron thread ichida tezkor jo'natish"""
    if not BOT_TOKEN or not chat_id:
        return
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": str(chat_id),
        "text": text,
        "parse_mode": "Markdown"
    }
    try:
        Thread(target=lambda: requests.post(url, json=payload, timeout=5)).start()
    except Exception as e:
        print(f"Telegram thread error: {e}")


@receiver(post_save, sender=Booking)
def notify_users_on_booking(instance, created, **kwargs):
    """Bron yaratilganda yoki bekor qilinganda Admin va Maydon egasini ogohlantirish"""
    venue = instance.venue
    owner = venue.owner  # Maydon egasi (User)

    status_label = getattr(instance, 'status', 'pending')

    # Holat matnini aniqlash
    if status_label == "paid":
        action_title = "🔔 YANGI ONLAYN BRON BILDIRISHNOMASI!"
        status_text = "✅ To‘langan (Onlayn)"
    elif status_label in ["canceled"]:
        action_title = "❌ BRON BEKOR QILINDI!"
        status_text = "❌ Bekor qilingan"
    else:
        action_title = "⏳ BRON KUTILMOQDA"
        status_text = "⏳ Kutilmoqda"

    message_text = (
        f"{action_title}\n\n"
        f"🏟 *Maydon:* {venue.name}\n"
        f"👤 *Mijoz:* {instance.user.get_full_name() or instance.user.username}\n"
        f"📞 *Telefon:* {getattr(instance.user, 'phone', 'Kiritilmagan')}\n"
        f"📅 *Sana:* {instance.date.strftime('%Y-%m-%d')}\n"
        f"⏳ *Vaqti:* {instance.start_time.strftime('%H:%M')} dan {instance.end_time.strftime('%H:%M')} gacha\n"
        f"💳 *Holat:* {status_text}\n\n"
        f"🌐 _Manba: Tizim paneli/Veb-sayt_"
    )

    # 1. Sizga (Asosiy Adminga) doim boradi
    if OWNER_CHAT_ID:
        sync_send_telegram(OWNER_CHAT_ID, message_text)

    # 2. Maydon egasiga (Agar u admin bo'lmasa va telegram_chat_id kiritilgan bo'lsa) yuboriladi
    if owner and getattr(owner, 'telegram_chat_id', None):
        if str(owner.telegram_chat_id) != str(OWNER_CHAT_ID):
            sync_send_telegram(owner.telegram_chat_id, message_text)


@receiver(post_save, sender=Venue)
def venue_moderation_signal(sender, instance, created, **kwargs):
    """Faqat yangi maydon qo'shilganda Adminga tasdiqlash uchun boradi"""
    if created:
        text = (
            f"🆕 *Yangi stadion arizasi tushdi!* (Tasdiqlanmagan)\n\n"
            f"🏟️ *Nomi:* {instance.name}\n"
            f"📍 *Manzil:* {getattr(instance, 'address', 'Koʻrsatilmagan')}\n"
            f"💰 *Narxi:* {int(instance.price):,} so'm\n"
            f"👤 *Kim tomonidan:* {instance.owner.username}\n\n"
            f"⚠️ _Tasdiqlash yoki rad etish uchun Django Admin panelga kiring._"
        )
        if OWNER_CHAT_ID:
            sync_send_telegram(OWNER_CHAT_ID, text)