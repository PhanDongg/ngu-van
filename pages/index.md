---
layout: home
title: Trang chủ
description: Trang chủ của website.
permalink: /
header_action_active: "__none__"
---

{% assign home = site.data.home %}
{% assign hero_slides = home.hero_slides %}
{% assign products_section = home.products_section %}
{% assign highlights_section = home.highlights_section %}
{% assign language_arena_section = home.language_arena_section %}
{% assign featured_events_section = home.featured_events_section %}
{% assign spotlight_section = home.spotlight_section %}
{% assign partners_section = home.partners_section %}
{% assign experts_section = home.experts_section %}

<section class="home-hero pt-1 ">
  <div id="homeHeroCarousel" class="carousel slide mx-auto pb-4" data-bs-ride="carousel" data-bs-interval="5000">
    <div class="home-hero__frame position-relative">
      <div class="carousel-inner overflow-hidden">
        {% for slide in hero_slides %}
          <div class="carousel-item{% if forloop.first %} active{% endif %}">
            <article class="w-100">
              <div class="home-hero__media ratio ratio-21x9 overflow-hidden">
                <img src="{{ slide.image | relative_url }}" alt="{{ slide.alt }}" class="home-hero__image img-fluid w-100 h-100 object-fit-cover">
              </div>
            </article>
          </div>
        {% endfor %}
      </div>

      <button class="carousel-control-prev home-hero__control opacity-100" type="button" data-bs-target="#homeHeroCarousel" data-bs-slide="prev">
        <span class="home-hero__control-icon d-inline-flex align-items-center justify-content-center rounded-circle" aria-hidden="true">
          <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M15 6l-6 6l6 6"></path></svg>
        </span>
        <span class="visually-hidden">Slide trước</span>
      </button>
      <button class="carousel-control-next home-hero__control opacity-100" type="button" data-bs-target="#homeHeroCarousel" data-bs-slide="next">
        <span class="home-hero__control-icon d-inline-flex align-items-center justify-content-center rounded-circle" aria-hidden="true">
          <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="30" width="30" xmlns="http://www.w3.org/2000/svg"><path d="M9 6l6 6l-6 6"></path></svg>
        </span>
        <span class="visually-hidden">Slide sau</span>
      </button>
    </div>

    <div class="carousel-indicators position-static mt-3 mb-0 gap-2">
      {% for slide in hero_slides %}
        <button type="button" data-bs-target="#homeHeroCarousel" data-bs-slide-to="{{ forloop.index0 }}" class="{% if forloop.first %}active {% endif %}home-hero__indicator"{% if forloop.first %} aria-current="true"{% endif %} aria-label="Banner {{ forloop.index }}"></button>
      {% endfor %}
    </div>
  </div>
</section>

