let requestsChart;

function renderChart({ times, counts }) {
  const canvas = document.getElementById('requests');
  if (!requestsChart) {
    requestsChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: times,
        datasets: [{
          label: 'requests',
          data: counts,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
    return;
  }
  requestsChart.data.labels = times;
  requestsChart.data.datasets[0].data = counts;
  requestsChart.update();
}

async function selectorChanged(ev) {
  window.requests = null;
  const res = await fetch(`/requests/${ev.target.value}`);
  if (!res.ok) throw new Error('fetch failed');
  const data = await res.json();
  renderChart(data); 
}

function loaded() {
  renderChart(window.requests);
  const selector = document.querySelector('#hours');
  selector.addEventListener('change', selectorChanged);
}

window.onload = loaded;