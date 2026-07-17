"""
PlayArena Telegram Bot — Production Ready Version
Django ORM bilan xavfsiz va asinxron ishlaydi.
Foydalanuvchi tomonidan arenalarni WebApp xaritasi orqali mukammal qo'shish,
tahrirlash, o'chirish va Admin tasdiqlash tizimi to'liq integratsiya qilingan.
"""
import asyncio
import datetime
import logging
import os
import sys
from pathlib import Path

from apscheduler.schedulers.asyncio import AsyncIOScheduler
import django
from django.conf import settings
from django.utils import timezone
from django.db.models import Count, Q
from asgiref.sync import sync_to_async
from django.core.files import File
import requests  # Manzilni koordinatadan matnga o'tkazish uchun

from aiogram import Bot, Dispatcher, F
from aiogram.filters import Command, Filter
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import (
    Message, CallbackQuery, WebAppInfo,
    ReplyKeyboardMarkup, InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardRemove
)
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.models import Booking, Venue, SportType, VenueImage  # noqa: E402
from django.contrib.auth import get_user_model  # noqa: E402

User = get_user_model()

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
OWNER_CHAT_ID = int(os.getenv("OWNER_CHAT_ID", 0))

if not BOT_TOKEN:
    raise ValueError("BOT_TOKEN .env faylida ko'rsatilmagan!")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("PlayArenaBot")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(storage=MemoryStorage())
scheduler = AsyncIOScheduler(timezone="Asia/Tashkent")


class IsAdminFilter(Filter):
    async def __call__(self, message: Message) -> bool:
        return message.from_user.id == OWNER_CHAT_ID


class IsAdminCallbackFilter(Filter):
    async def __call__(self, callback_query: CallbackQuery) -> bool:
        return callback_query.from_user.id == OWNER_CHAT_ID


class BookingState(StatesGroup):
    venue = State()
    date = State()
    slot = State()
    name = State()
    phone = State()
    confirm = State()


# --- Maydon qo'shish uchun optimallashgan FSM holatlari ---
class AddVenueState(StatesGroup):
    name = State()
    sport_type = State()
    price = State()
    description = State()
    start_time = State()
    end_time = State()
    location = State()  # Koordinatalar va matnli manzil shu bosqichda aniqlanadi
    photo = State()
    confirmation = State()  # Tekshirish, tahrirlash va yakuniy yuklash bosqichi


# --- Koordinatadan aniq matnli manzilni aniqlash funksiyasi ---
def get_address_from_coords(lat: float, lon: float) -> str:
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&addressdetails=1"
        headers = {'User-Agent': 'PlayArenaBot/2.0 (contact: playarena.uz)'}
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            return data.get("display_name", f"Koordinata: {lat}, {lon}")
    except Exception as e:
        log.error(f"Manzilni aniqlashda xatolik: {e}")
    return f"Koordinata: {lat}, {lon}"


@sync_to_async
def db_get_venues(user_id: int = None) -> list:
    try:
        qs = Venue.objects.select_related("owner", "sport")
        if user_id and user_id != OWNER_CHAT_ID:
            qs = qs.filter(owner__username=str(user_id))
        return list(qs)
    except Exception as e:
        log.error(f"Error fetching venues: {e}")
        return []


@sync_to_async
def db_get_venue(vid: int):
    try:
        return Venue.objects.select_related("owner", "sport").filter(pk=vid).first()
    except Exception as e:
        log.error(f"Error fetching venue {vid}: {e}")
        return None


@sync_to_async
def db_get_bookings(date: datetime.date, user_id: int = None, venue_id: int = None) -> list:
    try:
        qs = Booking.objects.select_related("user", "venue").filter(date=date)
        if venue_id:
            qs = qs.filter(venue_id=venue_id)
        if user_id and user_id != OWNER_CHAT_ID:
            qs = qs.filter(venue__owner__username=str(user_id))
        return list(qs.order_by("start_time"))
    except Exception as e:
        log.error(f"Error fetching bookings: {e}")
        return []


@sync_to_async
def db_booked_slots(venue_id: int, date: datetime.date) -> list:
    try:
        return list(
            Booking.objects.filter(venue_id=venue_id, date=date)
            .exclude(status="canceled")
            .values_list("start_time", "end_time")
        )
    except Exception as e:
        log.error(f"Error fetching booked slots: {e}")
        return []


@sync_to_async
def db_create_booking(venue_id, date, start, end, booker_tg_id: int):
    v = Venue.objects.get(pk=venue_id)
    client_user = User.objects.filter(username=str(booker_tg_id)).first()
    if not client_user:
        client_user = v.owner
    return Booking.objects.create(
        user=client_user,
        venue=v,
        date=date,
        start_time=start,
        end_time=end,
        status="paid",
    )


@sync_to_async
def db_stats(d1: datetime.date, d2: datetime.date, user_id: int = None) -> dict:
    try:
        qs = Booking.objects.select_related("user", "venue").filter(date__gte=d1, date__lte=d2)
        if user_id and user_id != OWNER_CHAT_ID:
            qs = qs.filter(venue__owner__username=str(user_id))
        lst = list(qs)
        return {
            "total": len(lst),
            "paid": sum(1 for b in lst if b.status == "paid"),
            "pending": sum(1 for b in lst if b.status == "pending"),
            "canceled": sum(1 for b in lst if b.status in ["canceled"]),
            "bookings": lst,
        }
    except Exception as e:
        log.error(f"Error generating stats: {e}")
        return {"total": 0, "paid": 0, "pending": 0, "canceled": 0, "bookings": []}


