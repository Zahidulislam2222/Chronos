import { Product, BlogPost } from '@/lib/mockData';

const API_URL = import.meta.env.VITE_API_URL || '';
// Unsplash license: https://unsplash.com/license — free for commercial use
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800';

// --- QUERIES & MUTATIONS ---

// <--- NEW: Add the mutation to update a user's core profile
const UPDATE_USER_MUTATION = `
  mutation UpdateUser($id: ID!, $firstName: String!) {
    updateUser(input: {
      id: $id,
      firstName: $firstName
    }) {
      user {
        id
        firstName
      }
    }
  }
`;

const LOGIN_MUTATION = `
  mutation Login($username: String!, $password: String!) {
    login(input: { clientMutationId: "uniqueId", username: $username, password: $password }) {
      authToken
      user {
        id
        databaseId
        name
        email
        avatar { url }
      }
    }
  }
`;

const REGISTER_MUTATION = `
  mutation RegisterCustomer($email: String!, $password: String!, $name: String!) {
    registerCustomer(input: {
      email: $email,
      password: $password,
      username: $email,
      billing: {
        firstName: $name
      }
    }) {
      customer {
        id
        databaseId
        email
        firstName
      }
    }
  }
`;
// ... (rest of the mutations and queries are the same) ...

const GET_CUSTOMER_ORDERS = `
  query GetCustomerOrders {
    customer {
      orders {
        nodes {
          orderNumber
          date
          status
          total
        }
      }
    }
  }
`;

const SUBMIT_FORM_MUTATION = `
  mutation SubmitChronosContact($name: String!, $email: String!, $subject: String!, $message: String!) {
    submitChronosContact(input: {
      clientMutationId: "chronos",
      name: $name,
      email: $email,
      subject: $subject,
      message: $message
    }) {
      success
      message
    }
  }
`;

const PRODUCTS_QUERY = `
query GetProducts {
  products(first: 50, where: { stockStatus: IN_STOCK }) {
    nodes {
      databaseId
      slug
      name
      featured
      shortDescription
      image { sourceUrl }
      ... on SimpleProduct {
        price
        regularPrice
        galleryImages { nodes { sourceUrl } }
        productCategories { nodes { name } }
        watchSpecifications {
          movement
          casematerial
          dialcolor
          waterresistance
          casediameter
        }
      }
    }
  }
}
`;

const SINGLE_PRODUCT_QUERY = `
query GetProductBySlug($slug: ID!) {
  product(id: $slug, idType: SLUG) {
    databaseId
    slug
    name
    featured
    shortDescription
    description
    image { sourceUrl }
    ... on SimpleProduct {
      price
      regularPrice
      galleryImages { nodes { sourceUrl } }
      productCategories { nodes { name } }
      watchSpecifications {
        movement
        casematerial
        dialcolor
        waterresistance
        casediameter
      }
    }
  }
}
`;

const POSTS_QUERY = `
query GetPosts {
  posts(first: 10) {
    nodes {
      databaseId
      id
      slug
      title
      excerpt
      content
      date
      featuredImage { node { sourceUrl } }
      categories { nodes { name } }
      author { node { name, avatar { url } } }
    }
  }
}
`;

const SINGLE_POST_QUERY = `
query GetPostBySlug($slug: ID!) {
  post(id: $slug, idType: SLUG) {
    databaseId
    id
    slug
    title
    excerpt
    content
    date
    featuredImage { node { sourceUrl } }
    categories { nodes { name } }
    author { node { name, avatar { url } } }
    comments(first: 20, where: { order: ASC }) {
      nodes {
        id
        content
        date
        author {
          node {
            name
            avatar { url }
          }
        }
      }
    }
  }
}
`;

const CREATE_COMMENT_MUTATION = `
mutation CreateComment($author: String!, $email: String!, $body: String!, $postId: Int!) {
  createComment(input: {
    author: $author,
    authorEmail: $email,
    content: $body,
    commentOn: $postId
  }) {
    success
  }
}
`;