<section class="home-section pt-4 pt-lg-0">
  <div class="text-center">
    <img src="{{ products_section.ornament | relative_url }}" alt="" class="img-fluid mb-3 m-auto" width="168" height="34">
    <h2 class="home-section__title mb-0">{{ products_section.title }}</h2>
  </div>

  <div class="home-products mx-auto mt-4 mt-lg-5 pb-4" data-home-products-slider>
    <div class="home-products__frame position-relative">
      <button class="home-products__control home-products__control--prev position-absolute border-0 bg-transparent p-0" type="button" data-direction="prev" aria-label="Sản phẩm trước">
        <span class="home-products__control-icon d-inline-flex align-items-center justify-content-center rounded-circle" aria-hidden="true">
          <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M15 6l-6 6l6 6"></path></svg>
        </span>
      </button>

      <div class="home-products__viewport overflow-hidden">
        <div class="home-products__track d-flex" data-track>
          {% for item in products_section.items %}
            <div class="home-products__item flex-shrink-0">
              <article class="home-products__card home-products__card--{{ item.theme }} rounded-5 d-flex flex-column align-items-center text-center px-3 px-lg-4 pt-4 pt-lg-5 pb-3 h-100">
                <div class="home-products__visual d-flex align-items-end justify-content-center mb-3">
                  <img src="{{ '/assets/images/home/' | append: item.image | relative_url }}" alt="{{ item.title }}" class="img-fluid">
                </div>
                <h3 class="home-products__name fw-bold mb-2">{{ item.title }}</h3>
                <p class="home-products__description mb-4">{{ item.description }}</p>
                <a href="{{ item.href }}" class="home-products__cta btn rounded-pill px-4 py-2 mt-auto d-inline-flex align-items-center justify-content-center gap-2">
                  <span>{{ products_section.cta_label }}</span>
                  <svg stroke="currentColor" fill="none" stroke-width="2.4" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M9 6l6 6l-6 6"></path></svg>
                </a>
              </article>
            </div>
          {% endfor %}
        </div>
      </div>

      <button class="home-products__control home-products__control--next position-absolute border-0 bg-transparent p-0" type="button" data-direction="next" aria-label="Sản phẩm sau">
        <span class="home-products__control-icon d-inline-flex align-items-center justify-content-center rounded-circle" aria-hidden="true">
          <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="30" width="30" xmlns="http://www.w3.org/2000/svg"><path d="M9 6l6 6l-6 6"></path></svg>
        </span>
      </button>
    </div>

    <div class="d-flex align-items-center justify-content-center gap-2 mt-4 mb-0">
      {% for item in products_section.items %}
        <button type="button" class="home-products__indicator{% if forloop.first %} is-active{% endif %}" data-index="{{ forloop.index0 }}" aria-label="Nhóm sản phẩm {{ forloop.index }}"></button>
      {% endfor %}
    </div>
  </div>
</section>

<section class="home-highlights pt-5 pt-xl-6">
  <div class="text-center">
    <img src="{{ highlights_section.ornament | relative_url }}" alt="" class="home-highlights__ornament img-fluid mb-3 m-auto">
    <h2 class="home-section__title mb-0">{{ highlights_section.title }}</h2>
  </div>

  <div class="row g-4 g-xl-5 align-items-center mt-4 mt-lg-5">
    <div class="col-12 col-md-4 mt-0">
      <div class="d-grid gap-4 gap-md-5">
        {% for item in highlights_section.left_items %}
          <article class="home-highlights__item text-center">
            <img src="{{ item.icon | relative_url }}" alt="" class="home-highlights__icon img-fluid mb-3 m-auto">
            <h3 class="home-highlights__heading fw-normal mb-3">{{ item.title }}</h3>
            <p class="home-highlights__copy mb-0">{{ item.description }}</p>
          </article>
        {% endfor %}
      </div>
    </div>

    <div class="col-12 col-md-4 mt-0">
      <div class="home-highlights__visual-wrap mx-auto position-relative">
        <div class="home-highlights__visual-shell rounded-5 overflow-hidden mx-auto">
          <img src="{{ highlights_section.center_image | relative_url }}" alt="Điểm nổi bật Trạng Nguyên" class="home-highlights__visual img-fluid d-block w-100">
        </div>
      </div>
    </div>

    <div class="col-12 col-md-4 mt-0">
      <div class="d-grid gap-4 gap-md-5">
        {% for item in highlights_section.right_items %}
          <article class="home-highlights__item text-center">
            <img src="{{ item.icon | relative_url }}" alt="" class="home-highlights__icon img-fluid mb-3 m-auto">
            <h3 class="home-highlights__heading fw-normal mb-3">{{ item.title }}</h3>
            <p class="home-highlights__copy mb-0">{{ item.description }}</p>
          </article>
        {% endfor %}
      </div>
    </div>
  </div>
</section>

