document.addEventListener("DOMContentLoaded", async () => {
  const headerContainer = document.getElementById("header-container");
  if (!headerContainer) {
    console.error("❌ Element with id 'header-container' not found.");
    return;
  }

  // مسیرهای ممکن برای پیدا کردن فایل header.html
  const possiblePaths = [
    "./components/header.html",
    "./public/components/header.html",
    "../components/header.html",
    "/components/header.html",
    "/public/components/header.html",
  ];

  let headerLoaded = false;

  for (const path of possiblePaths) {
    try {
      const res = await fetch(path);
      if (res.ok) {
        const html = await res.text();
        headerContainer.innerHTML = html;
        console.log(`✅ Header loaded successfully from: ${path}`);
        initializeHeaderInteractions();
        adjustHeaderVisibility();
        headerLoaded = true;
        break;
      } else {
        console.warn(`⚠️ Tried ${path} but got status ${res.status}`);
      }
    } catch (err) {
      console.warn(`⚠️ Error trying ${path}:`, err);
    }
  }

  if (!headerLoaded) {
    console.error("❌ Failed to load header.html from all possible paths.");
  }
});

/**
 * This function initializes all JavaScript logic related to header interactions after loading its HTML.
 */
function initializeHeaderInteractions() {
  // 1. Manage the display of login/account/logout buttons
  setupAuthButtons();

  // 2. Manage theme toggle (light/dark)
  setupThemeToggle();

  // 3. Manage shopping cart
  setupShoppingCart();

  // 4. Manage search (desktop)
  setupDesktopSearch();

  // 5. Manage mega menu (desktop)
  setupDesktopMegaMenu();

  // 6. Manage simple menu (desktop)
  setupDesktopSolidMenu();

  // 7. Manage city selection (desktop)
  setupCitySelection();

  // 8. Manage mobile menu and its submenus
  setupMobileMenu();

  // 9. Manage mobile search
  setupMobileSearch();

  // 10. Initialize Swiper Slider
  initializeSwiperSlider();
}

// --- Adjust Header Visibility Based on Screen Size ---
function adjustHeaderVisibility() {
  const headerContainer = document.getElementById("header-container");
  const isDesktop = window.innerWidth >= 1024; // Adjust this value based on your breakpoint

  if (headerContainer) {
    if (isDesktop) {
      // Show desktop header
      headerContainer.querySelector('.container').classList.remove('hidden');
    } else {
      // Hide desktop header
      headerContainer.querySelector('.container').classList.add('hidden');
    }
  }
}

// --- Helper functions for showing/hiding classes ---
function showElement(element, displayClass = 'flex', hiddenClass = 'hidden') {
  if (element) {
    element.classList.remove(hiddenClass);
    element.classList.add(displayClass);
  }
}

function hideElement(element, displayClass = 'flex', hiddenClass = 'hidden') {
  if (element) {
    element.classList.remove(displayClass);
    element.classList.add(hiddenClass);
  }
}

function toggleActiveClass(element, activeClass = 'active') {
  if (element) {
    element.classList.toggle(activeClass);
  }
}

function addActiveClass(element, activeClass = 'active') {
  if (element) {
    element.classList.add(activeClass);
  }
}

function removeActiveClass(element, activeClass = 'active') {
  if (element) {
    element.classList.remove(activeClass);
  }
}

// --- 1. Manage the display of login/account/logout buttons ---
function setupAuthButtons() {
  const loginBtn = document.getElementById("login-btn");
  const accountBtn = document.getElementById("account-btn");
  const logoutBtn = document.getElementById("logout-btn");

  const token = localStorage.getItem("access");

  if (token) {
    hideElement(loginBtn); // Hide login button
    showElement(accountBtn); // Show account button
  } else {
    showElement(loginBtn); // Show login button
    hideElement(accountBtn); // Hide account button
  }

  // Add Event Listener for logout button
  logoutBtn?.addEventListener("click", async (e) => {
    e.preventDefault();

    const access = localStorage.getItem("access");

    try {
      // Send logout request to the server
      await fetch("http://localhost:8000/api/account/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
      });
    } catch (e) {
      console.warn("Error communicating with server during logout:", e);
    } finally {
      // Remove tokens from localStorage and redirect
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      window.location.href = "/karin/public/login.html"; // Redirect to login page
    }
  });
}

