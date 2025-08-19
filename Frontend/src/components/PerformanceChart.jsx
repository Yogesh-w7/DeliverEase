import React from 'react';
import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    Title,
    CategoryScale,
    Filler,
    Legend
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Filler, Legend);

const PerformanceChart = () => {
    const canvasRef = React.useRef(null);

    React.useEffect(() => {
        const ctx = canvasRef.current.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    {
                        label: 'On-Time Deliveries',
                        data: [92, 94, 96, 93, 95, 90, 94],
                        borderColor: '#0071ce',
                        backgroundColor: 'rgba(0, 113, 206, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Total Deliveries',
                        data: [120, 132, 140, 138, 145, 130, 142],
                        borderColor: '#00b159',
                        backgroundColor: 'rgba(0, 177, 89, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 80,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });

        return () => chart.destroy(); // Cleanup on unmount
    }, []);

    return <canvas ref={canvasRef} id="performance-chart" style={{ height: "300px", width: "100%" }} />;
};

export default PerformanceChart;
