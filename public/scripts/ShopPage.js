// public/scripts/ShopPage.js
import { getProducts } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  checkUserStatus();
  loadProducts();
  setupSortHandlers();
  setupMobileSortHandlers();
  setupSearchHandler();
  handleSearch();
});

async function checkUserStatus() {
  const loginBtn = document.getElementById("login-btn");
  const accountBtn = document.getElementById("account-btn");
  const logoutBtn = document.getElementById("logout-btn");

  const token = localStorage.getItem("access");

  if (!token) {
    loginBtn?.classList.remove("hidden");
    accountBtn?.classList.add("hidden");
    return;
  }

  try {
    const res = await fetch("http://localhost:8000/api/account/auth/user/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      loginBtn?.classList.add("hidden");
      accountBtn?.classList.remove("hidden");
    } else {
      localStorage.removeItem("access");
      loginBtn?.classList.remove("hidden");
      accountBtn?.classList.add("hidden");
    }
  } catch (err) {
    console.error("خطا در بررسی توکن:", err);
    loginBtn?.classList.remove("hidden");
    accountBtn?.classList.add("hidden");
  }

  logoutBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.location.href = "/login.html";
  });
}

function setupSearchHandler() {
  const searchInput = document.getElementById("main-search-input");
  const resultBox = document.querySelector(".search-modal ul");
  const resultTitle = document.querySelector(".search-modal span .text-blue-400");
  const searchModal = document.querySelector(".search-modal");

  if (!searchInput || !resultBox || !resultTitle) return;

  searchInput.addEventListener("input", async () => {
    const query = searchInput.value.trim();
    if (!query) {
      resultBox.innerHTML = "";
      resultTitle.textContent = "";
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/market/products/?search=${encodeURIComponent(query)}`);
      const data = await response.json();

      resultTitle.textContent = query;
      resultBox.innerHTML = "";

      if (data.results.length === 0) {
        resultBox.innerHTML = `<li><p class='text-sm text-gray-500'>موردی یافت نشد</p></li>`;
        return;
      }

      data.results.slice(0, 5).forEach(product => {
        const li = document.createElement("li");
        li.innerHTML = `
          <a href="product-details.html?id=${product.id}" class="flex items-center gap-x-2">
              <svg class="size-5"><use href="#search" /></svg>
              ${product.name}
          </a>
          <svg class="size-4"><use href="#arrow-up-right" /></svg>
        `;
        resultBox.appendChild(li);
      });

    } catch (error) {
      console.error("خطا در جستجو:", error);
    }
  });
}

async function loadProducts(page = 1, ordering = "", searchQuery = "") {
  const container = document.getElementById("product-list");
  const pagination = document.getElementById("pagination");

  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get("category");

  try {
    let url = `http://localhost:8000/api/market/products/?page=${page}&ordering=${ordering}`;

    if (category) {
      url += `&category=${category}`;
    }
    if (searchQuery) {
      url += `&search=${encodeURIComponent(searchQuery)}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    const totalCountEl = document.getElementById("product-count");
    if (totalCountEl) {
      const faNumber = new Intl.NumberFormat("fa-IR").format(data.count);
      totalCountEl.textContent = `${faNumber} کالا`;
    }
    container.innerHTML = "";

    data.results.forEach(product => {
      const image1 = product.images?.[0]?.image_url
        ? product.images[0].image_url
        : "https://via.placeholder.com/300x300?text=No+Image";

      const image2 = product.images?.[1]?.image_url ?? image1;
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
                            <p>${product.average_rating ?? "5.0"}</p>
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

    renderPagination(data.count, page, ordering);

  } catch (err) {
    container.innerHTML = `<p class="text-red-500">خطا در بارگذاری محصولات</p>`;
    console.error(err);
  }
}

function renderPagination(totalItems, currentPage, ordering = "") {
  const pagination = document.getElementById("pagination");
  const pageSize = 10;
  const totalPages = Math.ceil(totalItems / pageSize);

  let html = '<ul class="flex items-center gap-x-3 child:flex child:items-center child:justify-center child:w-8 child:h-8 child:cursor-pointer child:shadow child:rounded-lg child:transition-all child:duration-300">';

  if (currentPage > 1) {
    html += `<li class="bg-white hover:bg-gray-800 hover:text-white">
      <a href="#" data-page="${currentPage - 1}" data-ordering="${ordering}">
        <svg class="size-5 rotate-180"><use href="#chevron-left"></use></svg>
      </a></li>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    html += `<li class="${i === currentPage ? 'text-white bg-blue-500' : 'bg-white hover:bg-blue-500 hover:text-white'}">
      <a href="#" data-page="${i}" data-ordering="${ordering}">${i}</a>
    </li>`;
  }

  if (currentPage < totalPages) {
    html += `<li class="bg-white hover:bg-gray-800 hover:text-white">
      <a href="#" data-page="${currentPage + 1}" data-ordering="${ordering}">
        <svg class="size-5"><use href="#chevron-left"></use></svg>
      </a></li>`;
  }

  html += '</ul>';
  pagination.innerHTML = html;

  pagination.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const page = parseInt(e.target.closest("a").dataset.page);
      const ordering = e.target.closest("a").dataset.ordering;
      if (page) loadProducts(page, ordering);
    });
  });
}

