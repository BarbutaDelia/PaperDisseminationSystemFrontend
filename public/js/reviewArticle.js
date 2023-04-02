// aici vine preluarea nft-urile de interes
// preluam nft urile cu tag-urile mentionate in articol, cu cel mai mare nivel existent in wallet
// se face post catre /article/:id din nodejs
// din /article/:id se apeleaza o metoda din spring boot care primeste {"tagDeInteres": "nivelMaxUtilizator", ...}
// spring boot verifica daca tag urile sunt ok pentru a da review 
// daca tag urile sunt ok, se downloadeaza articolul si se face redirect catre offer-revie.ejs, unde se completeaza review ul
// daca un utilizator a dat un review pt un articol, nu o mai poate face a doua oara

// Flow pt badge:
// cand ai dat submit, se baga in baza de date ca ai dat testul.
// daca dai din nou sa dai testul si a trecut o luna - se deschide testul normal
// daca nu a trecut o luna si nu ai badge ul -- se deschide diret pe pagina cu tranzactia metamask
// daca nu a trecut o luna ai badge-ul -- notificare cat mai trebuie sa astepti pana data urmatoare

// Flow pt badge varianta in care dai o sg data testul.
// daca dai testul si ai badge-ul, nu-l mai poti da
// daca dai testul si nu ai badge-ul, se deschide cu pop-up-ul metamask
document.addEventListener("DOMContentLoaded", function() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    const ranges = document.querySelectorAll('input[type="range"]');
    ranges.forEach(function(range) {
      const output = range.nextElementSibling;
      output.innerHTML = range.value;
  
      range.oninput = function() {
        output.innerHTML = this.value;
      };
    });
  });
  