// --- 2. Manage theme toggle ---
function setupThemeToggle() {
  const toggleBtn = document.querySelector(".toggle-theme");
  if (!toggleBtn) return;

  // Set initial theme based on localStorage
  const currentTheme = localStorage.getItem("theme");
  if (currentTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  toggleBtn.addEventListener("click", () => {
    const htmlEl = document.documentElement;
    if (htmlEl.classList.contains("dark")) {
      htmlEl.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      htmlEl.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  });
}

// --- 3. Manage shopping cart ---
function setupShoppingCart() {
  const openCartBtn = document.querySelector(".open-cart");
  const closeCartBtn = document.querySelector(".close-cart");
  const cartElement = document.querySelector(".cart");

  if (!openCartBtn || !closeCartBtn || !cartElement) return;

  openCartBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent immediate closing by document click
    addActiveClass(cartElement); // Show shopping cart
  });

  closeCartBtn.addEventListener("click", () => {
    removeActiveClass(cartElement); // Hide shopping cart
  });

  // Close shopping cart by clicking outside of it
  document.addEventListener("click", (e) => {
    if (!cartElement.contains(e.target) && !openCartBtn.contains(e.target)) {
      removeActiveClass(cartElement);
    }
  });

  // Manage item quantity in the shopping cart
  const cartItems = document.querySelectorAll(".cart .grid-cols-12");
  cartItems.forEach(item => {
    const incrementBtn = item.querySelector(".increment");
    const decrementBtn = item.querySelector(".decrement");
    const customInput = item.querySelector(".custom-input");

    if (incrementBtn && decrementBtn && customInput) {
      incrementBtn.addEventListener("click", () => {
        customInput.value = parseInt(customInput.value) + 1;
        // TODO: Add logic to update price or send to server
      });

      decrementBtn.addEventListener("click", () => {
        if (parseInt(customInput.value) > 1) { // Minimum one item
          customInput.value = parseInt(customInput.value) - 1;
          // TODO: Add logic to update price or send to server
        }
      });
    }
  });
}

// --- 4. Manage search (desktop) ---
function setupDesktopSearch() {
  const searchBtnOpen = document.querySelector(".search-btn-open");
  const searchModal = document.querySelector(".search-modal");

  if (!searchBtnOpen || !searchModal) return;

  searchBtnOpen.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent immediate closing by document click
    toggleActiveClass(searchModal); // Show/hide search modal
  });

  // Close search modal by clicking outside of it
  document.addEventListener("click", (e) => {
    if (!searchModal.contains(e.target) && !searchBtnOpen.contains(e.target)) {
      removeActiveClass(searchModal);
    }
  });
}

// --- 5. Manage mega menu (desktop) ---
function setupDesktopMegaMenu() {
  const megaMenuLink = document.querySelector(".megamenu-link");
  const megaMenu = document.querySelector(".megamenu");
  const megaMenuCategories = document.querySelectorAll(".megamenu_category-item");
  const megaMenuLeftItems = document.querySelectorAll(".megamenu_left-item");

  if (!megaMenuLink || !megaMenu || megaMenuCategories.length === 0 || megaMenuLeftItems.length === 0) return;

  // Show mega menu on hover over the main link
  megaMenuLink.addEventListener("mouseenter", () => {
    addActiveClass(megaMenu);
  });
  megaMenuLink.addEventListener("mouseleave", () => {
    removeActiveClass(megaMenu);
  });

  // Keep mega menu displayed when hovering over the mega menu itself
  megaMenu.addEventListener("mouseenter", () => {
    addActiveClass(megaMenu);
  });
  megaMenu.addEventListener("mouseleave", () => {
    removeActiveClass(megaMenu);
  });

  // Manage the content of the mega menu based on the selected category
  megaMenuCategories.forEach((category, index) => {
    category.addEventListener("mouseenter", () => {
      // Remove active class from all categories and related content
      megaMenuCategories.forEach(item => removeActiveClass(item));
      megaMenuLeftItems.forEach(item => removeActiveClass(item));

      // Add active class to the current category and related content
      addActiveClass(category);
      if (megaMenuLeftItems[index]) {
        addActiveClass(megaMenuLeftItems[index]);
      }
    });
  });
}

// --- 6. Manage simple menu (desktop) ---
function setupDesktopSolidMenu() {
  const solidMenuItems = document.querySelectorAll(".menu-item.group");

  solidMenuItems.forEach(menuItem => {
    const solidMenu = menuItem.querySelector(".solid-menu");
    if (!solidMenu) return;

    // Show simple menu on hover
    menuItem.addEventListener("mouseenter", () => {
      addActiveClass(solidMenu);
    });
    menuItem.addEventListener("mouseleave", () => {
      removeActiveClass(solidMenu);
    });

    // Manage nested submenus (solid-submenu)
    const solidSubmenuLinks = menuItem.querySelectorAll(".solid-submenu_link");
    solidSubmenuLinks.forEach(submenuLink => {
      const solidSubmenu = submenuLink.querySelector(".solid-submenu");
      if (!solidSubmenu) return;

      submenuLink.addEventListener("mouseenter", () => {
        addActiveClass(solidSubmenu);
      });
      submenuLink.addEventListener("mouseleave", () => {
        removeActiveClass(solidSubmenu);
      });
    });
  });
}