@sync_to_async
def db_get_monthly_ranking() -> str:
    try:
        today = timezone.now().date()
        first_day_this_month = today.replace(day=1)
        last_day_last_month = first_day_this_month - datetime.timedelta(days=1)
        first_day_last_month = last_day_last_month.replace(day=1)

        owners = User.objects.filter(role="owner").annotate(
            completed_count=Count('venues__bookings', filter=Q(
                venues__bookings__date__gte=first_day_last_month,
                venues__bookings__date__lte=last_day_last_month,
                venues__bookings__status="paid"
            )),
            canceled_count=Count('venues__bookings', filter=Q(
                venues__bookings__date__gte=first_day_last_month,
                venues__bookings__date__lte=last_day_last_month,
                venues__bookings__status__in=["canceled"]
            ))
        ).order_by('-completed_count')

        text = f"🏆 *O'TGAN OY REYTINGI ({first_day_last_month.strftime('%m.%Y')})*\n"
        text += f"📅 Davr: {first_day_last_month} — {last_day_last_month}\n\n"

        if not owners.exists():
            return text + "O'tgan oyda arenalarda harakatlar bo'lmagan. 😴"

        for idx, owner in enumerate(owners, 1):
            full_name = owner.get_full_name() or owner.username
            text += f"{idx}. 👤 *{full_name}*\n   ✅ Muvaffaqiyatli: {owner.completed_count} ta\n   ❌ Bekor qilingan: {owner.canceled_count} ta\n\n"
        return text
    except Exception as e:
        log.error(f"Ranking error: {e}")
        return "❌ Reytingni hisoblashda xatolik yuz berdi."


def main_menu() -> ReplyKeyboardMarkup:
    b = ReplyKeyboardBuilder()
    b.button(text="📋 Bugungi bronlar")
    b.button(text="📆 Ertangi bronlar")
    b.button(text="➕ Bron qo'shish")
    b.button(text="➕ Maydon qo'shish")
    b.button(text="📊 Hisobotlar")
    b.button(text="🏟️ Maydonlarim")
    b.button(text="ℹ️ Yordam")
    b.adjust(2, 2, 2, 1)
    return b.as_markup(resize_keyboard=True)


def venues_kb(venues: list) -> InlineKeyboardMarkup:
    b = InlineKeyboardBuilder()
    for v in venues:
        b.button(text=f"🏟️ {v.name}", callback_data=f"v_{v.id}")
    b.adjust(1)
    return b.as_markup()


def dates_kb() -> InlineKeyboardMarkup:
    b = InlineKeyboardBuilder()
    today = timezone.now().date()
    days = ["Dush", "Sesh", "Chor", "Pay", "Juma", "Shan", "Yak"]
    for i in range(7):
        d = today + datetime.timedelta(days=i)
        lbl = (
            f"📅 Bugun — {d.strftime('%d.%m')}" if i == 0 else
            f"📅 Ertaga — {d.strftime('%d.%m')}" if i == 1 else
            f"📅 {days[d.weekday()]} — {d.strftime('%d.%m')}"
        )
        b.button(text=lbl, callback_data=f"d_{d.isoformat()}")
    b.adjust(1)
    return b.as_markup()


def slots_kb(booked: list, sh: int, eh: int) -> InlineKeyboardMarkup:
    b = InlineKeyboardBuilder()
    busy = {(s.hour if hasattr(s, "hour") else int(str(s)[:2])) for s, _ in booked}
    for h in range(sh, eh):
        if h in busy:
            b.button(text=f"🔴 {h:02d}:00–{h + 1:02d}:00 (band)", callback_data=f"busy_{h}")
        else:
            b.button(text=f"🟢 {h:02d}:00–{h + 1:02d}:00", callback_data=f"sl_{h}")
    b.adjust(2)
    return b.as_markup()


def confirm_kb() -> InlineKeyboardMarkup:
    b = InlineKeyboardBuilder()
    b.button(text="✅ Tasdiqlash", callback_data="do_save")
    b.button(text="❌ Bekor qilish", callback_data="do_cancel")
    b.adjust(2)
    return b.as_markup()


def cancel_kb() -> InlineKeyboardMarkup:
    b = InlineKeyboardBuilder()
    b.button(text="🔙 Bekor qilish", callback_data="do_cancel")
    return b.as_markup()


def reports_kb() -> InlineKeyboardMarkup:
    b = InlineKeyboardBuilder()
    b.button(text="📅 Bugun", callback_data="rep_today")
    b.button(text="📅 Ertaga", callback_data="rep_tomorrow")
    b.button(text="📆 Bu hafta", callback_data="rep_week")
    b.button(text="📆 O'tgan hafta", callback_data="rep_lastweek")
    b.button(text="📊 Bu oy", callback_data="rep_month")
    b.button(text="📊 O'tgan oy", callback_data="rep_lastmonth")
    b.adjust(2)
    return b.as_markup()


