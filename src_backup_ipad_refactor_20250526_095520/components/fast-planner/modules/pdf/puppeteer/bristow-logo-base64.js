/**
 * bristow-logo-base64.js
 * 
 * Base64 encoded actual Bristow logo for embedding in PDFs
 * Using the real Bristow Helicopters logo with proper branding
 */

// We'll need to import the actual logo dynamically in the browser
// For now, let's create a function that converts the image to base64
const bristowLogoPath = '/src/assets/logos/Bristow_Helicopters-Logo.wine.png';

// Function to convert image to base64 (will be used in the PDF generator)
export const convertLogoToBase64 = async () => {
  try {
    const response = await fetch(bristowLogoPath);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Could not load Bristow logo, using fallback');
    // Fallback SVG logo if image fails to load
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiB2aWV3Qm94PSIwIDAgMjAwIDYwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiBmaWxsPSJ3aGl0ZSIvPgo8dGV4dCB4PSI1MCIgeT0iMzUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMDMzNjYiPkJyaXN0b3c8L3RleHQ+CjxyZWN0IHg9IjEwIiB5PSIxNSIgd2lkdGg9IjMwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjQ0MwMDAwIi8+CjxyZWN0IHg9IjIwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMDA2NkNDIi8+Cjwvc3ZnPgo=';
  }
};

// Export path for direct use
export default bristowLogoPath;