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

  // Menu déroulant Territoires (au clic, pour tablette et souris)
  document.querySelectorAll(".nav-deroulant > button").forEach(function (bouton) {
    bouton.addEventListener("click", function (e) {
      e.stopPropagation();
      var parent = bouton.parentElement;
      var ouvert = parent.classList.toggle("ouvert");
      bouton.setAttribute("aria-expanded", ouvert ? "true" : "false");
    });
  });
  document.addEventListener("click", function () {
    document.querySelectorAll(".nav-deroulant.ouvert").forEach(function (d) {
      d.classList.remove("ouvert");
      d.querySelector("button").setAttribute("aria-expanded", "false");
    });
  });

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

/* ------------------------------------------------------------------
   Bandeau d'actualités
   Lit assets/actualites.json, ne garde que les annonces dont la période
   couvre aujourd'hui, et n'insère le bandeau que s'il en reste au moins
   une. Une annonce : texte fixe. Plusieurs : défilement en boucle.
   Si le fichier manque ou est illisible, on ne fait rien : le site
   s'affiche normalement, sans bande vide.
   ------------------------------------------------------------------ */
(function () {
  "use strict";

  function aujourdhui() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function enDate(texte) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(texte || ""));
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function echappe(t) {
    var d = document.createElement("div");
    d.textContent = t;
    return d.innerHTML;
  }

  fetch("assets/actualites.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !Array.isArray(data.annonces)) return;
      var now = aujourdhui();
      var actives = data.annonces.filter(function (a) {
        if (!a || !a.texte) return false;
        var du = enDate(a.du), au = enDate(a.au);
        if (du && now < du) return false;
        if (au && now > au) return false;   // le jour de fin reste affiché
        return true;
      });
      if (!actives.length) return;

      function morceau(a) {
        var t = echappe(a.texte);
        return a.lien
          ? '<a href="' + echappe(a.lien) + '">' + t + "</a>"
          : '<span class="actu">' + t + "</span>";
      }

      var bandeau = document.createElement("div");
      bandeau.className = "bandeau-actu";
      bandeau.setAttribute("role", "region");
      bandeau.setAttribute("aria-label", "Actualités de la prépa");

      if (actives.length === 1) {
        bandeau.classList.add("bandeau-actu--fixe");
        bandeau.innerHTML = '<div class="piste">' + morceau(actives[0]) + "</div>";
      } else {
        bandeau.classList.add("bandeau-actu--defile");
        var piste = actives.map(morceau).join('<span class="sep">&#183;</span>');
        bandeau.innerHTML =
          '<div class="rail">' +
          '<div class="piste">' + piste + '<span class="sep">&#183;</span></div>' +
          '<div class="piste" aria-hidden="true">' + piste + '<span class="sep">&#183;</span></div>' +
          "</div>";
      }

      document.body.insertBefore(bandeau, document.body.firstChild);
      document.body.classList.add("a-bandeau");
      // on mesure la hauteur réelle plutôt que de la deviner
      var h = bandeau.offsetHeight;
      document.documentElement.style.setProperty("--h-bandeau", h + "px");
      window.addEventListener("resize", function () {
        document.documentElement.style.setProperty("--h-bandeau", bandeau.offsetHeight + "px");
      }, { passive: true });
    })
    .catch(function () { /* pas de bandeau, pas de drame */ });
})();

/* ------------------------------------------------------------------
   Compteur de QCM réalisés
   On interroge d'abord la fonction publique de l'application, qui renvoie
   le compte réel : le chiffre et sa date sont alors ceux du jour même.
   Si elle ne répond pas, on retombe sur assets/compteurs.json, dont la
   valeur est datée elle aussi. Dans les deux cas le site affiche un nombre
   qu'il a mesuré, jamais une progression qu'il aurait inventée.
   ------------------------------------------------------------------ */
(function () {
  "use strict";
  var cible = document.querySelector('[data-compteur="qcm_realises"]');
  if (!cible) return;
  var dateEl = document.querySelector("[data-releve]");

  var MOIS = ["janvier","février","mars","avril","mai","juin","juillet",
              "août","septembre","octobre","novembre","décembre"];

  function poser(total, releve) {
    if (!total) return;
    cible.setAttribute("data-cible", String(total));
    if (dateEl && releve) {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(releve);
      if (m) dateEl.textContent = (+m[3]) + " " + MOIS[+m[2] - 1] + " " + m[1];
    }
  }

  function depuisLeFichier() {
    return fetch("assets/compteurs.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.qcm_realises) return;
        var q = d.qcm_realises;
        poser((q.exoteach_jusqu_au_20_fevrier_2026 || 0)
            + (q.exoteach_depuis_le_21_fevrier_2026 || 0)
            + (q.medibox || 0), q.releve_le);
      });
  }

  var API = "https://uozfgssyswxjapscklan.supabase.co/functions/v1/compteurs-publics";
  var minuteur = setTimeout(depuisLeFichier, 2500);   // si l'API traîne, on n'attend pas

  fetch(API, { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (d) {
      clearTimeout(minuteur);
      poser(d.qcm_realises, d.releve_le);
    })
    .catch(function () {
      clearTimeout(minuteur);
      depuisLeFichier().catch(function () { /* on garde la valeur du HTML */ });
    });
})();
