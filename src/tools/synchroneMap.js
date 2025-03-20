import L from 'leaflet';
import 'leaflet.sync';


export function activateSynchroMode(map1, map2,sideBySideLayer,magnifyingGlass, leftLayer, rightLayer) {

    if (leftLayer) {
        map1.removeLayer(leftLayer);
        if(map2.hasLayer(leftLayer)){
            map2.removeLayer(leftLayer);
        }
    }
    if (rightLayer) {
        map1.removeLayer(rightLayer);
        if(map2.hasLayer(rightLayer)){
            map2.removeLayer(rightLayer);
        }
    }
    // Désactiver la loupe
    if (magnifyingGlass) {
        map1.removeLayer(magnifyingGlass);
        magnifyingGlass = null;
        const lensContainer = document.querySelector('.leaflet-magnifying-glass-container');
        if (lensContainer) {
            lensContainer.remove();
        }
    }

    // desactiver le mode side-by-side
    if (sideBySideLayer) {
        sideBySideLayer.remove();
        // map.removeControl(sideBySideLayer);
    }

    const map1Container = document.getElementById('map');
    const map2Container = document.getElementById('map2');
    const separator = document.getElementById('separator');
    separator.style.display = "block";

    map1Container.style.width = "50vw";
    map2Container.style.display = "block";
    map1Container.style.marginRight = "10px";

    setTimeout(() => {
        map1.invalidateSize();
        map2.invalidateSize();
    }, 100);

    // Ajouter un écouteur d'événement pour redimensionner la carte lorsque la fenêtre est redimensionnée
    window.addEventListener('resize', () => {
        map1.invalidateSize();
        map2.invalidateSize();
    });

    const cartodb = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' , {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
      


    leftLayer.addTo(map1)
    cartodb.addTo(map2);  
    cartodb.bringToBack();
    rightLayer.addTo(map2)  


    // 
    map1.sync(map2)
    map2.sync(map1)
}


export function disableSynchro(map1, map2, leftLayer, rightLayer) {
    const map1Container = document.getElementById('map');
    const map2Container = document.getElementById('map2');
    const separator = document.getElementById('separator');
    separator.style.display = "none";
    map1Container.style.width = "100vw";
    map2Container.style.display = "none";
    map1Container.style.marginRight = "0px";

    if (leftLayer) {
        map1.removeLayer(leftLayer);
        if(map2.hasLayer(leftLayer)){
            map2.removeLayer(leftLayer);
        }
    }
    if (rightLayer) {
        map1.removeLayer(rightLayer);
        if(map2.hasLayer(rightLayer)){
            map2.removeLayer(rightLayer);
        }
    }
}