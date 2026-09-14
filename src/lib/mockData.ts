// Shared storefront data contracts. Maintained preview data lives in src/content.

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
