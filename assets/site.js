/* =====================================================================
   site.js — page behaviour.

   Every listener here is delegated from `document`, because fragments are
   injected by loader.js at an unpredictable moment and anything bound to a
   specific element at load time would bind to nothing.
   ===================================================================== */
(function () {
  "use strict";

  // FAQ accordion. One item open at a time; clicking the open item closes it.
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".faq-acc-q");
    if (!btn) return;

    var item = btn.parentElement;
    var accordion = btn.closest(".faq-accordion");
    if (!accordion) return;

    var wasOpen = item.classList.contains("open");
    var open = accordion.querySelectorAll(".faq-acc-item.open");
    for (var i = 0; i < open.length; i++) open[i].classList.remove("open");
    if (!wasOpen) item.classList.add("open");
  });
})();
