function SCROLLTRIGGER() {

    gsap.registerPlugin(ScrollTrigger);

    const main = document.querySelector("#main");

    const scroll = new LocomotiveScroll({
        el: main,
        smooth: true,
        lerp: 0.06,
        multiplier: 0.7
    });

    scroll.on("scroll", ScrollTrigger.update);

    ScrollTrigger.scrollerProxy(main, {

        scrollTop(value) {
            return arguments.length
                ? scroll.scrollTo(value, {
                    duration: 0,
                    disableLerp: true
                })
                : scroll.scroll.instance.scroll.y;
        },

        getBoundingClientRect() {
            return {
                top: 0,
                left: 0,
                width: innerWidth,
                height: innerHeight
            };
        },

        pinType: main.style.transform ? "transform" : "fixed"
    });

    const navbar = document.querySelector(".Navbar");
    const menuToggle = document.querySelector(".menu-toggle");
    const mobileMenu = document.querySelector(".mobile-menu");
    const mobileMenuLinks = mobileMenu
        ? mobileMenu.querySelectorAll("a")
        : [];
    const backToTop = document.querySelector(".back-to-top");

    let lastScroll = scroll.scroll.instance.scroll.y || 0;
    let mobileMenuOpen = false;

    const showNavbar = () => {
        gsap.killTweensOf(navbar);
        gsap.to(navbar, {
            yPercent: 0,
            duration: 0.4,
            ease: "power3.out",
            overwrite: true
        });
    };

    const hideNavbar = () => {
        if (mobileMenuOpen) return;

        gsap.killTweensOf(navbar);
        gsap.to(navbar, {
            yPercent: -170,
            duration: 0.4,
            ease: "power3.out",
            overwrite: true
        });
    };

    if (navbar) {
        gsap.set(navbar, { yPercent: 0 });

        scroll.on("scroll", (args) => {
            const currentScroll = args.scroll.y || 0;
            const distance = currentScroll - lastScroll;

            if (mobileMenuOpen) {
                showNavbar();
            } else if (Math.abs(distance) > 2) {
                if (distance > 0 && currentScroll > 100) {
                    hideNavbar();
                } else if (distance < 0) {
                    showNavbar();
                }
            }

            lastScroll = currentScroll;
        });
    }

    if (menuToggle && mobileMenu) {
        gsap.set(mobileMenu, {
            autoAlpha: 0,
            clipPath: "inset(0 0 100% 0)"
        });

        const menuTimeline = gsap.timeline({
            paused: true,
            defaults: { ease: "power3.out" },
            onStart: () => {
                mobileMenuOpen = true;
                mobileMenu.setAttribute("aria-hidden", "false");
                menuToggle.setAttribute("aria-expanded", "true");
                menuToggle.setAttribute("aria-label", "Close menu");
                showNavbar();
            },
            onReverseComplete: () => {
                mobileMenuOpen = false;
                mobileMenu.setAttribute("aria-hidden", "true");
                menuToggle.setAttribute("aria-expanded", "false");
                menuToggle.setAttribute("aria-label", "Open menu");
            }
        });

        menuTimeline
            .to(mobileMenu, {
                autoAlpha: 1,
                clipPath: "inset(0 0 0% 0)",
                duration: 0.55,
                ease: "power4.inOut"
            })
            .from(mobileMenuLinks, {
                y: 34,
                opacity: 0,
                stagger: 0.07,
                duration: 0.42
            }, "-=0.2");

        const closeMenu = () => menuTimeline.reverse();

        menuToggle.addEventListener("click", () => {
            if (menuTimeline.progress() === 0) {
                menuTimeline.play();
            } else {
                closeMenu();
            }
        });

        mobileMenuLinks.forEach((link) => {
            link.addEventListener("click", (event) => {
                const target = document.querySelector(link.getAttribute("href"));
                if (!target) return;

                event.preventDefault();
                closeMenu();
                scroll.scrollTo(target, {
                    duration: 1.1,
                    offset: -10,
                    disableLerp: false
                });
            });
        });
    }

    if (backToTop) {
        backToTop.addEventListener("click", () => {
            showNavbar();
            scroll.scrollTo(0, {
                duration: 1.1,
                disableLerp: false
            });
        });
    }


     /* =========================================================
         AURA FRAME SEQUENCE
         ScrollTrigger owns both pinning and frame progress.
     ========================================================= */

    const auraCanvas = document.querySelector("#auraCanvas");
    const auraSection = document.querySelector("#auraJourney");
    const auraCounter = document.querySelector("#auraFrameCount");

    if (auraCanvas && auraSection) {
        const ctx = auraCanvas.getContext("2d", { alpha: false });

        const FRAME_COUNT = 455;
        const FRAME_PATH = (i) =>
            `images/aura/${String(i + 1).padStart(4, "0")}.webp`;

        const frames = new Array(FRAME_COUNT);
        let loaded = 0;
        let currentFrame = -1;
        let pendingFrame = 0;
        let raf = 0;

        const clamp = (n, min, max) =>
            Math.max(min, Math.min(max, n));

        const drawCover = (img) => {
            if (!img || !img.complete || !img.naturalWidth) return;

            const cw = auraCanvas.width;
            const ch = auraCanvas.height;

            const scale = Math.max(
                cw / img.naturalWidth,
                ch / img.naturalHeight
            );

            const w = img.naturalWidth * scale;
            const h = img.naturalHeight * scale;

            const x = (cw - w) * 0.5;
            const y = (ch - h) * 0.5;

            ctx.fillStyle = "#050505";
            ctx.fillRect(0, 0, cw, ch);
            ctx.drawImage(img, x, y, w, h);
        };

        const resizeCanvas = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            auraCanvas.width = Math.round(auraCanvas.clientWidth * dpr);
            auraCanvas.height = Math.round(auraCanvas.clientHeight * dpr);

            if (currentFrame >= 0) drawCover(frames[currentFrame]);
        };

        const getAvailableFrame = (frame) => {
            if (frames[frame]) return frames[frame];

            for (let distance = 1; distance < FRAME_COUNT; distance++) {
                const before = frame - distance;
                const after = frame + distance;

                if (before >= 0 && frames[before]) return frames[before];
                if (after < FRAME_COUNT && frames[after]) return frames[after];
            }

            return null;
        };

        const render = () => {
            raf = 0;

            const frame = clamp(
                Math.round(pendingFrame),
                0,
                FRAME_COUNT - 1
            );

            const image = getAvailableFrame(frame);
            if (!image) {
                return;
            }

            if (frame !== currentFrame) {
                currentFrame = frame;
                drawCover(image);

                if (auraCounter) {
                    auraCounter.textContent =
                        `${String(frame + 1).padStart(3, "0")} / ${FRAME_COUNT}`;
                }
            }
        };

        const requestRender = (frame) => {
            pendingFrame = frame;
            if (!raf) raf = requestAnimationFrame(render);
        };

        const loadFrame = (index) => {
            const img = new Image();

            img.decoding = "async";
            img.src = FRAME_PATH(index);

            img.onload = () => {
                frames[index] = img;
                loaded++;

                if (index === 0) {
                    resizeCanvas();
                    requestRender(0);
                }

                requestRender(pendingFrame);
            };

            img.onerror = () => {
                console.warn(`Aura frame missing: ${FRAME_PATH(index)}`);
            };
        };

        /* Load the first frame immediately, then progressively cache the rest. */
        loadFrame(0);

        let next = 1;
        const batchLoad = () => {
            const end = Math.min(next + 7, FRAME_COUNT);

            while (next < end) {
                loadFrame(next++);
            }

            if (next < FRAME_COUNT) {
                typeof requestIdleCallback === "function"
                    ? requestIdleCallback(batchLoad)
                    : setTimeout(batchLoad, 0);
            }
        };

        batchLoad();

        window.addEventListener("resize", resizeCanvas);

        resizeCanvas();

        ScrollTrigger.create({
            trigger: auraSection,
            scroller: main,
            start: "top top",
            end: "+=5000",
            pin: true,
            pinSpacing: true,
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
                requestRender(self.progress * (FRAME_COUNT - 1));
            }
        });
    }

    ScrollTrigger.addEventListener("refresh", () => scroll.update());

    ScrollTrigger.refresh();
}


