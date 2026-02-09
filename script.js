// Backend Base URL
const BASE_URL = "https://mentoresolutions-devops-backend.vercel.app";
const CERT_API = `${BASE_URL}/api/certificates`;

// ट्रॅकिंगसाठी
let prevCertIds = [];

// Certificates लोड करणे आणि Scrollers मध्ये दाखवणे
async function loadCertificates() {
  try {
    const res = await fetch(CERT_API);
    const certs = await res.json();

    if (!certs || certs.length === 0) return;

    const scroller1 = document.getElementById("certTrack1");
    const scroller2 = document.getElementById("certTrack2");

    if (!scroller1 || !scroller2) return;

    // फक्त नवीन सर्टिफिकेट्स फिल्टर करा जे आधी लोड झाले नाहीत
    const newCerts = certs.filter(c => !prevCertIds.includes(c.id));
    
    // जर काहीच नवीन नसेल, तर पुढचे लॉजिक रन करू नका
    if (newCerts.length === 0) return;

    // नवीन सर्टिफिकेट्स दोन भागात विभागणे
    const mid = Math.ceil(newCerts.length / 2);
    const firstHalf = newCerts.slice(0, mid);
    const secondHalf = newCerts.slice(mid);

    // --- Scroller 1 मध्ये इमेज जोडणे ---
    firstHalf.forEach(c => {
      const img = document.createElement("img");
      // Supabase कडून मिळणारी URL थेट वापरणे
      img.src = c.image; 
      img.alt = "Global Certificate";
      img.classList.add("admin-cert");
      scroller1.appendChild(img);
    });

    // --- Scroller 2 मध्ये इमेज जोडणे ---
    secondHalf.forEach(c => {
      const img = document.createElement("img");
      img.src = c.image; 
      img.alt = "Global Certificate";
      img.classList.add("admin-cert");
      scroller2.appendChild(img);
    });

    // ॲनिमेशन रिसेट आणि क्लोनिंग (Seamless Scroll साठी)
    refreshScrollerAnimation(scroller1);
    refreshScrollerAnimation(scroller2);

    // ID ट्रॅकर अपडेट करणे
    prevCertIds = certs.map(c => c.id);

  } catch (err) {
    console.error("Error loading certificates:", err);
  }
}

// स्क्रोलिंग स्मूथ आणि अपडेटेड ठेवण्यासाठी फंक्शन
function refreshScrollerAnimation(track) {
  // 1. आधीचे क्लोन्स काढून टाका (जर असतील तर) जेणेकरून गॅप पडणार नाही
  // आम्ही फक्त ओरिजिनल इमेजेस ठेवतो आणि पुन्हा क्लोन करतो
  const originalImages = Array.from(track.querySelectorAll('img:not(.clone)'));
  track.innerHTML = ''; // पूर्ण साफ करा
  
  originalImages.forEach(img => track.appendChild(img)); // ओरिजिनल परत टाका
  
  // 2. आता पुन्हा क्लोन करा
  originalImages.forEach(img => {
    const clone = img.cloneNode(true);
    clone.classList.add('clone');
    track.appendChild(clone);
  });

  // 3. ॲनिमेशन ड्युरेशन सेट करा
  const totalWidth = track.scrollWidth / 2;
  const duration = totalWidth / 40; 
  track.style.animationDuration = `${duration}s`;
}

// --- INITIALIZE ---
document.addEventListener("DOMContentLoaded", () => {
  // सुरुवातीला लोड करा
  loadCertificates();

  // दर १० सेकंदाला चेक करा काही नवीन सर्टिफिकेट आले आहे का
  setInterval(loadCertificates, 10000);

  // टायपिंग इफेक्ट
  const el = document.querySelector(".banner-tagline");
  if (el) {
    const text = el.textContent.trim();
    el.textContent = "";
    let index = 0;
    function type() {
      if (index < text.length) {
        el.textContent += text.charAt(index);
        index++;
        setTimeout(type, 50);
      }
    }
    type();
  }
});

// ============================
// COURSE SECTION - USER PANEL
// ============================

function toggleFAQ(element) {
  element.parentElement.classList.toggle("active");
}

function toggleTopics(element) {
  element.parentElement.classList.toggle("active");
}

function expandFirstBox() {
  const firstBox = document.getElementById("linux-box");
  if (firstBox && !firstBox.classList.contains("active")) {
    firstBox.classList.add("active");
  }
}

const COURSE_API = `${BASE_URL}/api/courses`;

/**
 * तारीख DD-MM-YYYY फॉरमॅटमध्ये दाखवण्यासाठी
 */
