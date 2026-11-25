// Utility to print a PDF from a base64 string
export default function printBase64Pdf(base64) {
  if (!base64) return;
  try {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    };
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
      document.body.removeChild(iframe);
    }, 60000);
  } catch (e) {
    console.error('Error printing PDF:', e);
  }
}
