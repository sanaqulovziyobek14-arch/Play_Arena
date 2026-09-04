export interface TranslationSchema {
  // Navigation
  home: string;
  venues: string;
  sports: string;
  bookings: string;
  myVenues: string;
  about: string;
  login: string;
  profile: string;
  logout: string;
  catalog: string;
  search: string;
  language: string;
  themeDay: string;
  themeNight: string;

  // Hero & Stats
  heroTitle: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  totalVenues: string;
  totalUsers: string;
  totalBookings: string;
  avgRating: string;

  // Venues & Filters
  allSports: string;
  allStatuses: string;
  statusApproved: string;
  statusPending: string;
  statusRejected: string;
  sortNewest: string;
  sortOldest: string;
  sortCheapest: string;
  sortExpensive: string;
  perHour: string;
  som: string;
  viewDetails: string;
  bookNow: string;
  noVenuesFound: string;

  // Amenities
  wifi: string;
  parking: string;
  shower: string;
  lighting: string;
  dressingRoom: string;
  equipmentRental: string;

  // Venue Detail & Booking
  availableSlots: string;
  eveningDiscountBadge: string;
  billiardWeekendBadge: string;
  selectTimeFirst: string;
  bookingSuccess: string;

  // My Venues Dashboard
  myVenuesTitle: string;
  adminVenuesTitle: string;
  addArena: string;
  editArena: string;
  deleteArena: string;
  confirmDelete: string;
  approveAction: string;
  rejectAction: string;
  arenaName: string;
  address: string;
  pricePerHour: string;
  startTime: string;
  endTime: string;
  size: string;
  description: string;
  amenities: string;
  saveChanges: string;

  // Payment Modal
  securePayment: string;
  sslEncryption: string;
  selectPaymentType: string;
  deposit50: string;
  full100: string;
  payNow: string;
  fullAmount: string;
  cardNumber: string;
  cardHolder: string;
  expireMonth: string;
  expireYear: string;
  processPayment: string;
  paymentSuccess: string;

  // Footer
  rightsReserved: string;
}

export type Language = "uz" | "ru" | "en";

