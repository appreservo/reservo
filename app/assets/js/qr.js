/* Reservo — pagina QR Code admin */

(async function () {
  const data = await loadData();
  const p = data.profile;

  renderLayout('QR Code', data);

  const slug = p.slug || '';
  const base = location.href.replace(/\/[^/]*(\?.*)?$/, '/');
  const publicUrl = base + 'sito.html' + (slug ? '?b=' + encodeURIComponent(slug) : '');

  document.getElementById('qrUrl').textContent = publicUrl;

  new QRCode(document.getElementById('qrcode'), {
    text: publicUrl,
    width: 220,
    height: 220,
    colorDark: '#1B2F6E',
    colorLight: '#ffffff',
  });

  document.getElementById('downloadQr').addEventListener('click', () => {
    const canvas = document.querySelector('#qrcode canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'qrcode-' + (slug || 'reservo') + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  document.getElementById('printQr').addEventListener('click', () => window.print());
})();