// --- 7. Manage city selection (desktop) ---
function setupCitySelection() {
  const citylistOpenBtn = document.querySelector(".citylist-open");
  const citylistMenu = document.querySelector(".citylist-menu");

  if (!citylistOpenBtn || !citylistMenu) return;

  citylistOpenBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleActiveClass(citylistMenu); // Show/hide city list menu
  });

  // Close city list menu by clicking outside of it
  document.addEventListener("click", (e) => {
    if (!citylistMenu.contains(e.target) && !citylistOpenBtn.contains(e.target)) {
      removeActiveClass(citylistMenu);
    }
  });
}

// --- 8. Manage mobile menu and its submenus ---
function setupMobileMenu() {
  const openMenuMobileBtn = document.querySelector(".open-menu-mobile");
  const closeMenuMobileBtn = document.querySelector(".close-menu-mobile");
  const mobileMenu = document.querySelector(".mobile-menu");

  if (openMenuMobileBtn && closeMenuMobileBtn && mobileMenu) {
    openMenuMobileBtn.addEventListener("click", () => {
      addActiveClass(mobileMenu); // Show mobile menu
    });

    closeMenuMobileBtn.addEventListener("click", () => {
      removeActiveClass(mobileMenu); // Hide mobile menu
    });
  }

  // Manage mobile category slides
  const openCategoryBtn = document.querySelector(".open-category");
  const closeCategorySlideBtn = document.querySelector(".close-category-slide");
  const categorySlide = document.querySelector(".category-slide");

  if (openCategoryBtn && closeCategorySlideBtn && categorySlide) {
    openCategoryBtn.addEventListener("click", () => {
      addActiveClass(categorySlide); // Show category slide
    });
    closeCategorySlideBtn.addEventListener("click", () => {
      removeActiveClass(categorySlide); // Hide category slide
    });
  }

  // Manage mobile subcategories
  const openDetailCategoryBtns = document.querySelectorAll(".open-detail-category");
  openDetailCategoryBtns.forEach(btn => {
    const detailCategory = btn.nextElementSibling; // Assuming detail-category is immediately after open-detail-category
    const closeDetailCategoryBtn = detailCategory?.querySelector(".close-detail-category");

    if (detailCategory && closeDetailCategoryBtn) {
      btn.addEventListener("click", () => {
        addActiveClass(detailCategory); // Show detail category
      });
      closeDetailCategoryBtn.addEventListener("click", () => {
        removeActiveClass(detailCategory); // Hide detail category
      });
    }
  });

  // Manage mobile category submenus
  const openSubmenuSpans = document.querySelectorAll(".mobile-menu .open-submenu");
  openSubmenuSpans.forEach(span => {
    span.addEventListener("click", () => {
      const submenu = span.nextElementSibling; // Assuming submenu is immediately after span
      if (submenu && submenu.classList.contains("menu-category-submenu")) {
        toggleActiveClass(submenu); // Show/hide submenu
        span.querySelector("svg")?.classList.toggle("rotate-90"); // Rotate chevron icon
      }
    });
  });
}

// --- 9. Manage mobile search ---
function setupMobileSearch() {
  const openMobileSearchModalBtn = document.querySelector(".open-mobile_search-modal");
  const closeMobileSearchModalBtn = document.querySelector(".close-mobile_search-modal");
  const mobileSearchModal = document.querySelector(".mobile_search-modal");

  if (!openMobileSearchModalBtn || !closeMobileSearchModalBtn || !mobileSearchModal) return;

  openMobileSearchModalBtn.addEventListener("click", () => {
    addActiveClass(mobileSearchModal); // Show mobile search modal
  });

  closeMobileSearchModalBtn.addEventListener("click", () => {
    removeActiveClass(mobileSearchModal); // Hide mobile search modal
  });
}

// --- 10. Initialize Swiper Slider ---
function initializeSwiperSlider() {
  // Check if Swiper.js library is loaded
  if (typeof Swiper !== 'undefined') {
    new Swiper(".header-slider", {
      loop: true, // Infinite slider
      autoplay: {
        delay: 3000, // Delay between slides (milliseconds)
        disableOnInteraction: false, // Continue autoplay even after user interaction
      },
      pagination: {
        el: ".swiper-pagination", // Pagination element
        clickable: true, // Clickable pagination dots
      },
      navigation: {
        nextEl: ".button-next", // Next button
        prevEl: ".button-prev", // Previous button
      },
      // Additional settings can be added here
      // effect: 'fade', // Example: fade effect
      // speed: 800, // Example: animation speed
    });
  } else {
    console.warn("Swiper.js library not found. Slider will not be initialized. Please ensure swiper-bundle.min.js is loaded before loadHeader.js.");
  }
}
