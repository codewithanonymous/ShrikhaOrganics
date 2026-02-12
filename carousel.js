// Modern Infinite Carousel with GSAP for Smooth Infinite scroll
class InfiniteCarousel {
    constructor() {
        this.track = document.querySelector('.carousel-track');
        this.cards = document.querySelectorAll('.testimonial-card');
        this.wrapper = document.querySelector('.carousel-wrapper');

        if (!this.track || !this.cards.length || !this.wrapper) {
            console.log('Carousel elements not found');
            return;
        }

        this.originalCards = Array.from(this.cards);
        this.totalOriginalCards = this.originalCards.length;
        this.cardWidth = 0;
        this.gap = 0;
        this.animation = null;
        this.isMobile = window.matchMedia('(max-width: 768px)').matches;

        this.init();
    }

    init() {
        // Setup initial state
        this.setupDimensions();
        this.cloneCards();
        this.setupGSAP();
        this.setupEventListeners();

        window.addEventListener('resize', () => {
            if (this.animation) this.animation.kill();
            this.setupDimensions();
            this.setupGSAP();
        });
    }

    setupDimensions() {
        const card = this.allCards ? this.allCards[0] : this.originalCards[0];
        const trackStyle = window.getComputedStyle(this.track);
        this.cardWidth = card.offsetWidth;
        const gapValue = trackStyle.gap;
        this.gap = (gapValue && gapValue !== 'normal') ? parseInt(gapValue) : 32; // Default 2rem = 32px
    }

    cloneCards() {
        // Clear track and re-clone for infinite feel
        // We clone twice to have enough content for seamless loop
        this.track.innerHTML = '';
        const allCardsHTML = [];

        // Original Set
        this.originalCards.forEach(card => allCardsHTML.push(card.outerHTML));
        // Clone Set
        this.originalCards.forEach(card => {
            const clone = card.cloneNode(true);
            allCardsHTML.push(clone.outerHTML);
        });
        // Second Clone Set for very wide screens
        this.originalCards.forEach(card => {
            const clone = card.cloneNode(true);
            allCardsHTML.push(clone.outerHTML);
        });

        this.track.innerHTML = allCardsHTML.join('');
        this.allCards = this.track.querySelectorAll('.testimonial-card');
    }

    setupGSAP() {
        this.currentIndex = 0;
        this.stepWidth = this.cardWidth + this.gap;
        this.isAnimating = false;
        this.isPaused = false;

        // Reset scroll position
        this.track.scrollLeft = 0;

        // Start the stepped animation loop
        this.startSteppedAnimation();

        // Pause on hover for desktop
        if (!this.isMobile) {
            this.wrapper.addEventListener('mouseenter', () => {
                this.isPaused = true;
                if (this.currentTween) this.currentTween.pause();
            });
            this.wrapper.addEventListener('mouseleave', () => {
                this.isPaused = false;
                if (this.currentTween) this.currentTween.play();
                else this.startSteppedAnimation();
            });
        }
    }

    startSteppedAnimation() {
        if (this.isPaused) return;

        // Duration to read the card: 3 seconds
        gsap.delayedCall(2.7, () => {
            if (this.isPaused) return;
            this.moveNext();
        });
    }

    moveNext() {
        if (this.isAnimating || this.isPaused) return;
        this.isAnimating = true;

        const targetScroll = (this.currentIndex + 1) * this.stepWidth;

        this.currentTween = gsap.to(this.track, {
            scrollLeft: targetScroll,
            duration: 0.8,
            ease: "power2.inOut",
            onComplete: () => {
                this.isAnimating = false;
                this.currentIndex++;

                // Seamless Loop Check
                if (this.currentIndex >= this.totalOriginalCards) {
                    this.track.scrollLeft = 0;
                    this.currentIndex = 0;
                }

                this.startSteppedAnimation();
            }
        });
    }

    setupEventListeners() {
        // Remove touch/drag interactions on mobile as requested
        if (this.isMobile) {
            this.track.style.pointerEvents = 'none'; // Disable horizontal interaction
            this.wrapper.style.touchAction = 'pan-y'; // Allow vertical page scroll

            // Re-enable pointer events for buttons if they exist
            this.allCards.forEach(card => {
                const btn = card.querySelector('.testimonial-btn');
                if (btn) btn.style.pointerEvents = 'auto';
            });
        }

        // Handle buttons within cards (Read More)
        this.allCards.forEach(card => {
            const btn = card.querySelector('.testimonial-btn');
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log('Review button clicked');
                });
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new InfiniteCarousel();
});