function formatDisplayDate(dateStr) {
    if (!dateStr) return "TBA";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; 
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

/**
 * डेटाबेस मधून Duration आणि Start Date अपडेट करणे
 */
async function updateUpcomingBatch() {
  try {
    const res = await fetch(COURSE_API);
    const courses = await res.json();
    
    // डेटा तपासणी
    if (!courses || !Array.isArray(courses) || courses.length === 0) {
        console.warn("No course data available.");
        return;
    }

    // शेवटचा (Latest) कोर्स मिळवणे
    const latest = courses[courses.length - 1];
    
    // HTML मधले Elements शोधणे
    const courseInfo = document.querySelector("#courses .course-info");
    
    if (courseInfo && latest) {
      const spans = courseInfo.querySelectorAll("span");
      
      if (spans.length >= 2) {
        // 1. Start Date अपडेट करा (Field changed to start_date1)
        const startDate = latest.start_date1 ? formatDisplayDate(latest.start_date1) : "TBA";
        spans[0].innerHTML = `📅 New Batch Starting On : ${startDate}`;
        
        // 2. Duration अपडेट करा (Field changed to duration1)
        const durationText = latest.duration1 ? latest.duration1 : "6 Months";
        spans[1].innerHTML = `⏱ Duration: ${durationText}`;
        
        console.log("Batch Data Updated Successfully from courses1 table");
      }
    }
  } catch (err) {
    console.error("Failed to load upcoming batch info:", err);
  }
}

// पेज लोड झाल्यावर रन करा
document.addEventListener("DOMContentLoaded", () => {
    expandFirstBox(); 
    updateUpcomingBatch(); 
});


// ===============================
// Training Js (Updated)
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  const sliderTrack = document.querySelector(".training-track");
  const sliderViewport = document.querySelector(".training-scroll");
  const API_URL = `${BASE_URL}/api/trainings`;
  
  let moveSpeed = 1.5;
  let currentOffset = 0;

  // तारीख DD-MM-YYYY फॉरमॅटमध्ये करण्यासाठी फंक्शन
  function formatDate(dateStr) {
    if (!dateStr) return "TBA";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // ================= BACKEND TRAININGS FETCH =================
  try {
    const res = await fetch(API_URL);
    const trainings = await res.json();
    
    trainings.forEach(t => {
      const card = document.createElement("div");
      card.className = "training-card";
      
      // बदल: इथे t.start_date आणि t.duration वापरले आहे
      card.innerHTML = `
        <i class="${t.icon}"></i>
        <h4>${t.name}</h4>
      `;
      sliderTrack.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading trainings from DB:", err);
  }

  // ================= DUPLICATE CARDS & SLIDER LOGIC =================
  // डेटा लोड झाल्यावर विड्थ मोजण्यासाठी थोडा वेळ (Dely) द्यावा लागतो
  setTimeout(() => {
    const baseItems = Array.from(sliderTrack.children);
    baseItems.forEach(item => sliderTrack.appendChild(item.cloneNode(true)));

    let baseWidth = 0;
    baseItems.forEach(item => (baseWidth += item.offsetWidth + 26));

    function runAutoSlider() {
      currentOffset -= moveSpeed;
      if (Math.abs(currentOffset) >= baseWidth) currentOffset = 0;
      sliderTrack.style.transform = `translateX(${currentOffset}px)`;
      requestAnimationFrame(runAutoSlider);
    }
    runAutoSlider();
  }, 500); 

  sliderViewport.addEventListener("mouseenter", () => (moveSpeed = 0));
  sliderViewport.addEventListener("mouseleave", () => (moveSpeed = 1.5));
});

/* ===============================
   USER PANEL – Placements Scroll
================================ */
async function loadPlacementsFromBackend() {
  const scrollDown = document.getElementById("scrollDown");
  const scrollUp = document.getElementById("scrollUp");
  if (!scrollDown || !scrollUp) return;
  try {
    const res = await fetch(`${BASE_URL}/api/placements`);
    const data = await res.json();
    
    // नावानुसार सॉर्टिंग
    data.sort((a, b) => a.name.localeCompare(b.name));
    
    const scrollDownContent = scrollDown.querySelector(".scroll-content");
    const scrollUpContent = scrollUp.querySelector(".scroll-content");

    // Helper to create card HTML
    // बदल: p.package ऐवजी p.pkg वापरले आणि इमेजसाठी p.image
    const createCard = (p) => `
      <div class="placement-card">
        <img src="${p.image}" alt="${p.name}">
        <div class="card-info">
          <h4>${p.name}</h4>
          <span>${p.role}</span>
          <p>${p.company}</p>
          <strong>${p.pkg}</strong>
        </div>
      </div>
    `;

    // डेटा दोन भागात विभागून Append करणे (+= मुळे आधीचा डेटा जाणार नाही)
    const half = Math.ceil(data.length / 2);
    data
      .slice(0, half)
      .forEach((p) => (scrollDownContent.innerHTML += createCard(p)));
    data
      .slice(half)
      .forEach((p) => (scrollUpContent.innerHTML += createCard(p)));

    // डेटा ॲपेंड झाल्यानंतर क्लोनिंग करणे जेणेकरून स्क्रोल नीट होईल
    duplicate(scrollDown);
    duplicate(scrollUp);

  } catch (err) {
    console.error("Error fetching placements:", err);
  }
}

/* ===============================
   Scroll + Pause Logic
================================ */
// ड्युप्लिकेट फंक्शन जेणेकरून स्क्रोलिंग मध्ये गॅप येणार नाही
const duplicate = (scroller) => {
  const content = scroller.querySelector(".scroll-content");
  if (content && !content.dataset.duplicated) {
    content.innerHTML += content.innerHTML;
    content.dataset.duplicated = "true"; 
  }
};

window.addEventListener("load", async () => {
  // बॅकएंड डेटा लोड करा
  await loadPlacementsFromBackend();
  
  const scrollDown = document.getElementById("scrollDown");
  const scrollUp = document.getElementById("scrollUp");
  const speed = 1; 
  let pauseDown = false;
  let pauseUp = false;

  // Pause events
  [
    { el: scrollDown, flag: (val) => (pauseDown = val) },
    { el: scrollUp, flag: (val) => (pauseUp = val) },
  ].forEach(({ el, flag }) => {
    if(!el) return;
    el.addEventListener("mouseenter", () => flag(true));
    el.addEventListener("mouseleave", () => flag(false));
    el.addEventListener("click", () => flag(!pauseDown));
    el.addEventListener("touchstart", () => flag(true));
    el.addEventListener("touchend", () => flag(false));
  });

  // Animation loop
  function animate() {
    const isDesktop = window.innerWidth > 768;
    if (isDesktop) {
      if (!pauseDown && scrollDown) {
        scrollDown.scrollTop += speed;
        if (scrollDown.scrollTop >= scrollDown.scrollHeight / 2)
          scrollDown.scrollTop = 0;
      }
      if (!pauseUp && scrollUp) {
        scrollUp.scrollTop -= speed;
        if (scrollUp.scrollTop <= 0)
          scrollUp.scrollTop = scrollUp.scrollHeight / 2;
      }
    } else {
      if (!pauseDown && scrollDown) {
        scrollDown.scrollLeft += speed;
        if (scrollDown.scrollLeft >= scrollDown.scrollWidth / 2)
          scrollDown.scrollLeft = 0;
      }
      if (!pauseUp && scrollUp) {
        scrollUp.scrollLeft -= speed;
        if (scrollUp.scrollLeft <= 0)
          scrollUp.scrollLeft = scrollUp.scrollWidth / 2;
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
});


// CONTACT JS
// ===============================
// USER PANEL – CONTACT (FOOTER) JS
// ===============================
const CONTACT_API = `${BASE_URL}/api/contacts`;
async function loadFooterContact() {
  try {
    const res = await fetch(CONTACT_API);
    const data = await res.json();
    if (!data || !data.length) return;
    // Always take latest contact
    const contact = data[data.length - 1];
    // Update footer phone & email
    const footerMobile = document.getElementById("footerMobile");
    const footerEmail = document.getElementById("footerEmail");
    if (footerMobile)
      footerMobile.innerHTML = `<i class="fas fa-phone"></i> ${contact.mobile || ""}`;
    if (footerEmail)
      footerEmail.innerHTML = `<i class="fas fa-envelope"></i> ${contact.email || ""}`;
    // Update social links
    const insta = document.getElementById("footerInstagram");
    const linkedin = document.getElementById("footerLinkedIn");
    if (insta) {
      insta.href = contact.instagram || "#";
      insta.style.visibility = contact.instagram ? "visible" : "hidden";
    }
    if (linkedin) {
      linkedin.href = contact.linkedin || "#";
      linkedin.style.visibility = contact.linkedin ? "visible" : "hidden";
    }
  } catch (err) {
    console.error("Footer contact load failed:", err);
  }
}
// ------------------------------
// INITIAL LOAD
// ------------------------------
document.addEventListener("DOMContentLoaded", loadFooterContact);
// ------------------------------
// OPTIONAL: live refresh after admin update
// call loadFooterContact() from admin JS
// ------------------------------