S_EMOJI = {"paid": "✅", "pending": "⏳", "canceled": "❌"}
S_LABEL = {"paid": "To'langan", "pending": "Kutilmoqda", "canceled": "Bekor qilingan"}


def fmt(b: Booking, i: int = None) -> str:
    p = f"*{i}.* " if i else ""
    return (
        f"{p}{S_EMOJI.get(b.status, '❓')} "
        f"*{b.start_time.strftime('%H:%M')}–{b.end_time.strftime('%H:%M')}*\n"
        f"🏟️ {b.venue.name}\n"
        f"👤 {b.user.get_full_name() or b.user.username}\n"
        f"📱 {getattr(b.user, 'phone', '—') or '—'}\n"
        f"💵 {S_LABEL.get(b.status, '?')}  |  🆔 #{b.id}"
    )


def fmt_stats(stats: dict, label: str) -> str:
    t = (
        f"📊 *{label}*\n\n"
        f"📋 Jami: *{stats['total']}*\n"
        f"✅ To'langan: *{stats['paid']}*\n"
        f"⏳ Kutilmoqda: *{stats['pending']}*\n"
        f"❌ Bekor: *{stats['canceled']}*\n"
    )
    if stats["bookings"]:
        t += "\n*Tafsilot:*\n"
        for i, b in enumerate(stats["bookings"][:15], 1):
            t += f"\n{fmt(b, i)}\n"
        if len(stats["bookings"]) > 15:
            t += f"\n_...va yana {len(stats['bookings']) - 15} ta_"
    return t


@dp.message(Command("start"))
async def cmd_start(msg: Message):
    is_admin = (msg.from_user.id == OWNER_CHAT_ID)
    role_lbl = "Asosiy Admin 👑" if is_admin else "Maydon Egasi 🏟️"
    await msg.answer(
        f"👋 Salom, *{msg.from_user.full_name}*!\n"
        f"Sizning huquqingiz: *{role_lbl}*\n\n"
        f"📋 Bronlarni ko'rish\n"
        f"➕ Telefon orqali bron qo'shish\n"
        f"📊 Onlayn Hisobotlar\n"
        f"🔔 Avtomatik bildirishnomalar",
        parse_mode="Markdown", reply_markup=main_menu(),
    )


# ==================== MAYDON QO'SHISH MUKAMMAL SENARIYSI ====================

@dp.message(F.text == "➕ Maydon qo'shish")
async def start_add_venue(message: Message, state: FSMContext):
    await state.clear()
    await message.answer("📝 **1-qadam:** Maydon nomini kiriting:", parse_mode="Markdown",
                         reply_markup=ReplyKeyboardRemove())
    await state.set_state(AddVenueState.name)


@dp.message(AddVenueState.name, F.text)
async def process_venue_name(message: Message, state: FSMContext):
    await state.update_data(name=message.text.strip())

    @sync_to_async
    def get_all_sports():
        return list(SportType.objects.all())

    sports = await get_all_sports()
    if sports:
        builder = ReplyKeyboardBuilder()
        for sport in sports:
            builder.button(text=sport.name)
        builder.adjust(2)
        kb = builder.as_markup(resize_keyboard=True, one_time_keyboard=True)
        await message.answer("⚽ **2-qadam:** Sport turini tanlang:", reply_markup=kb)
    else:
        await message.answer("⚽ **2-qadam:** Sport turini qo'lda yozib kiriting (masalan: Futbol):")

    await state.set_state(AddVenueState.sport_type)


@dp.message(AddVenueState.sport_type, F.text)
async def process_venue_sport(message: Message, state: FSMContext):
    await state.update_data(sport_type=message.text.strip())
    await message.answer("💰 **3-qadam:** Soatlik narxini kiriting (faqat raqamda):", reply_markup=ReplyKeyboardRemove())
    await state.set_state(AddVenueState.price)


@dp.message(AddVenueState.price, F.text)
async def process_venue_price(message: Message, state: FSMContext):
    try:
        price = float(message.text.strip())
        await state.update_data(price=price)
        await message.answer("ℹ️ **4-qadam:** Maydon haqida qisqacha tavsif (description) kiriting:")
        await state.set_state(AddVenueState.description)
    except ValueError:
        await message.answer("⚠️ Iltimos, narxni faqat raqamlarda kiriting:")


@dp.message(AddVenueState.description, F.text)
async def process_venue_description(message: Message, state: FSMContext):
    await state.update_data(description=message.text.strip())

    times = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"]
    builder = ReplyKeyboardBuilder()
    for t in times:
        builder.button(text=t)
    builder.adjust(4)

    await message.answer("⏰ **5-qadam:** Ish boshlanish vaqtini tanlang yoki kiriting (masalan 08:00):",
                         reply_markup=builder.as_markup(resize_keyboard=True))
    await state.set_state(AddVenueState.start_time)


