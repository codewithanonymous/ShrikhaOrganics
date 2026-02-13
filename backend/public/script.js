/**
 * Adhyat Global - Ultra Luxury Animation & Pricing Engine
 * Focus: High-inertia motion, dynamic pricing, and cross-device optimization.
 */

// Register GSAP Plugin
gsap.registerPlugin(ScrollTrigger);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger);

    // Initialize the sticky stack gallery
    initStickyStack();

    // Load products dynamically into the products section
    loadDynamicProducts();

    // Initialize individual section internal animations
    initAboutSection();
    initContactSection();

    // Smart Resize Handler (Ignores vertical-only resizes caused by URL bar)
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
        if (window.innerWidth !== lastWidth) {
            refreshStickyTops();
            lastWidth = window.innerWidth;
        }
    });

    // Add smooth scrolling to in-page anchor links (ignore href="#")
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;

            let target;
            try {
                target = document.querySelector(href);
            } catch {
                return;
            }

            if (!target) return;
            e.preventDefault();
            window.scrollTo({
                top: target.offsetTop - 100,
                behavior: 'smooth'
            });
        });
    });

    // Refresh ScrollTrigger after all fonts are loaded
    window.addEventListener('load', () => {
        ScrollTrigger.refresh();
    });

    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger-menu');
    const navLinks = document.querySelector('.nav-links');
    const header = document.querySelector('.main-header');
    const navIcons = document.querySelector('.nav-icons');
    const body = document.body;

    const isMobileNav = () => window.matchMedia('(max-width: 768px)').matches;

    const syncMobileHeaderUI = () => {
        if (!navIcons) return;
        if (isMobileNav()) {
            navIcons.style.display = 'none';
        } else {
            navIcons.style.display = '';
        }
    };

    const closeNav = () => {
        body.classList.remove('nav-active');
        if (hamburger) {
            hamburger.classList.remove('is-active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
    };

    const openNav = () => {
        body.classList.add('nav-active');
        if (hamburger) {
            hamburger.classList.add('is-active');
            hamburger.setAttribute('aria-expanded', 'true');
        }
    };

    if (hamburger && navLinks) {
        syncMobileHeaderUI();

        hamburger.setAttribute('role', 'button');
        hamburger.setAttribute('tabindex', '0');
        hamburger.setAttribute('aria-expanded', 'false');

        hamburger.addEventListener('click', (e) => {
            // Only run the drawer behavior when we're in the mobile breakpoint
            if (!isMobileNav()) return;
            e.stopPropagation();

            if (body.classList.contains('nav-active')) {
                closeNav();
            } else {
                openNav();
            }
        });

        hamburger.addEventListener('keydown', (e) => {
            if (!isMobileNav()) return;
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            hamburger.click();
        });

        // Close menu when clicking any nav link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                if (!isMobileNav()) return;
                // Prevent jumping to top for placeholder links
                if (link.getAttribute('href') === '#') e.preventDefault();
                closeNav();
            });
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!isMobileNav()) return;
            if (!body.classList.contains('nav-active')) return;
            if (header && header.contains(e.target)) return;
            closeNav();
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (!isMobileNav()) return;
            if (e.key !== 'Escape') return;
            closeNav();
        });

        // Ensure menu closes when resizing back to desktop
        window.addEventListener('resize', () => {
            syncMobileHeaderUI();
            if (!isMobileNav()) closeNav();
        });
    }
});

function getWebsiteProductImageSrc(imageUrl) {
    if (!imageUrl) return null;

    // Absolute or data URLs – use as-is
    if (/^(https?:)?\/\//i.test(imageUrl) || imageUrl.startsWith('data:')) {
        return imageUrl;
    }

    // Starts with /uploads – serve from backend
    if (imageUrl.startsWith('/uploads/')) {
        return imageUrl;
    }

    // Bare filename – assume it lives in /uploads on backend
    return `/uploads/${imageUrl}`;
}

// Fallback function for missing images
function getFallbackImageForProduct(productName) {
    const imageMap = {
        'Herbel dhoop': '/uploads/Sambrani powder.jpeg',
        'Herbal bath powder': '/uploads/Herbal bath powder.jpeg',
        'Herbal henna Powder': '/uploads/Herbal henna-powder.jpeg',
        'kumkuma': '/uploads/kumkuma.jpeg'
    };
    
    return imageMap[productName] || null;
}

