// public/scripts/ShopPage.js
import { getProducts } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
});

async function loadProducts(page = 1) {
  const container = document.getElementById("product-list");
  const pagination = document.getElementById("pagination");

  try {
    const response = await fetch(`http://localhost:8000/api/market/products/?page=${page}`);
    const data = await response.json();
    container.innerHTML = "";

    data.results.forEach(product => {
      const image1 = product.images?.[0]?.image_url
        ? product.images[0].image_url
        : "https://via.placeholder.com/300x300?text=No+Image";

      const image2 = product.images?.[1]?.image_url
        ? product.images[1].image_url
        : image1;

      const price = product.offer_price ?? product.price;
      const hasDiscount = !!product.offer;

      const productHTML = `
        <div class="product-card group">
            <div class="product-card_header">
                <div class="flex items-center gap-x-2">
                    <div class="tooltip">
                        <button class="rounded-full p-1.5 app-border app-hover">
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
                ${hasDiscount ? `<span class="product-card_badge">${product.offer}% تخفیف‌</span>` : ''}
            </div>

            <a href="product-details.html?id=${product.id}">
                <img class="product-card_img group-hover:opacity-0 absolute" src="${image1}" alt="${product.name}">
                <img class="product-card_img opacity-0 group-hover:opacity-100" src="${image2}" alt="${product.name}">
            </a>

            <div class="space-y-2">
                <a href="product-details.html?id=${product.id}" class="product-card_link">
                    ${product.name}
                </a>

                <div class="product-card_price-wrapper">
                    <div class="product-card_rate">
                        <span class="flex items-center gap-x-0.5">
                            <svg class="size-4 text-blue-500 mb-0.5"><use href="#rocket"></use></svg>
                            <p class="text-xs">ارسال امروز</p>
                        </span>
                        <span class="text-gray-400 flex items-center text-sm gap-x-0.5">
                            <p>5.0</p>
                            <svg class="size-4 mb-1"><use href="#star"></use></svg>
                        </span>
                    </div>
                    <div class="product-card_price">
                        ${product.offer_price ? `<del>${product.price.toLocaleString()} <h6>تومان</h6></del>` : ''}
                        <p>${price.toLocaleString()}</p>
                        <span>تومان</span>
                    </div>
                </div>
            </div>
        </div>
      `;

      container.insertAdjacentHTML("beforeend", productHTML);
    });

    renderPagination(data.count, page);

  } catch (err) {
    container.innerHTML = `<p class="text-red-500">خطا در بارگذاری محصولات</p>`;
    console.error(err);
  }
}

function renderPagination(totalItems, currentPage) {
  const pagination = document.getElementById("pagination");
  const pageSize = 10;
  const totalPages = Math.ceil(totalItems / pageSize);

  let html = '<ul class="flex items-center gap-x-3 child:flex child:items-center child:justify-center child:w-8 child:h-8 child:cursor-pointer child:shadow child:rounded-lg child:transition-all child:duration-300">';

  if (currentPage > 1) {
    html += `<li class="bg-white hover:bg-gray-800 hover:text-white">
      <a href="#" data-page="${currentPage - 1}">
        <svg class="size-5 rotate-180"><use href="#chevron-left"></use></svg>
      </a></li>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    html += `<li class="${i === currentPage ? 'text-white bg-blue-500' : 'bg-white hover:bg-blue-500 hover:text-white'}">
      <a href="#" data-page="${i}">${i}</a>
    </li>`;
  }

  if (currentPage < totalPages) {
    html += `<li class="bg-white hover:bg-gray-800 hover:text-white">
      <a href="#" data-page="${currentPage + 1}">
        <svg class="size-5"><use href="#chevron-left"></use></svg>
      </a></li>`;
  }

  html += '</ul>';
  pagination.innerHTML = html;

  pagination.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const page = parseInt(e.target.closest("a").dataset.page);
      if (page) loadProducts(page);
    });
  });
}