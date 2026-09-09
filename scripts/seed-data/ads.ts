import mongoose from "mongoose";

export interface SeedAd {
  title: string;
  description: string;
  categorySlug: string;
  price: number;
  province: string;
  city: string;
  district?: string;
  address?: string;
  showNumber?: boolean;
  isActiveChat?: boolean;
  options: Record<string, unknown>;
  images: string[]; // Fake image URLs
}

export const seedAds = [
  // Real Estate - Apartments
  {
    title: "آپارتمان ۳ خوابه نو در منطقه ۱ تهران",
    description: "آپارتمان کاملاً تبریزی شده با ۳ اتاق، سالن پذیرایی، ۲ سرویس بهداشتی، بالکن وسیع و پارکینگ. کف‌کاری چوبی، کابینت‌های مدرن، سیستم دوخته و کولر گازی. محل امن با دسترسی آسان به مترو و خطوط اتوبوس.",
    categorySlug: "apartment",
    price: 2500000000,
    province: "تهران",
    city: "تهران",
    district: "منطقه ۱",
    address: "خیابان ولیعصر، کوچه ۱۲، پلاک ۴۵",
    options: { area: 120, rooms: 3, bathrooms: 2, building_age: "5-10 سال", parking: true, elevator: true, storage: true, balcony: true },
    images: [
      "https://picsum.photos/seed/apartment1/800/600.jpg",
      "https://picsum.photos/seed/apartment2/800/600.jpg",
      "https://picsum.photos/seed/apartment3/800/600.jpg",
    ],
  },
  {
    title: "آپارتمان لوکس ۲ خوابه با بالکن در شیراز",
    description: "آپارتمان ۲ خوابه با بالکن دید منحصر‌به‌فرد، کف‌کاری سرامیک، کابینت‌هایMDF، پکیج کولر گازی، انباری و پارکینگ. مجتمع سكنی با امنیت ۲۴ ساعته، استخر و Saal ورزشی.",
    categorySlug: "apartment",
    price: 1800000000,
    province: "فارس",
    city: "شیراز",
    district: "منطقه ۳",
    address: "بلوار معالی، مجتمع پارسیان، واحد ۱۲",
    options: { area: 95, rooms: 2, bathrooms: 1, building_age: "0-5 سال", parking: true, elevator: true, storage: true, balcony: true },
    images: [
      "https://picsum.photos/seed/apartment4/800/600.jpg",
      "https://picsum.photos/seed/apartment5/800/600.jpg",
    ],
  },
  {
    title: "ویلا ۴ خوابه با استخر در شمال تهران",
    description: "ویلا دوطبقه ۴ خوابه با حیاط ۳۰۰ متری، استخر خصوصی، سونا، جاکوزی، باربیکیو و پارکینگ ۲ ماشین. کف‌کاری سنگ چینی، سیستم هوشمند خانه، دوربین مداربسته.'accès آسان به جاده چالوس.",
    categorySlug: "villa",
    price: 8500000000,
    province: "تهران",
    city: "شمال تهران",
    district: "فرحزاد",
    address: "خیابان فرهنگ، کوچه ۵، پلاک ۱۲",
    options: { land_area: 500, floor_area: 350, floors: 2, rooms: 4, yard: true, pool: true },
    images: [
      "https://picsum.photos/seed/villa1/800/600.jpg",
      "https://picsum.photos/seed/villa2/800/600.jpg",
      "https://picsum.photos/seed/villa3/800/600.jpg",
    ],
  },
  {
    title: "زمین ۵۰۰ متری در کرج",
    description: "زمین ۵۰۰ متری مربع در منطقه رو به رشد کرج، مناسب برای ساخت ویلا یا آپارتمان. رو به خیابان ۱۲ متری،удین zásobní، برق، گاز، آب و تلفن. سند رسمی ملکی.",
    categorySlug: "land",
    price: 3500000000,
    province: "البرز",
    city: "کرج",
    district: "مهروییل",
    address: "بلوار شهید بهشتی، خ میرحسین",
    options: { area: 500, deed_type: "سند رسمی" },
    images: [
      "https://picsum.photos/seed/land1/800/600.jpg",
      "https://picsum.photos/seed/land2/800/600.jpg",
    ],
  },
  // Vehicles - Cars
  {
    title: "پژو ۴۰۵ SLX مدل ۱۴۰۱، صفر کیلومتر",
    description: "پژو ۴۰۵ SLX مدل ۱۴۰۱، رنگ سفید صدفی، گیربکس اتوماتیک، سیستم ABS، ایربگ، کنترل ثبات، سنسور Парکینگ، کولر، کولرDeprecatedی، شیشه برقی، قفل مرکزی، ریموت کنترل، گارانتی شرکت ایران‌خودرو.",
    categorySlug: "car",
    price: 1200000000,
    province: "تهران",
    city: "تهران",
    district: "منطقه ۵",
    address: "خیابان آزادی، نمایشگاه پژو",
    options: { brand: "پژو", model: "۴۰۵ SLX", year: 1401, mileage: 0, color: "سفید صدفی", transmission: "اتوماتیک", fuel_type: "بنزین", real_mileage: true, no_paint: true, no_part_replace: true },
    images: [
      "https://picsum.photos/seed/car1/800/600.jpg",
      "https://picsum.photos/seed/car2/800/600.jpg",
      "https://picsum.photos/seed/car3/800/600.jpg",
    ],
  },
  {
    title: "پراید ۱۳۱ سافا مدل ۱۴۰۰، کارکرد ۳۰ هزار کیلومتر",
    description: "پراید ۱۳۱ سافا مدل ۱۴۰۰، رنگ نقره‌ای، گیربکس دنده‌ای، کولر، شیشه برقی، قفل مرکزی، سنسور پارکینگ، سنسور عقب، ناوبری، بلوتوث، USB، کارکرد ۳۰ هزار کیلومتر، بدون تصادف، رنگ‌آموزی و تعویض قطعه.",
    categorySlug: "car",
    price: 650000000,
    province: "تهران",
    city: "تهران",
    district: "منطقه ۱۰",
    address: "خیابان فاطمی، کوچه ۳",
    options: { brand: "پراید", model: "۱۳۱ سافا", year: 1400, mileage: 30000, color: "نقره‌ای", transmission: "دنده‌ای", fuel_type: "بنزین", real_mileage: true, no_paint: true, no_part_replace: true },
    images: [
      "https://picsum.photos/seed/car4/800/600.jpg",
      "https://picsum.photos/seed/car5/800/600.jpg",
    ],
  },
  {
    title: "سمند سورن پلاس EF7، توری ۲۰۲۳",
    description: "سمند سورن پلاس با موتور EF7، گیربکس اتوماتیک، سیستم ABS، ایربگ دوطرفه، کنترل ثبات ESP، سنسور پارکینگ، کامرا عقب، ناوبری، پایش bandaژ، صندلی‌های熱، 거울 برقی، سنسور باران، کولر اتوماتیک.",
    categorySlug: "car",
    price: 950000000,
    province: "تهران",
    city: "تهران",
    district: "منطقه ۲",
    address: "خیابان انقلاب، نمایشگاه ایران‌خودرو",
    options: { brand: "ایران‌خودرو", model: "سورن پلاس", year: 1402, mileage: 5000, color: "مشکی", transmission: "اتوماتیک", fuel_type: "بنزین", real_mileage: true, no_paint: true, no_part_replace: true },
    images: [
      "https://picsum.photos/seed/car6/800/600.jpg",
      "https://picsum.photos/seed/car7/800/600.jpg",
    ],
  },
  // Motorcycle
  {
    title: "موتورسیکلت یاماها MT-09 مدل ۱۴۰۲",
    description: "یاماها MT-09 مدل ۱۴۰۲، حجم ۸۹۰ سی‌سی، سه‌کلندر، ۱۱۹ اسب بخار، سیستم کنترل تراکشن، ABS، کوییک‌شیفر، PageMode‌های رانندگی، suspension کامل قابل تنظیم،LED کامل، صفر کیلومتر.",
    categorySlug: "motorcycle",
    price: 2800000000,
    province: "تهران",
    city: "تهران",
    district: "منطقه ۶",
    address: "خیابان شریعتی، نمایشگاه یاماها",
    options: { brand: "یاماها", model: "MT-09", year: 1402, mileage: 0, engine_cc: 890 },
    images: [
      "https://picsum.photos/seed/moto1/800/600.jpg",
      "https://picsum.photos/seed/moto2/800/600.jpg",
    ],
  },
  // Digital - Mobile
  {
    title: "آیفون ۱۵ پرو ماکس ۲۵۶ گیگ، آبی تیتانیوم",
    description: "آیفون ۱۵ پرو ماکس ۲۵۶ گیگ، رنگ آبی تیتانیوم، چیپ A17 Pro، دوربین ۴۸ مگاپیکسل، Dynamic Island، USB-C، باتری تمام روز، Face ID، iOS ۱۷، گارانتی اپل ایران، باکس کامل و 액سسوری‌های اصلی.",
    categorySlug: "mobile-tablet",
    price: 48000000,
    province: "تهران",
    city: "تهران",
    district: "منطقه ۱",
    address: "مرکز خرید تック، طبقه ۲",
    options: { brand: "اپل", model: "iPhone 15 Pro Max", storage: "۲۵۶ گیگ", ram: "۸ گیگ", condition: "نو" },
    images: [
      "https://picsum.photos/seed/iphone1/800/600.jpg",
      "https://picsum.photos/seed/iphone2/800/600.jpg",
    ],
  },
  {
    title: "سامسونگ گلکسی S24 ألترا ۵۱۲ گیگ، تیتانیوم خاکستری",
    description: "گالاکسی S24 ألترا ۵۱۲ گیگ، رم ۱۲ گیگ، رنگ تیتانیوم خاکستری، اس پن، دوربین ۲۰۰ مگاپیکسل، زوم ۱۰۰x، اسکرین ۶.۸ اینچ Dynamic AMOLED 2X، باتری ۵۰۰۰ میلی‌آمپر، شارژ ۴۵ وات، IP68، ۷ سال آپدیت.",
    categorySlug: "mobile-tablet",
    price: 42000000,
    province: "تهران",
    city: "تهران",
    district: "منطقه ۳",
    address: "مرکز خرید دیجیکالا، واحد ۱۵",
    options: { brand: "سامسونگ", model: "Galaxy S24 Ultra", storage: "۵۱۲ گیگ", ram: "۱۲ گیگ", condition: "نو" },
    images: [
      "https://picsum.photos/seed/samsung1/800/600.jpg",
      "https://picsum.photos/seed/samsung2/800/600.jpg",
    ],
  },
  // Laptop
  {
    title: "لپ‌تاپ ایسوس ROG Strix G16، RTX 4070",
    description: "لپ‌تاپ گیمینگ ایسوس ROG Strix G16، پردازنده Intel Core i9-13980HX، رم ۳۲ گیگ DDR5، ۱ ترابایت SSD NVMe، کارت گرافیک RTX 4070 ۸ گیگ، صفحه نمایش ۱۶ اینچ QHD ۲۴۰ هرتز، کیبورد RGB، سیستم خنک‌سازی پیشرفته، ویندوز ۱۱.",
    categorySlug: "laptop-computer",
    price: 75000000,
    province: "تهران",
    city: "تهران",
    district: "منطقه ۶",
    address: "مرکز کامپیوتری تهران، واحد ۴۵",
    options: { brand: "ایسوس", cpu: "Intel Core i9-13980HX", ram: "۳۲ گیگ", storage: "۱ ترابایت SSD", gpu: "RTX 4070 8GB" },
    images: [
      "https://picsum.photos/seed/laptop1/800/600.jpg",
      "https://picsum.photos/seed/laptop2/800/600.jpg",
    ],
  },
  {
    title: "مک‌بوک ایر ۱۵ اینچ M3، ۱۶ گیگ رم، ۵۱۲ گیگ SSD",
    description: "مک‌بوک ایر ۱۵ اینچ با چیپ M3، رم ۱۶ گیگ، ۵۱۲ گیگ SSD، صفحه نمایش Liquid Retina، تاچ آی‌دی، مغیول‌سیف ۳، دو پورت Thunderbolt، باتری تا ۱۸ ساعت، macOS Sonoma، رنگ Midnight، گارانتی اپل ایران.",
    categorySlug: "laptop-computer",
    price: 62000000,
    province: "تهران",
    city: "تهران",
    district: "منطقه ۱",
    address: "اپل استور رسمی، خیابان ولیعصر",
    options: { brand: "اپل", cpu: "Apple M3", ram: "۱۶ گیگ", storage: "۵۱۲ گیگ SSD", gpu: "Integrated 10-core" },
    images: [
      "https://picsum.photos/seed/macbook1/800/600.jpg",
      "https://picsum.photos/seed/macbook2/800/600.jpg",
    ],
  },
  // Home - Furniture
  {
    title: "مبل راحتی ۳+۲ نئوکلاسیک، پارچه ولوری",
    description: "مبل راحتی ۳+۲ نئوکلاسیک، چassie چوبی بوقلمون، اسفنج پرپشت ۳۵ و سیت ۳۰، بالین فایبر، پارچه ولوری ضد لکه و ضد آب، پایه‌های فلزی کروم، گارانتی ۵ ساله چassie، ارسال رایگان تهران.",
    categorySlug: "furniture",
    price: 45000000,
    province: "تهران",
    city: "تهران",
    district: "منطقه ۴",
    address: "خیابان سعادت‌آباد، نمایشگاه مبل الماس",
    options: { type: "مبل نئوکلاسیک", material: "چوب و پارچه", color: "کرم" },
    images: [
      "https://picsum.photos/seed/sofa1/800/600.jpg",
      "https://picsum.photos/seed/sofa2/800/600.jpg",
    ],
  },
  {
    title: "ماشین لباسشویی ال جی ۱۰ کیلو، استیم، AI DD",
    description: "ماشین لباسشویی ال جی ۱۰ کیلو، موتور اینورتر مستقیم، تکنولوژی AI DD، استیم، ۶ حرکتی، ۱۴ برنامه، ضد حساسیت، niño، قفل کودک، گارانتی ۱۰ ساله موتور، رنگ سفید، ابعاد ۶۰x۶۰x۸۵.",
    categorySlug: "appliances",
    price: 18500000,
    province: "تهران",
    city: "تهران",
    district: "منطقه ۵",
    address: "مرکز لوازم خانگی دیجیکالا، واحد ۱۰",
    options: { type: "ماشین لباسشویی", brand: "ال جی", warranty: "دارای ضمانت‌نامه معتبر" },
    images: [
      "https://picsum.photos/seed/washer1/800/600.jpg",
    ],
  },
  // Services - Education
  {
    title: "دوره کامل برنامه‌نویسی پایتون از صفر تا حرفه‌ای",
    description: "دوره کامل پایتون از صفر تا حرفه‌ای: مبنای برنامه‌نویسی، ООП، دیتابیس (SQL/NoSQL)، Django، FastAPI، تست‌نویسی، Docker، CI/CD، پروژه‌های واقعی، پشتیبانی ۲۴/۷، گواهی‌نامه معتبر، دسترسی مدیامدیت.",
    categorySlug: "education",
    price: 12000000,
    province: "تهران",
    city: "تهران",
    district: "آنلاین",
    address: "پلتفرم آنلاین فرادرس",
    options: { type: "آموزش برنامه‌نویسی", format: "آنلاین" },
    images: [
      "https://picsum.photos/seed/course1/800/600.jpg",
    ],
  },
  // Jobs
  {
    title: "استخدام برنامه‌نویس بک‌اند Senior (Node.js/Go)",
    description: "استخدام برنامه‌نویس بک‌اند Senior با تسلط بر Node.js، Go، PostgreSQL، Redis، Kafka، Kubernetes، Microservices، Clean Architecture، CI/CD، تست‌نویسی. حقوق رقابتی، بیمه تکمیل، انعطاف ساعتی، Rimot/Hybrid، مرخصی سالانه ۲۵ روز، بلیط غذا، دوره‌های آموزشی.",
    categorySlug: "programming-jobs",
    price: 0,
    province: "تهران",
    city: "تهران",
    district: "منطقه ۱",
    address: "شرکت فناوری الفبا، خیابان ورديقدم",
    options: { employment_type: "تمام وقت", experience: "سینیور", skills: "Node.js, Go, PostgreSQL, Redis, Kafka, Kubernetes, Microservices" },
    images: [
      "https://picsum.photos/seed/job1/800/600.jpg",
    ],
  },
];