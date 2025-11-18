// Chart configuration
let chart = null;
const maxDataPoints = 50;
let priceHistory = [];
let timeLabels = [];

// Initialize chart
function initChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [{
                label: 'Bitcoin Price (USD)',
                data: priceHistory,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return '$' + context.parsed.y.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            });
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString('en-US', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            });
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxTicksLimit: 8
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Fetch Bitcoin price from Binance API (more reliable)
async function fetchBitcoinPrice() {
    try {
        // Try Binance API first (more reliable, no rate limits for public endpoints)
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.lastPrice) {
            const price = parseFloat(data.lastPrice);
            const change24h = parseFloat(data.priceChangePercent);
            
            updatePriceDisplay(price, change24h);
            updateChart(price);
        } else {
            throw new Error('Invalid data format from API');
        }
    } catch (error) {
        console.error('Error fetching Bitcoin price:', error);
        const errorMsg = error.message || 'Network error';
        document.getElementById('currentPrice').textContent = `Error: ${errorMsg}`;
        document.getElementById('currentPrice').style.color = '#f44336';
        
        // Show helpful message in console
        if (error.message && (error.message.includes('CORS') || error.message.includes('Failed to fetch'))) {
            console.log('💡 Tip: Open this file using a local server (e.g., Live Server extension) to avoid CORS issues');
        }
    }
}

// Update price display
function updatePriceDisplay(price, change24h) {
    const priceElement = document.getElementById('currentPrice');
    const changeElement = document.getElementById('priceChange');
    
    priceElement.textContent = '$' + price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    const changePercent = change24h.toFixed(2);
    const changeSign = change24h >= 0 ? '+' : '';
    changeElement.textContent = `${changeSign}${changePercent}% (24h)`;
    
    // Update color based on change
    changeElement.className = 'price-change ' + (change24h >= 0 ? 'positive' : 'negative');
}

// Update chart with new price data
function updateChart(price) {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    
    priceHistory.push(price);
    timeLabels.push(timeLabel);
    
    // Keep only the last maxDataPoints
    if (priceHistory.length > maxDataPoints) {
        priceHistory.shift();
        timeLabels.shift();
    }
    
    // Update chart
    chart.data.labels = timeLabels;
    chart.data.datasets[0].data = priceHistory;
    chart.update('none'); // 'none' mode for smooth updates without animation
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    fetchBitcoinPrice(); // Fetch immediately
    
    // Update every 1 second
    setInterval(fetchBitcoinPrice, 1000);
});

