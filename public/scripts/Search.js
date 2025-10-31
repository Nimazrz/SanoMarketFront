function setupDesktopSearch() {
  const searchBtnOpen = document.querySelector(".search-btn-open");
  const searchModal = document.querySelector(".search-modal");
  const searchInput = document.querySelector("#search-input");
  const resultList = document.querySelector("#search-result-list");
  const resultQuery = document.querySelector("#search-result-query");

  if (!searchBtnOpen || !searchModal || !searchInput || !resultList) return;

  // باز و بسته کردن مودال
  searchBtnOpen.addEventListener("click", (e) => {
    e.stopPropagation();
    searchModal.classList.toggle("active");
    searchInput.focus();
  });

  // بستن مودال با کلیک بیرون
  document.addEventListener("click", (e) => {
    if (!searchModal.contains(e.target) && !searchBtnOpen.contains(e.target)) {
      searchModal.classList.remove("active");
    }
  });

  // جستجو با debounce
  let debounceTimer;
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const query = searchInput.value.trim();

    if (!query) {
      resultList.innerHTML = "";
      resultQuery.textContent = "";
      return;
    }

    resultQuery.textContent = query;

    debounceTimer = setTimeout(() => {
      fetchSearchResults(query);
    }, 400);
  });

  // fetch نتایج از API
  async function fetchSearchResults(query) {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/market/products/?search=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("خطا در دریافت نتایج جستجو");

      const data = await res.json();
      renderResults(data.results || data);
    } catch (err) {
      console.error("Search error:", err);
      resultList.innerHTML = `<li class="text-red-500">خطا در دریافت نتایج</li>`;
    }
  }

  // نمایش نتایج
  function renderResults(results) {
    if (!results || !results.length) {
      resultList.innerHTML = `<li class="text-gray-400">نتیجه‌ای پیدا نشد</li>`;
      return;
    }
    resultList.innerHTML = results
      .map((item) => `
        <li onclick="window.location.href='/product/${item.id}/'" 
            class="flex items-center justify-between hover:text-blue-500 transition-colors cursor-pointer">
          <div class="flex items-center gap-x-2">
            ${item.images && item.images.length > 0 
              ? `<img src="${item.images[0].image_url}" class="w-10 h-10 rounded-md object-cover">` 
              : ""}
            <span>${item.name}</span>
          </div>
          ${
            item.offer_price
              ? `<span class="text-sm text-green-500">${item.offer_price.toLocaleString()} تومان</span>`
              : item.price
              ? `<span class="text-sm text-gray-400">${item.price.toLocaleString()} تومان</span>`
              : ""
          }
        </li>
      `).join("");
  }
}

// اجرا بعد از لود کامل صفحه
document.addEventListener("DOMContentLoaded", setupDesktopSearch);