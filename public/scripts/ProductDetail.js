import { getProductById, getRelatedProducts } from "./api.js";
import Swiper from 'https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.mjs';

document.addEventListener("DOMContentLoaded", async () => {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) return;

  const product = await getProductById(id);
  if (!product) return;

  const titleEl = document.getElementById("product-title");
  const descriptionEl = document.getElementById("product-description");
  const priceEl = document.getElementById("price");
  const finalPriceContainer = document.getElementById("final-price");
  const mainImageContainer = document.getElementById("main-image");
  const thumbnailContainer = document.getElementById("image-thumbnails");
  const sliderWrapper = document.querySelector(".swiper-wrapper");
  const featuresContainer = document.getElementById("product-features");
  const commentsContainer = document.getElementById("product-comments");
  const sliderModalTitle = document.getElementById("slider-modal-title");
  const expandBtn = document.getElementById("expand-description-btn");
  const fadeOverlay = document.getElementById("description-fade");
  const specTitleList = document.getElementById("spec-titles");
  const specValueList = document.getElementById("spec-values");
  const relatedWrapper = document.getElementById("related-products-wrapper");

  titleEl && (titleEl.textContent = product.name ?? "");
  sliderModalTitle && (sliderModalTitle.textContent = product.name ?? "");
  descriptionEl && (descriptionEl.textContent = product.description ?? "توضیحی ثبت نشده است.");

  const price = product.offer_price ?? product.price;
  priceEl && (priceEl.innerHTML = product.offer_price
    ? `<del class="text-red-400">${product.price.toLocaleString()} تومان</del> → ${price.toLocaleString()} تومان`
    : `${price.toLocaleString()} تومان`);
  finalPriceContainer && (finalPriceContainer.innerHTML = product.offer_price
    ? `<div class="flex items-center gap-x-2"><del class="text-gray-400 text-base">${product.price.toLocaleString()}</del><p class="text-2xl font-DanaDemiBold text-white">${product.offer_price.toLocaleString()}</p><span class="text-base">تومان</span></div>`
    : `<div class="flex items-center gap-x-2"><p class="text-2xl font-DanaDemiBold">${product.price.toLocaleString()}</p><span class="text-base">تومان</span></div>`);

  const mainImage = product.images?.[0]?.image_url ?? "https://via.placeholder.com/500x500?text=No+Image";
  mainImageContainer && (mainImageContainer.innerHTML = `<img src="${mainImage}" class="cursor-pointer object-cover rounded-lg" alt="${product.name}">`);

  let thumbsHTML = "";
  product.images?.slice(0, 3).forEach(img => {
    thumbsHTML += `<div class="p-1 open-sliderModal"><img src="${img.image_url}" class="object-cover rounded-lg" alt="${product.name}" /></div>`;
  });
  if (product.images?.[3]) {
    thumbsHTML += `<div class="overflow-hidden relative open-sliderModal"><svg class="absolute size-8 text-gray-100 top-4 left-4 z-10"><use href="#ellipsis"></use></svg><img src="${product.images[3].image_url}" class="object-cover rounded-lg blur-sm" alt="${product.name}" /></div>`;
  }
  thumbnailContainer && (thumbnailContainer.innerHTML = thumbsHTML);

  let sliderHTML = "";
  product.images?.forEach(img => {
    sliderHTML += `<div class="swiper-slide"><img src="${img.image_url}" alt="${product.name}"></div>`;
  });
  sliderWrapper && (sliderWrapper.innerHTML = sliderHTML);

  if (featuresContainer) {
    if (Array.isArray(product.info) && product.info.length) {
      featuresContainer.innerHTML = product.info.map(item => `
        <div class="col-span-12 md:col-span-6 xl:col-span-4">
          <p class="text-sm text-gray-500">${item.title}</p>
          <p class="line-clamp-1 font-DanaDemiBold text-sm text-slate-800 dark:text-slate-200">${item.text}</p>
        </div>`).join('');
    } else {
      featuresContainer.innerHTML = "<p class='text-gray-400 col-span-12'>ویژگی‌ای برای این محصول ثبت نشده است.</p>";
    }
  }

  if (specTitleList && specValueList) {
    if (Array.isArray(product.info) && product.info.length) {
      specTitleList.innerHTML = product.info.map(i => `<li>${i.title}</li>`).join('');
      specValueList.innerHTML = product.info.map(i => `<li class="pt-2">${i.text}</li>`).join('');
    } else {
      specTitleList.innerHTML = "<li>مشخصاتی برای این محصول ثبت نشده</li>";
      specValueList.innerHTML = "";
    }
  }

  if (commentsContainer) {
    if (Array.isArray(product.comments) && product.comments.length) {
      commentsContainer.innerHTML = product.comments.map(c => `
        <div class="border-b pb-4 mb-4 text-sm">
          <h4 class="font-semibold">${c.title}</h4>
          <p>${c.text}</p>
        </div>`).join('');
    } else {
      commentsContainer.innerHTML = "<p class='text-gray-500'>هنوز نظری ثبت نشده است.</p>";
    }
  }

  const checkOverflow = () => {
    if (!descriptionEl) return false;
    const lineHeight = parseFloat(getComputedStyle(descriptionEl).lineHeight);
    return descriptionEl.scrollHeight > lineHeight * 4;
  };

  setTimeout(() => {
    if (descriptionEl && expandBtn && checkOverflow()) {
      expandBtn.style.display = "flex";
      fadeOverlay?.classList.remove("hidden");
    } else {
      expandBtn?.classList.add("hidden");
    }
  }, 100);

  expandBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    descriptionEl.classList.toggle("line-clamp-4");
    fadeOverlay?.classList.toggle("hidden");
    const isClamped = descriptionEl.classList.contains("line-clamp-4");
    expandBtn.innerHTML = isClamped
      ? `مشاهده بیشتر <svg class="size-4"><use href="#chevron-left" /></svg>`
      : `مشاهده کمتر <svg class="size-4 rotate-180"><use href="#chevron-left" /></svg>`;
  });

  const openSliderModals = document.querySelectorAll('.open-sliderModal');
  const sliderModal = document.querySelector('.slider-modal');
  const overlayProductPage = document.querySelector('.overlay');
  const closeSliderModal = document.querySelector('.close-sliderModal');

  openSliderModals.forEach(el => {
    el.addEventListener('click', () => {
      sliderModal?.classList.add('active');
      overlayProductPage?.classList.add('active');
    });
  });

  overlayProductPage?.addEventListener('click', () => {
    sliderModal?.classList.remove('active');
    overlayProductPage?.classList.remove('active');
  });

  closeSliderModal?.addEventListener('click', () => {
    sliderModal?.classList.remove('active');
    overlayProductPage?.classList.remove('active');
  });

  if (relatedWrapper) {
    try {
      const relatedResponse = await getRelatedProducts(product.id);
      const relatedProducts = relatedResponse.results;
      if (Array.isArray(relatedProducts)) {
        relatedWrapper.innerHTML = relatedProducts.map(item => {
          const image1 = item.images?.[0]?.image_url ?? "https://via.placeholder.com/400x400";
          const image2 = item.images?.[1]?.image_url ?? image1;
          const price = item.offer_price ?? item.price;
          const hasOffer = !!item.offer_price;
          return `
          <div class="swiper-slide product-card group">
              <a href="product-details.html?id=${item.id}">
                <img class="product-card_img group-hover:opacity-0 absolute" src="${image1}" alt="${item.name}" />
                <img class="product-card_img opacity-0 group-hover:opacity-100" src="${image2}" alt="${item.name}" />
              </a>
              <div class="space-y-2">
                <a href="product-details.html?id=${item.id}" class="product-card_link">${item.name}</a>
                <div class="product-card_price-wrapper">
                  <div class="product-card_price">
                    ${hasOffer ? `<del>${item.price.toLocaleString()} <h6>تومان</h6></del>` : ""}
                    <p>${price.toLocaleString()}</p>
                    <span>تومان</span>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('');
        new Swiper(".related-products-swiper", {
          slidesPerView: 2,
          spaceBetween: 16,
          navigation: {
            nextEl: ".related-next-slide",
            prevEl: ".related-prev-slide",
          },
          breakpoints: {
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 }
          }
        });
      }
    } catch (err) {
      console.error("خطا در بارگذاری محصولات مرتبط:", err);
    }
  }

  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      tabButtons.forEach((b) => {
        b.classList.remove("text-blue-500");
        b.classList.add("text-gray-500", "dark:text-gray-300");
      });
      btn.classList.add("text-blue-500");
      btn.classList.remove("text-gray-500", "dark:text-gray-300");
      tabContents.forEach((content) => {
        if (content.classList.contains(target)) {
          content.classList.remove("hidden");
          content.classList.add("block");
        } else {
          content.classList.add("hidden");
          content.classList.remove("block");
        }
      });
    });
  });
});