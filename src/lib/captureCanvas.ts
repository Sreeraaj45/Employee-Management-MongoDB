/**
 * Captures a canvas element and converts it to a data URL
 * @param canvasSelector - CSS selector to find the canvas element
 * @returns Promise that resolves to a data URL string or null if canvas not found
 */
export const captureCanvasAsImage = async (
  canvasSelector: string = 'canvas'
): Promise<string | null> => {
  try {
    // Find the canvas element
    const canvas = document.querySelector(canvasSelector) as HTMLCanvasElement;
    if (!canvas) {
      console.warn('Canvas element not found');
      return null;
    }

    // Convert canvas to data URL (PNG format)
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    return dataUrl;
  } catch (error) {
    console.error('Error capturing canvas:', error);
    return null;
  }
};
