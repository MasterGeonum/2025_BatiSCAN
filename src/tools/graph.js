
// CE FICHIER GERE TOUS CE QUI EST GRAPHIQUE
import {data} from '../index'

const buttonsLeft = document.querySelectorAll('#bandeauAnnee_left .btn'); // bandeau de boutons à gauche
const buttonsRight = document.querySelectorAll('#bandeauAnnee_right .btn'); // bandeau de boutons à droite



let leftYear1,rightYear1;
export function InitGraph(leftYear,rightYear){
    leftYear1=leftYear;
    rightYear1=rightYear;

    // Appel initial pour afficher le graphique
    updateGraph(leftYear,rightYear);
}

// Fonction pour récupérer la surface des données
async function getSurfaceData(type, year) {
    if (type === 'image') return 0;
  
    const url = data[year][type];
    const response = await fetch(url);
    const geojsonData = await response.json();
  
    let totalSurface = 0;
    geojsonData.features.forEach(feature => {
      if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
        totalSurface += turf.area(feature);
      }
    });
  
    return totalSurface / 10000;
}
  
let chartInstance = null;
let chartInstanceGlobal = null;

let currentChartType = 'bar';

// Fonction pour générer le graphique
function generateGraph(labels, data) {
const ctx = document.getElementById('comparaisonGraph').getContext('2d');

if (chartInstance) {
    chartInstance.destroy();
}

const typeLeft = document.getElementById('type_left').value;
const typeRight = document.getElementById('type_right').value;






let leftColor, rightColor;

if (typeLeft === 'bati') {
    leftColor = '#7b7bf6';
} else {
    leftColor = '#32cd32';
}

if (typeRight === 'bati') {
    rightColor = 'rgba(197, 31, 31, 0.6)';
} else {
    rightColor = '#006400';
}

chartInstance = new Chart(ctx, {
    type: currentChartType,
    data: {
    labels: labels,
    datasets: [
        {
        label: 'Surface (hectares)',
        data: data,
        backgroundColor: [leftColor, rightColor],
        borderColor: [leftColor.replace('0.6', '1'), rightColor.replace('0.6', '1')],
        borderWidth: 1
        }
    ]
    },
    options: {
    plugins: {
        legend: {
        display: false
        }
    },
    scales: {
        y: {
        beginAtZero: true,
        title: {
            display: true,
            text: 'Surface (hectares)'
        }
        }
    },
    responsive: true
    }
});

// Add custom legend below the chart
const legendContainer = document.getElementById('legendContainer');
if (legendContainer) {
    legendContainer.innerHTML = `
    <div class="legend-item">
        <span class="legend-color" style="background-color: rgba(54, 162, 235, 0.6);"></span> Bâtiments
    </div>
    <div class="legend-item">
        <span class="legend-color" style="background-color: rgba(0, 100, 0, 0.6);"></span> Végétation
    </div>
    `;
}
}


// Fonction pour générer le graphique global
async function generateGlobalGraph() {

    // Gérer l'affichage du titre selon le type de graphique
    if (currentChartType === 'pie') {
        document.getElementById('globalGraphTitle').style.display = 'none';
    } else {
        document.getElementById('globalGraphTitle').style.display = 'block';
    }

    // Supprimez le canvas existant (s'il existe)
    const existingCanvas = document.getElementById('globalComparaisonGraph');
    if (existingCanvas) {
        existingCanvas.remove();
    }

    // Créez un nouveau canvas pour le graphique
    const newCanvas = document.createElement('canvas');
    newCanvas.id = 'globalComparaisonGraph';
    document.getElementById('graphContainer').appendChild(newCanvas);

    const ctxGlobal = newCanvas.getContext('2d');

    const years = ['2012', '2015', '2018', '2022'];
    const batiData = [];
    const vegetationData = [];

    for (const year of years) {
        const batiSurface = await getSurfaceData('bati', year);
        const vegetationSurface = await getSurfaceData('vegetation', year);
        batiData.push(batiSurface);
        vegetationData.push(vegetationSurface);
    }

    // Vérifiez et détruisez l'instance précédente du graphique
    if (chartInstanceGlobal) {
        chartInstanceGlobal.destroy();
        chartInstanceGlobal = null;
    }

    // Si le type de graphique est 'bar', afficher l'histogramme
    if (currentChartType === 'bar') {
        chartInstanceGlobal = new Chart(ctxGlobal, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [
            {
                label: 'Bâtiments',
                data: batiData,
                backgroundColor: 'rgba(197, 31, 31, 0.6)',
                borderColor: 'rgba(197, 31, 31, 0.6)',
                borderWidth: 1
            },
            {
                label: 'Végétation',
                data: vegetationData,
                backgroundColor: 'rgba(146, 211, 62, 0.78)',
                borderColor: 'rgba(146, 211, 62, 0.78)',
                borderWidth: 1
            }
            ]
        },
        options: {
            scales: {
            y: {
                beginAtZero: true,
                title: {
                display: true,
                text: 'Surface (hectares)'
                }
            }
            },
            responsive: true
        }
        });
    }
    // Si le type de graphique est 'pie', afficher la comparaison pour 2022 uniquement
    else if (currentChartType === 'pie') {
        // Utilisation des données de 2022 pour la comparaison
        const latestYearIndex = years.indexOf('2022');
        const pieData = [
        batiData[latestYearIndex],
        vegetationData[latestYearIndex]
        ];
        const pieLabels = ['Bâtiments', 'Végétation'];
        const pieColors = ['rgba(197, 31, 31, 0.6)', 'rgba(146, 211, 62, 0.78)'];

        chartInstanceGlobal = new Chart(ctxGlobal, {
        type: 'pie',
        data: {
            labels: pieLabels,
            datasets: [
            {
                data: pieData,
                backgroundColor: pieColors,
                borderWidth: 1
            }
            ]
        },
        options: {
            responsive: true
        }
        });
    }
}


