document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn?.addEventListener("click", async (e) => {
    e.preventDefault();

    const access = localStorage.getItem("access");
    if (!access) {
      window.location.href = "./index.html";
      return;
    }

    try {
      await fetch("http://localhost:8000/api/account/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
      });
    } catch (error) {
      console.warn("⚠️ خطا در درخواست خروج:", error);
      // حتی اگر سرور ارور بده، ادامه بده چون logout سمت کاربر انجام می‌شه
    } finally {
      // پاک کردن توکن‌ها
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      // 🔹 هدایت به صفحه اصلی (index.html)
      window.location.href = `http://127.0.0.1:8080/index.html`;
    }
  });
});