@dp.message(AddVenueState.start_time, F.text)
async def process_venue_start_time(message: Message, state: FSMContext):
    await state.update_data(start_time=message.text.strip())

    times = ["18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "00:00", "01:00", "02:00"]
    builder = ReplyKeyboardBuilder()
    for t in times:
        builder.button(text=t)
    builder.adjust(4)

    await message.answer("⌛ **6-qadam:** Ish tugash vaqtini tanlang yoki kiriting (masalan 22:00):",
                         reply_markup=builder.as_markup(resize_keyboard=True))
    await state.set_state(AddVenueState.end_time)


@dp.message(AddVenueState.end_time, F.text)
async def process_venue_end_time(message: Message, state: FSMContext):
    await state.update_data(end_time=message.text.strip())

    # TELEGRAM WEBAPP REJIMIDAGI XARITA TUGMASI (Katta proyektlar uslubi)
    builder = ReplyKeyboardBuilder()
    # Har qanday qurilmada universal ishlaydigan ochiq xarita Telegram WebApp linki
    builder.button(
        text="🗺️ Xaritadan stadionni tanlash (Yandex/OSM)",
        web_app=WebAppInfo(url="https://eegeo.github.io/eegeo.js/examples/custom-map-marker/index.html")
    )
    builder.button(text="📍 Hozirgi joylashuvimni yuborish", request_location=True)

    await message.answer(
        "📍 **7-qadam:** Yuqoridagi ochiq xarita tugmasini bosing, stadion turgan joyni aniq belgilang yoki hozirgi joylashuv tugmasidan foydalaning.\n\n"
        "👉 _(Qo'shimcha: Agar xaritadan foydalana olmasangiz, matnli aniq manzilni yozib yuborishingiz ham mumkin)_",
        reply_markup=builder.as_markup(resize_keyboard=True, one_time_keyboard=True),
        parse_mode="Markdown"
    )
    await state.set_state(AddVenueState.location)


# Xaritadan yoki Telegram tugmasidan lokatsiya kelganda
@dp.message(AddVenueState.location, F.location)
async def process_venue_location_obj(message: Message, state: FSMContext):
    lat = message.location.latitude
    lon = message.location.longitude

    await message.answer("🔄 Koordinatalar bo'yicha aniq geografik manzil hisoblanmoqda...",
                         reply_markup=ReplyKeyboardRemove())
    address_text = await asyncio.to_thread(get_address_from_coords, lat, lon)

    await state.update_data(latitude=lat, longitude=lon, address=address_text)
    await message.answer(
        f"🗺️ **Aniqlandi:**\n`{address_text}`\n\n"
        f"📸 **8-qadam:** Maydon rasmini yuboring (Faqat rasm formatida):",
        parse_mode="Markdown"
    )
    await state.set_state(AddVenueState.photo)


# WebApp xaritadan yoki matn ko'rinishida manzil kiritilganda
@dp.message(AddVenueState.location, F.text)
async def process_venue_location_text(message: Message, state: FSMContext):
    # Agar foydalanuvchi WebApp orqali jo'natsa, u ham text ichida json/koordinata ko'rinishida kelishi mumkin
    text_val = message.text.strip()

    # Standart Toshkent koordinatalarini default holatga o'rnatamiz, agar foydalanuvchi matn yozgan bo'lsa
    await state.update_data(latitude=41.3111, longitude=69.2797, address=text_val)

    await message.answer(
        f"🗺️ **Kiritilgan manzil:**\n`{text_val}`\n\n"
        f"📸 **8-qadam:** Maydon rasmini yuboring (Faqat rasm formatida):",
        parse_mode="Markdown", reply_markup=ReplyKeyboardRemove()
    )
    await state.set_state(AddVenueState.photo)


# RASM YUKLANGANDAGI MUKAMMAL INTERFAZ (To'xtab qolish muammosi to'liq yechildi)
@dp.message(AddVenueState.photo, F.photo)
async def process_venue_photo(message: Message, state: FSMContext):
    photo = message.photo[-1]
    await state.update_data(photo_file_id=photo.file_id)

    data = await state.get_data()

    # Interaktiv yakuniy ko'rib chiqish paneli (UX)
    summary_text = (
        f"🏟️ **Arizani yakuniy tekshirish**\n\n"
        f"🔹 **Nomi:** {data.get('name')}\n"
        f"🔹 **Sport turi:** {data.get('sport_type')}\n"
        f"🔹 **Soatlik narxi:** {int(data.get('price')):,} so'm\n"
        f"🔹 **Tavsif:** {data.get('description')}\n"
        f"🔹 **Ish vaqti:** {data.get('start_time')} - {data.get('end_time')}\n"
        f"📍 **Aniq manzil:** {data.get('address')}\n\n"
        f"📢 _Barcha ma'lumotlar to'g'ri bo'lsa, quyidagi tugma orqali saytga yuklashga ruxsat bering._"
    )

    # Yuklash, tahrirlash va o'chirish tugmalari majmuasi
    builder = InlineKeyboardBuilder()
    builder.button(text="🚀 Saytga yuklash", callback_data="venue_submit_final")
    builder.button(text="🔄 Qayta tahrirlash", callback_data="venue_re-edit")
    builder.button(text="❌ Arizani o'chirish", callback_data="venue_delete_draft")
    builder.adjust(1, 2)

    await message.answer_photo(
        photo=photo.file_id,
        caption=summary_text,
        reply_markup=builder.as_markup(),
        parse_mode="Markdown"
    )
    await state.set_state(AddVenueState.confirmation)


# FOYDALANUVChI TASDIQLASh TUGMASINI BOSGANDA (🚀 Saytga yuklash)
@dp.callback_query(AddVenueState.confirmation, F.data == "venue_submit_final")
async def venue_submit_final_handler(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    await state.clear()

    # Sahnani ortida yuklanmoqda animatsiyasi
    await callback.message.edit_reply_markup(reply_markup=None)
    await callback.message.answer("⏳ Arizangiz tizimga yozilmoqda va adminga yuborilmoqda...")

    # Rasmni vaqtinchalik yuklab olish va DBga saqlash jarayoni
    photo_file_id = data.get('photo_file_id')
    file_info = await bot.get_file(photo_file_id)

    temp_dir = os.path.join(settings.BASE_DIR, 'media', 'temp')
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, f"{photo_file_id}.jpg")
    await bot.download_file(file_info.file_path, temp_file_path)

    @sync_to_async
    def save_venue_and_image_to_db(user_id):
        owner_user = User.objects.filter(username=str(user_id)).first()
        if not owner_user:
            owner_user = User.objects.filter(role="owner").first()

        sport_obj, _ = SportType.objects.get_or_create(name=data['sport_type'])

        venue = Venue.objects.create(
            name=data['name'],
            price=data['price'],
            description=data['description'],
            start_time=data['start_time'],
            end_time=data['end_time'],
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            address=data.get('address'),
            status='pending',
            owner=owner_user,
            sport=sport_obj
        )

        venue_image = VenueImage(venue=venue)
        with open(temp_file_path, 'rb') as f:
            venue_image.image.save(f"{data['name']}_bot.jpg", File(f), save=False)
        venue_image.save()

        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        return venue

    new_venue = await save_venue_and_image_to_db(callback.from_user.id)

    # Foydalanuvchiga muvaffaqiyatli xabari
    await callback.message.answer(
        "✨ **Ajoyib, arizangiz muvaffaqiyatli qabul qilindi!**\n"
        "🔎 Hozirda ariza tekshiruvda turibdi. Admin tasdiqlashi bilan sizga darhol xabar yuboramiz.",
        reply_markup=main_menu(), parse_mode="Markdown"
    )

    # Admin Panel uchun tugmalar
    admin_keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ Tasdiqlash",
                                 callback_data=f"approve_v_{new_venue.id}_{callback.from_user.id}"),
            InlineKeyboardButton(text="❌ Rad etish", callback_data=f"deny_v_{new_venue.id}_{callback.from_user.id}")
        ]
    ])

    admin_text = (
        f"🔔 **Yangi maydon arizasi (Botdan)**\n\n"
        f" Stadium ID: #{new_venue.id}\n"
        f"🏟️ Nomi: {new_venue.name}\n"
        f"⚽ Sport: {data['sport_type']}\n"
        f" Narxi: {new_venue.price} so'm\n"
        f" Tavsif: {new_venue.description}\n"
        f"⏰ Ish vaqti: {new_venue.start_time} - {new_venue.end_time}\n"
        f"📍 Manzil: {data.get('address')}\n\n"
        f"👤 Yuboruvchi: {callback.from_user.full_name} (ID: {callback.from_user.id})"
    )

    if OWNER_CHAT_ID:
        await bot.send_photo(
            chat_id=OWNER_CHAT_ID,
            photo=photo_file_id,
            caption=admin_text,
            reply_markup=admin_keyboard
        )
    await callback.answer()


