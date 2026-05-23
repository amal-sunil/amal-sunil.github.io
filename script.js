document.addEventListener("DOMContentLoaded", function () {

    // Set up the Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            // If the element scrolls into view
            if (entry.isIntersecting) {
                // Add the 'active' class to trigger the CSS animation
                entry.target.classList.add('active');

                // Stop observing once it has animated in once
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.05, // Trigger when 5% of the element is visible
        rootMargin: "0px 0px -60px 0px" // Trigger slightly before it hits the viewport bottom
    });

    // Find all elements with the reveal classes and watch them
    const hiddenElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
    hiddenElements.forEach((el) => observer.observe(el));

    // Scroll-Linked & Velocity Animation Variables
    let lastScrollY = window.scrollY;
    let currentVelocity = 0;
    let targetVelocity = 0;
    const marquee = document.querySelector('.marquee-content');

    function tick() {
        const scrollY = window.scrollY;

        // Calculate raw velocity (delta Y)
        const rawVelocity = scrollY - lastScrollY;
        lastScrollY = scrollY;

        // Smooth out the velocity using linear interpolation (lerp)
        targetVelocity = Math.abs(rawVelocity);
        currentVelocity += (targetVelocity - currentVelocity) * 0.1;

        // Set CSS variables on root document element
        document.documentElement.style.setProperty('--scroll-y', scrollY);
        document.documentElement.style.setProperty('--scroll-velocity', currentVelocity);

        // Dynamic Marquee Speed: Make marquee spin faster when scrolling fast without resetting it
        if (marquee) {
            if (typeof marquee.getAnimations === 'function') {
                const animation = marquee.getAnimations()[0];
                if (animation) {
                    // Base duration is 15s (playbackRate = 1).
                    // As scroll velocity increases, we increase the playbackRate up to 6x.
                    const targetPlaybackRate = 1 + currentVelocity * 0.05;
                    animation.playbackRate = Math.min(6, targetPlaybackRate);
                }
            } else {
                // Fallback for older browsers
                const duration = Math.max(2.5, 15 - currentVelocity * 0.15);
                marquee.style.animationDuration = `${duration}s`;
            }
        }

        requestAnimationFrame(tick);
    }

    // Initialize animation loop
    requestAnimationFrame(tick);

});