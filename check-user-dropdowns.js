// Check what the user actually sees in the dropdowns
console.log('Checking user-visible dropdown state...');

const typeDropdown = document.querySelector('.aircraft-type-dropdown, #aircraft-type');
const regDropdown = document.querySelector('#aircraft-registration, .aircraft-registration-dropdown');

console.log('=== TYPE DROPDOWN ===');
if (typeDropdown) {
  console.log('Type dropdown found');
  console.log('Current value:', typeDropdown.value);
  console.log('Option count:', typeDropdown.options.length);
  console.log('Options:');
  Array.from(typeDropdown.options).forEach((opt, i) => {
    console.log(`  ${i}: "${opt.value}" - "${opt.text}"`);
  });
} else {
  console.log('❌ Type dropdown not found');
}

console.log('\n=== REGISTRATION DROPDOWN ===');
if (regDropdown) {
  console.log('Registration dropdown found');
  console.log('Current value:', regDropdown.value);
  console.log('Option count:', regDropdown.options.length);
  console.log('Options:');
  Array.from(regDropdown.options).forEach((opt, i) => {
    console.log(`  ${i}: "${opt.value}" - "${opt.text}"`);
  });
  console.log('Disabled?', regDropdown.disabled);
} else {
  console.log('❌ Registration dropdown not found');
}

console.log('\n=== SELECTED AIRCRAFT DISPLAY ===');
const selectedDisplay = document.querySelector('.selected-aircraft-display, .aircraft-display');
if (selectedDisplay) {
  console.log('Selected display text:', selectedDisplay.textContent);
} else {
  console.log('❌ Selected aircraft display not found');
}