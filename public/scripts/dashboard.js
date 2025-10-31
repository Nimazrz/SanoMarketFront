document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("access");
  console.log("Token:", token);

  if (!token) {
    window.location.href = "./login.html";
    return;
  }

  const userNameEl = document.getElementById("user-name");
  const userPhoneEl = document.getElementById("user-phone");
  const userNameMobileEl = document.getElementById("user-name-mobile");
  const userPhoneMobileEl = document.getElementById("user-phone-mobile");
  const tableBody = document.getElementById("orders-table-body");
  const paginationEl = document.getElementById("pagination");
  let userData = null;
  let editingAddressId = null;

  // نمایش/مخفی کردن منوی کاربری در موبایل
  document.querySelector('.open-user-menu').addEventListener('click', function() {
    document.querySelector('.user-menu').classList.toggle('hidden');
  });

  document.querySelector('.close-user-menu').addEventListener('click', function() {
    document.querySelector('.user-menu').classList.add('hidden');
  });

  // بارگذاری اولیه آدرس‌ها و پروفایل
  loadUserAddresses();
  loadUserProfile();

  async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem("access");
    if (!token) {
      window.location.href = "./login.html";
      return;
    }

    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    try {
      const res = await fetch(url, options);
      if (res.status === 401) {
        const newToken = await refreshToken();
        options.headers.Authorization = `Bearer ${newToken}`;
        return await fetch(url, options);
      }
      if (!res.ok && res.status !== 204) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`خطا در درخواست: ${res.statusText}, جزئیات: ${JSON.stringify(errorData)}`);
      }
      return res.status === 204 ? null : await res.json();
    } catch (err) {
      console.error(`❌ خطا در ${url}:`, err);
      throw err;
    }
  }

  async function refreshToken() {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) throw new Error("رفرش توکن در دسترس نیست");
      const res = await fetch("http://localhost:8000/api/token/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (!res.ok) throw new Error("خطا در رفرش توکن");
      const data = await res.json();
      localStorage.setItem("access", data.access);
      return data.access;
    } catch (err) {
      console.error("❌ خطا در رفرش توکن:", err);
      window.location.href = "./login.html";
      throw err;
    }
  }

  async function loadUserProfile() {
    if (!userNameEl && !userPhoneEl && !userNameMobileEl && !userPhoneMobileEl) return;

    try {
      const user = await fetchWithAuth("http://localhost:8000/api/account/profile/");
      userData = user;
      const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
      if (userNameEl) userNameEl.textContent = fullName;
      if (userPhoneEl) userPhoneEl.textContent = user.phone || "";
      if (userNameMobileEl) userNameMobileEl.textContent = fullName;
      if (userPhoneMobileEl) userPhoneMobileEl.textContent = user.phone || "";
      console.log("User Data:", user);
    } catch (err) {
      console.error("❌ خطا در دریافت اطلاعات کاربر:", err);
    }
  }

  async function loadUserAddresses() {
    const addressListEl = document.getElementById("user-address-list");
    if (!token || !addressListEl) return;

    try {
      const data = await fetchWithAuth("http://localhost:8000/api/account/address/");
      const addresses = data.results || [];

      if (!Array.isArray(addresses) || addresses.length === 0) {
        addressListEl.innerHTML = `<li class="text-sm text-gray-400">هیچ آدرسی ثبت نشده است.</li>`;
        return;
      }

      addressListEl.innerHTML = addresses
        .map((address) => {
          const recipient = userData ? `${userData.first_name || ""} ${userData.last_name || ""}`.trim() : "نامشخص";
          return `
            <li class="relative w-full border border-blue-300 dark:border-blue-400 p-4 rounded-lg" data-address-id="${address.id}">
              <span class="flex items-center gap-x-1 text-blue-500 dark:text-blue-400">
                <svg class="size-6">
                  <use href="#map"></use>
                </svg>
                <h2 class="font-DanaMedium">نام آدرس</h2>
              </span>
              <div class="space-y-1.5 text-gray-600 dark:text-gray-300 mt-3 mr-2">
                <p>استان ${address.province} - ${address.address}</p>
                <p>کد پستی: ${address.postal_code}</p>
                <p>شهر: ${address.city}</p>
                <p>گیرنده: ${recipient}</p>
              </div>
              <span class="absolute left-4 bottom-3 flex items-center gap-x-4 child:cursor-pointer">
                <svg class="size-6 text-blue-500 edit-address" data-address-id="${address.id}">
                  <use href="#edit"></use>
                </svg>
                <svg class="size-6 text-red-500 delete-address" data-address-id="${address.id}">
                  <use href="#trash"></use>
                </svg>
              </span>
            </li>`;
        })
        .join("");

      document.querySelectorAll(".edit-address").forEach(button => {
        button.addEventListener("click", (e) => {
          const addressId = e.target.closest(".edit-address").dataset.addressId;
          const address = addresses.find(addr => addr.id == addressId);
          if (address) {
            editingAddressId = addressId;
            document.getElementById("address-province").value = address.province;
            document.getElementById("address-city").value = address.city;
            document.getElementById("address-postal").value = address.postal_code;
            document.getElementById("address-detail").value = address.address;
            document.getElementById("submit-new-address").textContent = "ویرایش آدرس";
            document.getElementById("new-address-form-container").classList.remove("hidden");
          }
        });
      });

      document.querySelectorAll(".delete-address").forEach(button => {
        button.addEventListener("click", async (e) => {
          const addressId = e.target.closest(".delete-address").dataset.addressId;
          if (confirm("آیا مطمئن هستید که می‌خواهید این آدرس را حذف کنید؟")) {
            try {
              await fetchWithAuth(`http://localhost:8000/api/account/address/${addressId}/`, {
                method: "DELETE",
              });
              alert("✅ آدرس با موفقیت حذف شد");
              loadUserAddresses();
            } catch (err) {
              console.error("❌ خطا در حذف آدرس:", err);
              alert("خطا در حذف آدرس. لطفاً دوباره تلاش کنید.");
            }
          }
        });
      });
    } catch (err) {
      console.error("❌ خطا در دریافت آدرس‌ها:", err);
      addressListEl.innerHTML = `<li class="text-sm text-red-500">خطا در بارگذاری آدرس‌ها</li>`;
    }
  }

  async function fetchProduct(productId) {
    try {
      const productData = await fetchWithAuth(`http://localhost:8000/api/market/products/${productId}/`);
      return productData;
    } catch (err) {
      console.error(`❌ خطا در دریافت محصول ${productId}:`, err);
      throw err;
    }
  }

  async function fetchOrderDetails(orderId) {
    try {
      const orderData = await fetchWithAuth(`http://localhost:8000/api/orders/orders/${orderId}/`);
      return orderData;
    } catch (err) {
      console.error(`❌ خطا در دریافت جزئیات سفارش ${orderId}:`, err);
      throw err;
    }
  }

  async function updateOrder(orderId, items) {
    try {
      const payload = {
        items: items.map(item => ({
          product: item.product,
          quantity: item.quantity
        }))
      };
      await fetchWithAuth(`http://localhost:8000/api/orders/orders/${orderId}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      alert("✅ سفارش با موفقیت به‌روزرسانی شد");
      loadOrders();
    } catch (err) {
      console.error("❌ خطا در به‌روزرسانی سفارش:", err);
      alert("خطا در به‌روزرسانی سفارش. لطفاً دوباره تلاش کنید.");
    }
  }

  async function loadOrders(url = "http://localhost:8000/api/orders/orders/") {
    try {
      if (tableBody) {
        tableBody.style.overflowX = "hidden";
        tableBody.parentElement.style.width = "100%";
        tableBody.parentElement.style.overflowX = "hidden";
      }

      const ordersResponse = await fetchWithAuth(url);

      const ordersCountEl = document.getElementById("orders-count");
      if (ordersCountEl) {
        ordersCountEl.textContent = `${ordersResponse.count || 0} سفارش`;
      }
    
      const ordersArray = ordersResponse.results || [];

      if (ordersArray.length === 0) {
        tableBody.innerHTML = `
          <tr><td colspan="5" class="text-center py-4 text-gray-500">
            شما هنوز سفارشی ثبت نکرده‌اید.
          </td></tr>
        `;
        paginationEl.innerHTML = "";
        return;
      }

      const baseUrl = "http://localhost:8000";
      const statusMap = {
        awaiting_payment: "در انتظار پرداخت",
        paid: "پرداخت شده",
        shipping: "در حال ارسال",
        delivered: "تحویل داده شده",
        cancelled: "لغو شده",
        returned: "مرجوع شده",
      };

      tableBody.innerHTML = "";

      for (const order of ordersArray) {
        if (!order.items || order.items.length === 0) continue;

        const sortedItems = order.items.sort((a, b) => a.id - b.id);

        const productImagesHtmlArray = await Promise.all(
          sortedItems.slice(0, 1).map(async (item) => {
            try {
              const productData = await fetchProduct(item.product);
              const firstImage = productData.images?.[0]?.image_url;

              const imageUrl = firstImage
                ? (firstImage.startsWith("http") ? firstImage : baseUrl + firstImage)
                : "./images/svg/user.png";

              return `
                <img 
                  src="${imageUrl}" 
                  alt="${productData.name || "محصول"}"
                  title="${productData.name || "محصول"}"
                  style="width: 32px; height: 32px; border-radius: 4px; border: 1px solid #d1d5db; object-fit: cover;"
                >
              `;
            } catch {
              return `<div style="width: 32px; height: 32px; border-radius: 4px; background-color: #e5e7eb; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; color: #9ca3af;">❌</div>`;
            }
          })
        );

        const productImagesHtml = productImagesHtmlArray.join("");
        const date = order.created ? new Date(order.created).toLocaleDateString("fa-IR") : "-";
        const status = statusMap[order.status] || "نامشخص";
        const totalCostFormatted = typeof order.total_price === "number" ? order.total_price.toLocaleString() : "0";

        const row = document.createElement("tr");
        row.className = "bg-white border-b dark:bg-gray-800 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700";
        row.innerHTML = `
          <td class="px-6 py-4 font-DanaMedium" style="max-width: 150px; overflow: hidden; white-space: nowrap;">${order.first_name} ${order.last_name}</td>
          <td class="px-6 py-4" style="max-width: 100px; overflow: hidden; white-space: nowrap;">${date}</td>
          <td class="px-6 py-4" style="max-width: 120px; overflow: hidden; white-space: nowrap;">${totalCostFormatted} تومان</td>
          <td class="px-6 py-4" style="max-width: 100px; overflow: hidden; white-space: nowrap;">${status}</td>
          <td class="px-6 py-4" style="max-width: 80px; overflow-x: hidden; white-space: nowrap;">
            <div class="flex items-center gap-2" style="max-width: 80px; overflow-x: hidden; flex-wrap: nowrap;">
              ${productImagesHtml}
            </div>
          </td>
        `;

        let isDetailVisible = false;
        let detailRow;

        row.addEventListener("click", async () => {
          if (isDetailVisible) {
            detailRow.remove();
            isDetailVisible = false;
            return;
          }

          try {
            const fullOrder = await fetchOrderDetails(order.id);
            let modifiedItems = [...fullOrder.items]; // Keep track of modified items

            const itemDetailsHtmlArray = await Promise.all(
              fullOrder.items.map(async (item, index) => {
                try {
                  const productData = await fetchProduct(item.product);
                  const firstImage = productData.images?.[0]?.image_url;
                  const imageUrl = firstImage
                    ? (firstImage.startsWith("http") ? firstImage : baseUrl + firstImage)
                    : "./images/svg/user.png";

                  let itemControls = "";
                  if (fullOrder.status === "awaiting_payment") {
                    itemControls = `
                      <div class="flex items-center gap-2 mt-2">
                        <button class="decrease-qty bg-gray-200 text-gray-800 px-2 py-1 rounded" data-index="${index}">-</button>
                        <span class="quantity text-sm">${item.quantity}</span>
                        <button class="increase-qty bg-gray-200 text-gray-800 px-2 py-1 rounded" data-index="${index}">+</button>
                        <button class="delete-item bg-red-500 text-white px-2 py-1 rounded text-sm" data-index="${index}">حذف</button>
                      </div>
                    `;
                  }

                  return `
                    <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border flex items-center gap-4">
                      <a href="./product-details.html?id=${productData.id}">
                        <img src="${imageUrl}" alt="${productData.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid #d1d5db;" />
                      </a>
                      <div>
                        <a href="./product-details.html?id=${productData.id}" class="font-medium text-gray-800 dark:text-white hover:text-blue-500">
                          ${productData.name}
                        </a>
                        <div class="text-sm text-gray-500 dark:text-gray-400">تعداد: <span class="quantity">${item.quantity}</span></div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">قیمت: ${item.price.toLocaleString()} تومان</div>
                        ${itemControls}
                      </div>
                    </div>
                  `;
                } catch {
                  return `<div class="text-red-500 text-sm my-2">❌ خطا در دریافت اطلاعات محصول</div>`;
                }
              })
            );

            const itemDetailsHtml = itemDetailsHtmlArray.join("");

            let saveButton = "";
            if (fullOrder.status === "awaiting_payment") {
              saveButton = `
                <button class="save-changes bg-blue-500 text-white px-4 py-2 rounded mt-4">ذخیره تغییرات</button>
              `;
            }

            detailRow = document.createElement("tr");
            detailRow.innerHTML = `
              <td colspan="5" class="bg-gray-100 dark:bg-gray-900 px-6 py-4">
                <div class="mb-3 text-base font-bold text-gray-800 dark:text-white">
                  🧾 شماره سفارش: ${fullOrder.id}
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  ${itemDetailsHtml}
                </div>
                <div class="text-sm text-gray-800 dark:text-gray-300 space-y-1">
                  <div>👤 نام گیرنده: ${fullOrder.first_name} ${fullOrder.last_name}</div>
                  <div>📞 شماره تماس: ${fullOrder.phone}</div>
                  <div>📍 آدرس: ${fullOrder.address.province}، ${fullOrder.address.city}، ${fullOrder.address.address}، ${fullOrder.address.postal_code}</div>
                  <div>📅 تاریخ سفارش: ${new Date(fullOrder.created).toLocaleString("fa-IR")}</div>
                  <div>📦 وضعیت: ${statusMap[fullOrder.status] || "نامشخص"}</div>
                  <div class="font-bold text-green-600 dark:text-green-400">💰 مبلغ کل: ${fullOrder.total_price.toLocaleString()} تومان</div>
                </div>
                ${saveButton}
              </td>
            `;

            if (fullOrder.status === "awaiting_payment") {
              // Add event listeners for quantity controls
              detailRow.querySelectorAll(".increase-qty").forEach(button => {
                button.addEventListener("click", (e) => {
                  const index = parseInt(e.target.dataset.index);
                  modifiedItems[index].quantity += 1;
                  e.target.closest(".bg-gray-100").querySelector(".quantity").textContent = modifiedItems[index].quantity;
                });
              });

              detailRow.querySelectorAll(".decrease-qty").forEach(button => {
                button.addEventListener("click", (e) => {
                  const index = parseInt(e.target.dataset.index);
                  if (modifiedItems[index].quantity > 1) {
                    modifiedItems[index].quantity -= 1;
                    e.target.closest(".bg-gray-100").querySelector(".quantity").textContent = modifiedItems[index].quantity;
                  }
                });
              });

              detailRow.querySelectorAll(".delete-item").forEach(button => {
                button.addEventListener("click", (e) => {
                  const index = parseInt(e.target.dataset.index);
                  modifiedItems = modifiedItems.filter((_, i) => i !== index);
                  e.target.closest(".bg-gray-100").remove();
                  if (modifiedItems.length === 0) {
                    detailRow.remove();
                    loadOrders();
                  }
                });
              });

              // Add event listener for save changes
              const saveButtonEl = detailRow.querySelector(".save-changes");
              if (saveButtonEl) {
                saveButtonEl.addEventListener("click", () => {
                  if (modifiedItems.length > 0) {
                    updateOrder(fullOrder.id, modifiedItems);
                  } else {
                    alert("سفارش نمی‌تواند خالی باشد.");
                  }
                });
              }
            }

            row.insertAdjacentElement("afterend", detailRow);
            isDetailVisible = true;
          } catch (err) {
            console.error("❌ خطا در بارگذاری جزئیات سفارش:", err);
            alert("خطایی در بارگذاری جزئیات سفارش رخ داد.");
          }
        });

        tableBody.appendChild(row);
      }

      const pageSize = ordersArray.length;
      const totalCount = ordersResponse.count || pageSize;
      const totalPages = Math.ceil(totalCount / pageSize);

      const getCurrentPage = (url) => {
        if (!url) return 1;
        try {
          const params = new URL(url).searchParams;
          return parseInt(params.get("page")) || 1;
        } catch {
          return 1;
        }
      };

      const currentPage = getCurrentPage(url);

      renderPaginationControls(currentPage, totalPages, ordersResponse.next, ordersResponse.previous);
    } catch (err) {
      console.error("❌ خطا:", err);
      tableBody.innerHTML = `
        <tr><td colspan="5" class="text-center py-4 text-red-500">
          ${err.message || "خطایی در بارگذاری سفارش‌ها رخ داد."}
        </td></tr>
      `;
      paginationEl.innerHTML = "";
    }
  }

  function renderPaginationControls(currentPage, totalPages, nextUrl, prevUrl) {
    paginationEl.innerHTML = "";

    const createText = (text, disabled, onClick) => {
      const span = document.createElement("span");
      span.textContent = text;
      span.className = `mx-2 text-xs font-medium ${
        disabled ? "text-gray-400" : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white cursor-pointer"
      }`;
      if (!disabled && typeof onClick === "function") span.addEventListener("click", onClick);
      return span;
    };

    const prevBtn = createText("« قبلی", !prevUrl, () => loadOrders(prevUrl));
    const pageInfo = document.createElement("span");
    pageInfo.textContent = `صفحه ${currentPage} از ${totalPages}`;
    pageInfo.className = "mx-2 text-xs text-gray-500 dark:text-gray-300";
    const nextBtn = createText("بعدی »", !nextUrl, () => loadOrders(nextUrl));

    paginationEl.appendChild(prevBtn);
    paginationEl.appendChild(pageInfo);
    paginationEl.appendChild(nextBtn);
  }

  const addNewAddressBtn = document.getElementById("add-new-address");
  const formContainer = document.getElementById("new-address-form-container");

  if (addNewAddressBtn && formContainer) {
    addNewAddressBtn.addEventListener("click", (e) => {
      e.preventDefault();
      editingAddressId = null;
      document.getElementById("submit-new-address").textContent = "ثبت آدرس";
      clearFormAndHide();
      formContainer.classList.remove("hidden");
    });
  }

  function showError(message) {
    let errorDiv = document.getElementById("postal-code-error");
    if (!errorDiv) {
      errorDiv = document.createElement("div");
      errorDiv.id = "postal-code-error";
      errorDiv.style.color = "red";
      errorDiv.style.fontSize = "12px";
      errorDiv.style.marginTop = "4px";
      const postalInput = document.getElementById("address-postal");
      if (postalInput) {
        postalInput.parentNode.insertBefore(errorDiv, postalInput.nextSibling);
      }
    }
    errorDiv.textContent = message;
  }

  function clearError() {
    const errorDiv = document.getElementById("postal-code-error");
    if (errorDiv) {
      errorDiv.textContent = "";
    }
  }

  function clearFormAndHide() {
    ["address-province", "address-city", "address-postal", "address-detail"].forEach(id => {
      const element = document.getElementById(id);
      if (element) element.value = "";
    });
    clearError();
  }

  const submitAddressBtn = document.getElementById("submit-new-address");
  const cancelAddressBtn = document.getElementById("cancel-address");

  if (submitAddressBtn) {
    submitAddressBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const province = document.getElementById("address-province")?.value.trim();
      const city = document.getElementById("address-city")?.value.trim();
      const postal_code = document.getElementById("address-postal")?.value.trim();
      const address = document.getElementById("address-detail")?.value.trim();

      clearError();

      console.log("داده‌های ارسالی به سرور:", { province, city, postal_code, address });

      if (!province || !city || !postal_code || !address) {
        showError("لطفاً همه‌ی فیلدها را پر کنید.");
        return;
      }

      if (postal_code.length > 10) {
        showError("کد پستی نباید بیشتر از 10 کاراکتر باشد.");
        return;
      }

      const payload = {
        province,
        city,
        postal_code,
        address,
      };

      try {
        const url = editingAddressId
          ? `http://localhost:8000/api/account/address/${editingAddressId}/`
          : "http://localhost:8000/api/account/address/";
        const method = editingAddressId ? "PUT" : "POST";

        await fetchWithAuth(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        clearError();
        alert(editingAddressId ? "✅ آدرس با موفقیت ویرایش شد" : "✅ آدرس با موفقیت ثبت شد");
        editingAddressId = null;
        document.getElementById("submit-new-address").textContent = "ثبت آدرس";
        clearFormAndHide();
        formContainer.classList.add("hidden");
        loadUserAddresses();
      } catch (err) {
        console.error(`❌ خطا در ${editingAddressId ? "ویرایش" : "ثبت"} آدرس:`, err);
        const errorMessage = err.message.includes("جزئیات")
          ? JSON.parse(err.message.split("جزئیات: ")[1] || "{}").error || `خطا در ${editingAddressId ? "ویرایش" : "ثبت"} آدرس. لطفاً دوباره تلاش کنید.`
          : `خطا در ${editingAddressId ? "ویرایش" : "ثبت"} آدرس. لطفاً دوباره تلاش کنید.`;
        showError(errorMessage);
      }
    });
  }

  if (cancelAddressBtn) {
    cancelAddressBtn.addEventListener("click", (e) => {
      e.preventDefault();
      editingAddressId = null;
      document.getElementById("submit-new-address").textContent = "ثبت آدرس";
      clearFormAndHide();
      formContainer.classList.add("hidden");
    });
  }

  if (!tableBody || !paginationEl) {
    console.log("Table body or pagination not found, skipping orders loading.");
  } else {
    loadOrders();
  }
});