function setupSortHandlers() {
  const sortOptions = document.querySelectorAll("#sort-options li");
  sortOptions.forEach(option => {
    option.addEventListener("click", () => {
      const ordering = option.getAttribute("data-order");

      sortOptions.forEach(o => {
        o.classList.remove("text-blue-500");
        o.classList.add("text-gray-400");
      });
      option.classList.remove("text-gray-400");
      option.classList.add("text-blue-500");

      loadProducts(1, ordering);
    });
  });
}

function setupMobileSortHandlers() {
  const sortOptions = document.querySelectorAll("#mobile-sort-options li");

  sortOptions.forEach(option => {
    option.addEventListener("click", () => {
      const ordering = option.getAttribute("data-order");

      sortOptions.forEach(o => o.classList.remove("text-blue-500"));
      option.classList.add("text-blue-500");

      loadProducts(1, ordering);
    });
  });
}

function handleSearch() {
  const input = document.getElementById("main-search-input");
  const resultContainer = document.querySelector(".search-modal ul");
  const resultTitle = document.querySelector(".search-modal .text-blue-400");
  const modal = document.querySelector(".search-modal");

  if (!input || !resultContainer || !resultTitle || !modal) return;

  let timeout = null;

  input.addEventListener("input", () => {
    clearTimeout(timeout);
    const query = input.value.trim();

    if (!query) {
      modal.classList.remove("active");
      resultContainer.innerHTML = "";
      resultTitle.textContent = "";
      return;
    }

    timeout = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/market/products/?search=${encodeURIComponent(query)}`);
        const data = await res.json();

        modal.classList.add("active");
        resultTitle.textContent = query;
        resultContainer.innerHTML = "";

        if (!data.results.length) {
          resultContainer.innerHTML = `<li class="text-gray-400 text-sm">نتیجه‌ای یافت نشد</li>`;
          return;
        }

        data.results.forEach(product => {
          const li = document.createElement("li");
          li.innerHTML = `
            <a href="product-details.html?id=${product.id}" class="flex items-center gap-x-2">
              <svg class="size-5"><use href="#search" /></svg>
              ${product.name}
            </a>
            <svg class="size-4"><use href="#arrow-up-right" /></svg>
          `;
          resultContainer.appendChild(li);
        });
      } catch (err) {
        console.error("خطا در جستجو:", err);
        resultContainer.innerHTML = `<li class="text-red-500 text-sm">خطا در دریافت نتایج</li>`;
      }
    }, 400); // دی‌بونس برای کاهش تعداد درخواست‌ها
  });
}