const ADD_TO_CART_MUTATION = `
mutation AddToCart($productId: Int!, $quantity: Int!) {
  addToCart(input: {productId: $productId, quantity: $quantity}) {
    clientMutationId
  }
}
`;

const CHECKOUT_MUTATION = `
mutation Checkout($input: CheckoutInput!) {
  checkout(input: $input) {
    order {
      databaseId
      orderNumber
    }
    result
  }
}
`;

// --- HELPERS ---

function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
}

const DEFAULT_SPECIFICATIONS = {
  movement: 'N/A',
  caseMaterial: 'N/A',
  dialColor: 'N/A',
  waterResistance: 'N/A',
  caseDiameter: 'N/A',
};

function transformProduct(node: any): Product & { databaseId: number } {
  const imageUrl = node.image?.sourceUrl || PLACEHOLDER_IMAGE;
  const galleryImages = node.galleryImages?.nodes?.map((img: any) => img?.sourceUrl).filter(Boolean) || [];
  const priceStr = node.price || node.regularPrice;
  const price = priceStr ? parseFloat(priceStr.replace(/[^0-9.]/g, '')) : 0;
  const shortDescription = stripHtml(node.shortDescription);
  const specs = node.watchSpecifications || {};
  const specifications = {
    movement: specs.movement || DEFAULT_SPECIFICATIONS.movement,
    caseMaterial: specs.casematerial || DEFAULT_SPECIFICATIONS.caseMaterial,
    dialColor: specs.dialcolor || DEFAULT_SPECIFICATIONS.dialColor,
    waterResistance: specs.waterresistance || DEFAULT_SPECIFICATIONS.waterResistance,
    caseDiameter: specs.casediameter || DEFAULT_SPECIFICATIONS.caseDiameter,
  };

  return {
    databaseId: node.databaseId,
    id: String(node.databaseId),
    slug: node.slug,
    name: node.name,
    price,
    description: node.description || '',
    shortDescription,
    image: imageUrl,
    gallery: galleryImages.length > 0 ? galleryImages : [imageUrl],
    category: node.productCategories?.nodes?.[0]?.name || 'Watch',
    brand: 'Maison Horlogère',
    inStock: true,
    featured: node.featured || false,
    specifications,
  };
}

function transformPost(node: any): BlogPost & { databaseId: number; comments: any[] } {
    return {
    databaseId: node.databaseId,
    id: node.id,
    slug: node.slug,
    title: node.title,
    excerpt: stripHtml(node.excerpt),
    content: node.content || '',
    featuredImage: node.featuredImage?.node?.sourceUrl || PLACEHOLDER_IMAGE,
    author: {
      name: node.author?.node?.name || 'Editor',
      avatar: node.author?.node?.avatar?.url || '',
    },
    date: new Date(node.date).toLocaleDateString(),
    category: node.categories?.nodes?.[0]?.name || 'Journal',
    readTime: '5 min read',
    comments: node.comments?.nodes || [],
  };
}

function getCountryCode(countryName: string) {
  const lower = countryName.toLowerCase().trim();
  if (lower === 'bangladesh') return 'BD';
  if (lower === 'united states' || lower === 'usa') return 'US';
  if (lower === 'united kingdom' || lower === 'uk') return 'GB';
  return countryName.length === 2 ? countryName.toUpperCase() : 'BD';
}

// --- CORE FETCH FUNCTION ---
let sessionToken = localStorage.getItem('woo-session') || null;

async function fetchGraphQL(query: string, variables = {}) {
  if (!API_URL) throw new Error('API URL is not configured');
  
  const headers: any = { 'Content-Type': 'application/json' };
  
  if (sessionToken) {
    headers['woocommerce-session'] = `Session ${sessionToken}`;
  }

  const authToken = localStorage.getItem('auth-token');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const newSession = response.headers.get('woocommerce-session');
  if (newSession) {
    sessionToken = newSession;
    localStorage.setItem('woo-session', newSession);
  }

  const json = await response.json();
  if (json.errors) {
    console.error('GraphQL Errors:', json.errors);
    throw new Error(JSON.stringify(json.errors));
  }
  return json.data;
}

