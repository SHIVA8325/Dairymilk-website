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
// 6. Global Order Modal Handlers
// --------------------------------------------------------------------------
function openOrderModal(productName) {
    const modal = document.getElementById('order-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('order-form');
    const success = document.getElementById('order-success');

    title.textContent = `Order ${productName}`;
    form.classList.remove('hidden');
    success.classList.add('hidden');
    modal.classList.remove('hidden');
}

function closeOrderModal() {
    const modal = document.getElementById('order-modal');
    modal.classList.add('hidden');
}

function handleOrderSubmit(event) {
    event.preventDefault();
    const form = document.getElementById('order-form');
    const success = document.getElementById('order-success');

    form.classList.add('hidden');
    success.classList.remove('hidden');

    if (window.lucide) lucide.createIcons();
}