export const translations: Record<Language, TranslationSchema> = {
  uz: {
    // Navigation
    home: "Bosh sahifa",
    venues: "Maydonlar",
    sports: "Sport turlari",
    bookings: "Bronlarim",
    myVenues: "Arenalarim",
    about: "Biz haqimizda",
    login: "Kirish",
    profile: "Mening Profilim",
    logout: "Chiqish",
    catalog: "Katalog",
    search: "Qidiruv",
    language: "Til",
    themeDay: "Kunduzi",
    themeNight: "Tungi",

    // Hero & Stats
    heroTitle: "ENG YAXSHI SPORT MAYDONLARINI OSON BRON QILING",
    heroSubtitle: "Futbol, Bilyard, Basketbol va boshqa barcha sport turlari bo'yicha maydonlarni bir necha soniyada band qiling.",
    searchPlaceholder: "Nomi yoki manzili bo'yicha qidirish...",
    totalVenues: "Jami Maydonlar",
    totalUsers: "Foydalanuvchilar",
    totalBookings: "Muvaffaqiyatli Bronlar",
    avgRating: "O'rtacha Reyting",

    // Venues & Filters
    allSports: "Barcha Sport Turlari",
    allStatuses: "Barcha Holatlar",
    statusApproved: "Tasdiqlangan",
    statusPending: "Kutilmoqda",
    statusRejected: "Rad Etilgan",
    sortNewest: "Eng oxirgi qo'shilgan",
    sortOldest: "Eng birinchi qo'shilgan",
    sortCheapest: "Eng arzoni",
    sortExpensive: "Eng qimmati",
    perHour: "1 soat",
    som: "so'm",
    viewDetails: "Batafsil ko'rish",
    bookNow: "Hozir Bron Qilish",
    noVenuesFound: "Hech qanday maydon topilmadi",

    // Amenities
    wifi: "Wi-Fi",
    parking: "Parking",
    shower: "Dush Xonasi",
    lighting: "Yoritish Tizimi",
    dressingRoom: "Kiyinish Xonasi",
    equipmentRental: "Koptok/Ijara",

    // Venue Detail & Booking
    availableSlots: "Mavjud Soatlar",
    eveningDiscountBadge: "🔥 -20% Chegirma (20:00 dan keyin)",
    billiardWeekendBadge: "⚡ +25% Dam Olish Kuni Narxi",
    selectTimeFirst: "Iltimos, avval bron vaqtini tanlang!",
    bookingSuccess: "Broningiz muvaffaqiyatli yaratildi!",

    // My Venues Dashboard
    myVenuesTitle: "🏟 Mening Arenalarim",
    adminVenuesTitle: "⚙ Barcha Arenalar Boshqaruvi (Admin)",
    addArena: "Yangi Arena Qo'shish",
    editArena: "Arenani Tahrirlash",
    deleteArena: "Arenani O'chirish",
    confirmDelete: "Haqiqatan ham ushbu arenani o'chirmoqchimisiz?",
    approveAction: "Tasdiqlash",
    rejectAction: "Rad Etish",
    arenaName: "Arena Nomi",
    address: "Manzil",
    pricePerHour: "1 Soatlik Narxi (so'm)",
    startTime: "Boshlanish Vaqti",
    endTime: "Tugash Vaqti",
    size: "O'lcham",
    description: "Tavsif",
    amenities: "Qulayliklar",
    saveChanges: "Saqlash va Yangilash",

    // Payment Modal
    securePayment: "Xavfsiz To'lov Tizimi",
    sslEncryption: "256-bit SSL shifrlangan",
    selectPaymentType: "To'lov Turini Tanlang:",
    deposit50: "⚡ 50% Avans To'lov",
    full100: "100% To'liq To'lov",
    payNow: "Hozir to'lanadi:",
    fullAmount: "To'liq summa:",
    cardNumber: "Karta Raqami",
    cardHolder: "Ism va Familiya",
    expireMonth: "Oy (MM)",
    expireYear: "Yil (YY)",
    processPayment: "TO'LASH",
    paymentSuccess: "To'lov Muvaffaqiyatli Bajarildi!",

    // Footer
    rightsReserved: "Barcha huquqlar himoyalangan.",
  },

  ru: {
    // Navigation
    home: "Главная",
    venues: "Площадки",
    sports: "Виды спорта",
    bookings: "Мои бронирования",
    myVenues: "Мои Арены",
    about: "О нас",
    login: "Войти",
    profile: "Мой Профиль",
    logout: "Выйти",
    catalog: "Каталог",
    search: "Поиск",
    language: "Язык",
    themeDay: "Дневной",
    themeNight: "Ночной",

    // Hero & Stats
    heroTitle: "ЗАБРОНИРУЙТЕ ЛУЧШИЕ СПОРТИВНЫЕ ПЛОЩАДКИ ЛЕГКО",
    heroSubtitle: "Забронируйте поля для футбола, бильярда, баскетбола и других видов спорта за считанные секунды.",
    searchPlaceholder: "Поиск по названию или адресу...",
    totalVenues: "Всего Площадок",
    totalUsers: "Пользователи",
    totalBookings: "Успешных Броней",
    avgRating: "Средний Рейтинг",

    // Venues & Filters
    allSports: "Все виды спорта",
    allStatuses: "Все статусы",
    statusApproved: "Одобрено",
    statusPending: "В ожидании",
    statusRejected: "Отклонено",
    sortNewest: "Сначала новые",
    sortOldest: "Сначала старые",
    sortCheapest: "Сначала дешевые",
    sortExpensive: "Сначала дорогие",
    perHour: "1 час",
    som: "сум",
    viewDetails: "Подробнее",
    bookNow: "Забронировать",
    noVenuesFound: "Площадки не найдены",

    // Amenities
    wifi: "Wi-Fi",
    parking: "Парковка",
    shower: "Душевая",
    lighting: "Освещение",
    dressingRoom: "Раздевалка",
    equipmentRental: "Аренда инвентаря",

    // Venue Detail & Booking
    availableSlots: "Доступные часы",
    eveningDiscountBadge: "🔥 -20% Скидка (после 20:00)",
    billiardWeekendBadge: "⚡ +25% Выходной Тариф",
    selectTimeFirst: "Пожалуйста, сначала выберите время бронирования!",
    bookingSuccess: "Бронирование успешно создано!",

    // My Venues Dashboard
    myVenuesTitle: "🏟 Мои Арены",
    adminVenuesTitle: "⚙ Управление Аренами (Админ)",
    addArena: "Добавить Арену",
    editArena: "Редактировать",
    deleteArena: "Удалить Арену",
    confirmDelete: "Вы уверены, что хотите удалить эту арену?",
    approveAction: "Одобрить",
    rejectAction: "Отклонить",
    arenaName: "Название Арены",
    address: "Адрес",
    pricePerHour: "Цена за 1 час (сум)",
    startTime: "Время начала",
    endTime: "Время окончания",
    size: "Размер",
    description: "Описание",
    amenities: "Удобства",
    saveChanges: "Сохранить изменения",

    // Payment Modal
    securePayment: "Безопасная Оплата",
    sslEncryption: "256-bit SSL шифрование",
    selectPaymentType: "Выберите тип оплаты:",
    deposit50: "⚡ 50% Предоплата",
    full100: "100% Полная Оплата",
    payNow: "К оплате сейчас:",
    fullAmount: "Полная сумма:",
    cardNumber: "Номер карты",
    cardHolder: "Имя и Фамилия",
    expireMonth: "Месяц (MM)",
    expireYear: "Год (YY)",
    processPayment: "ОПЛАТИТЬ",
    paymentSuccess: "Оплата прошла успешно!",

    // Footer
    rightsReserved: "Все права защищены.",
  },

  en: {
    // Navigation
    home: "Home",
    venues: "Venues",
    sports: "Sports",
    bookings: "My Bookings",
    myVenues: "My Venues",
    about: "About Us",
    login: "Login",
    profile: "My Profile",
    logout: "Logout",
    catalog: "Catalog",
    search: "Search",
    language: "Language",
    themeDay: "Light",
    themeNight: "Dark",

    // Hero & Stats
    heroTitle: "BOOK THE BEST SPORTS VENUES EASILY",
    heroSubtitle: "Book fields for Football, Billiards, Basketball, and more in just a few seconds.",
    searchPlaceholder: "Search by name or address...",
    totalVenues: "Total Venues",
    totalUsers: "Users",
    totalBookings: "Successful Bookings",
    avgRating: "Average Rating",

    // Venues & Filters
    allSports: "All Sports",
    allStatuses: "All Statuses",
    statusApproved: "Approved",
    statusPending: "Pending",
    statusRejected: "Rejected",
    sortNewest: "Newest First",
    sortOldest: "Oldest First",
    sortCheapest: "Price: Low to High",
    sortExpensive: "Price: High to Low",
    perHour: "1 hour",
    som: "UZS",
    viewDetails: "View Details",
    bookNow: "Book Now",
    noVenuesFound: "No venues found",

    // Amenities
    wifi: "Wi-Fi",
    parking: "Parking",
    shower: "Shower Room",
    lighting: "Floodlights",
    dressingRoom: "Dressing Room",
    equipmentRental: "Equipment Rental",

    // Venue Detail & Booking
    availableSlots: "Available Slots",
    eveningDiscountBadge: "🔥 -20% Evening Discount (after 20:00)",
    billiardWeekendBadge: "⚡ +25% Weekend Surge Rate",
    selectTimeFirst: "Please select a booking time first!",
    bookingSuccess: "Booking created successfully!",

    // My Venues Dashboard
    myVenuesTitle: "🏟 My Venues",
    adminVenuesTitle: "⚙ All Venues Management (Admin)",
    addArena: "Add New Arena",
    editArena: "Edit Arena",
    deleteArena: "Delete Arena",
    confirmDelete: "Are you sure you want to delete this arena?",
    approveAction: "Approve",
    rejectAction: "Reject",
    arenaName: "Arena Name",
    address: "Address",
    pricePerHour: "Price Per Hour (UZS)",
    startTime: "Start Time",
    endTime: "End Time",
    size: "Size",
    description: "Description",
    amenities: "Amenities",
    saveChanges: "Save Changes",

    // Payment Modal
    securePayment: "Secure Payment System",
    sslEncryption: "256-bit SSL Encrypted",
    selectPaymentType: "Select Payment Option:",
    deposit50: "⚡ 50% Deposit",
    full100: "100% Full Payment",
    payNow: "Pay Now:",
    fullAmount: "Total Amount:",
    cardNumber: "Card Number",
    cardHolder: "Cardholder Name",
    expireMonth: "Month (MM)",
    expireYear: "Year (YY)",
    processPayment: "PAY NOW",
    paymentSuccess: "Payment Completed Successfully!",

    // Footer
    rightsReserved: "All rights reserved.",
  },
};