const greetings = [
    "HELLO",
    "नमस्ते",
    "こんにちは",
    "你好",
    "안녕하세요",
    "Hola",
    "Bonjour",
    "Hallo",
    "Ciao",
    "Привет"
];


window.addEventListener("load", () => {

    const loader = document.querySelector(".Loading");
    const text = document.querySelector(".Loading_text");

    let index = 0;

    text.textContent = greetings[0];

    gsap.fromTo(text,
        {
            opacity: 0,
            y: 20,
            filter: "blur(6px)"
        },
        {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.5,
            ease: "power3.out"
        }
    );


    function changeGreeting() {

        const tl = gsap.timeline();

        tl.to(text, {
            opacity: 0,
            y: -10,
            filter: "blur(4px)",
            duration: 0.1,
            ease: "power2.in"
        })

        .call(() => {
            index = (index + 1) % greetings.length;
            text.textContent = greetings[index];
        })

        .fromTo(text,
            {
                opacity: 0,
                y: 10,
                filter: "blur(4px)"
            },
            {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 0.18,
                ease: "power3.out"
            }
        );
    }


    const greetingInterval = setInterval(changeGreeting, 450);


    gsap.timeline({ delay: 4.5 })

        .to(text, {
            opacity: 0,
            y: -40,
            filter: "blur(10px)",
            duration: 0.5,
            ease: "power4.in"
        })

        .to(loader, {
            height: 0,
            borderBottomLeftRadius: "50% 100%",
            borderBottomRightRadius: "50% 100%",
            duration: 1.3,
            ease: "expo.inOut"
        })

        .set(loader, {
            display: "none"
        })

        .call(() => {

            clearInterval(greetingInterval);

            SCROLLTRIGGER();

        });

});

















/* =========================
   CONTACT / BACK TO TOP
========================= */

const backToTop = document.querySelector(".back-to-top");

if (backToTop) {
    backToTop.addEventListener("click", () => {
        const main = document.querySelector("#main");

        if (window.scroll && typeof window.scroll.scrollTo === "function") {
            window.scroll.scrollTo("top", {
                duration: 900,
                disableLerp: false
            });
        } else if (main) {
            main.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        } else {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    });
}