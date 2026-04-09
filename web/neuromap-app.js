// ===============================
// NeuroMap App (FINAL)
// ===============================

const NeuroMapApp = (() => {
  const API_BASE_URL = "https://neuromap-backend-production-969d.up.railway.app";

  let currentLang = localStorage.getItem("nm_lang") || null;

  const translations = {
    hu: {
      startTitle: "Kérdőív indítása",
      name: "Név",
      email: "Email",
      pay: "Fizetés"
    },
    en: {
      startTitle: "Start questionnaire",
      name: "Name",
      email: "Email",
      pay: "Pay"
    }
  };

  function applyTranslations() {
    if (!currentLang) return;

    const t = translations[currentLang];

    document.getElementById("startTitle").innerText = t.startTitle;
    document.getElementById("labelName").innerText = t.name;
    document.getElementById("labelEmail").innerText = t.email;
    document.getElementById("paymentBtn").innerText = t.pay;
    document.getElementById("langSwitch").innerText = currentLang.toUpperCase();
  }

  function showLanguageModal() {
    const modal = document.getElementById("languageModal");
    if (modal) {
      modal.style.display = "flex";
    }
  }

  function hideLanguageModal() {
    const modal = document.getElementById("languageModal");
    if (modal) {
      modal.style.display = "none";
    }
  }

  function selectLang(lang) {
    currentLang = lang;
    localStorage.setItem("nm_lang", lang);
    hideLanguageModal();
    applyTranslations();
  }

  function setupLangSwitch() {
    const btn = document.getElementById("langSwitch");
    if (!btn) return;

    btn.addEventListener("click", () => {
      showLanguageModal();
    });
  }

  async function startCheckout() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;

    if (!name || !email) {
      alert("Missing data");
      return;
    }

    const res = await fetch(`${API_BASE_URL}/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        lang: currentLang || "hu"
      })
    });

    const data = await res.json();

    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    } else {
      alert("Stripe error");
    }
  }

  function init() {
    console.log("NeuroMap INIT");

    setupLangSwitch();

    if (!currentLang) {
      showLanguageModal();
    } else {
      applyTranslations();
    }

    window.selectLang = selectLang;
    window.startCheckout = startCheckout;
  }

  return { init };
})();

// 🔥 KRITIKUS
window.NeuroMapApp = NeuroMapApp;