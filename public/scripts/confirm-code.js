
  const otpForm = document.getElementById("otp-form");
  const inputs = document.querySelectorAll(".otp-input");

  inputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      if (input.value.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });
  });

  otpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = Array.from(inputs).map(i => i.value).join("");
    const verify_token = localStorage.getItem("verify_token");
    if (!verify_token || code.length !== 4) return alert("کد نادرست است");

    try {
      const res = await fetch("http://localhost:8000/api/account/verify_code/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",

        },
        body: JSON.stringify({ code, verify_token })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        window.location.href = "index.html";
      } else {
        alert(data.message || "خطایی رخ داده است");
      }
    } catch (err) {
      alert("در ارتباط با سرور مشکلی پیش آمده است");
      console.error(err);
    }
  });