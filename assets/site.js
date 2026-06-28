const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const wordpressBlogUrl = "https://parlayordie.wordpress.com";
const wordpressApiUrl =
  "https://public-api.wordpress.com/rest/v1.1/sites/parlayordie.wordpress.com/posts/?number=12&fields=ID,title,URL,date,excerpt,status";
const starterBlogPost = {
  date: "2026-06-25T00:00:00-04:00",
  title: "Welcome to the Parlay or Die Blog",
  link: wordpressBlogUrl,
  excerpt:
    "The blog is where Parlay or Die can stretch out beyond the clips: sports notes, betting angles, show updates, local stories, and whatever game-day chaos deserves more than a caption.",
};

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

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatDate = (dateValue) => {
  if (!dateValue) return "Latest post";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateValue));
};

const renderBlogPost = (post) => {
  const title = decodeHtml(post.title?.rendered || post.title || "Untitled post");
  const excerpt = stripHtml(post.excerpt?.rendered || post.excerpt || "").trim();
  const link = post.link || post.URL || "#";
  const date = formatDate(post.date);

  return `
    <article class="blog-card">
      <span>${escapeHtml(date)}</span>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(excerpt || "Open the full post on WordPress for the latest from Parlay or Die.")}</p>
      <a href="${escapeHtml(link)}">Read post</a>
    </article>
  `;
};

const loadWordPressData = () =>
  new Promise((resolve, reject) => {
    const callbackName = `parlayWordPressPosts_${Date.now()}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("WordPress posts unavailable"));
    }, 7000);
    const cleanup = () => {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    };

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("WordPress posts unavailable"));
    };

    script.src = `${wordpressApiUrl}&callback=${callbackName}`;
    script.async = true;
    document.head.append(script);
  });

const loadWordPressPosts = async () => {
  if (!blogTargets.length || !wordpressBlogUrl) return;

  const baseUrl = wordpressBlogUrl.replace(/\/$/, "");
  const data = await loadWordPressData();
  const posts = Array.isArray(data) ? data : data.posts || [];
  const publishedPosts = posts.filter((post) => post.status !== "draft");
  const postsToRender = publishedPosts.length ? publishedPosts : [starterBlogPost];

  blogTargets.forEach((target) => {
    const mode = target.dataset.wpPosts;
    const visiblePosts = mode === "latest" ? postsToRender.slice(0, 1) : postsToRender.slice(1);

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
    target.innerHTML = renderBlogPost(starterBlogPost);
  });
});