# USER QAYTA TAHRIRLASHNI BOSGANDA
@dp.callback_query(AddVenueState.confirmation, F.data == "venue_re-edit")
async def venue_re_edit_handler(callback: CallbackQuery, state: FSMContext):
    await callback.message.delete()
    await callback.message.answer("🔄 Maydon nomini qayta kiritishdan boshlang:", reply_markup=ReplyKeyboardRemove())
    await state.set_state(AddVenueState.name)
    await callback.answer()


# USER O'CHIRISH/BEKOR QILISHNI BOSGANDA
@dp.callback_query(AddVenueState.confirmation, F.data == "venue_delete_draft")
async def venue_delete_draft_handler(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    await callback.message.delete()
    await callback.message.answer("❌ Ariza loyihasi muvaffaqiyatli o'chirildi va bekor qilindi.",
                                  reply_markup=main_menu())
    await callback.answer()


# ADMIN TASDIQLASA (✅ Userga "Ajoyib arizangiz qabul qilindi..." xabari boradi)
@dp.callback_query(F.data.startswith("approve_v_"), IsAdminCallbackFilter())
async def approve_venue_callback(callback: CallbackQuery):
    parts = callback.data.split("_")
    venue_id = int(parts[2])
    user_tg_id = int(parts[3])

    @sync_to_async
    def make_active():
        try:
            venue = Venue.objects.get(id=venue_id)
            venue.status = 'approved'
            venue.save()
            return venue
        except Venue.DoesNotExist:
            return None

    venue = await make_active()
    if venue:
        await callback.message.edit_caption(
            caption=callback.message.caption + "\n\n🟢 **TASDIQLANDI! (Saytda e'lon qilindi)**",
            reply_markup=None
        )
        try:
            await bot.send_message(
                chat_id=user_tg_id,
                text=f"🎉 **Ajoyib, arizangiz muvaffaqiyatli qabul qilindi!**\n"
                     f"Siz taqdim etgan **'{venue.name}'** stadioni admin tomonidan tasdiqlandi va platformaga joylashtirildi. 🏟️✨",
                parse_mode="Markdown"
            )
        except Exception as e:
            log.error(f"Userga tasdiqlash xabari yetib bormadi: {e}")
    await callback.answer()


@dp.callback_query(F.data.startswith("deny_v_"), IsAdminCallbackFilter())
async def deny_venue_callback(callback: CallbackQuery):
    parts = callback.data.split("_")
    venue_id = int(parts[2])
    user_tg_id = int(parts[3])

    @sync_to_async
    def make_rejected():
        try:
            venue = Venue.objects.get(id=venue_id)
            venue.status = 'rejected'
            venue.save()
            return venue
        except Venue.DoesNotExist:
            return None

    venue = await make_rejected()
    await callback.message.edit_caption(
        caption=callback.message.caption + "\n\n🔴 **ARIZA RAD ETILDI!**",
        reply_markup=None
    )
    try:
        # venue o'zgaruvchisidan foydalanamiz va stadion nomini ko'rsatamiz
        venue_name = venue.name if venue else "Siz yuborgan"
        await bot.send_message(
            chat_id=user_tg_id,
            text=f"❌ **Arizangiz qabul qilinmadi (tasdiqlanmadi).**\n"
                 f"Siz taqdim etgan **'{venue_name}'** stadioni arizasi rad etildi. "
                 f"Agar ma'lumotlarda xatolik bo'lsa, iltimos qaytadan to'g'ri to'ldirib yuboring.",
            parse_mode="Markdown"
        )
    except Exception as e:
        log.error(f"Userga rad etish xabari yetib bormadi: {e}")


# ============================================================================

@dp.message(Command("stats"), IsAdminFilter())
async def cmd_online_stats(msg: Message):
    today = timezone.now().date()
    stats = await db_stats(today, today)
    text = (
        f"⚡ *TEZKOR ONLAYN HISOBOT (BUGUN)*\n"
        f"📅 Sana: {today}\n\n"
        f"🏟️ Jami bronlar: {stats['total']} ta\n"
        f"✅ To'langanlar: {stats['paid']} ta\n"
        f"⏳ Kutilmoqda: {stats['pending']} ta\n"
        f"❌ Bekor bo'lganlar: {stats['canceled']} ta\n\n"
        f"🔍 Mukammal tahlil uchun '📊 Hisobotlar' tugmasidan foydalanamiz."
    )
    await msg.answer(text, parse_mode="Markdown")


@dp.message(F.text == "ℹ️ Yordam")
async def cmd_help(msg: Message):
    admin_cmds = "/stats — Tezkor onlayn hisobot (Faqat Admin)\n" if msg.from_user.id == OWNER_CHAT_ID else ""
    await msg.answer(
        "*Buyruqlar:*\n"
        "/start — Bosh menyu\n"
        f"{admin_cmds}"
        "/bronlar — Bugungi bronlar\n\n"
        "*Avtomatik:*\n"
        "🔔 Yangi bron — darhol xabar\n"
        "🌅 Har kuni 09:00 — Bugungi bronlar ro'yxati\n"
        "🏆 Har oy 1-sana 00:00 — Foydalanuvchilar oylik reytingi (Faqat Admin)",
        parse_mode="Markdown",
    )


@dp.message(Command("bronlar"))
@dp.message(F.text == "📋 Bugungi bronlar")
async def today_bookings(msg: Message):
    today = timezone.now().date()
    bookings = await db_get_bookings(today, user_id=msg.from_user.id)
    if not bookings:
        await msg.answer(f"📋 Bugun ({today}) bronlar yo'q")
        return
    text = f"📋 *Bugungi bronlar — {today}*\n_Jami: {len(bookings)} ta_\n"
    for i, b in enumerate(bookings, 1):
        text += f"\n{fmt(b, i)}\n"
    await msg.answer(text, parse_mode="Markdown")


@dp.message(F.text == "📆 Ertangi bronlar")
async def tomorrow_bookings(msg: Message):
    tmr = timezone.now().date() + datetime.timedelta(days=1)
    bookings = await db_get_bookings(tmr, user_id=msg.from_user.id)
    if not bookings:
        await msg.answer(f"📆 Ertaga ({tmr}) bronlar yo'q")
        return
    text = f"📆 *Ertangi bronlar — {tmr}*\n_Jami: {len(bookings)} ta_\n"
    for i, b in enumerate(bookings, 1):
        text += f"\n{fmt(b, i)}\n"
    await msg.answer(text, parse_mode="Markdown")


@dp.message(F.text == "📊 Hisobotlar")
async def reports_menu(msg: Message):
    await msg.answer("📊 *Hisobot turini tanlang:*",
                     parse_mode="Markdown", reply_markup=reports_kb())


@dp.callback_query(F.data.startswith("rep_"))
async def handle_report(cb: CallbackQuery):
    key = cb.data[4:]
    today = timezone.now().date()
    fm1 = today.replace(day=1)
    lm_e = fm1 - datetime.timedelta(1)
    lm_s = lm_e.replace(day=1)

    cfg = {
        "today": (today, today, "Bugungi hisobot"),
        "tomorrow": (today + datetime.timedelta(1), today + datetime.timedelta(1), "Ertangi hisobot"),
        "week": (today, today + datetime.timedelta(6), "Bu haftalik hisobot"),
        "lastweek": (today - datetime.timedelta(7), today - datetime.timedelta(1), "O'tgan haftalik"),
        "month": (fm1, today, "Bu oylik hisobot"),
        "lastmonth": (lm_s, lm_e, "O'tgan oylik hisobot"),
    }
    if key not in cfg:
        await cb.answer()
        return

    d1, d2, lbl = cfg[key]
    stats = await db_stats(d1, d2, user_id=cb.from_user.id)
    await cb.message.edit_text(
        fmt_stats(stats, f"{lbl}\n📅 {d1} — {d2}"),
        parse_mode="Markdown"
    )
    await cb.answer()


@dp.message(F.text == "🏟️ Maydonlarim")
async def my_venues(msg: Message):
    venues = await db_get_venues(user_id=msg.from_user.id)
    if not venues:
        await msg.answer("❌ Sizga tegishli maydon topilmadi")
        return
    today = timezone.now().date()
    text = "🏟️ *Sizning maydonlaringiz:*\n\n"
    for v in venues:
        bks = await db_get_bookings(today, venue_id=v.id)
        active = [b for b in bks if b.status not in ["canceled"]]
        text += (
            f"*{v.name}*\n"
            f"⚽ {v.sport.name if v.sport else '—'} | 📍 {getattr(v, 'address', '—')}\n"
            f"🕐 {v.start_time.strftime('%H:%M') if hasattr(v.start_time, 'strftime') else v.start_time} — {v.end_time.strftime('%H:%M') if hasattr(v.end_time, 'strftime') else v.end_time}\n"
            f"💵 {int(v.price):,} so'm/soat\n"
            f"📋 Bugun: *{len(active)} ta* bron\n\n"
        )
    await msg.answer(text, parse_mode="Markdown")


@dp.message(F.text == "➕ Bron qo'shish")
async def start_booking(msg: Message, state: FSMContext):
    await state.clear()
    venues = await db_get_venues(user_id=msg.from_user.id)
    if not venues:
        await msg.answer("❌ Maydon topilmadi")
        return
    if len(venues) == 1:
        v = venues[0]
        v_sh = v.start_time.hour if hasattr(v.start_time, "hour") else int(str(v.start_time)[:2])
        v_eh = v.end_time.hour if hasattr(v.end_time, "hour") else int(str(v.end_time)[:2])
        await state.update_data(venue_id=v.id, venue_name=v.name, sh=v_sh, eh=v_eh)
        await state.set_state(BookingState.date)
        await msg.answer(f"🏟️ *{v.name}*\n\n📅 Sanani tanlang:",
                         parse_mode="Markdown", reply_markup=dates_kb())
    else:
        await state.set_state(BookingState.venue)
        await msg.answer("🏟️ Qaysi maydon uchun bron?", reply_markup=venues_kb(venues))


@dp.callback_query(BookingState.venue, F.data.startswith("v_"))
async def pick_venue(cb: CallbackQuery, state: FSMContext):
    v = await db_get_venue(int(cb.data[2:]))
    if not v:
        await cb.answer("Topilmadi", show_alert=True)
        return
    v_sh = v.start_time.hour if hasattr(v.start_time, "hour") else int(str(v.start_time)[:2])
    v_eh = v.end_time.hour if hasattr(v.end_time, "hour") else int(str(v.end_time)[:2])
    await state.update_data(venue_id=v.id, venue_name=v.name, sh=v_sh, eh=v_eh)
    await state.set_state(BookingState.date)
    await cb.message.edit_text(f"🏟️ *{v.name}*\n\n📅 Sanani tanlang:",
                               parse_mode="Markdown", reply_markup=dates_kb())
    await cb.answer()


@dp.callback_query(BookingState.date, F.data.startswith("d_"))
async def pick_date(cb: CallbackQuery, state: FSMContext):
    d = datetime.date.fromisoformat(cb.data[2:])
    data = await state.get_data()
    busy = await db_booked_slots(data["venue_id"], d)
    await state.update_data(bdate=d.isoformat())
    await state.set_state(BookingState.slot)
    await cb.message.edit_text(
        f"⏰ *{data['venue_name']} — {d.strftime('%d.%m.%Y')}*\n"
        f"🟢 Bo'sh  🔴 Band\n\nVaqt tanlang:",
        parse_mode="Markdown",
        reply_markup=slots_kb(busy, data["sh"], data["eh"])
    )
    await cb.answer()


@dp.callback_query(BookingState.slot, F.data.startswith("sl_"))
async def pick_slot(cb: CallbackQuery, state: FSMContext):
    h = int(cb.data[3:])
    await state.update_data(sh_val=h, eh_val=h + 1)
    await state.set_state(BookingState.name)
    await cb.message.edit_text(
        f"✅ Vaqt: *{h:02d}:00 – {h + 1:02d}:00*\n\n👤 Mijoz ism-familiyasini kiriting:",
        parse_mode="Markdown", reply_markup=cancel_kb()
    )
    await cb.answer()


@dp.callback_query(BookingState.slot, F.data.startswith("busy_"))
async def busy_slot(cb: CallbackQuery):
    await cb.answer("❌ Bu vaqt band! Boshqa vaqt tanlang.", show_alert=True)


@dp.message(BookingState.name, F.text)
async def get_name(msg: Message, state: FSMContext):
    name = msg.text.strip()
    if len(name) < 2:
        await msg.answer("❌ Ism kamida 2 belgi bo'lishi kerak. Qayta kiriting:")
        return
    await state.update_data(cname=name)
    await state.set_state(BookingState.phone)
    await msg.answer("📱 Telefon raqamini kiriting:\n_Misol: +998901234567_",
                     parse_mode="Markdown", reply_markup=cancel_kb())


@dp.message(BookingState.phone, F.text)
async def get_phone(msg: Message, state: FSMContext):
    phone = msg.text.strip()
    if len(phone) < 9 or not any(c.isdigit() for c in phone):
        await msg.answer("❌ Telefon raqami noto'g'ri. Qayta kiriting (Misol: +998901234567):")
        return
    await state.update_data(cphone=phone)
    data = await state.get_data()
    await state.set_state(BookingState.confirm)
    await msg.answer(
        f"📋 *Bron ma'lumotlari:*\n\n"
        f"🏟️ *{data['venue_name']}*\n"
        f"📅 Sana: *{data['bdate']}*\n"
        f"⏰ Vaqt: *{data['sh_val']:02d}:00 – {data['eh_val']:02d}:00*\n"
        f"👤 Mijoz: *{data['cname']}*\n"
        f"📱 Telefon: *{phone}*\n\n"
        f"✅ Tasdiqlaysizmi?",
        parse_mode="Markdown", reply_markup=confirm_kb()
    )


@dp.callback_query(BookingState.confirm, F.data == "do_save")
async def do_save(cb: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    await state.clear()
    d = datetime.date.fromisoformat(data["bdate"])
    start = datetime.time(data["sh_val"], 0)
    end = datetime.time(data["eh_val"], 0)
    try:
        b = await db_create_booking(data["venue_id"], d, start, end)
        await cb.message.edit_text(
            f"✅ *Bron #{b.id} saqlandi!*\n\n"
            f"🏟️ {b.venue.name}\n"
            f"📅 {d}  ⏰ {start.strftime('%H:%M')}–{end.strftime('%H:%M')}\n"
            f"👤 {data['cname']}  📱 {data['cphone']}\n"
            f"💵 To'langan ✅\n\n"
            f"🌐 Saytda avtomatik band qilindi",
            parse_mode="Markdown"
        )
    except django.db.utils.IntegrityError:
        await cb.message.edit_text("❌ Xatolik: Bu vaqt oraliq bazada hozirgina band qilindi!", parse_mode="Markdown")
    except Exception as e:
        log.error(f"Save error: {e}")
        await cb.message.edit_text("❌ Kutilmagan xatolik yuz berdi.", parse_mode="Markdown")
    await cb.answer()


@dp.callback_query(F.data == "do_cancel")
async def do_cancel(cb: CallbackQuery, state: FSMContext):
    await state.clear()
    await cb.message.edit_text("❌ Bekor qilindi")
    await cb.answer()


async def daily_report():
    today = timezone.now().date()
    if OWNER_CHAT_ID:
        bks = await db_get_bookings(today)
        active = [b for b in bks if b.status not in ["canceled"]]
        text = f"🌅 *ADMIN: Bugungi umumiy bronlar — {today}*\n_Aktiv: {len(active)} ta_\n"
        for i, b in enumerate(active, 1):
            text += f"\n{fmt(b, i)}\n"
        if not active:
            text += "\nBugun hech qaysi arenada bron yo'q 😴"
        try:
            await bot.send_message(OWNER_CHAT_ID, text, parse_mode="Markdown")
        except Exception as e:
            log.error(f"Admin daily report error: {e}")

    @sync_to_async
    def get_distinct_owners():
        return list(
            User.objects.filter(role="owner").exclude(telegram_chat_id__isnull=True).exclude(telegram_chat_id=""))

    owners = await get_distinct_owners()
    for owner in owners:
        try:
            chat_id = int(owner.telegram_chat_id)
            if chat_id == OWNER_CHAT_ID:
                continue
            bks = await db_get_bookings(today, user_id=chat_id)
            active = [b for b in bks if b.status not in ["canceled"]]
            if active:
                text = "🌅 *Xayrli tong! Bugungi bronlaringiz ro'yxati:* \n"
                for i, b in enumerate(active, 1):
                    text += f"\n{fmt(b, i)}\n"
                await bot.send_message(chat_id, text, parse_mode="Markdown")
        except Exception as e:
            log.error(f"User daily notification error for {owner.username}: {e}")


async def monthly_ranking_report():
    if not OWNER_CHAT_ID:
        return
    text = await db_get_monthly_ranking()
    try:
        await bot.send_message(OWNER_CHAT_ID, text, parse_mode="Markdown")
        log.info("Oylik reyting admin uchun jo'natildi.")
    except Exception as e:
        log.error(f"Cron monthly ranking report error: {e}")


async def main():
    log.info("🤖 PlayArena Bot production rejimda ishga tushmoqda...")
    scheduler.add_job(daily_report, "cron", hour=9, minute=0)
    scheduler.add_job(monthly_ranking_report, "cron", day=1, hour=0, minute=0)
    scheduler.start()
    try:
        await dp.start_polling(bot, allowed_updates=["message", "callback_query"])
    finally:
        scheduler.shutdown()
        await bot.session.close()
        log.info("Bot to'xtatildi")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        log.info("Bot o'chirildi")