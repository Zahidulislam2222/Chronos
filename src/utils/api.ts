import { settings, isPreview } from "@/config/settings";
import { previewCatalogue, content } from "@/content";
import { Product, BlogPost } from "@/lib/mockData";
import { wordpressMedia, wordpressText } from "@/lib/wordpress";

interface WPProduct {
  databaseId: number;
  slug: string;
  name: string;
  price?: string;
  regularPrice?: string;
  description?: string;
  shortDescription?: string;
  image?: { sourceUrl?: string };
  galleryImages?: { nodes?: { sourceUrl?: string }[] };
  featured?: boolean;
  stockStatus?: string;
  productCategories?: { nodes?: { name: string }[] };
  watchSpecifications?: {
    movement?: string;
    casematerial?: string;
    dialcolor?: string;
    waterresistance?: string;
    casediameter?: string;
  };
}
interface WPPost {
  databaseId: number;
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  date: string;
  featuredImage?: { node?: { sourceUrl?: string } };
  author?: { node?: { name?: string; avatar?: { url?: string } } };
  categories?: { nodes?: { name: string }[] };
  comments?: { nodes?: unknown[] };
}
export interface CustomerOrder {
  orderNumber: string;
  date: string;
  status: string;
  total: string;
}
interface CheckoutInput {
  country: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  zip: string;
  email: string;
}

