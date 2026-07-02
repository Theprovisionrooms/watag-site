// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Resizes and re-compresses an image entirely in the browser before
// it's ever uploaded. A phone camera photo is routinely 3-8MB, this
// gets it down to a few hundred KB at most, without a visible quality
// hit on a phone screen. This is the actual cost control for message
// photos: cheaper storage, cheaper bandwidth, and every photo an
// artist deletes frees the space immediately, no separate cleanup job
// needed either way.

const MAX_DIMENSION = 1440;
const JPEG_QUALITY = 0.75;

export function resizeImageForUpload(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("could not compress image"));
            return;
          }
          resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("could not load image"));
    };

    img.src = objectUrl;
  });
}
