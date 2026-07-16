// MediBox Antilles-Guyane · interactions du site vitrine

(function () {
  "use strict";

  // Header qui se fige au défilement
  var entete = document.querySelector(".entete");
  function majEntete() {
    entete.classList.toggle("figee", window.scrollY > 40);
  }
  window.addEventListener("scroll", majEntete, { passive: true });
  majEntete();

  // Menu mobile
  var burger = document.querySelector(".burger");
  var nav = document.querySelector(".nav-principale");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var ouvert = nav.classList.toggle("ouverte");
      burger.classList.toggle("ouvert", ouvert);
      burger.setAttribute("aria-expanded", ouvert ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (lien) {
      lien.addEventListener("click", function () {
        nav.classList.remove("ouverte");
        burger.classList.remove("ouvert");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Apparitions au scroll
  var observateur = new IntersectionObserver(
    function (entrees) {
      entrees.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          observateur.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll(".reveal").forEach(function (el) {
    observateur.observe(el);
  });

  // Compteurs animés
  function animeCompteur(el) {
    var cible = parseInt(el.getAttribute("data-cible"), 10);
    var suffixe = el.getAttribute("data-suffixe") || "";
    var duree = 1600;
    var debut = null;
    function pas(t) {
      if (!debut) debut = t;
      var avancement = Math.min((t - debut) / duree, 1);
      var facilite = 1 - Math.pow(1 - avancement, 3);
      var valeur = Math.round(cible * facilite);
      el.textContent = valeur.toLocaleString("fr-FR") + suffixe;
      if (avancement < 1) requestAnimationFrame(pas);
    }
    requestAnimationFrame(pas);
  }

  var observateurCompteurs = new IntersectionObserver(
    function (entrees) {
      entrees.forEach(function (e) {
        if (e.isIntersecting) {
          animeCompteur(e.target);
          observateurCompteurs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  document.querySelectorAll("[data-cible]").forEach(function (el) {
    observateurCompteurs.observe(el);
  });
})();
