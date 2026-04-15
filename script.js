// --- 1. GLOBAL CONFIGURATION ---
const BASE_URL = `https://mentoresolutions-java-backend.vercel.app`;

// API Endpoints
const API = {
    CERTIFICATES: `${BASE_URL}/api/certificates`,
    COURSES: `${BASE_URL}/api/java-courses`,
    TRAININGS: `${BASE_URL}/api/trainings`,
    PLACEMENTS: `${BASE_URL}/api/placements`,
    PAP: `${BASE_URL}/api/pap-steps`,
    CONTACTS: `${BASE_URL}/api/contacts`
};

// Tracking
let prevCertIds = [];

// --- 2. UTILITY FUNCTIONS ---
function formatDisplayDate(dateStr) {
    if (!dateStr) return "TBA";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// --- 3. CORE FUNCTIONS ---

// A. Certificates Scroller
async function loadCertificates() {
    try {
        const res = await fetch(API.CERTIFICATES);
        const certs = await res.json();
        if (!certs || certs.length === 0) return;

        const scroller1 = document.getElementById("certTrack1");
        const scroller2 = document.getElementById("certTrack2");
        if (!scroller1 || !scroller2) return;

        const newCerts = certs.filter(c => !prevCertIds.includes(c.id));
        if (newCerts.length === 0) return;

        const mid = Math.ceil(newCerts.length / 2);
        const halves = [newCerts.slice(0, mid), newCerts.slice(mid)];
        const tracks = [scroller1, scroller2];

        halves.forEach((half, index) => {
            half.forEach(c => {
                const img = document.createElement("img");
                img.src = c.image;
                img.alt = "Global Certificate";
                img.classList.add("admin-cert");
                tracks[index].appendChild(img);
            });
            refreshScrollerAnimation(tracks[index]);
        });

        prevCertIds = certs.map(c => c.id);
    } catch (err) { console.error("Certificates Error:", err); }
}

function refreshScrollerAnimation(track) {
    const originalImages = Array.from(track.querySelectorAll('img:not(.clone)'));
    track.innerHTML = '';
    originalImages.forEach(img => track.appendChild(img));
    originalImages.forEach(img => {
        const clone = img.cloneNode(true);
        clone.classList.add('clone');
        track.appendChild(clone);
    });
    const duration = (track.scrollWidth / 2) / 40;
    track.style.animationDuration = `${duration}s`;
}

// B. Upcoming Course Batch
async function updateUpcomingBatch() {
    try {
        const res = await fetch(API.COURSES);
        const courses = await res.json();
        if (Array.isArray(courses) && courses.length > 0) {
            const latest = courses.sort((a, b) => b.id - a.id)[0];
            const updates = {
                "java-start-date": `📅 New Batch Starting On : ${formatDisplayDate(latest.start_date)}`,
                "java-duration": `⏱ Duration: ${latest.duration || "6 Months"}`,
                "java-batch-time": `⏰ Batch Time: ${latest.batch_time || "Morning/Evening"}`
            };
            for (const [id, val] of Object.entries(updates)) {
                const el = document.getElementById(id);
                if (el) el.innerHTML = val;
            }
        }
    } catch (err) { console.error("Batch Update Error:", err); }
}

// C. Trainings Slider
async function loadTrainings() {
    const sliderTrack = document.querySelector(".training-track");
    if (!sliderTrack) return;

    try {
        const res = await fetch(API.TRAININGS);
        const trainings = await res.json();
        trainings.forEach(t => {
            const card = document.createElement("div");
            card.className = "training-card";
            card.innerHTML = `<i class="${t.icon}"></i><h4>${t.name}</h4>`;
            sliderTrack.appendChild(card);
        });

        setTimeout(() => initTrainingSlider(sliderTrack), 500);
    } catch (err) { console.error("Trainings Error:", err); }
}

function initTrainingSlider(track) {
    let moveSpeed = 1.5;
    let currentOffset = 0;
    const baseItems = Array.from(track.children);
    baseItems.forEach(item => track.appendChild(item.cloneNode(true)));
    
    let baseWidth = 0;
    baseItems.forEach(item => (baseWidth += item.offsetWidth + 26));

    function run() {
        currentOffset -= moveSpeed;
        if (Math.abs(currentOffset) >= baseWidth) currentOffset = 0;
        track.style.transform = `translateX(${currentOffset}px)`;
        requestAnimationFrame(run);
    }
    run();

    const viewport = document.querySelector(".training-scroll");
    if (viewport) {
        viewport.addEventListener("mouseenter", () => (moveSpeed = 0));
        viewport.addEventListener("mouseleave", () => (moveSpeed = 1.5));
    }
}

// D. Placements Scroll
async function loadPlacements() {
    const scrollDown = document.getElementById("scrollDown");
    const scrollUp = document.getElementById("scrollUp");
    if (!scrollDown || !scrollUp) return;

    try {
        const res = await fetch(API.PLACEMENTS);
        const data = await res.json();
        data.sort((a, b) => a.name.localeCompare(b.name));

        const createCard = (p) => `
            <div class="placement-card">
                <img src="${p.image}" alt="${p.name}">
                <div class="card-info">
                    <h4>${p.name}</h4><span>${p.role}</span><p>${p.company}</p><strong>${p.pkg}</strong>
                </div>
            </div>`;

        const half = Math.ceil(data.length / 2);
        const downContent = scrollDown.querySelector(".scroll-content");
        const upContent = scrollUp.querySelector(".scroll-content");

        data.slice(0, half).forEach(p => downContent.innerHTML += createCard(p));
        data.slice(half).forEach(p => upContent.innerHTML += createCard(p));

        [scrollDown, scrollUp].forEach(s => {
            const content = s.querySelector(".scroll-content");
            content.innerHTML += content.innerHTML;
        });
        initPlacementAnimation(scrollDown, scrollUp);
    } catch (err) { console.error("Placements Error:", err); }
}

function initPlacementAnimation(scrollDown, scrollUp) {
    let speed = 1, pauseDown = false, pauseUp = false;

    const setupEvents = (el, setFlag) => {
        if (!el) return;
        ["mouseenter", "touchstart"].forEach(ev => el.addEventListener(ev, () => setFlag(true)));
        ["mouseleave", "touchend"].forEach(ev => el.addEventListener(ev, () => setFlag(false)));
    };

    setupEvents(scrollDown, (v) => pauseDown = v);
    setupEvents(scrollUp, (v) => pauseUp = v);

    function animate() {
        const isDesktop = window.innerWidth > 768;
        if (isDesktop) {
            if (!pauseDown) {
                scrollDown.scrollTop += speed;
                if (scrollDown.scrollTop >= scrollDown.scrollHeight / 2) scrollDown.scrollTop = 0;
            }
            if (!pauseUp) {
                scrollUp.scrollTop -= speed;
                if (scrollUp.scrollTop <= 0) scrollUp.scrollTop = scrollUp.scrollHeight / 2;
            }
        } else {
            if (!pauseDown) {
                scrollDown.scrollLeft += speed;
                if (scrollDown.scrollLeft >= scrollDown.scrollWidth / 2) scrollDown.scrollLeft = 0;
            }
            if (!pauseUp) {
                scrollUp.scrollLeft -= speed;
                if (scrollUp.scrollLeft <= 0) scrollUp.scrollLeft = scrollUp.scrollWidth / 2;
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
}

// E. PAP Policy
async function loadPAPPolicy() {
    const timeline = document.getElementById('user-pap-timeline');
    if (!timeline) return;

    try {
        const res = await fetch(API.PAP);
        const data = await res.json();
        if (data && data.length > 0) {
            timeline.innerHTML = '';
            data.forEach(step => {
                const div = document.createElement('div');
                div.className = `step ${step.status === 'danger' ? 'danger' : ''}`;
                div.innerHTML = `<div class="dot"></div><div class="pap-content"><h3>${step.title}</h3><p>${step.description}</p></div>`;
                timeline.appendChild(div);
            });
        }
    } catch (err) { console.error("PAP Error:", err); }
}

// F. Footer Contact
async function loadFooterContact() {
    try {
        const res = await fetch(API.CONTACTS);
        const data = await res.json();
        if (!data || !data.length) return;
        const contact = data[data.length - 1];

        const updates = {
            footerMobile: `<i class="fas fa-phone"></i> ${contact.mobile || ""}`,
            footerEmail: `<i class="fas fa-envelope"></i> ${contact.email || ""}`
        };
        for (const [id, val] of Object.entries(updates)) {
            const el = document.getElementById(id);
            if (el) el.innerHTML = val;
        }

        const insta = document.getElementById("footerInstagram");
        const linkedin = document.getElementById("footerLinkedIn");
        if (insta) { insta.href = contact.instagram || "#"; insta.style.visibility = contact.instagram ? "visible" : "hidden"; }
        if (linkedin) { linkedin.href = contact.linkedin || "#"; linkedin.style.visibility = contact.linkedin ? "visible" : "hidden"; }
    } catch (err) { console.error("Footer Error:", err); }
}

// --- 4. INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    // Run all loads
    loadCertificates();
    updateUpcomingBatch();
    loadTrainings();
    loadPlacements();
    loadPAPPolicy();
    loadFooterContact();

    // Secondary UI logics
    const linuxBox = document.getElementById("linux-box");
    if (linuxBox) linuxBox.classList.add("active");

    // Interval for dynamic certs
    setInterval(loadCertificates, 10000);

    // Typing Effect
    const tagline = document.querySelector(".banner-tagline");
    if (tagline) {
        const text = tagline.textContent.trim();
        tagline.textContent = "";
        let i = 0;
        const type = () => {
            if (i < text.length) { tagline.textContent += text.charAt(i++); setTimeout(type, 50); }
        };
        type();
    }
});

// UI Toggles
function toggleFAQ(el) { el.parentElement.classList.toggle("active"); }
function toggleTopics(el) { el.parentElement.classList.toggle("active"); }