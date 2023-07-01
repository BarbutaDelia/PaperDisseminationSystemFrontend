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
  