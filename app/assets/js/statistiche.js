(function () {
  const data = loadData();
  renderLayout('Statistiche', data);

  const NAVY = '#1B2F6E', GOLD = '#C9A227', GREEN = '#16a34a', ORANGE = '#d97706', RED = '#dc2626', GRAY = '#9ca3af';

  let trendChart, statusChart, hoursChart;

  function render(days) {
    const today = new Date();
    const fromDate = fmtDate(addDays(today, -days + 1));

    // ----- trend (line) -----
    const labels = [];
    const counts = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = fmtDate(addDays(today, -i));
      labels.push(fmtDateShort(d));
      counts.push(data.bookings.filter(b => b.date === d && b.status !== 'rejected' && b.status !== 'cancelled').length);
    }

    if (trendChart) trendChart.destroy();
    trendChart = new Chart(document.getElementById('trendChart'), {
      type: 'line',
      data: { labels, datasets: [{
        label: 'Prenotazioni',
        data: counts,
        borderColor: NAVY,
        backgroundColor: 'rgba(27,47,110,.08)',
        fill: true,
        tension: .3,
        pointRadius: days > 60 ? 0 : 3,
        pointBackgroundColor: GOLD,
      }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
    });

    // ----- status distribution (doughnut) -----
    const periodBookings = data.bookings.filter(b => b.date >= fromDate && b.date <= fmtDate(today));
    const statusCounts = { confirmed: 0, pending: 0, rejected: 0, cancelled: 0 };
    periodBookings.forEach(b => { if (statusCounts[b.status] !== undefined) statusCounts[b.status]++; });

    if (statusChart) statusChart.destroy();
    statusChart = new Chart(document.getElementById('statusChart'), {
      type: 'doughnut',
      data: {
        labels: ['Confermate','In attesa','Rifiutate','Annullate'],
        datasets: [{ data: [statusCounts.confirmed, statusCounts.pending, statusCounts.rejected, statusCounts.cancelled], backgroundColor: [GREEN, ORANGE, RED, GRAY] }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    // ----- hours (bar) -----
    const hourMap = {};
    periodBookings.filter(b => b.status !== 'rejected' && b.status !== 'cancelled').forEach(b => {
      const hour = b.time.split(':')[0] + ':00';
      hourMap[hour] = (hourMap[hour] || 0) + 1;
    });
    const hourLabels = Object.keys(hourMap).sort();

    if (hoursChart) hoursChart.destroy();
    hoursChart = new Chart(document.getElementById('hoursChart'), {
      type: 'bar',
      data: { labels: hourLabels, datasets: [{ label: 'Prenotazioni', data: hourLabels.map(h => hourMap[h]), backgroundColor: GOLD }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
    });

    // ----- KPIs -----
    const total = periodBookings.length;
    const confirmedBookings = periodBookings.filter(b => b.status === 'confirmed');
    const people = confirmedBookings.reduce((sum, b) => sum + (b.party_size || 0), 0);
    const decided = periodBookings.filter(b => b.status === 'confirmed' || b.status === 'rejected').length;
    const rate = decided > 0 ? Math.round((confirmedBookings.length / decided) * 100) : 0;

    document.getElementById('kpiTotal').textContent = total;
    document.getElementById('kpiPeople').textContent = people;
    document.getElementById('kpiRate').textContent = rate + '%';
  }

  document.getElementById('rangeSelect').addEventListener('change', (e) => render(parseInt(e.target.value, 10)));
  render(30);
})();
