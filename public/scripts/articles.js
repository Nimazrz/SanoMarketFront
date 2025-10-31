import { getProducts } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const loginBtn = document.getElementById("login-btn");
  const accountBtn = document.getElementById("account-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const token = localStorage.getItem("access");

  if (!token) {
    // اگر توکن نبود، فقط دکمه ورود را نشان بده
    loginBtn?.classList.remove("hidden");
    accountBtn?.classList.add("hidden");
    return;
  }

  // بررسی معتبر بودن توکن با زدن به API
  try {
    const res = await fetch("http://localhost:8000/api/account/auth/user/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      accountBtn?.classList.remove("hidden");
      loginBtn?.classList.add("hidden");
    } else {
      // توکن نامعتبر بود
      localStorage.removeItem("access");
      loginBtn?.classList.remove("hidden");
      accountBtn?.classList.add("hidden");
    }
  } catch (err) {
    console.error("خطا در بررسی توکن:", err);
    loginBtn?.classList.remove("hidden");
    accountBtn?.classList.add("hidden");
  }

  // خروج از حساب
  logoutBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.location.href = "../login.html"; // مسیر صفحه ورود یا اصلی
  });
});