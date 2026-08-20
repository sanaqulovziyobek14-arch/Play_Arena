🏟️ Play Arena — Sports Venue Booking & Management Ecosystem
Python VersionDjango VersionDRFNext.jsAiogramDockerPostgreSQLUV Package ManagerLicense

Sport maydonlarini real-vaqt rejimida avtomatlashtirilgan band qilish va boshqarish platformasi.
Havaskor sportchilar uchun 10 soniyada maydon topish, arena egalari uchun esa shaffof moliya va analitika ekotizimi.

🔍 Loyiha Haqida
 • 
✨ Asosiy Imkoniyatlar
 • 
🛠 Texnologik Stek
 • 
🚀 O'rnatish va Sozlash
 • 
📂 Loyiha Tuzilmasi
 • 
📡 API Endpoints
 • 
📬 Aloqa va Litsenziya

🔍 Loyiha Haqida
Play Arena — bu an'anaviy analogik usulda (telefon qo'ng'iroqlari va qog'oz daftarlar orqali) ishlayotgan sport maydonlari ijarasi sohasini raqamlashtiruvchi zamonaviy B2B/B2C Sports Tech SaaS loyihasidir.

Hal etilayotgan real muammolar:
❌ Xaotik Bron Tizimi: O'yinchilar bo'sh vaqt va narxlarni bilish uchun soatlab telefon qilib vaqt yo'qotishi.
❌ Double-Booking (Ustma-ust tushish): Qog'oz daftarlardagi xatoliklar sababli bir vaqtga ikkita jamoa yozilib qolishi.
❌ Noaniq Joylashuv va Sharoitlar: Maydon maysasi sifati (sun'iy/tabiiy), o'lchamlari va aniq geolokatsiyasining yo'qligi.
❌ Moliya Tahlilining Yo'qligi: Arena egalari daromadlar dinamikasi, pik soatlar va bekor qilingan bronlar haqida aniq statistikaga ega emasligi.
Play Arena ushbu muammolarni Next.js 15 Web Platforma hamda Aiogram 3 Telegram WebApp Bot integratsiyasi orqali noldan hal etadi.

✨ Asosiy Imkoniyatlar
👤 Foydalanuvchilar (O'yinchilar) Uchun:
🟢 Real-Vaqt Slot Grid: Har bir maydon uchun ochiq (🟢), band (🔴) va o'tib ketgan (⚪) vaqtlarni ko'rish va band qilish.
🗺️ Interaktiv Xarita va Geopozitsiya: Yandex Maps (Web) va OpenStreetMap Nominatim Reverse Geocoding (Telegram Bot) orqali eng yaqin arenalarni xaritada topish.
⚽ Aqlli Filtrlar: Sport turi (Futbol, Basketbol va h.k.), maysa qoplamasi (Sun'iy o't, Tabiiy o me't) va o'lchamlar bo'yicha saralash.
⭐ Reyting va Sharhlar: Tashrif buyurgan o'yinchilarning xolis baholari va sharhlarini o'qish.
🔖 Saralangan Maydonlar: Sevimli arenalarni kelgusida tezkor bron qilish uchun saqlab qo'yish.
🏟️ Arena Egalari (Owners) Uchun:
📊 Daromad va Bandlik Analitikasi: MyVenueStatsAPIView orqali kunlik, haftalik va oylik tushum, bronlar soni va pik vaqtlarni kuzatish.
🤖 Telegram FSM Boshqaruv Bot: Bot orqali yangi maydon qo'shish, rasmlar yuklash, ish vaqtini sozlash va so'rovlarni boshqarish.
🏆 Oylik Avtomatik Reyting (Leaderboard): APScheduler cron-jobi orqali eng ko'p va sifatli xizmat ko me'rsatgan arena egalari oylik reytingini aniqlash.
🔔 Tezkor Notifications: Yangi bronlar va bekor qilishlar haqida Telegram orqali bir zumda xabar olish.
⚙️ Platforma Administratorlari Uchun:
🛡️ Role-Based Access Control (RBAC): User (👤), Owner (🏟) va Admin (⚙) rollarini qat'iy ajratish.
📋 Moderatsiya Tizimi: Yangi qo'shilgan maydonlarni tekshirish va tasdiqlash (Pending, Approved, Rejected).
🎨 Django Jazzmin Admin Dashboard: Zamonaviy va qulay ma'lumotlar bazasi boshqaruv interfeysi.
🛠 Texnologik Stek
Backend & API:
Til: Python 3.13+
Freymvork: Django 6.0 & Django REST Framework (DRF 3.17)
Paket Menejeri: uv (Astral — ultra-tezkor Python package manager)
Ma'lumotlar Bazasi: PostgreSQL & asyncpg drayveri
Autentifikatsiya: djangorestframework-simplejwt (JWT Token Auth)
Admin Panel: django-jazzmin & django-ckeditor-5
Filtirlash & CORS: django-filter & django-cors-headers
Telegram Bot & Automation:
Freymvork: aiogram 3.x (Asinxron Telegram Bot engine)
Rejalashtiruvchi: APScheduler (AsyncIOScheduler — avtomatik reyting va hisobotlar)
Geolokatsiya API: OpenStreetMap Nominatim Reverse Geocoding (Koordinatalarni matnli manzilga o'girish)
ORM Integration: asgiref.sync.sync_to_async (Django ORM bilan asinxron ishlash)
Frontend Engine:
Freymvork: Next.js 15 (App Router) & React 19
Til: TypeScript
Stillashtirish: Tailwind CSS & Framer Motion (Interaktiv animatsiyalar)
Xarita Integratsiyasi: @pbe/react-yandex-maps
Ikonkalar & Utilitlar: lucide-react, js-cookie
DevOps & Infrastructure:
Konteynerizatsiya: Docker & Docker Compose
Web Server: Gunicorn / Uvicorn
📂 Loyiha Tuzilmasi
text

Play_Arena/
├── docker-compose.yaml       # Multikonteynerli Docker sozlamalari (Backend, Frontend, Postgres)
├── TODO                      # Rejadagi vazifalar
├── backend/                  # Python Django Backend & Telegram Bot
│   ├── apps/                 # Django asosiy ilovasi
│   │   ├── admin.py          # Jazzmin admin panel konfiguratsiyasi
│   │   ├── bot_utils.py      # Bot uchun yordamchi utilitlar
│   │   ├── filters.py        # Django Filter sinflari (Maydonlar va bronlar uchun)
│   │   ├── models.py         # DB Modellari (User, Venue, Booking, Review va h.k.)
│   │   ├── paginations.py    # Custom pagination sozlamalari
│   │   ├── permissions.py    # IsOwner, IsAdmin va Custom RBAC ruxsatnomalari
│   │   ├── serializers.py    # DRF Serializerlar
│   │   ├── signals.py        # Django Signals (Bildirishnomalar)
│   │   ├── urls.py           # REST API marshrutlari
│   │   └── views.py          # API ViewSet va APIView sinflari
│   ├── config/               # Django loyiha konfiguratsiyasi
│   │   ├── asgi.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── bot.py                # Aiogram 3 Telegram Bot (FSM & Scheduler)
│   ├── manage.py
│   ├── pyproject.toml        # UV bog'liqliklari va loyiha konfiguratsiyasi
│   ├── Dockerfile            # Backend uchun Docker build fayli
│   └── .dockerignore
└── frontend/                 # Next.js 15 React Frontend
    ├── app/                  # Next.js App Router sahifalari
    ├── components/           # UI komponentlar (Slot Grid, Map View, Cards)
    ├── context/              # React Context (Auth State, User Session)
    ├── css/                  # Global uslublar va Tailwind CSS
    ├── services/             # API klientlari va Axios/Fetch so'rovlari
    ├── types/                # TypeScript tiplari va interfeyslari
    ├── package.json          # Node.js bog'liqliklari
    ├── next.config.ts        # Next.js sozlamalari
    ├── tsconfig.json         # TypeScript sozlamalari
    └── Dockerfile            # Frontend uchun Docker build fayli
🚀 O'rnatish va Ishga Tushirish
Talablar:
Git
Docker va Docker Compose (Tavsiya etiladi)
Yoki mahalliy ishga tushirish uchun: Python 3.13+, uv, Node.js 20+, PostgreSQL.
1-usul: Docker Compose Orqali (Eng Tezkor Tizim)
Repozitoriyani klonlang:

bash

git clone https://github.com/sanaqulovziyobek14-arch/Play_Arena.git
cd Play_Arena
Backend .env faylini yarating (backend/.env):

env

SECRET_KEY=your_custom_django_secret_key
DEBUG=True
ALLOWED_HOSTS=*
# Database Settings
DB_NAME=playarena_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=postgres_service
DB_PORT=5432
# Telegram Bot Config
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
OWNER_CHAT_ID=123456789
BOT_USERNAME=PlayArena_bronqilsih_bot
Docker konteynerlarini qurib ishga tushiring:

bash

docker-compose up --build -d
Migratsiyalarni bajaring va Admin foydalanuvchisini yarating:

bash

docker-compose exec backend_service uv run python manage.py migrate
docker-compose exec backend_service uv run python manage.py createsuperuser
Platforma manzillari:

Backend API: http://localhost:8000/api/
Django Admin: http://localhost:8000/admin/
Frontend App: http://localhost:3000/
2-usul: Mahalliy (Manual) Ishga Tushirish
Backend & Telegram Bot:
Backend jildiga o'ting va bog'liqliklarni o'rnating:

bash

cd backend
# uv paket boshqaruvchisi orqali:
uv sync
Migratsiyalarni bajaring va serverni ishga tushiring:

bash

uv run python manage.py migrate
uv run python manage.py runserver 8000
Alohida terminalda Telegram Botni ishga tushiring:

bash

uv run python bot.py
Frontend (Next.js):
Frontend jildida paketlarni o'rnating:
bash

cd frontend
npm install
npm run dev
📡 API End-pointlar
Bo'lim	Metod	Endpoint	Tavsif	Auth
Auth	POST	/api/users/	Yangi foydalanuvchini ro'yxatdan o'tkazish	❌ Open
Auth	POST	/api/token	JWT Access & Refresh token olish	❌ Open
Auth	POST	/api/token/refresh	Access tokenni yangilash	❌ Open
Auth	POST	/api/change-password	Parolni o'zgartirish	🔒 Bearer
Venues	GET	/api/venues	Barcha tasdiqlangan maydonlar ro'yxati (Filtrlar bilan)	❌ Open
Venues	POST	/api/venues	Yangi arena yaratish (Pending statusida)	🔒 Owner
Slots	GET	/api/venues/{id}/booked-slots/	Tanlangan kunga arena band slotlarini ko'rish	❌ Open
Bookings	GET/POST	/api/bookings	Bronlarni ko'rish va yangi slot band qilish	🔒 Bearer
Stats	GET	/api/my-venue-stats	Arena egasining shaxsiy moliya va bandlik statistikasi	🔒 Owner
Stats	GET	/api/platform-stats	Umumiy platforma analitikasi	🔒 Admin
Reviews	GET/POST	/api/reviews	Maydon uchun baho va sharhlar qoldirish	🔒 Bearer
📬 Aloqa va Litsenziya
Dasturchi: Ziyobek Sanaqulov (@sanaqulovziyobek14-arch)
Telegram: @sanaqulovziyobek
Litsenziya: Ushbu loyiha 
MIT License
 asosida tarqatiladi.
Play Arena — Sport infratuzilmasini birgalikda raqamlashtiramiz! ⚽🏟️