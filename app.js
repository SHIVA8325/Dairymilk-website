/* ==========================================================================
   FEVICOL CHOCO LTD - SCROLL ANIMATION ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Configuration
    const TOTAL_FRAMES = 240;
    const FRAME_PREFIX = 'frames/ezgif-frame-';
    const FRAME_EXTENSION = '.jpg';
    
    // DOM Elements
    const canvas = document.getElementById('hero-canvas');
    const ctx = canvas.getContext('2d');
    const loader = document.getElementById('loader');
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');
    const frameScrubber = document.getElementById('frame-scrubber');
    const frameCounter = document.getElementById('frame-counter');
    const playBtn = document.getElementById('play-btn');
    const playIcon = document.getElementById('play-icon');
    const speedBtn = document.getElementById('speed-btn');
    const soundToggle = document.getElementById('sound-toggle');
    const fitToggle = document.getElementById('fit-toggle');
    const storySections = document.querySelectorAll('.story-section');

    // State Variables
    const images = [];
    let loadedImagesCount = 0;
    let currentFrameIndex = 0;
    let targetFrameIndex = 0;
    let isAutoPlaying = false;
    let autoPlaySpeed = 1; // 1x, 2x, 0.5x
    let autoPlayTimer = null;
    let canvasFitMode = 'cover'; // 'cover' or 'contain'
    let isAudioMuted = true;
    let audioContext = null;

    // Helper: format index to 3 digits (e.g., 1 -> 001, 25 -> 025)
    function formatFrameNumber(num) {
        return num.toString().padStart(3, '0');
    }

    // --------------------------------------------------------------------------
    // 1. Frame Preloader Engine
    // --------------------------------------------------------------------------
    function preloadFrames() {
        for (let i = 1; i <= TOTAL_FRAMES; i++) {
            const img = new Image();
            const frameSrc = `${FRAME_PREFIX}${formatFrameNumber(i)}${FRAME_EXTENSION}`;
            
            img.onload = () => {
                loadedImagesCount++;
                const progress = Math.floor((loadedImagesCount / TOTAL_FRAMES) * 100);
                
                loadingBar.style.width = `${progress}%`;
                loadingText.textContent = `Crafting Pure Indulgence... ${progress}%`;

                if (loadedImagesCount === TOTAL_FRAMES) {
                    onAllFramesLoaded();
                }
            };

            img.onerror = () => {
                console.warn(`Failed to load frame: ${frameSrc}`);
                loadedImagesCount++;
                if (loadedImagesCount === TOTAL_FRAMES) {
                    onAllFramesLoaded();
                }
            };

            img.src = frameSrc;
            images.push(img);
        }
    }

    function onAllFramesLoaded() {
        setTimeout(() => {
            loader.classList.add('loaded');
            resizeCanvas();
            renderFrame(0);
            startRenderLoop();
        }, 300);
    }

    // --------------------------------------------------------------------------
    // 2. High-DPI Canvas Rendering Engine
    // --------------------------------------------------------------------------
    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        const height = window.innerHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.scale(dpr, dpr);
        renderFrame(Math.round(currentFrameIndex));
    }

    function renderFrame(index) {
        const frame = images[index];
        if (!frame || !frame.complete) return;

        const canvasWidth = window.innerWidth;
        const canvasHeight = window.innerHeight;
        const imgWidth = frame.naturalWidth || 1920;
        const imgHeight = frame.naturalHeight || 1080;

        // Fill background with dark violet to eliminate subpixel seam lines
        ctx.fillStyle = '#160033';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Aspect ratio calculations
        const imgRatio = imgWidth / imgHeight;
        const canvasRatio = canvasWidth / canvasHeight;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (canvasFitMode === 'cover') {
            if (canvasRatio > imgRatio) {
                drawWidth = canvasWidth;
                drawHeight = canvasWidth / imgRatio;
            } else {
                drawWidth = canvasHeight * imgRatio;
                drawHeight = canvasHeight;
            }
        } else { // contain mode
            if (canvasRatio > imgRatio) {
                drawHeight = canvasHeight;
                drawWidth = canvasHeight * imgRatio;
            } else {
                drawWidth = canvasWidth;
                drawHeight = canvasWidth / imgRatio;
            }
        }

        // Add 2px overhang to eliminate edge anti-aliasing line artifacts
        drawWidth = Math.ceil(drawWidth) + 2;
        drawHeight = Math.ceil(drawHeight) + 2;
        offsetX = Math.floor((canvasWidth - drawWidth) / 2);
        offsetY = Math.floor((canvasHeight - drawHeight) / 2);

        ctx.drawImage(frame, offsetX, offsetY, drawWidth, drawHeight);
    }

    // --------------------------------------------------------------------------
    // 3. Smooth Lerping Animation Loop (Scroll Driven)
    // --------------------------------------------------------------------------
    function calculateTargetFrameFromScroll() {
        if (isAutoPlaying) return;

        const heroWrapper = document.getElementById('hero-experience');
        if (!heroWrapper) return;

        const containerTop = heroWrapper.offsetTop;
        const containerHeight = heroWrapper.offsetHeight - window.innerHeight;
        if (containerHeight <= 0) return;

        const scrollY = window.scrollY;
        const scrollFraction = Math.min(1, Math.max(0, (scrollY - containerTop) / containerHeight));
        
        targetFrameIndex = Math.min(TOTAL_FRAMES - 1, Math.floor(scrollFraction * TOTAL_FRAMES));

        // Animate centered overlay text: Fade in at start, fade out slowly as user scrolls 30% of the section
        const textOverlay = document.getElementById('hero-text-overlay');
        if (textOverlay) {
            const FADE_OUT_THRESHOLD = 0.30; // 30% of the hero section
            if (scrollFraction <= FADE_OUT_THRESHOLD) {
                const textOpacity = 1 - (scrollFraction / FADE_OUT_THRESHOLD);
                textOverlay.style.opacity = textOpacity.toFixed(3);
                textOverlay.style.transform = `translateY(-${(scrollFraction / FADE_OUT_THRESHOLD) * 40}px)`;
                textOverlay.style.pointerEvents = textOpacity < 0.1 ? 'none' : 'auto';
            } else {
                textOverlay.style.opacity = '0';
                textOverlay.style.transform = `translateY(-40px)`;
                textOverlay.style.pointerEvents = 'none';
            }
        }
    }

    function startRenderLoop() {
        function tick() {
            calculateTargetFrameFromScroll();

            // Smooth linear interpolation (lerp)
            const diff = targetFrameIndex - currentFrameIndex;
            if (Math.abs(diff) > 0.01) {
                currentFrameIndex += diff * 0.15;
                const roundedIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(currentFrameIndex)));
                
                renderFrame(roundedIndex);
                updateUIState(roundedIndex);
            }

            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    // Update controls & story section active state
    function updateUIState(frameIndex) {
        // Update scrubber slider & text if present
        if (frameScrubber) frameScrubber.value = frameIndex + 1;
        if (frameCounter) frameCounter.textContent = `${frameIndex + 1} / ${TOTAL_FRAMES}`;

        // Highlight active story card based on frame range
        storySections.forEach(section => {
            const start = parseInt(section.getAttribute('data-frame-start'), 10);
            const end = parseInt(section.getAttribute('data-frame-end'), 10);

            if (frameIndex >= start && frameIndex <= end) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
    }

    // --------------------------------------------------------------------------
    // 4. Interactive Scrubber & Auto-Play Controls
    // --------------------------------------------------------------------------
    if (frameScrubber) {
        frameScrubber.addEventListener('input', (e) => {
            if (isAutoPlaying) pauseAutoPlay();
            const targetVal = parseInt(e.target.value, 10) - 1;
            targetFrameIndex = targetVal;
            
            // Also sync page scroll position relative to scroll container
            const scrollContainer = document.querySelector('.scroll-container');
            if (scrollContainer) {
                const containerHeight = scrollContainer.offsetHeight - window.innerHeight;
                const targetScroll = scrollContainer.offsetTop + (targetVal / TOTAL_FRAMES) * containerHeight;
                window.scrollTo({ top: targetScroll, behavior: 'instant' });
            }
        });
    }

    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (isAutoPlaying) {
                pauseAutoPlay();
            } else {
                startAutoPlay();
            }
        });
    }

    function startAutoPlay() {
        isAutoPlaying = true;
        if (playBtn) playBtn.classList.add('active');
        if (playIcon) playIcon.setAttribute('data-lucide', 'pause');
        if (window.lucide) lucide.createIcons();

        if (targetFrameIndex >= TOTAL_FRAMES - 1) {
            targetFrameIndex = 0;
            currentFrameIndex = 0;
        }

        const intervalMs = Math.round(40 / autoPlaySpeed); // ~25fps at 1x
        autoPlayTimer = setInterval(() => {
            if (targetFrameIndex < TOTAL_FRAMES - 1) {
                targetFrameIndex++;
            } else {
                pauseAutoPlay();
            }
        }, intervalMs);
    }

    function pauseAutoPlay() {
        isAutoPlaying = false;
        if (playBtn) playBtn.classList.remove('active');
        if (playIcon) playIcon.setAttribute('data-lucide', 'play');
        if (window.lucide) lucide.createIcons();
        if (autoPlayTimer) clearInterval(autoPlayTimer);
    }

    if (speedBtn) {
        speedBtn.addEventListener('click', () => {
            if (autoPlaySpeed === 1) autoPlaySpeed = 2;
            else if (autoPlaySpeed === 2) autoPlaySpeed = 0.5;
            else autoPlaySpeed = 1;

            speedBtn.textContent = `${autoPlaySpeed}x`;
            if (isAutoPlaying) {
                pauseAutoPlay();
                startAutoPlay();
            }
        });
    }

    // Toggle Fit View mode
    fitToggle.addEventListener('click', () => {
        canvasFitMode = (canvasFitMode === 'cover') ? 'contain' : 'cover';
        renderFrame(Math.round(currentFrameIndex));
    });

    // --------------------------------------------------------------------------
    // 5. Sound & Audio Synth Engine
    // --------------------------------------------------------------------------
    soundToggle.addEventListener('click', () => {
        isAudioMuted = !isAudioMuted;
        const soundIcon = document.getElementById('sound-icon');

        if (!isAudioMuted) {
            soundIcon.setAttribute('data-lucide', 'volume-2');
            playAmbientTone();
        } else {
            soundIcon.setAttribute('data-lucide', 'volume-x');
        }
        if (window.lucide) lucide.createIcons();
    });

    function playAmbientTone() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, audioContext.currentTime); // Soft A3 tone
        
        gain.gain.setValueAtTime(0.01, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 2.5);

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.start();
        osc.stop(audioContext.currentTime + 2.5);
    }

    // Window events
    window.addEventListener('resize', resizeCanvas);

    // Initialize
    preloadFrames();
});

// --------------------------------------------------------------------------
// 6. Comprehensive Product Data & Interactive Modal System
// --------------------------------------------------------------------------

const PRODUCTS_DATA = {
    'classic-fevicol': {
        id: 'classic-fevicol',
        name: 'Classic Milk Chocolate Bar',
        tagline: 'Crafted with 1.5 glasses of fresh milk in every half pound',
        price: 3.50,
        originalPrice: 4.20,
        rating: 4.9,
        reviewsCount: '14.2k',
        weight: '110g',
        category: 'Classic',
        cocoaContent: '33% Sustainable Cocoa',
        milkContent: '26% Whole Dairy Milk',
        calories: '534 kcal / 100g',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3R1V4d72d_N_j8YJ11Vst6_qA6g7t972lX8yKj_Qy0FvN6u_9H47eGk0970aK26F74-qR82xJj19kZ_wB9a7e0V_b1h_N14fXz80hC0y-mR0d8zR21J04aX73y4596d-3s2207b1d',
        badge: 'Classic Best Seller',
        badgeBg: 'bg-primary-container text-on-primary',
        description: 'The definitive standard in British confectionery. Made using our secret 1905 conching process, every single bar combines pure cocoa butter with fresh liquid dairy milk from local valley farms for an incomparable melt-in-the-mouth texture.',
        highlights: [
            'Made with real liquid fresh milk, never dry powder',
            '100% Sustainably Sourced Cocoa through Cocoa Life Program',
            'No artificial colors, preservatives, or palm oils',
            'Iconic snap and silky smooth aftertaste'
        ],
        ingredients: 'Milk**, Sugar, Cocoa Mass, Cocoa Butter, Vegetable Fats (Palm, Shea), Emulsifiers (E442, E476), Flavorings. **The equivalent of 426 ml of Fresh Liquid Milk in every 227 g of Milk Chocolate.',
        nutrition: {
            energy: '534 kcal / 2230 kJ',
            fat: '30.0g',
            saturatedFat: '18.0g',
            carbs: '57.0g',
            sugar: '56.0g',
            protein: '7.3g',
            sodium: '0.24g'
        },
        origin: 'Bournville, United Kingdom',
        allergenInfo: 'Contains Milk. May contain Nuts, Wheat and Soy.',
        servingSuggestion: 'Best enjoyed at room temperature (18°C–21°C) with a warm cup of English Breakfast Tea.'
    },
    'fruit-nut': {
        id: 'fruit-nut',
        name: 'Fruit & Nut Velvet Bar',
        tagline: 'Plump golden raisins and whole roasted almonds enveloped in silk milk chocolate',
        price: 3.80,
        originalPrice: 4.50,
        rating: 4.8,
        reviewsCount: '8.6k',
        weight: '110g',
        category: 'Nuts & Fruit',
        cocoaContent: '33% Fine Cocoa',
        milkContent: '24% Dairy Milk',
        calories: '508 kcal / 100g',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDT1401fM-1k2_3696aQeH5290b0eA_q71981x1F811d7-Hk_cE8yP02n_R63-9w7s4-h2G2dY9Y111-Qd8yG0eQ3f628jQ03F3b3Jd5d6t9uF_Q9yR8z1c',
        badge: 'Fan Favorite',
        badgeBg: 'bg-secondary-container text-on-secondary-fixed',
        description: 'Generous helpings of sun-ripened Mediterranean raisins and crisp slow-roasted California almonds blended into signature Fevicol Choco Ltd milk chocolate.',
        highlights: [
            'Features 18% plump juicy raisins & 10% crunchy almonds',
            'Slow roasted in-house for extra nuttiness',
            'Rich in fiber and natural fruit sweetness',
            'Certified Sustainable Cocoa Life supply chain'
        ],
        ingredients: 'Milk**, Sugar, Raisins, Cocoa Butter, Cocoa Mass, Almonds, Vegetable Fats, Emulsifiers (E442, E476), Natural Vanilla Flavor.',
        nutrition: {
            energy: '508 kcal / 2125 kJ',
            fat: '28.0g',
            saturatedFat: '15.5g',
            carbs: '55.5g',
            sugar: '52.0g',
            protein: '8.1g',
            sodium: '0.20g'
        },
        origin: 'Bournville, United Kingdom',
        allergenInfo: 'Contains Milk and Almonds. May contain Hazelnut, Walnut and Wheat.',
        servingSuggestion: 'Pair with an afternoon espresso or chilled sparkling cider.'
    },
    'silk-hazelnut': {
        id: 'silk-hazelnut',
        name: 'Silk Whole Nut Hazelnut',
        tagline: 'Whole roasted Turkish hazelnuts wrapped in ultra-creamy Silk milk chocolate',
        price: 4.50,
        originalPrice: 5.20,
        rating: 4.9,
        reviewsCount: '12.4k',
        weight: '143g',
        category: 'Silk Luxury',
        cocoaContent: '35% Artisanal Cocoa',
        milkContent: '28% Rich Dairy Milk',
        calories: '562 kcal / 100g',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBspYcT3Q29P2Jj64_6n072E31_9M-V67v2y2P-J0Q97qL6t2a-d9P7J58m5sQ0u8E-c36195Q3yD-F1R93Y2-6F_R4s0E-eM_aE9jJ4wF',
        badge: 'Ultra Smooth Silk',
        badgeBg: 'bg-tertiary-container text-on-tertiary-container',
        description: 'Silk Whole Nut Hazelnut delivers an unmatched sensory explosion. The velvety, micro-conched Silk formula melts instant on contact, revealing crunchy, whole-roasted Giresun hazelnuts.',
        highlights: [
            'Hand-selected Grade A Turkish whole hazelnuts',
            'Extra conched for 36 hours for silk texture',
            'Elevated cocoa butter content for glossy sheen',
            'Luxe gold foil packaging'
        ],
        ingredients: 'Sugar, Milk Solids (30%*), Hazelnuts (19%), Cocoa Butter, Cocoa Solids, Emulsifiers (442, 476), Flavors (Natural & Nature-identical).',
        nutrition: {
            energy: '562 kcal / 2345 kJ',
            fat: '36.5g',
            saturatedFat: '17.2g',
            carbs: '49.0g',
            sugar: '46.8g',
            protein: '9.4g',
            sodium: '0.22g'
        },
        origin: 'Bournville, United Kingdom',
        allergenInfo: 'Contains Milk and Hazelnuts. May contain Cashew, Almond and Soy.',
        servingSuggestion: 'Chill in refrigerator for 10 minutes prior to serving for optimal texture contrast.'
    },
    'silk-caramello': {
        id: 'silk-caramello',
        name: 'Silk Caramello Soft Center',
        tagline: 'Fluid buttery caramel encased in velvety Fevicol Silk milk chocolate',
        price: 4.20,
        originalPrice: 4.90,
        rating: 4.7,
        reviewsCount: '7.9k',
        weight: '136g',
        category: 'Caramel',
        cocoaContent: '32% Silk Cocoa',
        milkContent: '26% Whole Milk',
        calories: '512 kcal / 100g',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_-813F9J-515a81_s1v8_q41k5k3A-Q09zY-tN9-eR-u09Y5vR_d-F6y7cE15Q-1R3Y_eP9jX0uY17N1kG9bF3v9_F2-6R5c-Q1',
        badge: 'Molten Caramel',
        badgeBg: 'bg-primary-container text-on-primary',
        description: 'Indulge in liquid luxury. Each pocket of the Caramello bar bursts with slow-cooked golden caramel infused with sea salt and real cream.',
        highlights: [
            'Golden caramel filling made with double cream',
            'Salted caramel balance to highlight cocoa notes',
            'Silk chocolate shell crafted to prevent caramel leak',
            'Perfect dessert pairing chocolate'
        ],
        ingredients: 'Milk Chocolate (Sugar, Cocoa Butter, Milk Solids, Cocoa Mass), Caramel Filling (40%) (Glucose Syrup, Sugared Condensed Milk, Butter Oil, Salt, Emulsifiers, Natural Vanilla Extract).',
        nutrition: {
            energy: '512 kcal / 2138 kJ',
            fat: '27.4g',
            saturatedFat: '16.1g',
            carbs: '61.0g',
            sugar: '55.2g',
            protein: '5.8g',
            sodium: '0.35g'
        },
        origin: 'Bournville, United Kingdom',
        allergenInfo: 'Contains Milk. May contain Soy and Tree Nuts.',
        servingSuggestion: 'Warm a single piece gently over coffee for an oozing dessert experience.'
    },
    'roast-almond': {
        id: 'roast-almond',
        name: 'Roast Almond Gold Edition',
        tagline: 'Double toasted whole almonds with sea salt pinch in milk chocolate',
        price: 3.90,
        originalPrice: 4.60,
        rating: 4.8,
        reviewsCount: '6.1k',
        weight: '110g',
        category: 'Nuts & Fruit',
        cocoaContent: '34% Gold Cocoa',
        milkContent: '25% Pure Dairy',
        calories: '548 kcal / 100g',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB21634N9E4e14E1564Y01R855-8q025qY-53z09N_6_F-E96f-E4yQ55F8b9E-d225J836e52_t93_Q337F_0vN9b',
        badge: 'Crunch Specialist',
        badgeBg: 'bg-secondary-container text-on-secondary-fixed',
        description: 'For lovers of pure crunch. Whole California nonpareil almonds undergo a twin flame roasting technique before being folded into rich Fevicol Choco milk chocolate with a micro pinch of sea salt.',
        highlights: [
            'Twin-flame roasted whole nonpareil almonds',
            'Touch of flaky sea salt for flavor depth',
            'High protein & healthy nut fats',
            'Sustainable cocoa certified'
        ],
        ingredients: 'Milk**, Sugar, Roasted Almonds (22%), Cocoa Mass, Cocoa Butter, Sea Salt (0.3%), Emulsifiers (E442, E476), Natural Vanilla.',
        nutrition: {
            energy: '548 kcal / 2288 kJ',
            fat: '34.2g',
            saturatedFat: '16.8g',
            carbs: '48.5g',
            sugar: '44.0g',
            protein: '10.2g',
            sodium: '0.28g'
        },
        origin: 'Bournville, United Kingdom',
        allergenInfo: 'Contains Milk and Almonds. May contain Pecan and Soy.',
        servingSuggestion: 'Great post-workout energy treat or evening pairing with dark roasts.'
    },
    'butterscotch-crackle': {
        id: 'butterscotch-crackle',
        name: 'Butterscotch Crackle',
        tagline: 'Crispy golden butterscotch crystals embedded in signature chocolate',
        price: 3.40,
        originalPrice: 4.00,
        rating: 4.7,
        reviewsCount: '5.1k',
        weight: '110g',
        category: 'Caramel',
        cocoaContent: '31% Dairy Milk Cocoa',
        milkContent: '26% Whole Dairy Milk',
        calories: '520 kcal / 100g',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKd6j9nkYJ7XHDqtGVZVGOCaQD859X4_EPR8Hja8kas12C2R2Y6URp8BsiabNKh9fpySqSHTSyeWL4GlhmpaZLJWMhnWRgYQXqqShdEG4EuALQr89dvio9ngJGFkFnN8sLt-mgHywhpRrFVtkyFm-ywK-lOw_0s3uvMBKVZnYZkfLU8WWlhDWDX-aT0YUccSqzY_XdQS7GSPvr-qD9RipqxEXQ_cGzSmxXr5ZhgUal0EZVAKb8T7jZUQ',
        badge: 'Sweet Crunch',
        badgeBg: 'bg-tertiary-container text-on-tertiary-container',
        description: 'Golden, buttery brown sugar crystals create an addictively crunchy snap inside every creamy block of Fevicol Choco milk chocolate.',
        highlights: [
            'Artisanal butterscotch crunch pieces',
            'Rich buttery aroma with hints of dark brown molasses',
            'Childhood nostalgia in every bite',
            'Perfect for ice cream topping crumble'
        ],
        ingredients: 'Milk**, Sugar, Butterscotch Granules (15%) (Sugar, Glucose Syrup, Butter (Milk), Salt), Cocoa Mass, Cocoa Butter, Emulsifiers, Flavorings.',
        nutrition: {
            energy: '520 kcal / 2170 kJ',
            fat: '29.0g',
            saturatedFat: '17.5g',
            carbs: '59.0g',
            sugar: '57.0g',
            protein: '6.5g',
            sodium: '0.31g'
        },
        origin: 'Bournville, United Kingdom',
        allergenInfo: 'Contains Milk. May contain Tree Nuts and Wheat.',
        servingSuggestion: 'Crush over vanilla bean ice cream or warm waffles.'
    },
    'silk-bubbly': {
        id: 'silk-bubbly',
        name: 'Silk Bubbly Aerated Bar',
        tagline: 'Unique bubble texture filled with soft aerated chocolate pockets',
        price: 4.60,
        originalPrice: 5.40,
        rating: 4.9,
        reviewsCount: '11.0k',
        weight: '120g',
        category: 'Silk Luxury',
        cocoaContent: '34% Silk Cocoa',
        milkContent: '28% Whole Dairy Milk',
        calories: '545 kcal / 100g',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBw6T0eU60WVPYUMf7De8ZAospWkY1lN2KOc0cLVpFEGvLuIECyI4j2Br50IFcvb2wyoo3MBVytlNs_Rt2gtBYjCfsw_PcdvsKJBucOSMLjJkwW3E6E2XkZ2JKMO359mBa1gfhvpsZk7KynXsfEM1tpo712qdu7bf2StFey9zjhHeZGfllCZP1_eemgMILN93EDFkbv9R9xz1Wk51UtCYXoxE5fa3R2mpAtVUW-mZzTmkgTpRIe8a-W8A',
        badge: 'Aerated Silk',
        badgeBg: 'bg-secondary-container text-on-secondary-fixed',
        description: 'Crafted through high-pressure nitrogen aerating technology, Silk Bubbly features outer smooth chocolate bubbles filled with thousands of tiny melting air cells that collapse effortlessly on your tongue.',
        highlights: [
            'Patented bubble design for unique mouthfeel',
            'Quick-melting airy texture release',
            'Double conched for velvety finish',
            'Loved by children & gourmets alike'
        ],
        ingredients: 'Sugar, Milk Solids (28%), Cocoa Butter, Cocoa Mass, Aerating Gas (Nitrogen), Emulsifiers (442, 476), Natural Vanilla Flavor.',
        nutrition: {
            energy: '545 kcal / 2275 kJ',
            fat: '32.5g',
            saturatedFat: '19.8g',
            carbs: '54.0g',
            sugar: '53.1g',
            protein: '7.8g',
            sodium: '0.23g'
        },
        origin: 'Bournville, United Kingdom',
        allergenInfo: 'Contains Milk. May contain Soy and Nuts.',
        servingSuggestion: 'Let a single bubble rest on your tongue and dissolve without chewing.'
    },
    'jelly-popping': {
        id: 'jelly-popping',
        name: 'Jelly Popping Candy Marvel',
        tagline: 'Chewy fruit jellies, cocoa bean drops, and energetic popping candy',
        price: 2.90,
        originalPrice: 3.50,
        rating: 4.6,
        reviewsCount: '4.3k',
        weight: '100g',
        category: 'Caramel',
        cocoaContent: '30% Milk Chocolate',
        milkContent: '24% Dairy Milk',
        calories: '495 kcal / 100g',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1c-kt08ym9UUNePRH9VANtyBIr_0yJms6zRAgDKkhkjc_lNYC8kqIXK-6x9jrv6HXKrPqrjgxZojpY-uhi7p0jR9yhtzHcjrPNASWctXWterBjMj360Sg87QbdpgxqYKRk_1nqrIS_Zh4cfyiAc_OPSuRV03gKpcRmQlBVeJXJ6ro3Zjr-Fk6riGnh68u2A-k8A7ZJG5YABZQvj9FBGHHHWIl3q7gKB70-F99oVG62h5aBJuwNIqiyg',
        badge: 'Party Explosion',
        badgeBg: 'bg-primary-container text-on-primary',
        description: 'Unleash the carnival! Every bite brings an unexpected surprise: chewy fruit-flavored gum jellies, crunchy candy shelled drops, and carbonated popping sugar fizzing across your mouth.',
        highlights: [
            'Includes fruit jelly gems, sugar drops & popping candy',
            'Fun interactive taste sensation',
            'No synthetic azodyes used',
            'Great party favor & gifting bar'
        ],
        ingredients: 'Milk Chocolate (Sugar, Milk Solids, Cocoa Butter, Cocoa Mass), Fruit Jellies (10%) (Glucose Syrup, Gelatin, Citric Acid), Popping Candy (6%) (Sugar, Lactose, Carbon Dioxide), Candy Shell Drops (5%).',
        nutrition: {
            energy: '495 kcal / 2070 kJ',
            fat: '25.0g',
            saturatedFat: '14.8g',
            carbs: '62.0g',
            sugar: '58.5g',
            protein: '5.2g',
            sodium: '0.19g'
        },
        origin: 'Bournville, United Kingdom',
        allergenInfo: 'Contains Milk and Lactose. May contain Wheat and Soy.',
        servingSuggestion: 'Share with friends at movie nights for guaranteed giggles.'
    }
};

const HAMPERS_DATA = {
    'royale-box': {
        id: 'royale-box',
        title: 'The Royal Gold Luxury Box',
        price: 34.99,
        originalPrice: 42.00,
        tagline: 'Hand-crafted velvet box filled with 12 premium Fevicol Choco bars & silk truffles',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBspYcT3Q29P2Jj64_6n072E31_9M-V67v2y2P-J0Q97qL6t2a-d9P7J58m5sQ0u8E-c36195Q3yD-F1R93Y2-6F_R4s0E-eM_aE9jJ4wF',
        description: 'The ultimate statement of generosity. Encased in a purple embossed foil rigid box with satin ribbon pull, this hamper brings together our entire flagship portfolio including Silk Hazelnut, Fruit & Nut, Caramello, and custom recipe card booklet.',
        itemsIncluded: [
            '2x Silk Whole Nut Hazelnut (143g)',
            '2x Classic Milk Chocolate Bar (110g)',
            '2x Fruit & Nut Velvet Bar (110g)',
            '2x Silk Caramello Soft Center (136g)',
            '2x Roast Almond Gold Edition (110g)',
            '1x Gold Embossed Bournville Master Class Recipe Book',
            'Custom Hand-written Greeting Card'
        ]
    },
    'party-pack': {
        id: 'party-pack',
        title: 'Family Celebration Party Hamper',
        price: 24.50,
        originalPrice: 30.00,
        tagline: 'The ultimate joy hamper featuring 8 full-size bars & share bags',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDT1401fM-1k2_3696aQeH5290b0eA_q71981x1F811d7-Hk_cE8yP02n_R63-9w7s4-h2G2dY9Y111-Qd8yG0eQ3f628jQ03F3b3Jd5d6t9uF_Q9yR8z1c',
        description: 'Designed for family gatherings, birthdays, and holiday celebrations. Packed with diverse flavors so everyone finds their favorite bite.',
        itemsIncluded: [
            '2x Classic Milk Bar (110g)',
            '2x Butterscotch Crackle (110g)',
            '2x Jelly Popping Candy (100g)',
            '2x Silk Bubbly Aerated Bar (120g)',
            'Fevicol Choco Party Popper Streamers'
        ]
    },
    'lovers-edition': {
        id: 'lovers-edition',
        title: 'Sweet Heart Romance Silk Edition',
        price: 19.99,
        originalPrice: 25.00,
        tagline: 'Heart-shaped velvet gift box with Silk Bubbly, Caramello & plush keepsake',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBw6T0eU60WVPYUMf7De8ZAospWkY1lN2KOc0cLVpFEGvLuIECyI4j2Br50IFcvb2wyoo3MBVytlNs_Rt2gtBYjCfsw_PcdvsKJBucOSMLjJkwW3E6E2XkZ2JKMO359mBa1gfhvpsZk7KynXsfEM1tpo712qdu7bf2StFey9zjhHeZGfllCZP1_eemgMILN93EDFkbv9R9xz1Wk51UtCYXoxE5fa3R2mpAtVUW-mZzTmkgTpRIe8a-W8A',
        description: 'Express your feelings with the silkiness of Fevicol Choco Ltd. Encased in a luxury soft-touch crimson heart box with gold foil lettering.',
        itemsIncluded: [
            '1x Silk Bubbly Heart Specially Molded (150g)',
            '1x Silk Caramello Soft Center (136g)',
            '1x Silk Whole Nut Hazelnut (143g)',
            'Satin Red Ribbon & Personal Message Tag'
        ]
    }
};

const RECIPES_DATA = {
    'lava-cake': {
        id: 'lava-cake',
        title: 'Molten Silk Lava Cake',
        prepTime: '25 Mins',
        difficulty: 'Intermediate',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3R1V4d72d_N_j8YJ11Vst6_qA6g7t972lX8yKj_Qy0FvN6u_9H47eGk0970aK26F74-qR82xJj19kZ_wB9a7e0V_b1h_N14fXz80hC0y-mR0d8zR21J04aX73y4596d-3s2207b1d',
        description: 'Decadent individual molten cakes made with broken Fevicol Choco Silk Caramello. Cutting into the warm sponge releases a oozing center of liquid silk chocolate.',
        ingredients: [
            '200g Fevicol Choco Silk Caramello (chopped)',
            '100g Unsalted Butter + extra for ramekins',
            '2 Large Eggs + 2 Egg Yolks',
            '50g Caster Sugar',
            '2 tbsp All-purpose Flour',
            'Pinch of Sea Salt'
        ],
        instructions: [
            'Preheat oven to 200°C (180°C fan). Butter 4 ramekins and dust with cocoa powder.',
            'Melt chopped Fevicol Choco Silk and butter over a pan of simmering water until smooth.',
            'Whisk eggs, egg yolks, and sugar together until pale and slightly thickened.',
            'Fold the melted chocolate mixture gently into the eggs, then sift in the flour and salt.',
            'Divide into ramekins and bake for exactly 12 minutes until edges are set but center jiggles.',
            'Invert onto plates and serve immediately with vanilla bean ice cream.'
        ],
        chefTip: 'Do not overbake! The key to a lush lava center is removing the cakes when the top center still looks soft.'
    },
    'choco-truffles': {
        id: 'choco-truffles',
        title: 'Artisanal Silk Truffles',
        prepTime: '40 Mins',
        difficulty: 'Easy',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBspYcT3Q29P2Jj64_6n072E31_9M-V67v2y2P-J0Q97qL6t2a-d9P7J58m5sQ0u8E-c36195Q3yD-F1R93Y2-6F_R4s0E-eM_aE9jJ4wF',
        description: 'Hand-rolled velvety chocolate ganache truffles coated in dark cocoa powder, toasted hazelnuts, and edible gold leaf.',
        ingredients: [
            '250g Fevicol Choco Classic Milk Chocolate',
            '150ml Heavy Double Cream (38% fat)',
            '25g Unsalted Butter (softened)',
            'Unsweetened Dutch Cocoa Powder for rolling',
            '50g Toasted Chopped Hazelnuts'
        ],
        instructions: [
            'Finely chop the Fevicol Choco bar and place in a heatproof bowl.',
            'Heat double cream until just simmer point, then pour over chopped chocolate.',
            'Let sit for 2 minutes, then stir gently from center out until glossy and melted.',
            'Stir in softened butter until combined. Chill ganache in fridge for 2 hours.',
            'Scoop tablespoon portions and roll into round truffle spheres.',
            'Roll half in cocoa powder and half in toasted hazelnuts.'
        ],
        chefTip: 'Keep your hands cool by rinsing with cold water before rolling to prevent ganache from melting.'
    },
    'fudge-brownies': {
        id: 'fudge-brownies',
        title: 'Fevicol Choco Fudge Brownies',
        prepTime: '45 Mins',
        difficulty: 'Beginner',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDT1401fM-1k2_3696aQeH5290b0eA_q71981x1F811d7-Hk_cE8yP02n_R63-9w7s4-h2G2dY9Y111-Qd8yG0eQ3f628jQ03F3b3Jd5d6t9uF_Q9yR8z1c',
        description: 'Fudgy, crinkly-topped brownies loaded with chunks of Fevicol Choco Roast Almond and Fruit & Nut.',
        ingredients: [
            '200g Fevicol Choco Classic (melted)',
            '100g Fevicol Choco Roast Almond (coarsely chopped)',
            '150g Unsalted Butter',
            '200g Granulated Sugar',
            '3 Large Eggs',
            '90g All-purpose Flour',
            '35g Cocoa Powder'
        ],
        instructions: [
            'Preheat oven to 175°C and line an 8x8 inch baking pan with parchment paper.',
            'Melt butter and classic chocolate together in microwave in 30-sec bursts.',
            'Whisk eggs and sugar vigorously for 3 minutes until pale and voluminous for that crinkle top.',
            'Fold melted chocolate into eggs, then gently fold flour and cocoa powder.',
            'Fold in the chopped Roast Almond chocolate chunks.',
            'Pour into pan and bake 25-28 minutes. Cool completely before slicing.'
        ],
        chefTip: 'For ultra fudgy brownies, let them cool in the fridge overnight before cutting into neat squares.'
    }
};

// State Management
let currentProductModalId = null;
let currentModalQty = 1;
let cartItems = [];
let wishlistItems = new Set();

// --------------------------------------------------------------------------
// 7. Product Modal Handlers & Dynamic Data Renderer
// --------------------------------------------------------------------------
function openProductModal(productId) {
    const product = PRODUCTS_DATA[productId] || PRODUCTS_DATA['classic-fevicol'];
    currentProductModalId = product.id;
    currentModalQty = 1;

    const modal = document.getElementById('product-detail-modal');
    if (!modal) return;

    // Populate data
    document.getElementById('pm-image').src = product.image;
    document.getElementById('pm-image').alt = product.name;
    document.getElementById('pm-badge').textContent = product.badge;
    document.getElementById('pm-badge').className = `font-label-sm text-label-sm px-3 py-1 rounded-full font-bold shadow-sm ${product.badgeBg}`;
    document.getElementById('pm-title').textContent = product.name;
    document.getElementById('pm-tagline').textContent = product.tagline;
    document.getElementById('pm-rating').textContent = product.rating;
    document.getElementById('pm-reviews').textContent = `(${product.reviewsCount} reviews)`;
    document.getElementById('pm-weight').textContent = product.weight;
    document.getElementById('pm-price').textContent = `$${product.price.toFixed(2)}`;
    document.getElementById('pm-orig-price').textContent = `$${product.originalPrice.toFixed(2)}`;
    document.getElementById('pm-unit-price').textContent = `$${(product.price / (parseFloat(product.weight) / 100)).toFixed(2)} / 100g`;
    
    document.getElementById('pm-cocoa').textContent = product.cocoaContent;
    document.getElementById('pm-milk').textContent = product.milkContent;
    document.getElementById('pm-calories').textContent = product.calories;
    document.getElementById('pm-origin').textContent = product.origin;
    
    document.getElementById('pm-desc').textContent = product.description;
    
    // Highlights list
    const highlightsContainer = document.getElementById('pm-highlights');
    highlightsContainer.innerHTML = product.highlights.map(h => `
        <li class="flex items-start gap-2 text-on-surface-variant font-body-sm text-body-sm">
            <span class="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">check_circle</span>
            <span>${h}</span>
        </li>
    `).join('');

    document.getElementById('pm-ingredients').textContent = product.ingredients;
    document.getElementById('pm-allergen').textContent = product.allergenInfo;
    document.getElementById('pm-serving').textContent = product.servingSuggestion;

    // Nutrition grid
    document.getElementById('pm-nut-energy').textContent = product.nutrition.energy;
    document.getElementById('pm-nut-fat').textContent = product.nutrition.fat;
    document.getElementById('pm-nut-satfat').textContent = product.nutrition.saturatedFat;
    document.getElementById('pm-nut-carbs').textContent = product.nutrition.carbs;
    document.getElementById('pm-nut-sugar').textContent = product.nutrition.sugar;
    document.getElementById('pm-nut-protein').textContent = product.nutrition.protein;
    document.getElementById('pm-nut-sodium').textContent = product.nutrition.sodium;

    // Wishlist button state
    const modalWishlistBtn = document.getElementById('pm-wishlist-btn');
    const isWishlisted = wishlistItems.has(product.id);
    modalWishlistBtn.querySelector('span').style.fontVariationSettings = isWishlisted ? "'FILL' 1" : "'FILL' 0";
    modalWishlistBtn.querySelector('span').classList.toggle('text-error', isWishlisted);

    document.getElementById('pm-qty').textContent = currentModalQty;

    // Show modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    if (window.lucide) lucide.createIcons();

    // Track product view in Supabase
    trackProductView(product);
}

function closeProductModal() {
    const modal = document.getElementById('product-detail-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
}

function changeProductModalQty(delta) {
    currentModalQty = Math.max(1, currentModalQty + delta);
    const qtyElem = document.getElementById('pm-qty');
    if (qtyElem) qtyElem.textContent = currentModalQty;
}

function addProductModalToCart() {
    if (!currentProductModalId) return;
    const product = PRODUCTS_DATA[currentProductModalId];
    if (!product) return;

    for (let i = 0; i < currentModalQty; i++) {
        addToCart(null, product.id);
    }

    closeProductModal();
}

function toggleProductModalWishlist() {
    if (!currentProductModalId) return;
    toggleWishlist(null, currentProductModalId);
    
    const isWishlisted = wishlistItems.has(currentProductModalId);
    const modalWishlistBtn = document.getElementById('pm-wishlist-btn');
    if (modalWishlistBtn) {
        modalWishlistBtn.querySelector('span').style.fontVariationSettings = isWishlisted ? "'FILL' 1" : "'FILL' 0";
        modalWishlistBtn.querySelector('span').classList.toggle('text-error', isWishlisted);
    }
}

// --------------------------------------------------------------------------
// 8. Cart & Drawer System
// --------------------------------------------------------------------------
function addToCart(event, productId) {
    if (event) event.stopPropagation();

    const product = PRODUCTS_DATA[productId] || PRODUCTS_DATA['classic-fevicol'];
    const existingIndex = cartItems.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
        cartItems[existingIndex].qty += 1;
    } else {
        cartItems.push({
            id: product.id,
            name: product.name,
            price: product.price,
            weight: product.weight,
            image: product.image,
            qty: 1
        });
    }

    updateCartUI();
    showToast(`${product.name} added to cart`, `$${product.price.toFixed(2)} • 1.5 Glasses Fresh Milk`);

    // Track product added to cart in Supabase
    trackAddToCart(product);
}

function updateCartUI() {
    const totalCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
    const badge1 = document.getElementById('cartBadge');
    const badge2 = document.getElementById('cart-count-badge');
    [badge1, badge2].forEach(badge => {
        if (badge) {
            badge.textContent = totalCount;
            if (totalCount > 0) {
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    });

    // Render Drawer Items
    const container = document.getElementById('cart-drawer-items');
    const emptyState = document.getElementById('cart-drawer-empty');
    const footer = document.getElementById('cart-drawer-footer');

    if (!container) return;

    if (cartItems.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        if (footer) footer.classList.add('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (footer) footer.classList.remove('hidden');

    let subtotal = 0;
    container.innerHTML = cartItems.map(item => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;

        return `
            <div class="flex items-center gap-4 p-3 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded-lg object-cover bg-primary-container/5 shrink-0" />
                <div class="flex-1 min-w-0">
                    <h5 class="font-title-lg text-sm text-on-surface font-bold truncate">${item.name}</h5>
                    <p class="font-body-sm text-xs text-on-surface-variant">${item.weight} • $${item.price.toFixed(2)}</p>
                    <div class="flex items-center gap-2 mt-2">
                        <button onclick="changeCartQty('${item.id}', -1)" class="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-on-surface font-bold hover:bg-surface-container-high">-</button>
                        <span class="font-label-md text-xs font-bold w-4 text-center">${item.qty}</span>
                        <button onclick="changeCartQty('${item.id}', 1)" class="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-on-surface font-bold hover:bg-surface-container-high">+</button>
                    </div>
                </div>
                <div class="text-right shrink-0">
                    <p class="font-headline-sm text-sm text-primary-container font-bold">$${itemTotal.toFixed(2)}</p>
                    <button onclick="removeFromCart('${item.id}')" class="text-error text-xs hover:underline mt-2 block">Remove</button>
                </div>
            </div>
        `;
    }).join('');

    const shipping = subtotal >= 30 ? 0 : 4.50;
    const total = subtotal + shipping;

    document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('cart-shipping').textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
    document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
}

function changeCartQty(productId, delta) {
    const item = cartItems.find(i => i.id === productId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        removeFromCart(productId);
    } else {
        updateCartUI();
    }
}

function removeFromCart(productId) {
    cartItems = cartItems.filter(i => i.id !== productId);
    updateCartUI();
}

function openCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (drawer) drawer.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (drawer) drawer.classList.add('hidden');
    document.body.style.overflow = '';
}

// --------------------------------------------------------------------------
// 9. Wishlist Handlers
// --------------------------------------------------------------------------
function toggleWishlist(event, productId, btnElem) {
    if (event) event.stopPropagation();

    const isAdding = !wishlistItems.has(productId);
    if (wishlistItems.has(productId)) {
        wishlistItems.delete(productId);
        showToast('Removed from Wishlist', 'Item saved removed');
    } else {
        wishlistItems.add(productId);
        showToast('Added to Wishlist ❤️', 'Saved to your personal chocolate collection');
    }

    if (btnElem) {
        const span = btnElem.querySelector('span');
        if (span) {
            const isFilled = wishlistItems.has(productId);
            span.style.fontVariationSettings = isFilled ? "'FILL' 1" : "'FILL' 0";
            btnElem.classList.toggle('text-error', isFilled);
        }
    }

    // Track wishlist action in Supabase
    trackWishlist(productId, isAdding ? 'add' : 'remove');
}

// --------------------------------------------------------------------------
// 10. Checkout Flow
// --------------------------------------------------------------------------
function openCheckoutModal() {
    if (cartItems.length === 0) {
        showToast('Your Cart is Empty', 'Add chocolate bars to proceed to checkout');
        return;
    }

    closeCartDrawer();
    const modal = document.getElementById('checkout-modal');
    if (!modal) return;

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const shipping = subtotal >= 30 ? 0 : 4.50;
    const total = subtotal + shipping;

    document.getElementById('checkout-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('checkout-shipping').textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
    document.getElementById('checkout-total').textContent = `$${total.toFixed(2)}`;

    document.getElementById('checkout-form').classList.remove('hidden');
    document.getElementById('checkout-success').classList.add('hidden');

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
}

function handleCheckoutSubmit(event) {
    event.preventDefault();

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const shipping = subtotal >= 30 ? 0 : 4.50;
    const total = subtotal + shipping;
    const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    const form = document.getElementById('checkout-form');
    const success = document.getElementById('checkout-success');

    form.classList.add('hidden');
    success.classList.remove('hidden');

    // Track completed order in Supabase
    trackOrder({
        orderNumber: orderNumber,
        customerName: 'Guest Customer',
        customerEmail: 'customer@fevicolchoco.com',
        shippingAddress: 'Standard Express Shipping',
        subtotal: subtotal,
        shipping: shipping,
        total: total,
        items: [...cartItems]
    });

    // Clear Cart
    cartItems = [];
    updateCartUI();
}

// --------------------------------------------------------------------------
// 11. Recipe & Hamper & Lightbox Modals
// --------------------------------------------------------------------------
function openRecipeModal(recipeId) {
    const recipe = RECIPES_DATA[recipeId] || RECIPES_DATA['lava-cake'];
    const modal = document.getElementById('recipe-detail-modal');
    if (!modal) return;

    document.getElementById('rm-image').src = recipe.image;
    document.getElementById('rm-title').textContent = recipe.title;
    document.getElementById('rm-preptime').textContent = recipe.prepTime;
    document.getElementById('rm-difficulty').textContent = recipe.difficulty;
    document.getElementById('rm-desc').textContent = recipe.description;
    
    document.getElementById('rm-ingredients').innerHTML = recipe.ingredients.map(i => `
        <li class="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
            <span class="w-2 h-2 rounded-full bg-secondary shrink-0"></span>
            <span>${i}</span>
        </li>
    `).join('');

    document.getElementById('rm-instructions').innerHTML = recipe.instructions.map((inst, idx) => `
        <li class="flex items-start gap-3 text-on-surface-variant font-body-sm text-body-sm">
            <span class="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-fixed font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">${idx + 1}</span>
            <span>${inst}</span>
        </li>
    `).join('');

    document.getElementById('rm-cheftip').textContent = recipe.chefTip;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeRecipeModal() {
    const modal = document.getElementById('recipe-detail-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
}

function openHamperModal(hamperId) {
    const hamper = HAMPERS_DATA[hamperId] || HAMPERS_DATA['royale-box'];
    const modal = document.getElementById('hamper-detail-modal');
    if (!modal) return;

    document.getElementById('hm-image').src = hamper.image;
    document.getElementById('hm-title').textContent = hamper.title;
    document.getElementById('hm-tagline').textContent = hamper.tagline;
    document.getElementById('hm-price').textContent = `$${hamper.price.toFixed(2)}`;
    document.getElementById('hm-orig-price').textContent = `$${hamper.originalPrice.toFixed(2)}`;
    document.getElementById('hm-desc').textContent = hamper.description;

    document.getElementById('hm-items').innerHTML = hamper.itemsIncluded.map(item => `
        <li class="flex items-center gap-2 text-on-surface font-body-sm text-body-sm font-medium">
            <span class="material-symbols-outlined text-secondary text-[18px]">verified</span>
            <span>${item}</span>
        </li>
    `).join('');

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeHamperModal() {
    const modal = document.getElementById('hamper-detail-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
}

function addHamperToCart() {
    showToast('Luxury Hamper Added', 'Free express insured shipping included');
    closeHamperModal();
    openCartDrawer();
}

function openHamperBuilderModal() {
    showToast('Custom Hamper Studio', 'Select 5 or more chocolate bars to create your box!');
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

function openLightboxModal(userHandle, imgSrc, caption) {
    const modal = document.getElementById('photo-lightbox-modal');
    if (!modal) return;

    document.getElementById('lb-image').src = imgSrc;
    document.getElementById('lb-handle').textContent = userHandle;
    document.getElementById('lb-caption').textContent = caption;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeLightboxModal() {
    const modal = document.getElementById('photo-lightbox-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// --------------------------------------------------------------------------
// 12. Info Modals & Footer Handlers
// --------------------------------------------------------------------------
const INFO_CONTENTS = {
    'cocoa-life': {
        title: '100% Sustainable Cocoa Life Promise',
        body: `
            <p class="mb-4">At Fevicol Choco Ltd, sustainability is at the heart of our chocolate making tradition. Through the Cocoa Life initiative, we partner directly with cocoa farming communities across Ghana, Ivory Coast, and Indonesia.</p>
            <h4 class="font-bold text-on-surface mb-2">Our 3 Core Pillars:</h4>
            <ul class="list-disc pl-5 space-y-2 mb-4 text-on-surface-variant">
                <li><strong>Farming Prosperity:</strong> Helping farmers double yields and earn fair living wages.</li>
                <li><strong>Community Empowerment:</strong> Investing in local schools, clean water, and female entrepreneurship.</li>
                <li><strong>Forest Conservation:</strong> Zero net deforestation commitment and planting 5 million shade trees.</li>
            </ul>
        `
    },
    'nutrition': {
        title: 'Allergen & Nutritional Quality Guide',
        body: `
            <p class="mb-4">We are committed to full transparency regarding ingredients and dietary specifications across all Fevicol Choco Ltd bars.</p>
            <h4 class="font-bold text-on-surface mb-2">Allergen Declarations:</h4>
            <p class="mb-4 text-on-surface-variant">All milk chocolate products contain Dairy (Milk). Flavors containing nuts (Hazelnut, Roast Almond, Fruit & Nut) are processed in dedicated lines with strict cross-contamination protocols.</p>
            <h4 class="font-bold text-on-surface mb-2">Quality Standards:</h4>
            <p class="text-on-surface-variant">No high-fructose corn syrup, zero hydrogenated trans fats, and non-GMO certified dairy ingredients.</p>
        `
    },
    'vegetarian': {
        title: 'Vegetarian Status Certification',
        body: `
            <p class="mb-4">100% of our Fevicol Choco standard chocolate bars, Silk range, and gift hampers are certified <strong>Suitable for Vegetarians</strong> by the Vegetarian Society.</p>
            <p class="text-on-surface-variant">We strictly use plant-derived emulsifiers (soy lecithin and sunflower lecithin) and non-animal rennet across our entire confectionery lineup.</p>
        `
    },
    'packaging': {
        title: 'Sustainable & Recyclable Packaging',
        body: `
            <p class="mb-4">Fevicol Choco Ltd is pledged to achieving 100% recyclable packaging across all global shipments.</p>
            <p class="text-on-surface-variant">Our classic foil wrappers are 100% infinitely recyclable aluminum, and outer paperboard gift boxes are crafted from FSC-certified recycled pulp printed with vegetable-based inks.</p>
        `
    },
    'privacy': {
        title: 'Privacy Policy & Data Security',
        body: `
            <p class="mb-4">Your privacy matters to us. Fevicol Choco Ltd processes customer personal data strictly in compliance with GDPR and global privacy standards.</p>
            <p class="text-on-surface-variant">We never sell personal details to third parties. Information collected during orders is strictly used for order fulfillment, delivery tracking, and requested newsletter drops.</p>
        `
    },
    'terms': {
        title: 'Terms of Use & Service',
        body: `
            <p class="mb-4">By visiting Fevicol Choco Ltd's official store, you agree to our standard terms of online ordering and delivery guarantee.</p>
            <p class="text-on-surface-variant">All chocolates are guaranteed to arrive in thermal temperature-controlled packaging. Free returns or replacement provided for damaged shipments.</p>
        `
    },
    'cookies': {
        title: 'Cookie Preferences & Settings',
        body: `
            <p class="mb-4">We use essential cookies to maintain your shopping bag items and provide a smooth responsive browsing experience.</p>
            <p class="text-on-surface-variant">Analytical and preference cookies help us improve recipe suggestions and personalized product offerings.</p>
        `
    }
};

function openInfoModal(type) {
    const info = INFO_CONTENTS[type] || {
        title: 'Fevicol Choco Ltd Information',
        body: '<p class="text-on-surface-variant">Thank you for visiting Fevicol Choco Ltd. For customer support inquiries, please email contact@fevicolchoco.com.</p>'
    };

    const modal = document.getElementById('info-modal');
    if (!modal) return;

    document.getElementById('info-title').textContent = info.title;
    document.getElementById('info-body').innerHTML = info.body;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeInfoModal() {
    const modal = document.getElementById('info-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
}

function openShareModal() {
    if (navigator.share) {
        navigator.share({
            title: 'Fevicol Choco Ltd',
            text: 'Discover moments of pure chocolate joy with 1.5 glasses of fresh milk!',
            url: window.location.href
        }).catch(() => {});
    } else {
        showToast('Link Copied to Clipboard!', 'Share Fevicol Choco Ltd with your friends');
    }
}

function showToast(title, subtitle) {
    const toast = document.getElementById('cartToast');
    const toastTitle = document.getElementById('cartToastTitle');
    const toastSubtitle = document.getElementById('cartToastSubtitle');

    if (toast && toastTitle && toastSubtitle) {
        toastTitle.textContent = title;
        toastSubtitle.textContent = subtitle;

        toast.classList.remove('translate-y-32', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');

        setTimeout(() => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('translate-y-32', 'opacity-0');
        }, 2600);
    }
}

function handleNewsletterSubmit(event) {
    event.preventDefault();
    const emailInput = event.target.querySelector('input[type="email"]');
    const email = emailInput ? emailInput.value : '';

    showToast('Welcome to Fevicol Choco Club! 🍫', 'Check your inbox for your 15% welcome discount code');
    
    // Track subscriber in Supabase
    if (email) trackNewsletter(email);

    event.target.reset();
}

// --------------------------------------------------------------------------
// 13. Supabase Integration Setup
// Project ID: ffzxalvmywrlptlurnlq
// --------------------------------------------------------------------------
const SUPABASE_URL = 'https://ffzxalvmywrlptlurnlq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_SBEiHpwm2x3ieKU3J4XAGg_wxPr3iH3';

let supabaseClient = null;

function initSupabase() {
    try {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Connected to Supabase Project: ffzxalvmywrlptlurnlq');
        } else {
            console.warn('⚠️ Supabase JS SDK library loading...');
        }
    } catch (err) {
        console.error('Supabase initialization error:', err);
    }
}

function getOrCreateSessionId() {
    let session = localStorage.getItem('fevicol_session_id');
    if (!session) {
        session = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
        localStorage.setItem('fevicol_session_id', session);
    }
    return session;
}

// Log product interactions (views / modal opens)
async function trackProductView(product) {
    if (!product) return;
    const payload = {
        product_id: product.id,
        product_name: product.name,
        category: product.category || 'Classic',
        price: product.price,
        session_id: getOrCreateSessionId(),
        created_at: new Date().toISOString()
    };

    console.log('📡 [Supabase] Product viewed:', payload);

    if (supabaseClient) {
        try {
            await supabaseClient.from('product_interactions').insert([payload]);
            await supabaseClient.from('product_views').insert([payload]);
        } catch (err) {
            console.warn('Supabase product view log notice:', err);
        }
    }
}

// Log cart additions
async function trackAddToCart(product) {
    if (!product) return;
    const payload = {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        weight: product.weight || '110g',
        session_id: getOrCreateSessionId(),
        created_at: new Date().toISOString()
    };

    console.log('🛒 [Supabase] Product added to cart:', payload);

    if (supabaseClient) {
        try {
            await supabaseClient.from('cart_events').insert([payload]);
            await supabaseClient.from('cart_items').insert([payload]);
        } catch (err) {
            console.warn('Supabase cart log notice:', err);
        }
    }
}

// Log orders placed
async function trackOrder(orderData) {
    if (!orderData) return;
    const payload = {
        order_number: orderData.orderNumber,
        customer_name: orderData.customerName || 'Guest Customer',
        customer_email: orderData.customerEmail || 'guest@example.com',
        shipping_address: orderData.shippingAddress || 'Standard Delivery',
        subtotal: orderData.subtotal,
        shipping_fee: orderData.shipping,
        total: orderData.total,
        items: orderData.items,
        session_id: getOrCreateSessionId(),
        created_at: new Date().toISOString()
    };

    console.log('📦 [Supabase] Order recorded:', payload);

    if (supabaseClient) {
        try {
            await supabaseClient.from('orders').insert([payload]);
        } catch (err) {
            console.warn('Supabase order log notice:', err);
        }
    }
}

// Log wishlist changes
async function trackWishlist(productId, action) {
    const payload = {
        product_id: productId,
        action: action,
        session_id: getOrCreateSessionId(),
        created_at: new Date().toISOString()
    };

    console.log('❤️ [Supabase] Wishlist updated:', payload);

    if (supabaseClient) {
        try {
            await supabaseClient.from('wishlist_events').insert([payload]);
        } catch (err) {
            console.warn('Supabase wishlist log notice:', err);
        }
    }
}

// Log newsletter subscriptions
async function trackNewsletter(email) {
    const payload = {
        email: email,
        session_id: getOrCreateSessionId(),
        created_at: new Date().toISOString()
    };

    console.log('📧 [Supabase] Newsletter subscriber:', payload);

    if (supabaseClient) {
        try {
            await supabaseClient.from('newsletter_subscribers').insert([payload]);
        } catch (err) {
            console.warn('Supabase newsletter log notice:', err);
        }
    }
}

// Auto-initialize on window load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
} else {
    initSupabase();
}

// --------------------------------------------------------------------------
// 14. Data Aliases for Seamless Legacy / HTML Compatibility
// --------------------------------------------------------------------------
HAMPERS_DATA['hamper-discovery'] = HAMPERS_DATA['royale-box'];
HAMPERS_DATA['hamper-velvet'] = HAMPERS_DATA['party-pack'];
HAMPERS_DATA['hamper-nut'] = HAMPERS_DATA['lovers-edition'];

RECIPES_DATA['recipe-ganache'] = RECIPES_DATA['choco-truffles'];
RECIPES_DATA['recipe-lava'] = RECIPES_DATA['fudge-brownies'];
RECIPES_DATA['recipe-iced'] = RECIPES_DATA['lava-cake'];

// --------------------------------------------------------------------------
// 15. Search Modal Controller & Real-Time Filtering
// --------------------------------------------------------------------------
function openSearchModal() {
    const modal = document.getElementById('search-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    const input = document.getElementById('search-input');
    if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 100);
    }
    renderSearchResults('');
}

function closeSearchModal() {
    const modal = document.getElementById('search-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
}

function handleSearchInput(query) {
    renderSearchResults(query);
}

function setSearchCategory(cat) {
    const input = document.getElementById('search-input');
    if (input) {
        input.value = cat;
        renderSearchResults(cat);
    }
}

function renderSearchResults(query) {
    const container = document.getElementById('search-results');
    if (!container) return;

    const q = (query || '').toLowerCase().trim();
    const matches = Object.values(PRODUCTS_DATA).filter(p => {
        if (!q) return true;
        return p.name.toLowerCase().includes(q) ||
               p.tagline.toLowerCase().includes(q) ||
               p.category.toLowerCase().includes(q) ||
               p.description.toLowerCase().includes(q) ||
               (p.highlights && p.highlights.some(h => h.toLowerCase().includes(q)));
    });

    if (matches.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-on-surface-variant">
                <span class="material-symbols-outlined text-[36px] text-secondary-container">search_off</span>
                <p class="font-bold text-sm mt-2">No chocolates matching "${query}"</p>
                <p class="text-xs mt-1">Try searching for "Silk", "Almond", "Fruit", or "Classic"</p>
            </div>
        `;
        return;
    }

    container.innerHTML = matches.map(p => `
        <div onclick="closeSearchModal(); openProductModal('${p.id}');" class="flex items-center gap-4 p-3 rounded-2xl bg-surface-container hover:bg-surface-container-high border border-white/5 cursor-pointer transition-all group">
            <img src="${p.image}" alt="${p.name}" class="w-16 h-16 rounded-xl object-cover bg-primary-container/5 shrink-0 group-hover:scale-105 transition-transform" onerror="this.onerror=null; this.src='https://lh3.googleusercontent.com/aida-public/AB6AXuB3R1V4d72d_N_j8YJ11Vst6_qA6g7t972lX8yKj_Qy0FvN6u_9H47eGk0970aK26F74-qR82xJj19kZ_wB9a7e0V_b1h_N14fXz80hC0y-mR0d8zR21J04aX73y4596d-3s2207b1d';"/>
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                    <h5 class="font-title-lg text-sm font-bold text-on-surface group-hover:text-secondary transition-colors truncate">${p.name}</h5>
                    <span class="font-headline-sm text-sm text-primary-container font-bold">$${p.price.toFixed(2)}</span>
                </div>
                <p class="text-xs text-on-surface-variant line-clamp-1 mt-0.5">${p.tagline}</p>
                <div class="flex items-center gap-2 mt-1 text-[11px] text-secondary-container">
                    <span>${p.category}</span> • <span>${p.weight}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// --------------------------------------------------------------------------
// 16. Keyboard Accessibility & Shortcuts
// --------------------------------------------------------------------------
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeProductModal();
        closeCartDrawer();
        closeCheckoutModal();
        closeSearchModal();
        closeRecipeModal();
        closeHamperModal();
        closeInfoModal();
        closeLightboxModal();
    } else if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        openSearchModal();
    }
});