const API_URL = settings.apiUrl;
const PLACEHOLDER_IMAGE = content.hero.image;

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
  query GetCustomerOrders($first: Int!, $after: String) {
    customer {
      orders(first: $first, after: $after) {
        pageInfo { hasNextPage endCursor }
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
query GetProducts($first: Int!, $after: String) {
  products(first: $first, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes {
      databaseId
      slug
      name
      featured
      shortDescription
      image { sourceUrl }
      ... on SimpleProduct {
        price(format: RAW)
        regularPrice(format: RAW)
        stockStatus
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
      price(format: RAW)
      regularPrice(format: RAW)
      stockStatus
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
query GetPosts($first: Int!, $after: String) {
  posts(first: $first, after: $after) {
    pageInfo { hasNextPage endCursor }
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
  if (!html) return "";
  return wordpressText(html);
}

const DEFAULT_SPECIFICATIONS = {
  movement: "N/A",
  caseMaterial: "N/A",
  dialColor: "N/A",
  waterResistance: "N/A",
  caseDiameter: "N/A",
};

function transformProduct(node: WPProduct): Product & { databaseId: number } {
  const imageUrl = wordpressMedia(node.image?.sourceUrl || "") || PLACEHOLDER_IMAGE;
  const galleryImages =
    node.galleryImages?.nodes?.map((img) => wordpressMedia(img?.sourceUrl || "")).filter(Boolean) ||
    [];
  const priceStr = node.price || node.regularPrice;
  const price = priceStr ? parseFloat(priceStr.replace(/[^0-9.]/g, "")) : 0;
  const shortDescription = stripHtml(node.shortDescription);
  const specs = node.watchSpecifications || {};
  const specifications = {
    movement: specs.movement || DEFAULT_SPECIFICATIONS.movement,
    caseMaterial: specs.casematerial || DEFAULT_SPECIFICATIONS.caseMaterial,
    dialColor: specs.dialcolor || DEFAULT_SPECIFICATIONS.dialColor,
    waterResistance:
      specs.waterresistance || DEFAULT_SPECIFICATIONS.waterResistance,
    caseDiameter: specs.casediameter || DEFAULT_SPECIFICATIONS.caseDiameter,
  };

  return {
    databaseId: node.databaseId,
    id: String(node.databaseId),
    slug: node.slug,
    name: wordpressText(node.name),
    price,
    description: node.description || "",
    shortDescription,
    image: imageUrl,
    gallery: galleryImages.length > 0 ? galleryImages : [imageUrl],
    category: node.productCategories?.nodes?.[0]?.name || "Watch",
    brand: content.brand.name,
    inStock: node.stockStatus === "IN_STOCK" && Number.isFinite(price) && price > 0,
    featured: node.featured || false,
    specifications,
  };
}

function transformPost(
  node: WPPost,
): BlogPost & { databaseId: number; comments: unknown[] } {
  return {
    databaseId: node.databaseId,
    id: node.id,
    slug: node.slug,
    title: wordpressText(node.title),
    excerpt: stripHtml(node.excerpt),
    content: node.content || "",
    featuredImage: wordpressMedia(node.featuredImage?.node?.sourceUrl || "") || PLACEHOLDER_IMAGE,
    author: {
      name: node.author?.node?.name || "Editor",
      avatar: node.author?.node?.avatar?.url || "",
    },
    date: new Date(node.date).toLocaleDateString(),
    category: node.categories?.nodes?.[0]?.name || "Journal",
    readTime: "5 min read",
    comments: node.comments?.nodes || [],
  };
}

function getCountryCode(countryName: string) {
  const lower = countryName.toLowerCase().trim();
  if (lower === "bangladesh") return "BD";
  if (lower === "united states" || lower === "usa") return "US";
  if (lower === "united kingdom" || lower === "uk") return "GB";
  return countryName.length === 2 ? countryName.toUpperCase() : "BD";
}

// --- CORE FETCH FUNCTION ---
// Preview imports must remain usable when browser storage is denied.
let sessionToken: string | null = null;
if (!isPreview) {
  try { sessionToken = localStorage.getItem("woo-session"); } catch { /* No persisted session available. */ }
}

async function fetchGraphQL(query: string, variables = {}) {
  if (isPreview) throw new Error(content.preview.notice);
  if (!API_URL) throw new Error("API URL is not configured");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (sessionToken) {
    headers["woocommerce-session"] = `Session ${sessionToken}`;
  }

  let authToken: string | null = null;
  try { authToken = localStorage.getItem("auth-token"); } catch { /* Storage may be unavailable. */ }
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(settings.requestTimeoutMs),
  });

  if (!response.ok) throw new Error(`WordPress request failed (${response.status}).`);

  const newSession = response.headers.get("woocommerce-session");
  if (newSession) {
    sessionToken = newSession;
    try { localStorage.setItem("woo-session", newSession); } catch { /* Keep the in-memory session. */ }
  }

  const json = await response.json();
  if (json.errors) {
    if (authToken && json.errors.some((error: {message?:string})=>/jwt|token|authorization/i.test(error.message || ""))) {
      window.dispatchEvent(new Event("chronos-auth-expired"));
    }
    throw new Error("WordPress could not complete this request. Please retry or sign in again.");
  }
  return json.data;
}

// --- EXPORTED FUNCTIONS ---

// <--- NEW: Add the function to update a user's name after they register
export async function updateUserName(userId: string, name: string) {
  const data = await fetchGraphQL(UPDATE_USER_MUTATION, {
    id: userId,
    firstName: name,
  });
  return data?.updateUser?.user;
}

export async function fetchProducts(): Promise<Product[]> {
  if (isPreview) return previewCatalogue.products;
  return (await fetchConnection<WPProduct>(PRODUCTS_QUERY, "products")).map(transformProduct);
}

export async function fetchProductBySlug(
  slug: string,
): Promise<Product | null> {
  if (isPreview)
    return (
      previewCatalogue.products.find((product) => product.slug === slug) || null
    );
  const data = await fetchGraphQL(SINGLE_PRODUCT_QUERY, { slug });
  if (!data?.product) return null;
  return transformProduct(data.product);
}

export async function fetchPosts(): Promise<BlogPost[]> {
  if (isPreview) return previewCatalogue.posts;
  return (await fetchConnection<WPPost>(POSTS_QUERY, "posts")).map(transformPost);
}

async function fetchConnection<T>(query: string, field: string): Promise<T[]> {
  const nodes: T[] = [];
  const cursors = new Set<string>();
  let after: string | null = null;
  do {
    const data = await fetchGraphQL(query, { first: settings.pageSize, after });
    const connection = data?.[field];
    if (!Array.isArray(connection?.nodes) || !connection?.pageInfo)
      throw new Error("Invalid WordPress content response.");
    nodes.push(...connection.nodes);
    if (!connection.pageInfo.hasNextPage) return nodes;
    after = connection.pageInfo.endCursor;
    if (!after || cursors.has(after)) throw new Error("Invalid WordPress pagination cursor.");
    cursors.add(after);
  } while (after);
  return nodes;
}

export async function fetchPostBySlug(slug: string): Promise<BlogPost | null> {
  if (isPreview)
    return previewCatalogue.posts.find((post) => post.slug === slug) || null;
  const data = await fetchGraphQL(SINGLE_POST_QUERY, { slug });
  if (!data?.post) return null;
  return transformPost(data.post);
}

export async function createComment(
  postId: number,
  author: string,
  email: string,
  body: string,
) {
  const data = await fetchGraphQL(CREATE_COMMENT_MUTATION, {
    postId,
    author,
    email,
    body,
  });
  return data?.createComment;
}

export async function processCheckout(
  data: CheckoutInput,
  cartItems: { product: Product; quantity: number }[],
) {
  for (const item of cartItems) {
    await fetchGraphQL(ADD_TO_CART_MUTATION, {
      productId: parseInt(item.product.id, 10),
      quantity: item.quantity,
    });
  }

  const countryCode = getCountryCode(data.country);
  const input = {
    paymentMethod: "cod",
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
    const avatarUrl = loginData.user.avatar?.url || "";

    return {
      authToken: loginData.authToken,
      user: {
        id: String(loginData.user.databaseId || loginData.user.id || ""),
        name: loginData.user.name || "",
        email: loginData.user.email || "",
        avatar: avatarUrl,
      },
    };
  }
  return null;
}

export async function fetchCurrentUser() {
  const data = await fetchGraphQL("query CurrentUser { viewer { databaseId name email avatar { url } } }");
  const user = data?.viewer;
  if (!user) {
    window.dispatchEvent(new Event("chronos-auth-expired"));
    throw new Error("Please sign in again.");
  }
  return {id:String(user.databaseId),name:String(user.name),email:String(user.email),avatar:user.avatar?.url || ""};
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
) {
  const data = await fetchGraphQL(REGISTER_MUTATION, { email, password, name });
  const customer = data?.registerCustomer?.customer;

  if (customer) {
    return {
      id: customer.id, // We need the GraphQL ID (e.g. "user:5") for the update mutation
      email: customer.email || email,
      name: customer.firstName || name,
      avatar: customer.avatar?.url || "",
    };
  }
  return null;
}

export async function fetchCustomerOrders(): Promise<CustomerOrder[]> {
  const orders: CustomerOrder[] = [];
  const seen = new Set<string>();
  let after:string|null = null;
  do {
    const data = await fetchGraphQL(GET_CUSTOMER_ORDERS,{first:settings.pageSize,after});
    const connection=data?.customer?.orders;
    if (!Array.isArray(connection?.nodes)) throw new Error("Please sign in again.");
    orders.push(...connection.nodes);
    if (!connection.pageInfo?.hasNextPage) return orders;
    after=connection.pageInfo.endCursor;
    if(!after || seen.has(after))throw new Error("Invalid order pagination cursor.");
    seen.add(after);
  } while(after);
  return orders;
}

export async function submitContactForm(data: {
  name: string;
  email: string;
  message: string;
  subject?: string;
}) {
  const response = await fetchGraphQL(SUBMIT_FORM_MUTATION, {
    name: data.name,
    email: data.email,
    subject: data.subject || "General Inquiry",
    message: data.message,
  });

  if (!response?.submitChronosContact?.success) {
    throw new Error("Server failed to send email");
  }

  return true;
}
