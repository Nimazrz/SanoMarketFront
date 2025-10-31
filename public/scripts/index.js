document.addEventListener("DOMContentLoaded", loadCart);
document.addEventListener("DOMContentLoaded", async () => {
  await renderPopularCategories(); 
  await loadLatestProducts();
  await loadBestSellingProducts();
  setupQuantityButtons();
  setupAddToCartButtons();
  
});



async function renderPopularCategories() {
  const container = document.getElementById("popular-categories");
  if (!container) return;

  try {
    const res = await fetch("http://localhost:8000/api/market/categories/");
    const categories = await res.json();

    const imageMap = {
      electronics: "5.png",
      digital_goods: "6.png",
      home_appliances: "7.png",
      cosmetics: "8.png",
      stationery: "9.png",
      gift_card: "10.png",
      tools: "11.png"
    };

    container.innerHTML = "";

    categories.forEach((cat, index) => {
      const imgName = imageMap[cat.key] || "default.png";

      const itemHTML = `
        <a href="shop.html?category=${cat.key}" class="group flex-shrink-0 flex flex-col items-center w-[100px] lg:w-[120px] cursor-pointer mr-6 p-2">
          <img src="./images/category/${imgName}"
              class="w-[100px] h-[100px] lg:w-[120px] lg:h-[120px] object-cover group-hover:grayscale group-hover:opacity-90 duration-300 rounded-lg"
              alt="${cat.label}" />
          <p class="pt-2 text-sm lg:text-lg line-clamp-1 text-center">
              ${cat.label}
          </p>
        </a>
      `;
      container.insertAdjacentHTML("beforeend", itemHTML);
    });

  } catch (err) {
    console.error("خطا در دریافت دسته‌بندی‌ها:", err);
    container.innerHTML = `<p class="text-red-500 text-sm">خطا در بارگذاری دسته‌بندی‌ها</p>`;
  }
}

async function loadLatestProducts() {
  try {
    const response = await fetch("http://localhost:8000/api/market/products/?limit=10&ordering=-created_at");
    const data = await response.json();

    const swiperWrapper = document.querySelector(".LatestProducts .swiper-wrapper");
    if (!swiperWrapper) return;

    swiperWrapper.innerHTML = "";

    data.results.forEach(product => {
      const discountPercent = product.offer_price
        ? Math.round(100 - (product.offer_price / product.price) * 100)
        : null;

      const productHTML = `
        <div class="swiper-slide product-card group">
          <div class="product-card_header">
            <div class="flex items-center gap-x-2">
              <div class="tooltip">
                <button class="add-to-cart-btn rounded-full p-1.5 app-border app-hover" data-product-id="${product.id}" aria-label="افزودن به سبد خرید">
                  <svg class="size-4"><use href="#shopping-cart"></use></svg>
                </button>
                <div class="tooltiptext">سبد خرید</div>
              </div>
              <div class="tooltip">
                <button class="rounded-full p-1.5 app-border app-hover">
                  <svg class="size-4"><use href="#heart"></use></svg>
                </button>
                <div class="tooltiptext">علاقه مندی</div>
              </div>
              <div class="tooltip">
                <button class="rounded-full p-1.5 app-border app-hover">
                  <svg class="size-4"><use href="#arrows-up-down"></use></svg>
                </button>
                <div class="tooltiptext">مقایسه</div>
              </div>
            </div>
            ${discountPercent ? `<span class="product-card_badge">${discountPercent}% تخفیف‌</span>` : ''}
          </div>

          <a href="product-details.html?id=${product.id}" class="relative block">
            <img class="product-card_img group-hover:opacity-0 absolute top-0 left-0 w-full h-full object-cover" src="${product.images && product.images[0]?.image_url || './images/products/default.png'}" alt="${product.name}" />
            <img class="product-card_img opacity-0 group-hover:opacity-100 w-full h-full object-cover" src="${product.images && product.images[1]?.image_url || product.images[0]?.image_url || './images/products/default.png'}" alt="${product.name}" />
          </a>

          <div class="space-y-2">
            <a href="product-details.html?id=${product.id}" class="product-card_link">${product.name}</a>
            <div class="product-card_price-wrapper">
              <div class="product-card_rate">
                <span class="flex items-center gap-x-0.5">
                  <svg class="size-4 text-blue-500 mb-0.5"><use href="#rocket"></use></svg>
                  <p class="text-xs">ارسال امروز</p>
                </span>
                <span class="text-gray-400 flex items-center text-sm gap-x-0.5">
                  <p>${product.rating || 5.0}</p>
                  <svg class="size-4 mb-1"><use href="#star"></use></svg>
                </span>
              </div>
              <div class="product-card_price">
                ${product.offer_price ? `<del>${product.price.toLocaleString()} <h6>تومان</h6></del>` : ''}
                <p>${(product.offer_price || product.price).toLocaleString()}</p>
                <span>تومان</span>
              </div>
            </div>
          </div>
        </div>
      `;

      swiperWrapper.insertAdjacentHTML("beforeend", productHTML);
    });

    if (window.latestProductsSwiper) {
      window.latestProductsSwiper.update();
    } else {
      window.latestProductsSwiper = new Swiper(".LatestProducts", {
        slidesPerView: 3,
        spaceBetween: 20,
        navigation: {
          nextEl: ".LatestProducts-next-slide",
          prevEl: ".LatestProducts-prev-slide",
        },
        breakpoints: {
          640: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        },
      });
    }

  } catch (error) {
    console.error("خطا در بارگذاری محصولات جدید:", error);
  }
}

