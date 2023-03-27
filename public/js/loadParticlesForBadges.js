document.addEventListener("DOMContentLoaded", function(event) {
    particlesJS.load('particles-js', 'js/particles.json', function () {
    });
    var badges = document.getElementsByClassName("badge-particle");
    for (var i = 0; i < badges.length; i++) {
        particlesJS.load(badges.item(i).id, 'js/particles.json', function () {
        });
    }
  });
  