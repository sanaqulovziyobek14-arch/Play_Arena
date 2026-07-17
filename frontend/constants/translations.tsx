export const translations = {
  uz: {
    home: "Bosh sahifa",
    venues: "Maydonlar",
    sports: "Sport turlari",
    bookings: "Bronlarim",
    about: "Biz haqimizda",
    login: "Kirish",
    catalog: "Katalog",
  },

  ru: {
    home: "Главная",
    venues: "Площадки",
    sports: "Виды спорта",
    bookings: "Мои бронирования",
    about: "О нас",
    login: "Войти",
    catalog: "Каталог",
  },

  en: {
    home: "Home",
    venues: "Venues",
    sports: "Sports",
    bookings: "My Bookings",
    about: "About Us",
    login: "Login",
    catalog: "Catalog",
  },
} as const;

export type Language = keyof typeof translations;