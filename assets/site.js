const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const wordpressBlogUrl = "https://parlayordie.wordpress.com";

document.querySelectorAll('a[href^="http"]').forEach((link) => {
  link.target = "_blank";
  link.rel = "noopener noreferrer";
});

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

const form = document.querySelector(".contact-form");

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const note = form.querySelector(".form-note");
    if (note) {
      note.textContent =
        "Inquiry details are ready locally. Use the official social links beside the form to send it through the best Parlay or Die channel.";
    }
  });
}

const lightboxButtons = document.querySelectorAll("[data-lightbox-image]");

if (lightboxButtons.length) {
  const lightbox = document.createElement("div");
  lightbox.className = "image-lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Expanded image");
  lightbox.innerHTML = `
    <button class="image-lightbox-close" type="button" aria-label="Close expanded image">&times;</button>
    <img src="" alt="" />
  `;
  document.body.append(lightbox);

  const lightboxImage = lightbox.querySelector("img");
  const closeButton = lightbox.querySelector(".image-lightbox-close");

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  lightboxButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!lightboxImage) return;
      lightboxImage.src = button.dataset.lightboxImage || "";
      lightboxImage.alt = button.dataset.lightboxAlt || "";
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
      closeButton?.focus();
    });
  });

  closeButton?.addEventListener("click", closeLightbox);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
      closeLightbox();
    }
  });
}

const blogTargets = document.querySelectorAll("[data-wp-posts]");

const decodeHtml = (html) => {
  const parser = new DOMParser();
  return parser.parseFromString(html || "", "text/html").documentElement.textContent || "";
};

const stripHtml = (html) => {
  const parser = new DOMParser();
  return parser.parseFromString(html || "", "text/html").body.textContent || "";
};

const formatDate = (dateValue) => {
  if (!dateValue) return "Latest post";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateValue));
};

const renderBlogPost = (post) => {
  const title = decodeHtml(post.title?.rendered || "Untitled post");
  const excerpt = stripHtml(post.excerpt?.rendered || "").trim();
  const link = post.link || "#";
  const date = formatDate(post.date);

  return `
    <article class="blog-card">
      <span>${date}</span>
      <h3>${title}</h3>
      <p>${excerpt || "Open the full post on WordPress for the latest from Parlay or Die."}</p>
      <a href="${link}">Read post</a>
    </article>
  `;
};

const loadWordPressPosts = async () => {
  if (!blogTargets.length || !wordpressBlogUrl) return;

  const baseUrl = wordpressBlogUrl.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/wp-json/wp/v2/posts?per_page=12&_fields=date,excerpt,link,title`);

  if (!response.ok) {
    throw new Error("WordPress posts unavailable");
  }

  const posts = await response.json();

  blogTargets.forEach((target) => {
    const mode = target.dataset.wpPosts;
    const visiblePosts = mode === "latest" ? posts.slice(0, 1) : posts.slice(1);

    if (!visiblePosts.length) {
      target.innerHTML = `
        <article class="blog-card placeholder-card">
          <span>WordPress</span>
          <h3>No older posts yet</h3>
          <p>The latest post is featured on the homepage. Older posts will appear here as the blog grows.</p>
          <a href="${baseUrl}">Open WordPress</a>
        </article>
      `;
      return;
    }

    target.innerHTML = visiblePosts.map(renderBlogPost).join("");
  });
};

loadWordPressPosts().catch(() => {
  blogTargets.forEach((target) => {
    target.classList.add("feed-error");
  });
});
