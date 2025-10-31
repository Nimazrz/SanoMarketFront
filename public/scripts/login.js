 const form = document.getElementById("login-form");
    const errorMessage = document.getElementById("error-message");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const phone = document.getElementById("phone").value;

      try {
        const response = await fetch("http://localhost:8000/api/account/signin/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",

          },
          body: JSON.stringify({ phone }),
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem("verify_token", data.verify_token);
          localStorage.setItem("phone", phone);
          window.location.href = "confirm-code.html";
        } else {
          errorMessage.textContent = data.message || "خطایی رخ داده است";
        }
      } catch (error) {
        errorMessage.textContent = "اتصال به سرور برقرار نشد.";
      }
    });