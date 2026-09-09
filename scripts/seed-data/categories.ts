import mongoose from "mongoose";

export interface SeedCategory {
  _id?: string;
  name: string;
  slug: string;
  icon: string;
  parent?: string; // parent slug
}

export const seedCategories = [
  // Root categories (preserve original IDs)
  {
    _id: "66fd1cb382b527f9d5e20b4b",
    name: "املاک",
    slug: "real-estate",
    icon: "home.svg",
  },
  {
    _id: "66fd1d0582b527f9d5e20b4e",
    name: "وسایل نقلیه",
    slug: "vehicles",
    icon: "car.svg",
  },
  {
    _id: "66fd1d5f82b527f9d5e20b51",
    name: "کالای دیجیتال",
    slug: "digital-devices",
    icon: "mobile.svg",
  },
  {
    _id: "66fd1d7c82b527f9d5e20b54",
    name: "خانه و آشپزخانه",
    slug: "home-kitchen",
    icon: "home.svg",
  },
  {
    _id: "66fd1d9882b527f9d5e20b57",
    name: "خدمات",
    slug: "services",
    icon: "paint.svg",
  },
  {
    _id: "66fd1db382b527f9d5e20b5a",
    name: "وسایل شخصی",
    slug: "personal-items",
    icon: "user.svg",
  },
  {
    _id: "66fd1dcb82b527f9d5e20b5d",
    name: "سرگرمی و فراغت",
    slug: "entertainment",
    icon: "gamepad.svg",
  },
  {
    _id: "66fd1df382b527f9d5e20b60",
    name: "تجهیزات و صنعتی",
    slug: "industrial-tools",
    icon: "tool.svg",
  },
  {
    _id: "66fd1e0a82b527f9d5e20b63",
    name: "استخدام و کاریابی",
    slug: "jobs",
    icon: "briefcase.svg",
  },

  // Subcategories - املاک (Real Estate)
  { name: "آپارتمان", slug: "apartment", icon: "apartment.svg", parent: "real-estate" },
  { name: "ویلا", slug: "villa", icon: "villa.svg", parent: "real-estate" },
  { name: "زمین", slug: "land", icon: "land.svg", parent: "real-estate" },
  { name: "مستغلات اداری و تجاری", slug: "commercial-property", icon: "building.svg", parent: "real-estate" },
  { name: "مجتمع‌های مسکن", slug: "residential-complex", icon: "building-2.svg", parent: "real-estate" },
  { name: "مغازه", slug: "shop", icon: "shop.svg", parent: "real-estate" },
  { name: "دفتر کار", slug: "office", icon: "office.svg", parent: "real-estate" },

  // وسایل نقلیه (Vehicles)
  { name: "خودرو", slug: "car", icon: "car.svg", parent: "vehicles" },
  { name: "موتورسیکلت", slug: "motorcycle", icon: "motorcycle.svg", parent: "vehicles" },
  { name: "کامیون و کامیونت", slug: "truck", icon: "truck.svg", parent: "vehicles" },
  { name: "بس و مینی‌بوس", slug: "bus", icon: "bus.svg", parent: "vehicles" },
  { name: "قطعات و لوازم یدکی", slug: "auto-parts", icon: "cog.svg", parent: "vehicles" },
  { name: "سایر وسایل نقلیه", slug: "other-vehicles", icon: "car-2.svg", parent: "vehicles" },

  // کالای دیجیتال (Digital Devices)
  { name: "موبایل و تبلت", slug: "mobile-tablet", icon: "smartphone.svg", parent: "digital-devices" },
  { name: "لپ‌تاپ و کامپیوتر", slug: "laptop-computer", icon: "laptop.svg", parent: "digital-devices" },
  { name: "پلی‌استیشن و کنسول بازی", slug: "gaming-console", icon: "gamepad-2.svg", parent: "digital-devices" },
  { name: "دوربین و عکاسی", slug: "camera", icon: "camera.svg", parent: "digital-devices" },
  { name: "سایر کالای دیجیتال", slug: "other-digital", icon: "device.svg", parent: "digital-devices" },

  // خانه و آشپزخانه (Home & Kitchen)
  { name: "مبلمان و دکوراسیون", slug: "furniture", icon: "sofa.svg", parent: "home-kitchen" },
  { name: "لوازم خانگی", slug: "appliances", icon: "fridge.svg", parent: "home-kitchen" },
  { name: "ظرف و ظروف", slug: "kitchenware", icon: "utensils.svg", parent: "home-kitchen" },
  { name: "فرش و قالی", slug: "carpet", icon: "carpet.svg", parent: "home-kitchen" },
  { name: "پوشاک و کیف", slug: "clothing-bags", icon: "shirt.svg", parent: "home-kitchen" },
  { name: "سایر لوازم خانه", slug: "other-home", icon: "home-2.svg", parent: "home-kitchen" },

  // خدمات (Services)
  { name: "آموزش و مشاوره", slug: "education", icon: "graduation-cap.svg", parent: "services" },
  { name: "طراحی و گرافیک", slug: "design", icon: "palette.svg", parent: "services" },
  { name: "برنامه‌نویسی و تکنولوژی", slug: "programming", icon: "code.svg", parent: "services" },
  { name: "تعمیرات", slug: "repair", icon: "wrench.svg", parent: "services" },
  { name: "نظافت", slug: "cleaning", icon: "sparkles.svg", parent: "services" },
  { name: "حمل و نقل", slug: "transport", icon: "truck-2.svg", parent: "services" },
  { name: "سایر خدمات", slug: "other-services", icon: "service.svg", parent: "services" },

  // وسایل شخصی (Personal Items)
  { name: "ساعت و جواهرات", slug: "watch-jewelry", icon: "watch.svg", parent: "personal-items" },
  { name: "عطر و آرایشی", slug: "perfume-cosmetics", icon: "spray.svg", parent: "personal-items" },
  { name: "کتاب و لوازم تحریر", slug: "books-stationery", icon: "book.svg", parent: "personal-items" },
  { name: "اسباب‌بازی", slug: "toys", icon: "toy.svg", parent: "personal-items" },
  { name: "سایر وسایل شخصی", slug: "other-personal", icon: "user-2.svg", parent: "personal-items" },

  // سرگرمی و فراغت (Entertainment)
  { name: "بلیت Konzert و رویداد", slug: "event-tickets", icon: "ticket.svg", parent: "entertainment" },
  { name: "ورزش و فیتنس", slug: "sports-fitness", icon: "dumbbell.svg", parent: "entertainment" },
  { name: "سفر و گردشگری", slug: "travel", icon: "plane.svg", parent: "entertainment" },
  { name: "سایر سرگرمی‌ها", slug: "other-entertainment", icon: "music.svg", parent: "entertainment" },

  // تجهیزات و صنعتی (Industrial Tools)
  { name: "ماشین‌آلات", slug: "machinery", icon: "factory.svg", parent: "industrial-tools" },
  { name: "ابزارها", slug: "tools", icon: "hammer.svg", parent: "industrial-tools" },
  { name: "مواد اولیه", slug: "raw-materials", icon: "box.svg", parent: "industrial-tools" },
  { name: "سایر صنعتی", slug: "other-industrial", icon: "industry.svg", parent: "industrial-tools" },

  // استخدام و کاریابی (Jobs)
  { name: "برنامه‌نویسی", slug: "programming-jobs", icon: "code.svg", parent: "jobs" },
  { name: "طراحی و گرافیک", slug: "design-jobs", icon: "figma.svg", parent: "jobs" },
  { name: "فروش و بازاریابی", slug: "sales-marketing", icon: "megaphone.svg", parent: "jobs" },
  { name: "حسابداری و مالی", slug: "accounting-finance", icon: "calculator.svg", parent: "jobs" },
  { name: "سایر مشاغل", slug: "other-jobs", icon: "briefcase-2.svg", parent: "jobs" },
];