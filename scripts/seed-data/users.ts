export interface SeedUser {
  mobile: string;
  fullName: string;
  isAdmin?: boolean;
}

export const seedUsers = [
  { mobile: "09123456789", fullName: "احمد محمدی", isAdmin: true },
  { mobile: "09123456780", fullName: "فاطمه احمدی" },
  { mobile: "09123456781", fullName: "محمد رضایی" },
  { mobile: "09123456782", fullName: "زهرا حسینی" },
  { mobile: "09123456783", fullName: "علی اکبری" },
  { mobile: "09123456784", fullName: "مریم موسوی" },
  { mobile: "09123456785", fullName: "حسن قاسمی" },
];