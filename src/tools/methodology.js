// CE FICHIER GERE TOUS LES ELEMENTS DANS L'ONGLET METHODOLOGIE
import L from 'leaflet';
import 'leaflet-side-by-side';
import 'leaflet.vectorgrid';
import{loadGeoJson} from '../index';

import {addWmsLayer} from '../index';

const data={
    'mapflow':'/methodes/bati_mapflow_2012.geojson',  
    'sam':'/methodes/bati_sam_2012.geojson',
    'arcgis':'/methodes/bati_arcgis_2012.geojson',
    'reference':'/methodes/ref_manuelle_bati_2012.geojson', 
    'bdtopo':'/methodes/ref_bdtopo_bati_2012.geojson',
}
// Bounding box
const bbox = [
    [45.75483297810007, 4.847347206745411], // Sud-Ouest (latMin, lngMin)
    [45.76687395897801, 4.8726068026879545] // Nord-Est (latMax, lngMax)
];

let leftLayerMethod, rightLayerMethod;

const wmsLyon = 'https://data.grandlyon.com/geoserver/grandlyon/wms'; // url pour charger les otho(2012,..2022)
const wmsLyon2 = 'https://data.grandlyon.com/geoserver/metropole-de-lyon/wms'; // url pour les autres données Lyon

// Fonction pour initialiser la carte de méthodologie
export async function initMethodologyMap() {
    // definition de la carte 
    const map = L.map('mapMethodology', {
        zoomControl: false // Désactive le zoom par défaut
    }).setView([45.76093730306634, 4.85748071985805], 16);

    // // Ajuster la vue de la carte pour s'adapter à la bounding box
    // map.fitBounds(bbox);

    // Ajout de Fond de carte
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const ortho2012Layer = addWmsLayer(wmsLyon, 'ortho_2012',map);

    // Forcer le redimensionnement de la carte après un court délai
    setTimeout(() => {
        map.invalidateSize();
    }, 100);

    // Ajouter un écouteur d'événement pour redimensionner la carte lorsque la fenêtre est redimensionnée
    window.addEventListener('resize', () => {
        map.invalidateSize();
    });

    // Initialiser les 2 couches

    leftLayerMethod= await loadGeoJson(data['mapflow'],"bati", "left",map);
    rightLayerMethod= await loadGeoJson(data['sam'],"bati", "right",map);

    // ajouter le sideLayer à la carte 
    let sideBySide = L.control.sideBySide(leftLayerMethod, rightLayerMethod).addTo(map);

    //----------------------------------------------------------------------------
    // fonction pour gerer les changement des approches
    
    const selectDiv = [document.getElementById('approach-left'), document.getElementById('approach-right')];

    selectDiv.forEach(select => {
        select.addEventListener('change', async function(){
            const approach = select.options[select.selectedIndex].value;
            const side = select.id.split('-')[1];
            const newLayer= await loadGeoJson(data[approach],'bati',side,map);
            if (side === 'left') {
                map.removeLayer(leftLayerMethod);// supprimer l'ancienne couche à la gauche
                sideBySide.setLeftLayers(newLayer);
                leftLayerMethod = newLayer;
            } else if (side === 'right') {
                map.removeLayer(rightLayerMethod);// supprimer l'ancienne couche à la droite
                sideBySide.setRightLayers(newLayer);
                rightLayerMethod = newLayer;
            }


        })
    })




}



