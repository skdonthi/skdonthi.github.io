// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
toggle?.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
navLinks?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// Scroll-triggered fade-up animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-up');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll(
  '.timeline-card, .skill-group, .blog-card, .stat-card, .cert-card, .contact-link'
).forEach(el => observer.observe(el));

// Open principle card
window.activateOpenPrinciple = function activateOpenPrinciple() {
  const card = document.getElementById('open-principle');
  if (card.classList.contains('is-editing')) return;

  card.classList.add('is-editing');
  card.classList.remove('is-saved');

  const title = document.getElementById('open-principle-title');
  const desc = document.getElementById('open-principle-desc');
  const edit = document.getElementById('open-principle-edit');
  const inputTitle = document.getElementById('open-principle-input-title');
  const inputDesc = document.getElementById('open-principle-input-desc');

  // pre-fill if already saved
  if (card.dataset.savedTitle) {
    inputTitle.value = card.dataset.savedTitle;
    inputDesc.value = card.dataset.savedDesc;
  }

  title.style.display = 'none';
  desc.style.display = 'none';
  edit.style.display = 'flex';
  inputTitle.focus();
}

window.savePrinciple = function savePrinciple() {
  const card = document.getElementById('open-principle');
  const inputTitle = document.getElementById('open-principle-input-title');
  const inputDesc = document.getElementById('open-principle-input-desc');
  const title = document.getElementById('open-principle-title');
  const desc = document.getElementById('open-principle-desc');
  const edit = document.getElementById('open-principle-edit');

  const t = inputTitle.value.trim();
  const d = inputDesc.value.trim();

  if (!t) { inputTitle.focus(); return; }

  card.dataset.savedTitle = t;
  card.dataset.savedDesc = d;

  title.textContent = t;
  desc.textContent = d || 'A principle that drives this team forward.';

  title.style.display = '';
  desc.style.display = '';
  edit.style.display = 'none';

  card.classList.remove('is-editing');
  card.classList.add('is-saved');
}

window.cancelPrinciple = function cancelPrinciple() {
  const card = document.getElementById('open-principle');
  const title = document.getElementById('open-principle-title');
  const desc = document.getElementById('open-principle-desc');
  const edit = document.getElementById('open-principle-edit');

  if (!card.dataset.savedTitle) {
    title.textContent = 'Your Principle';
    desc.textContent = "What value matters most to your team? Click to add it — I'm here to adapt, grow, and build around what makes your organisation excellent.";
  }

  title.style.display = '';
  desc.style.display = '';
  edit.style.display = 'none';
  card.classList.remove('is-editing');
}

// Active nav link highlight on scroll
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navAnchors.forEach(a => {
        a.style.color = a.getAttribute('href') === `#${id}` ? 'var(--text-1)' : '';
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));