async function loadBestSellingProducts() {
  try {
    const response = await fetch("http://localhost:8000/api/market/products/?limit=10&ordering=-sales_count");
    const data = await response.json();

    const swiperWrapper = document.querySelector(".BestSelling .swiper-wrapper");
    if (!swiperWrapper) return;

    swiperWrapper.innerHTML = "";

    data.results.forEach(product => {
      const discountPercent = product.offer_price
        ? Math.round(100 - (product.offer_price / product.price) * 100)
        : null;

      const productHTML = `
        <div class="swiper-slide product-card group">
          <div class="product-card_header">
            <div class="flex items-center gap-x-2">
              <div class="tooltip">
                <button class="add-to-cart-btn rounded-full p-1.5 app-border app-hover" data-product-id="${product.id}" aria-label="افزودن به سبد خرید">
                  <svg class="size-4"><use href="#shopping-cart"></use></svg>
                </button>
                <div class="tooltiptext">سبد خرید</div>
              </div>
              <div class="tooltip">
                <button class="rounded-full p-1.5 app-border app-hover">
                  <svg class="size-4"><use href="#heart"></use></svg>
                </button>
                <div class="tooltiptext">علاقه مندی</div>
              </div>
              <div class="tooltip">
                <button class="rounded-full p-1.5 app-border app-hover">
                  <svg class="size-4"><use href="#arrows-up-down"></use></svg>
                </button>
                <div class="tooltiptext">مقایسه</div>
              </div>
            </div>
            ${discountPercent ? `<span class="product-card_badge">${discountPercent}% تخفیف‌</span>` : ''}
          </div>

          <a href="product-details.html?id=${product.id}" class="relative block">
            <img class="product-card_img group-hover:opacity-0 absolute top-0 left-0 w-full h-full object-cover" src="${product.images && product.images[0]?.image_url || './images/products/default.png'}" alt="${product.name}" />
            <img class="product-card_img opacity-0 group-hover:opacity-100 w-full h-full object-cover" src="${product.images && product.images[1]?.image_url || product.images[0]?.image_url || './images/products/default.png'}" alt="${product.name}" />
          </a>

          <div class="space-y-2">
            <a href="product-details.html?id=${product.id}" class="product-card_link">${product.name}</a>
            <div class="product-card_price-wrapper">
              <div class="product-card_rate">
                <span class="flex items-center gap-x-0.5">
                  <svg class="size-4 text-blue-500 mb-0.5"><use href="#rocket"></use></svg>
                  <p class="text-xs">ارسال امروز</p>
                </span>
                <span class="text-gray-400 flex items-center text-sm gap-x-0.5">
                  <p>${product.rating || 5.0}</p>
                  <svg class="size-4 mb-1"><use href="#star"></use></svg>
                </span>
              </div>
              <div class="product-card_price">
                ${product.offer_price ? `<del>${product.price.toLocaleString()} <h6>تومان</h6></del>` : ''}
                <p>${(product.offer_price || product.price).toLocaleString()}</p>
                <span>تومان</span>
              </div>
            </div>
          </div>
        </div>
      `;

      swiperWrapper.insertAdjacentHTML("beforeend", productHTML);
    });

    if (window.bestSellingSwiper) {
      window.bestSellingSwiper.update();
    } else {
      window.bestSellingSwiper = new Swiper(".BestSelling", {
        slidesPerView: 3,
        spaceBetween: 20,
        navigation: {
          nextEl: ".BestSelling-next-slide",
          prevEl: ".BestSelling-prev-slide",
        },
        breakpoints: {
          640: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        },
      });
    }

  } catch (error) {
    console.error("خطا در بارگذاری محصولات پرفروش:", error);
  }
}

