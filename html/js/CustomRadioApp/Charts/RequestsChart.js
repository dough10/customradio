import msToHhMmSs from '../../../../src/util/msToHhMmSs.js';

const chartOptions = {
  responsive: true,
  scales: {
    y: {
      beginAtZero: true
    },
    x: {
      ticks: {
        autoSkip: true,
        maxTicksLimit: 8
      }
    }
  }
};

export default class RequestsChart {
  #chart = null;
  #canvas;

  constructor(canvas) {
    if (!canvas) {
      throw new Error('RequestsChart requires a canvas element');
    }

    this.#canvas = canvas;
  }

  update(times, counts, interval) {
    const label = msToHhMmSs(interval);

    if (!this.#chart) {
      this.#create(times, counts, label);
      return;
    }

    this.#chart.data.labels = times;
    this.#chart.data.datasets[0].data = counts;
    this.#chart.data.datasets[0].label = label;

    this.#chart.update();
  }

  #create(times, counts, label) {
    this.#chart = new Chart(this.#canvas, {
      type: 'bar',
      data: {
        labels: times,
        datasets: [{
          label,
          data: counts,
          borderWidth: 1,
          backgroundColor: 'rgba(166, 136, 250, 1)'
        }]
      },
      options: chartOptions
    });
  }

  destroy() {
    this.#chart?.destroy();
    this.#chart = null;
  }
}
