(function () {
  document.addEventListener('submit', function (event) {
    var message = event.target.getAttribute && event.target.getAttribute('data-confirm');
    if (message && !window.confirm(message)) event.preventDefault();
  });

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest ? event.target.closest('[data-confirm]') : null;
    if (trigger && !window.confirm(trigger.getAttribute('data-confirm'))) event.preventDefault();
  });

  var questionForm = document.getElementById('question-form');
  if (!questionForm) return;

  var type = document.getElementById('question_type');
  var mc = document.getElementById('mc-fields');
  var tf = document.getElementById('tf-fields');

  function toggle() {
    var isMc = type.value === 'multiple_choice';
    mc.hidden = !isMc;
    tf.hidden = isMc;
    mc.querySelectorAll('input, select').forEach(function (el) { el.disabled = !isMc; });
    tf.querySelectorAll('select').forEach(function (el) { el.disabled = isMc; });
  }

  type.addEventListener('change', toggle);
  toggle();
})();