// --- EXPORTED FUNCTIONS ---

// <--- NEW: Add the function to update a user's name after they register
export async function updateUserName(userId: string, name: string) {
    const data = await fetchGraphQL(UPDATE_USER_MUTATION, { id: userId, firstName: name });
    return data?.updateUser?.user;
}

export async function fetchProducts(): Promise<Product[]> {
  const data = await fetchGraphQL(PRODUCTS_QUERY);
  return data?.products?.nodes?.map(transformProduct) || [];
}

export async function fetchProductBySlug(slug: string): Promise<any | null> {
  const data = await fetchGraphQL(SINGLE_PRODUCT_QUERY, { slug });
  if (!data?.product) return null;
  return transformProduct(data.product);
}

export async function fetchPosts(): Promise<BlogPost[]> {
  const data = await fetchGraphQL(POSTS_QUERY);
  return data?.posts?.nodes?.map(transformPost) || [];
}

export async function fetchPostBySlug(slug: string): Promise<any | null> {
  const data = await fetchGraphQL(SINGLE_POST_QUERY, { slug });
  if (!data?.post) return null;
  return transformPost(data.post);
}

export async function createComment(postId: number, author: string, email: string, body: string) {
  const data = await fetchGraphQL(CREATE_COMMENT_MUTATION, { postId, author, email, body });
  return data?.createComment;
}

export async function processCheckout(data: any, cartItems: any[]) {
  for (const item of cartItems) {
    await fetchGraphQL(ADD_TO_CART_MUTATION, {
      productId: parseInt(item.product.id, 10), 
      quantity: item.quantity
    });
  }

  const countryCode = getCountryCode(data.country);
  const input = {
    paymentMethod: 'cod',
    billing: {
      firstName: data.firstName,
      lastName: data.lastName,
      address1: data.address,
      city: data.city,
      postcode: data.zip,
      country: countryCode,
      email: data.email,
    },
    isPaid: false,
  };

  const response = await fetchGraphQL(CHECKOUT_MUTATION, { input });
  return response?.checkout;
}

export async function loginUser(username: string, password: string) {
  const data = await fetchGraphQL(LOGIN_MUTATION, { username, password });
  const loginData = data?.login;
  
  if (loginData?.user) {
    const avatarUrl = loginData.user.avatar?.url || '';
    
    return {
      authToken: loginData.authToken,
      user: {
        id: String(loginData.user.databaseId || loginData.user.id || ''),
        name: loginData.user.name || '',
        email: loginData.user.email || '',
        avatar: avatarUrl,
      }
    };
  }
  return null;
}
  
export async function registerUser(name: string, email: string, password: string) {
  const data = await fetchGraphQL(REGISTER_MUTATION, { email, password, name });
  const customer = data?.registerCustomer?.customer;
  
  if (customer) {
    return {
      id: customer.id, // We need the GraphQL ID (e.g. "user:5") for the update mutation
      email: customer.email || email,
      name: customer.firstName || name,
      avatar: customer.avatar?.url || '',
    };
  }
  return null;
}

export async function fetchCustomerOrders() {
  try {
    const data = await fetchGraphQL(GET_CUSTOMER_ORDERS);
    const orders = data?.customer?.orders?.nodes || [];
    
    return orders.map((order: any) => ({
      orderNumber: order.orderNumber,
      date: order.date,
      status: order.status,
      total: order.total,
    }));
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return [];
  }
}

export async function submitContactForm(data: { name: string; email: string; message: string; subject?: string }) {
    const response = await fetchGraphQL(SUBMIT_FORM_MUTATION, {
      name: data.name,
      email: data.email,
      subject: data.subject || 'General Inquiry',
      message: data.message
    });
  
    if (!response?.submitChronosContact?.success) {
      throw new Error('Server failed to send email');
    }
  
    return true;
}