<section class="home-language-arena mt-5 pt-5 pb-4 pb-lg-5 ">
  <div class="home-language-arena__inner home-section">
  <div class="text-center position-relative z-1">
    <h2 class="home-section__title mb-0">{{ language_arena_section.title }}</h2>
  </div>

  <div class="home-language-arena__crest mx-auto mt-4 mt-lg-5 position-relative" aria-hidden="true">
    <span class="home-language-arena__crest-wing home-language-arena__crest-wing--left"></span>
    <span class="home-language-arena__crest-wing home-language-arena__crest-wing--right"></span>
    <span class="home-language-arena__crest-cap"></span>
    <span class="home-language-arena__crest-brim"></span>
    <span class="home-language-arena__crest-gem"></span>
  </div>

  <div class="home-language-arena__benefits d-grid gap-3 gap-lg-4 mt-4 mt-lg-5">
    {% for benefit in language_arena_section.benefits %}
      <div class="home-language-arena__benefit rounded-4 d-flex align-items-center justify-content-center text-center px-3 px-lg-4 py-4 fw-semibold">
        {{ benefit }}
      </div>
    {% endfor %}
  </div>

  <div class="row g-4 g-xl-5 align-items-stretch mt-4 mt-lg-4">
    <div class="col-12 col-lg-6 mt-0">
      <article class="home-language-arena__panel home-language-arena__panel--timeline rounded-5 h-100 p-4 p-xl-5">
        <div class="home-language-arena__timeline position-relative mx-auto">
          {% for item in language_arena_section.timeline reversed %}
            {% assign timeline_mod = forloop.index0 | modulo: 2 %}
            <div class="home-language-arena__timeline-item d-flex align-items-center justify-content-center w-100{% if timeline_mod == 0 %} is-right{% else %} is-left{% endif %}">
              {% if timeline_mod == 0 %}
                <div class="home-language-arena__timeline-side" aria-hidden="true"></div>
                <div class="home-language-arena__timeline-marker d-flex align-items-center justify-content-center flex-shrink-0">
                  {% if item.marker_image %}
                    <img src="{{ item.marker_image | relative_url }}" alt="" class="img-fluid">
                  {% else %}
                    <span class="home-language-arena__timeline-badge rounded-circle d-inline-flex align-items-center justify-content-center">{{ item.marker_label }}</span>
                  {% endif %}
                </div>
                <div class="home-language-arena__timeline-copy text-start">
                  <h3 class="home-language-arena__timeline-title fw-normal mb-1">{{ item.title }}</h3>
                  <p class="home-language-arena__timeline-period mb-0">{{ item.period }}</p>
                </div>
              {% else %}
                <div class="home-language-arena__timeline-copy text-end">
                  <h3 class="home-language-arena__timeline-title fw-normal mb-1">{{ item.title }}</h3>
                  <p class="home-language-arena__timeline-period mb-0">{{ item.period }}</p>
                </div>
                <div class="home-language-arena__timeline-marker d-flex align-items-center justify-content-center flex-shrink-0">
                  {% if item.marker_image %}
                    <img src="{{ item.marker_image | relative_url }}" alt="" class="img-fluid">
                  {% else %}
                    <span class="home-language-arena__timeline-badge rounded-circle d-inline-flex align-items-center justify-content-center">{{ item.marker_label }}</span>
                  {% endif %}
                </div>
                <div class="home-language-arena__timeline-side" aria-hidden="true"></div>
              {% endif %}
            </div>
          {% endfor %}
        </div>
      </article>
    </div>

    <div class="col-12 col-lg-6 mt-0">
      <article class="home-language-arena__panel rounded-5 h-100 p-4 p-xl-5 d-flex flex-column">
        <div class="d-grid gap-4 gap-sm-3 gap-lg-4">
          {% for article in language_arena_section.articles %}
            <a href="{{ article.href }}" class="home-language-arena__article d-flex align-items-start gap-3 text-decoration-none flex-column flex-sm-row">
              <div class="home-language-arena__article-image rounded-4 overflow-hidden flex-shrink-0">
                <img src="{{ article.image | relative_url }}" alt="{{ article.title }}" class="img-fluid w-100 h-100 object-fit-cover">
              </div>
              <div class="home-language-arena__article-copy min-w-0">
                <span class="home-language-arena__article-date d-inline-flex align-items-center rounded-pill mb-2 px-3 py-1">{{ article.date }}</span>
                <h3 class="home-language-arena__article-title fw-normal mb-0">{{ article.title }}</h3>
              </div>
            </a>
          {% endfor %}
        </div>

        <a href="{{ language_arena_section.cta_href }}" class="home-language-arena__cta btn rounded-pill mt-4 mt-lg-auto px-4 py-3 align-self-stretch align-self-lg-start d-inline-flex align-items-center justify-content-center gap-2">
          <span>{{ language_arena_section.cta_label }}</span>
          <svg stroke="currentColor" fill="none" stroke-width="2.4" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M9 6l6 6l-6 6"></path></svg>
        </a>
      </article>
    </div>
  </div>
  </div>
