const BASE_URL = "http://localhost:8000/api";


export async function getProducts() {
  const res = await fetch(`${BASE_URL}/market/products/`);
  if (!res.ok) throw new Error("Failed to fetch products");
  const data = await res.json();
  return data.results; // ✅ فقط لیست محصولات
}

export async function getProductById(id) {
  const res = await fetch(`${BASE_URL}/market/products/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch product ${res.status}`);
  return await res.json(); // 👈 یک محصول کامل برمی‌گردونه
}


export async function getRelatedProducts(productId) {
  const response = await fetch(`${BASE_URL}/market/related_products/${productId}`);
  if (!response.ok) {
    throw new Error("خطا در واکشی محصولات مرتبط");
  }
  return await response.json();
}