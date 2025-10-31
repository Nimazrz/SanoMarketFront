
// وقتی صفحه لود میشه، سبد خرید را بارگذاری کن
document.addEventListener("DOMContentLoaded", loadCart);

// بارگذاری سبد خرید
async function loadCart() {
  const container = document.getElementById("cart-items-container");
  console.log("🟢 loadCart شروع شد");

  if (!container) {
    console.error("❌ عنصر با id='cart-items-container' پیدا نشد.");
    return;
  }

  container.innerHTML = "";

  try {
    const res = await fetch("http://localhost:8000/api/cart/cart/", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      console.error("❌ خطا در پاسخ API:", res.status);
      return;
    }

    const data = await res.json();
    const items = data.items || [];
    const totalPrice = data.total_price || 0;

    updateCartBadge(items.length);

    if (items.length === 0) {
      container.innerHTML = `
        <div class="text-center py-10 text-gray-500 dark:text-gray-300">
          <svg class="mx-auto mb-4 size-12 text-blue-500 opacity-60">
            <use href="#shopping-bag" />
          </svg>
          <p class="text-lg font-DanaMedium">سبد خرید شما خالی است</p>
        </div>
      `;
      return;
    }

    const baseUrl = "http://localhost:8000";
    let cartHTML = ""; // ✅ حتماً تعریفش کن قبل از استفاده

    cartHTML += `
      <div class="flex items-center justify-between pb-2 border-b-2 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-300">
        <div>
          <h2 class="font-DanaMedium text-lg">
            سبد خرید 
            <span class="text-sm text-gray-400 font-Dana">(${items.length} مورد)</span>
          </h2>
        </div>
        <div class="flex items-center gap-x-2">
          <button id="clear-cart-btn" title="خالی کردن سبد" class="text-red-500 text-sm hover:underline font-Dana">
            خالی کردن
          </button>
          <svg class="size-5 cursor-pointer close-cart mb-.5">
            <use href="#x-mark" />
          </svg>
        </div>
      </div>
      <div class="flex flex-col divide-y-2 divide-gray-200 dark:divide-gray-600 my-4">
    `;

    items.forEach((item) => {
      const product = item.product || {};
      let imageUrl = product.image_url || "/images/no-image.jpg";
      if (imageUrl && !imageUrl.startsWith("http")) {
        imageUrl = baseUrl + imageUrl;
      }

      const productName = product.name || "نامشخص";
      const productId = product.id || item.product_id;
      if (!productId) return;

      const quantity = item.quantity || 1;
      const total = item.total ?? (item.quantity * item.price);

      cartHTML += `
        <div class="grid grid-cols-12 gap-x-2 w-full py-4 cursor-pointer">
          <div class="col-span-4 w-24 h-20">
            <a href="product-details.html?id=${productId}">
              <img src="${imageUrl}" class="rounded-lg" alt="${productName}">
            </a>
          </div>
          <div class="col-span-8 flex flex-col justify-between">
            <a href="product-details.html?id=${productId}">
              <h2 class="font-DanaMedium line-clamp-2">${productName}</h2>
            </a>
            <div class="flex items-center justify-between gap-x-2 mt-2">
              <button class="w-20 flex items-center justify-between gap-x-1 rounded-lg border border-gray-200 dark:border-white/20 py-1 px-2">
                <svg class="size-4 increment text-green-600" data-product-id="${productId}">
                  <use href="#plus"></use>
                </svg>
                <input type="number" value="${quantity}" class="custom-input w-4 mr-2 text-sm" readonly>
                <svg class="size-4 decrement text-red-500" data-product-id="${productId}">
                  <use href="#minus"></use>
                </svg>
              </button>
              <p class="text-lg text-blue-500 dark:text-blue-400 font-DanaMedium">
                ${total.toLocaleString()} <span class="font-Dana text-sm">تومان</span>
              </p>
            </div>
          </div>
        </div>
      `;
    });

    cartHTML += `
      </div>
      <div class="w-[90%] fixed bottom-2 flex items-center justify-between border-t-2 border-gray-200 dark:border-gray-600 pt-4">
        <div>
          <p class="text-gray-500 dark:text-gray-300 text-sm">مبلغ قابل پرداخت :</p>
          <p class="text-lg text-blue-500 dark:text-blue-400 font-DanaDemiBold">
            ${totalPrice.toLocaleString()} <span class="font-Dana text-sm">تومان</span>
          </p>
        </div>
        <a href="shopping-cart.html" class="py-2 px-4 bg-blue-600 flex-center hover:bg-blue-700 transition-all rounded-lg text-gray-200">
          ثبت سفارش
        </a>
      </div>
    `;

    container.innerHTML = cartHTML;
    setupQuantityButtons();

    // ✅ بعد از رندر HTML، دکمه "خالی کردن" رو پیدا کن
    document.getElementById("clear-cart-btn")?.addEventListener("click", async () => {
      if (!confirm("آیا مطمئن هستید که می‌خواهید سبد خرید را خالی کنید؟")) return;

      try {
        const res = await fetch("http://localhost:8000/api/cart/cart/clear/", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" }
        });

        if (res.ok) {
          alert("سبد خرید با موفقیت خالی شد");
          await loadCart?.();
        } else {
          alert("❌ خطا در خالی کردن سبد");
        }
      } catch (err) {
        console.error("❌ خطای ارتباط:", err);
        alert("ارتباط با سرور برقرار نشد");
      }
    });

  } catch (error) {
    console.error("❌ خطا در دریافت سبد خرید:", error);
  }
}
// اضافه کردن 
function setupAddToCartButtons() {
  document.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const productId = btn.dataset.productId || btn.getAttribute("data-product-id");
      if (!productId) return;

      try {
        const res = await fetch("http://localhost:8000/api/cart/cart/add/", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: parseInt(productId, 10) }),
        });

        const data = await res.json();

        if (res.ok) {
          console.log("✅ محصول با موفقیت اضافه شد");
          await loadCart();
        } else {
          alert(data.message || "خطایی در افزودن محصول رخ داده است");
        }
      } catch (err) {
        console.error("❌ خطای ارتباط:", err);
        alert("ارتباط با سرور برقرار نشد");
      }
    });
  });
}
//  تغییر تعداد
function setupQuantityButtons() {
  const incrementButtons = document.querySelectorAll(".increment");
  const decrementButtons = document.querySelectorAll(".decrement");

  incrementButtons.forEach((btn) => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const productId = newBtn.dataset.productId;
      if (!productId) return;

      try {
        const res = await fetch("http://localhost:8000/api/cart/cart/add/", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: parseInt(productId, 10) }),
        });

        const data = await res.json();

        if (res.ok) {
          await loadCart?.();
        } else {
          alert(data.message || "خطا در افزایش تعداد");
        }
      } catch (err) {
        console.error("❌ خطای ارتباط:", err);
      }
    });
  });

  decrementButtons.forEach((btn) => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const productId = newBtn.dataset.productId;
      if (!productId) return;

      try {
        const res = await fetch("http://localhost:8000/api/cart/cart/decrease/", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: parseInt(productId, 10) }),
        });

        if (res.ok) {
          await loadCart?.();
        } else {
          console.error("❌ خطا در کاهش:", await res.text());
        }
      } catch (err) {
        console.error("❌ خطای ارتباط:", err);
      }
    });
  });
}

// بروزرسانی نشانگر تعداد سبد خرید
function updateCartBadge(count) {
  const badge = document.getElementById("cart-badge-count");
  if (!badge) return;

  badge.parentElement.style.display = count > 0 ? "flex" : "none";
  badge.textContent = count;
  console.log("🔔 badge تعداد:", count);
}