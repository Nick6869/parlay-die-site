const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");

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