// Load products from backend and render into the marketing site
async function loadDynamicProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    try {
        const response = await fetch('/api/products/public');
        if (!response.ok) {
            console.error('Failed to load products for website');
            return;
        }

        const products = await response.json();
        console.log('Products loaded:', products); // Debug log
        grid.innerHTML = '';

        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';

            const priceNumber = Number(product.price);
            const formattedPrice = Number.isFinite(priceNumber)
                ? `₹${priceNumber.toFixed(2)}`
                : '';

            const imgSrc = getWebsiteProductImageSrc(product.image_url);
            console.log('Product:', product.name, 'Database Image URL:', product.image_url, 'Processed src:', imgSrc); // Debug log

            card.innerHTML = `
                <div class="product-image-container">
                    ${
                        imgSrc
                            ? `<img src="${imgSrc}" alt="${product.name}" class="product-img" onerror="this.onerror=null; this.src='${getFallbackImageForProduct(product.name) || '/assets/placeholder.jpg'}';">`
                            : `<div class="product-img" style="background:#f5f5f5;display:flex;align-items:center;justify-content:center;color:#999;">No Image</div>`
                    }
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">${formattedPrice}</p>
                    <p class="product-description">${product.description || 'Discover the perfect balance of nature and wellness with our carefully crafted products.'}</p>
                    <a href="mailto:info@shrikhaorganics.com?subject=Hello%20Shrikha%20Organics!%0A%0AI'm%20interested%20in%20your%20${
                        encodeURIComponent(product.name || 'product')
                    }.%0A%0ACould%20you%20please%20provide%20more%20details%20about%3A%0A%20Product%20benefits%20and%20usage%0A%20Available%20sizes%20and%20pricing%0A%20Ordering%20process%0A%20Thank%20you!" class="btn-cta btn-add-to-cart">Buy Now</a>
                </div>
            `;

            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading products for website:', error);
    }
}

function initAboutSection() {
    const section = document.querySelector('.about-section');
    if (!section) return;

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
        }
    });

    tl.from(section.querySelector('.about-media'), {
        opacity: 0,
        y: 28,
        duration: 0.8,
        ease: 'power3.out'
    })
        .from(section.querySelector('.about-title'), {
            opacity: 0,
            y: 18,
            duration: 0.7,
            ease: 'power3.out'
        }, '-=0.5');

    const texts = section.querySelectorAll('.about-text');
    if (texts.length) {
        tl.from(texts, {
            opacity: 0,
            y: 14,
            duration: 0.6,
            stagger: 0.12,
            ease: 'power3.out'
        }, '-=0.45');
    }

    const highlights = section.querySelectorAll('.about-highlight');
    if (highlights.length) {
        tl.from(highlights, {
            opacity: 0,
            y: 18,
            duration: 0.6,
            stagger: 0.12,
            ease: 'power3.out'
        }, '-=0.35');
    }
}

// ====================================
// MODERN AYURVEDIC HERITAGE GALLERY
// ====================================

// Initialize Sticky Stack Gallery
// Initialize Sticky Stack Gallery
function initStickyStack() {
    // Use ScrollTrigger.matchMedia for responsive animations
    ScrollTrigger.matchMedia({
        // Desktop Only: Sticky Stack Animation
        "(min-width: 769px)": function () {
            const cards = gsap.utils.toArray('.product-stack .product-card');
            if (cards.length === 0) return;

            // 1. Initial Setup
            // Ensure cards are sticky and Z-index increases
            cards.forEach((card, i) => {
                gsap.set(card, {
                    zIndex: i + 1,
                    position: 'sticky',
                    top: '8vh'
                });
                if (i === 0) card.classList.add('is-active');
            });

            // 2. Create ScrollTriggers
            cards.forEach((card, i) => {
                if (i === 0) return; // Skip first card

                const prevCard = cards[i - 1];

                // Trigger: Burial Effect
                gsap.to(prevCard, {
                    scrollTrigger: {
                        trigger: card,
                        start: "top 80%",
                        end: "top 8vh",
                        scrub: true,
                        toggleActions: "play reverse play reverse",
                    },
                    scale: 0.9,
                    opacity: 0,
                    filter: "blur(8px)",
                    ease: "none"
                });

                // Active State Toggle
                ScrollTrigger.create({
                    trigger: card,
                    start: "top 55%",
                    onEnter: () => {
                        card.classList.add('is-active');
                        prevCard.classList.remove('is-active');
                    },
                    onLeaveBack: () => {
                        card.classList.remove('is-active');
                        prevCard.classList.add('is-active');
                    }
                });
            });
        },

        // Mobile Only: Cleanup
        "(max-width: 768px)": function () {
            // Ensure clean state for mobile by clearing GSAP props
            gsap.set('.product-stack .product-card', {
                clearProps: "all"
            });
        }
    });

    // 3. Refresh
    ScrollTrigger.refresh();
}

/**
 * Internal section animations
 */

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

/**
 * Contact Us Section GSAP ScrollTrigger Animation
 * Handles the reveal animation for the Contact Us section after testimonials
 */
function initContactSection() {
    const contactSection = document.getElementById('contact');
    const testimonialsSection = document.getElementById('testimonials');

    if (!contactSection || !testimonialsSection) return;

    // Set initial state (hidden)
    // Set initial state for contact section (visible by default)
    gsap.set(contactSection, {
        opacity: 1,
        y: 0
    });

    gsap.set('.contact-header', {
        opacity: 1,
        y: 0
    });

    gsap.set('.contact-links', {
        opacity: 1,
        y: 0
    });

    // Contact section is now visible by default, no ScrollTrigger needed
}

// Refresh sticky positions for responsive behavior
function refreshStickyTops() {
    const cards = gsap.utils.toArray('.product-stack .product-card');
    if (cards.length === 0) return;
    
    cards.forEach((card, i) => {
        gsap.set(card, {
            top: '8vh'
        });
    });
}

// End of script
