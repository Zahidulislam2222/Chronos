// Mock data structure mimicking WordPress GraphQL responses
// Replace with actual API calls using import.meta.env.VITE_API_URL

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  salePrice?: number;
  description: string;
  shortDescription: string;
  image: string;
  gallery: string[];
  category: string;
  brand: string;
  inStock: boolean;
  featured: boolean;
  specifications: {
    movement: string;
    caseMaterial: string;
    dialColor: string;
    waterResistance: string;
    caseDiameter: string;
  };
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: {
    name: string;
    avatar: string;
  };
  date: string;
  category: string;
  readTime: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export const mockProducts: Product[] = [
  {
    id: "1",
    slug: "royal-chronograph-gold",
    name: "Royal Chronograph",
    price: 24500,
    description: "A masterpiece of Swiss engineering, the Royal Chronograph combines timeless elegance with precision mechanics. Featuring a hand-finished 18k rose gold case and a stunning guilloche dial, this timepiece represents the pinnacle of haute horlogerie.",
    shortDescription: "18K Rose Gold Swiss Automatic",
    image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800",
    gallery: [
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800",
      "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800",
    ],
    category: "Chronograph",
    brand: "Maison Horlogère",
    inStock: true,
    featured: true,
    specifications: {
      movement: "Automatic Swiss",
      caseMaterial: "18K Rose Gold",
      dialColor: "Champagne",
      waterResistance: "100m",
      caseDiameter: "42mm",
    },
  },
  {
    id: "2",
    slug: "midnight-tourbillon",
    name: "Midnight Tourbillon",
    price: 89000,
    description: "The Midnight Tourbillon showcases our most complex movement yet. The flying tourbillon at 6 o'clock is framed by a deep blue aventurine dial studded with diamond hour markers.",
    shortDescription: "Platinum Flying Tourbillon",
    image: "https://images.unsplash.com/photo-1548171915-e79a380a2a4b?w=800",
    gallery: [
      "https://images.unsplash.com/photo-1548171915-e79a380a2a4b?w=800",
    ],
    category: "Tourbillon",
    brand: "Maison Horlogère",
    inStock: true,
    featured: true,
    specifications: {
      movement: "Manual-wind Tourbillon",
      caseMaterial: "Platinum",
      dialColor: "Aventurine Blue",
      waterResistance: "30m",
      caseDiameter: "40mm",
    },
  },
  {
    id: "3",
    slug: "sport-diver-pro",
    name: "Sport Diver Pro",
    price: 12800,
    description: "Built for the depths, the Sport Diver Pro is certified to 300m water resistance. The ceramic bezel and titanium case ensure durability while the luminous indices guarantee visibility in any condition.",
    shortDescription: "Titanium Professional Diver",
    image: "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=800",
    gallery: [
      "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=800",
    ],
    category: "Diver",
    brand: "Maison Horlogère",
    inStock: true,
    featured: false,
    specifications: {
      movement: "Automatic Swiss",
      caseMaterial: "Titanium",
      dialColor: "Deep Black",
      waterResistance: "300m",
      caseDiameter: "44mm",
    },
  },
  {
    id: "4",
    slug: "classic-dress-platinum",
    name: "Classic Dress",
    price: 18500,
    description: "Understated elegance defines the Classic Dress. Its ultra-thin profile houses a beautifully decorated movement visible through the sapphire caseback.",
    shortDescription: "White Gold Ultra-Thin",
    image: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800",
    gallery: [
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800",
    ],
    category: "Dress",
    brand: "Maison Horlogère",
    inStock: true,
    featured: true,
    specifications: {
      movement: "Manual-wind",
      caseMaterial: "18K White Gold",
      dialColor: "Silver Sunburst",
      waterResistance: "30m",
      caseDiameter: "38mm",
    },
  },
  {
    id: "5",
    slug: "perpetual-calendar",
    name: "Perpetual Calendar",
    price: 145000,
    description: "Our most sophisticated complication, the Perpetual Calendar tracks the day, date, month, and moon phase, automatically adjusting for months of varying length until 2100.",
    shortDescription: "Platinum Grand Complication",
    image: "https://images.unsplash.com/photo-1639037687665-625aacc4ed2a?w=800",
    gallery: [
      "https://images.unsplash.com/photo-1639037687665-625aacc4ed2a?w=800",
    ],
    category: "Complications",
    brand: "Maison Horlogère",
    inStock: false,
    featured: true,
    specifications: {
      movement: "Automatic",
      caseMaterial: "Platinum",
      dialColor: "Slate Grey",
      waterResistance: "30m",
      caseDiameter: "41mm",
    },
  },
  {
    id: "6",
    slug: "aviator-gmt",
    name: "Aviator GMT",
    price: 9800,
    description: "Designed for the modern traveler, the Aviator GMT features a rotating bezel for tracking a second timezone and a large, legible dial inspired by cockpit instruments.",
    shortDescription: "Steel Dual Time Zone",
    image: "https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=800",
    gallery: [
      "https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=800",
    ],
    category: "GMT",
    brand: "Maison Horlogère",
    inStock: true,
    featured: false,
    specifications: {
      movement: "Automatic Swiss",
      caseMaterial: "Stainless Steel",
      dialColor: "Deep Blue",
      waterResistance: "100m",
      caseDiameter: "42mm",
    },
  },
];

export const mockBlogPosts: BlogPost[] = [
  {
    id: "1",
    slug: "art-of-watchmaking",
    title: "The Art of Haute Horlogerie: A Journey Through Time",
    excerpt: "Discover the meticulous craftsmanship behind luxury timepieces and the centuries-old traditions that define Swiss watchmaking excellence.",
    content: "<p>The world of haute horlogerie represents the pinnacle of human craftsmanship...</p>",
    featuredImage: "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=800",
    author: {
      name: "Laurent Dubois",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
    },
    date: "2024-01-15",
    category: "Craftsmanship",
    readTime: "8 min read",
  },
  {
    id: "2",
    slug: "tourbillon-explained",
    title: "Understanding the Tourbillon: Engineering Marvel",
    excerpt: "Unravel the mystery behind one of watchmaking's most complex and mesmerizing complications—the tourbillon.",
    content: "<p>The tourbillon, invented by Abraham-Louis Breguet in 1795...</p>",
    featuredImage: "https://images.unsplash.com/photo-1619134778706-7015533a6150?w=800",
    author: {
      name: "Marie Chen",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
    },
    date: "2024-01-10",
    category: "Education",
    readTime: "12 min read",
  },
  {
    id: "3",
    slug: "collecting-vintage-watches",
    title: "The Collector's Guide to Vintage Timepieces",
    excerpt: "Expert insights on building a discerning collection of vintage watches, from authentication to investment potential.",
    content: "<p>Collecting vintage watches is both an art and a science...</p>",
    featuredImage: "https://images.unsplash.com/photo-1526045431048-f857369baa09?w=800",
    author: {
      name: "James Worthington",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    },
    date: "2024-01-05",
    category: "Collecting",
    readTime: "10 min read",
  },
];

export const mockCategories: Category[] = [
  { id: "1", name: "All Watches", slug: "all", count: 6 },
  { id: "2", name: "Chronograph", slug: "chronograph", count: 1 },
  { id: "3", name: "Tourbillon", slug: "tourbillon", count: 1 },
  { id: "4", name: "Diver", slug: "diver", count: 1 },
  { id: "5", name: "Dress", slug: "dress", count: 1 },
  { id: "6", name: "Complications", slug: "complications", count: 1 },
  { id: "7", name: "GMT", slug: "gmt", count: 1 },
];