</section>
<section class="home-events home-section pt-5 pt-xl-6">
  <div class="text-center">
    <img src="{{ featured_events_section.ornament | relative_url }}" alt="" class="home-events__ornament img-fluid mb-3 m-auto">
    <h2 class="home-section__title mb-0">{{ featured_events_section.title }}</h2>
  </div>

  <div class="row g-4 g-lg-5 mt-4 mt-lg-5">
    {% for item in featured_events_section.items %}
      <div class="col-12 col-md-6 col-xl-4 mt-0">
        <a href="{{ item.href }}" class="home-events__card d-block text-decoration-none h-100">
          <div class="home-events__image-wrap rounded-4 overflow-hidden mb-3">
            <img src="{{ item.image | relative_url }}" alt="{{ item.title }}" class="home-events__image img-fluid w-100 h-100 object-fit-contain">
          </div>
          <h3 class="home-events__title fw-normal mb-0">{{ item.title }}</h3>
        </a>
      </div>
    {% endfor %}
  </div>
</section>
<section class="home-spotlight home-section pt-5 pt-xl-6 px-xl-0">
  <div class="home-spotlight__heading text-center position-relative">
    <div class="home-spotlight__title-wrap d-inline-flex flex-column align-items-center position-relative px-4 px-lg-5 pt-3 pb-0">
      <img src="{{ spotlight_section.ornament | relative_url }}" alt="" class="home-spotlight__ornament img-fluid mb-2">
      <h2 class="home-spotlight__heading-title mb-0 home-section__title">{{ spotlight_section.title }}</h2>
      <img src="{{ spotlight_section.accent_image | relative_url }}" alt="" class="home-spotlight__accent img-fluid">
    </div>
  </div>

  <div id="homeSpotlightCarousel" class="carousel slide pb-4" data-bs-touch="false">
    <div class="home-spotlight__frame position-relative">
      <div class="carousel-inner">
        {% for item in spotlight_section.items %}
          <div class="carousel-item{% if forloop.first %} active{% endif %}">
            <div class="home-spotlight__panel rounded-5 p-3 p-lg-4">
              <div class="row align-items-stretch">
                <div class="col-12 col-lg-6 mt-0">
                  <div class="home-spotlight__media overflow-hidden h-100 d-flex align-items-center justify-content-center">
                    <img src="{{ item.image | relative_url }}" alt="{{ item.title }}" class="home-spotlight__image img-fluid w-100 h-100 object-fit-contain rounded-4">
                  </div>
                </div>
                <div class="col-12 col-lg-6 mt-0">
                  <article class="home-spotlight__content rounded-4 h-100 d-flex flex-column justify-content-center p-4 p-xl-5">
                    <h3 class="home-spotlight__title fw-normal mb-3">{{ item.title }}</h3>
                    <p class="home-spotlight__description mb-4">{{ item.description }}</p>
                    <a href="{{ item.href }}" class="home-spotlight__cta btn rounded-pill px-4 py-3 d-inline-flex align-items-center justify-content-center gap-2 align-self-start">
                      <span>{{ spotlight_section.cta_label }}</span>
                      <svg stroke="currentColor" fill="none" stroke-width="2.4" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M9 6l6 6l-6 6"></path></svg>
                    </a>
                  </article>
                </div>
              </div>
            </div>
          </div>
        {% endfor %}
      </div>

      <button class="carousel-control-prev home-spotlight__control opacity-100" type="button" data-bs-target="#homeSpotlightCarousel" data-bs-slide="prev">
        <span class="home-spotlight__control-icon d-inline-flex align-items-center justify-content-center rounded-circle" aria-hidden="true">
          <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M15 6l-6 6l6 6"></path></svg>
        </span>
        <span class="visually-hidden">Slide trước</span>
      </button>
      <button class="carousel-control-next home-spotlight__control opacity-100" type="button" data-bs-target="#homeSpotlightCarousel" data-bs-slide="next">
        <span class="home-spotlight__control-icon d-inline-flex align-items-center justify-content-center rounded-circle" aria-hidden="true">
          <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="30" width="30" xmlns="http://www.w3.org/2000/svg"><path d="M9 6l6 6l-6 6"></path></svg>
        </span>
        <span class="visually-hidden">Slide sau</span>
      </button>
    </div>

    <div class="carousel-indicators position-static mt-4 mb-0 gap-2">
      {% for item in spotlight_section.items %}
        <button type="button" data-bs-target="#homeSpotlightCarousel" data-bs-slide-to="{{ forloop.index0 }}" class="{% if forloop.first %}active {% endif %}home-spotlight__indicator"{% if forloop.first %} aria-current="true"{% endif %} aria-label="Tiêu điểm {{ forloop.index }}"></button>
      {% endfor %}
    </div>
  </div>
