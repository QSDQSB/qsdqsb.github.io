/*
* Greedy Navigation
*
* http://codepen.io/lukejacksonn/pen/PwmwWV
*
*/

var $nav = $('#site-nav');
var $btn = $('#site-nav button');
var $vlinks = $('#site-nav .visible-links');
var $hlinks = $('#site-nav .hidden-links');

var breaks = [];
var recursionDepth = 0;
var MAX_RECURSION_DEPTH = 50;

function updateNav() {
  // Check if required elements exist
  if (!$nav.length || !$vlinks.length || !$hlinks.length) {
    recursionDepth = 0;
    return;
  }
  
  // Prevent infinite recursion
  if (recursionDepth >= MAX_RECURSION_DEPTH) {
    console.warn('updateNav: Maximum recursion depth reached, stopping to prevent stack overflow');
    recursionDepth = 0;
    return;
  }
  
  recursionDepth++;

  var availableSpace = $btn.hasClass('hidden') ? $nav.width() : $nav.width() - $btn.width() - 30;

  // The visible list is overflowing the nav
  if($vlinks.width() > availableSpace) {

    // Record the width of the list
    breaks.push($vlinks.width());

    // Move item to the hidden list
    $vlinks.children().last().prependTo($hlinks);

    // Show the dropdown btn
    if($btn.hasClass('hidden')) {
      $btn.removeClass('hidden');
    }

  // The visible list is not overflowing
  } else {

    // There is space for another item in the nav
    if(availableSpace > breaks[breaks.length-1]) {

      // Move the item to the visible list
      $hlinks.children().first().appendTo($vlinks);
      breaks.pop();
    }

    // Hide the dropdown btn if hidden list is empty
    if(breaks.length < 1) {
      $btn.addClass('hidden');
      $hlinks.addClass('hidden');
    }
  }

  // Keep counter updated
  $btn.attr("count", breaks.length);

  // Recur if the visible list is still overflowing the nav
  // Only recurse if there are items left to move (prevent infinite loop)
  if($vlinks.width() > availableSpace && $vlinks.children().length > 0) {
    updateNav();
  } else {
    // Reset recursion depth when done
    recursionDepth = 0;
  }

}

// Window listeners

$(window).resize(function() {
  updateNav();
});

$btn.on('click', function() {
  $hlinks.toggleClass('hidden');
  $(this).toggleClass('close');
});

updateNav();