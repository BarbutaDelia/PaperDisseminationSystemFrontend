// import $ from './node_modules/jquery/dist/jquery.js';
// import '../../selectize/dist/js/standalone/selectize.min.js';
// import '../../selectize/dist/css/selectize.css';

$(document).ready(function () {
    $('select').selectize({ maxItems: 3 })
});
$("#authors").selectize({
    delimiter: ",",
    persist: false,
    create: function (input) {
      return {
          value: input,
          text: input,
      };
    },
  });