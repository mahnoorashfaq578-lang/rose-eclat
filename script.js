
const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
const navButton = document.querySelector(".nav-button");
const navLinks = document.getElementById("navLinks");

// LIGHT / DARK THEME
function setTheme(theme) {
  root.setAttribute("data-theme", theme);

  const icon = document.querySelector(".theme-icon i");
  const label = document.querySelector(".theme-label");

  if (icon) {
    icon.className = theme === "dark"
      ? "fa-solid fa-moon"
      : "fa-solid fa-sun";
  }

  if (label) {
    label.textContent = theme === "dark" ? "DARK MODE" : "LIGHT MODE";
  }

  try {
    localStorage.setItem("roseTheme", theme);
  } catch (error) {
    // Theme toggle still works without local storage.
  }
}

let savedTheme = "light";

try {
  savedTheme = localStorage.getItem("roseTheme") || "light";
} catch (error) {
  savedTheme = "light";
}

setTheme(savedTheme === "dark" ? "dark" : "light");

if (themeToggle) {
  themeToggle.addEventListener("click", function () {
    const currentTheme = root.getAttribute("data-theme");
    setTheme(currentTheme === "dark" ? "light" : "dark");
  });
}

// MOBILE NAVIGATION
if (navButton && navLinks) {
  navButton.addEventListener("click", function (event) {
    if (window.innerWidth <= 760) {
      event.preventDefault();

      const isOpen = navLinks.classList.toggle("open");

      navButton.setAttribute("aria-expanded", String(isOpen));

      navButton.innerHTML = isOpen
        ? '<span>Close</span><i class="fa-solid fa-xmark"></i>'
        : '<span>Explore Scents</span><i class="fa-solid fa-arrow-right"></i>';
    }
  });

  navLinks.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      navLinks.classList.remove("open");

      navButton.setAttribute("aria-expanded", "false");

      navButton.innerHTML =
        '<span>Explore Scents</span><i class="fa-solid fa-arrow-right"></i>';
    });
  });
}

// ACTIVE NAVIGATION LINK
const navItems = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("main section[id]");

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        navItems.forEach(function (link) {
          const active = link.getAttribute("href") === "#" + entry.target.id;
          link.classList.toggle("active", active);
        });
      }
    });
  }, {
    rootMargin: "-25% 0px -60% 0px"
  });

  sections.forEach(function (section) {
    sectionObserver.observe(section);
  });
}

// GSAP ANIMATIONS
window.addEventListener("load", function () {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (typeof gsap === "undefined" || reducedMotion) {
    document.querySelectorAll(".reveal").forEach(function (element) {
      element.style.opacity = "1";
      element.style.transform = "none";
    });

    return;
  }

  // Hero entrance animation
  const heroTimeline = gsap.timeline({
    defaults: {
      ease: "power3.out"
    }
  });

  heroTimeline
    .from(".hero .eyebrow", {
      opacity: 0,
      y: 18,
      duration: 0.7
    })
    .from(".hero-title", {
      opacity: 0,
      y: 35,
      duration: 1
    }, "-=0.35")
    .from(".hero-description", {
      opacity: 0,
      y: 18,
      duration: 0.7
    }, "-=0.5")
    .from(".hero-actions", {
      opacity: 0,
      y: 15,
      duration: 0.7
    }, "-=0.45")
    .from(".hero-product", {
      opacity: 0,
      scale: 0.94,
      duration: 1
    }, "-=0.9");

  // Reveal content when sections enter the viewport
  if (typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray(".reveal").forEach(function (element) {
      gsap.fromTo(element,
        {
          opacity: 0,
          y: 28
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: "power2.out",
          clearProps: "transform",
          scrollTrigger: {
            trigger: element,
            start: "top 88%",
            once: true
          }
        }
      );
    });

    // Staggered perfume cards
    gsap.fromTo(".perfume-card",
      {
        opacity: 0,
        y: 28
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.75,
        stagger: 0.14,
        ease: "power2.out",
        clearProps: "transform",
        scrollTrigger: {
          trigger: ".perfume-grid",
          start: "top 86%",
          once: true
        }
      }
    );

    // Gentle banner image movement on scroll
    gsap.fromTo(".banner-photo img",
      {
        scale: 1.08
      },
      {
        scale: 1,
        ease: "none",
        scrollTrigger: {
          trigger: ".signature-banner",
          start: "top bottom",
          end: "bottom top",
          scrub: 1
        }
      }
    );
  }
});