</section>
<section class="home-partners home-section pt-5 pt-xl-6">
  <div class="text-center">
    <img src="{{ partners_section.ornament | relative_url }}" alt="" class="home-partners__ornament img-fluid mb-3 m-auto">
    <h2 class="home-section__title mb-0">{{ partners_section.title }}</h2>
  </div>

  <div class="home-partners__grid mt-4 mt-lg-5">
    {% for item in partners_section.items %}
      <article class="home-partners__item text-center">
        <div class="home-partners__logo-wrap d-flex align-items-center justify-content-center mb-3 mx-auto">
          <img src="{{ item.image }}" alt="{{ item.title }}" class="home-partners__logo img-fluid">
        </div>
        <h3 class="home-partners__name fw-normal mb-0">{{ item.title }}</h3>
      </article>
    {% endfor %}
  </div>
</section>
<section class="home-experts mt-5 pt-5 pb-5 pb-lg-6 px-3">
  <div class="home-experts__inner home-section">
    <div class="text-center position-relative z-1">
      <img src="{{ experts_section.ornament | relative_url }}" alt="" class="home-experts__ornament img-fluid mb-3 m-auto">
      <h2 class="home-section__title mb-0">{{ experts_section.title }}</h2>
    </div>

    <div class="home-experts__grid mt-4 mt-lg-5">
      {% for item in experts_section.items %}
        <article class="home-experts__card rounded-5 h-100 position-relative">
          <div class="home-experts__card-body d-flex flex-column h-100">
            <p class="home-experts__quote text-center mb-4">{{ item.quote }}</p>
            <div class="home-experts__portrait-wrap mt-auto d-flex align-items-end justify-content-center">
              <img src="{{ item.image }}" alt="{{ item.name }}" class="home-experts__portrait img-fluid">
            </div>
            <div class="home-experts__meta rounded-5 text-center mx-auto">
              <p class="home-experts__role mb-2">{{ item.role }}</p>
              <h3 class="home-experts__name fw-normal mb-0">{{ item.name }}</h3>
            </div>
          </div>
        </article>
      {% endfor %}
    </div>
  </div>
</section>