// Fonction de mise à jour du graphique
export async function updateGraph(leftYear,rightYear) {
    const typeLeft = document.getElementById('type_left').value;
    const typeRight = document.getElementById('type_right').value;
    
    const areaLeft = await getSurfaceData(typeLeft, leftYear);
    const areaRight = await getSurfaceData(typeRight, rightYear);

    generateGraph([leftYear,rightYear], [areaLeft, areaRight]);
    generateGlobalGraph();
}


buttonsLeft.forEach(button => {
button.addEventListener('click', () => {
    leftYear1 = button.textContent;
    updateGraph(leftYear1,rightYear1);
    buttonsLeft.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
});
});

buttonsRight.forEach(button => {
button.addEventListener('click', () => {
    rightYear1 = button.textContent;
    updateGraph(leftYear1,rightYear1);
    buttonsRight.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
});
});

// Gestion des clics sur les icônes de type de graphique
const chartIcons = document.querySelectorAll('.chart-icon');
chartIcons.forEach(icon => {
    icon.addEventListener('click', () => {
        currentChartType = icon.getAttribute('data-chart-type');
        
        // Cacher le titre si le type de graphique est un pie chart
        const globalGraphTitle = document.getElementById('globalGraphTitle');
        if (currentChartType === 'doughnut') {
            console.log(globalGraphTitle)
            globalGraphTitle.style.display = 'none';
        } else {
            globalGraphTitle.style.display = 'block';
        }

        updateGraph(leftYear1,rightYear1);
        chartIcons.forEach(icon => icon.classList.remove('active'));
        icon.classList.add('active');
    });
});

function updateChart(chartInstance, labels, data) {
chartInstance.data.labels = labels;
chartInstance.data.datasets[0].data = data;
chartInstance.update();
}

function updateButtonState(buttons, activeButton) {
buttons.forEach(btn => btn.classList.remove('active', 'disabled'));
activeButton.classList.add('active');
}


const globalGraph = document.getElementById('globalComparaisonGraph');
const globalTitle = document.getElementById('globalGraphTitle');

if (globalGraph && globalTitle) {
globalGraph.addEventListener('mouseenter', () => {
    globalTitle.style.display = 'none';
});

globalGraph.addEventListener('mouseleave', () => {
    globalTitle.style.display = 'block';
});
}



// ----------------------------GRAPHIQUES POUR LA METHODOLOGIE--------------------------------------------------

const dict = {
    'mapflow': {'IoU': 68.35, 'Taux de couverture': 71.36, 'Sur-detcteion': 5.82, 'Sous-detection': 28.64},
    'sam': {'IoU': 51.65, 'Taux de couverture': 59.57, 'Sur-detcteion': 20.46, 'Sous-detection': 40.43},
    'arcgis': {'IoU':59.24 , 'Taux de couverture': 66.94, 'Sur-detcteion': 16.25, 'Sous-detection': 33.06}
};

// Recupérer le canva
const metricSelector = document.getElementById('metricSelector');
const ctx = document.getElementById('comparisonChart').getContext('2d');


let comparisonChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['mapflow', 'sam', 'arcgis'],  
        datasets: [{
            label: 'Comparaison entre les 3 ( Référence manuelle)',
            data: [],  
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
            borderColor: ['#FF6384', '#36A2EB', '#FFCE56'],
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        interaction: {
            mode: 'index',  
            intersect: false,  
        },
        plugins: {
            tooltip: {
                enabled: true,  
                mode: 'nearest',  
                intersect: false,  
                callbacks: {
                    label: function(tooltipItem) {
                        return `Méthode: ${tooltipItem.label}, Valeur: ${tooltipItem.raw}%`;
                    }
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,  
                    text: 'Pourcentage(%)',  
                    font: {
                        size: 18,  
                        weight: 'bold',  
                    }
                },
                ticks: {
                    font: {
                        size: 18,  
                    }
                }
            },
            x: {
                beginAtZero: true,
                title: {
                    display: true, 
                    text: 'Méthodes',
                    font: {
                        size: 18,  
                        weight: 'bold',  
                    }
                },
                ticks: {
                    font: {
                        size: 18,  
                    }
                }
            }
        },
        hover: {
            mode: 'nearest', 
            intersect: true,  
        }
    }
});

// Fonction pour mettre à jour les données du graphique en fonction de la métrique sélectionnée
function updateChartData(metric) {
    const data = [
        dict['mapflow'][metric],
        dict['sam'][metric],
        dict['arcgis'][metric]
    ];

    // Mise à jour des données du graphique avec la nouvelle métrique sélectionnée
    comparisonChart.data.datasets[0].data = data;
    comparisonChart.update();
}

// Écouteur d'événements pour mettre à jour le graphique 
metricSelector.addEventListener('change', (event) => {
    const selectedMetric = event.target.value;  
    updateChartData(selectedMetric);  
});

// Mise à jour initiale avec la métrique par défaut (IoU)
updateChartData('IoU');

