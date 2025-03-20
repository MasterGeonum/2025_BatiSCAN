import L from 'leaflet';
import 'leaflet-side-by-side';
import 'leaflet.vectorgrid';
import 'leaflet-measure';
import {InitNavigation,switchToOneMap} from './tools/navigation';
import {initOneMap} from './tools/oneMap';
import {InitGraph, updateGraph} from './tools/graph';
import {initLoop,activateSideBySideMode,activateLoupeMode,updateLoupe} from './tools/loop';
import{activateSynchroMode,disableSynchro} from './tools/synchroneMap';


// ---------------------------------------------------------------------------------------------------------
let layerList={}; // ceci est un dictionnaire qui va contenir toutes les couches chargées sur la carte dans le cas de OneMap
let allLoadedLayerList={}; // ceci est un dictionnaire qui va contenier toutes les couches chargées sur la carte ( oneMap et sideLayer)
let currentMode = 'side-by-side'; // Mode par défaut



const wmsLyon = 'https://data.grandlyon.com/geoserver/grandlyon/wms';// url pour charger les otho(2012,..2022)
const wmsLyon2 = 'https://data.grandlyon.com/geoserver/metropole-de-lyon/wms'; // url pour les autres données Lyon

const map = L.map('map', {
    zoomControl: false // Désactive le zoom par défaut
}).setView([45.76393730306634, 4.85748071985805], 14);

// la 2 eme carte dans le cas de la synchronisation
const map2 = L.map('map2').setView([45.76393730306634, 4.85748071985805], 14);
//-----------------------------------------------------------------------
// Fonctionnalité measure 
const mesuresOptions={
    position: 'topleft',
    primaryLengthUnit: 'meters',
    secondaryLengthUnit: 'kilometers',
    primaryAreaUnit: 'sqmeters',
    captureZIndex: 10000 ,
    className: 'leaflet-measure-resultpopup', autoPanPadding: [10, 10],
    activeColor: '#00ff04',
    completedColor: '#00ff04' 
};

// Ceci est un workaround car la version de leaflet-measure et leaflet ne sont pas compatibles
// source https://github.com/ljagis/leaflet-measure/issues/171#issuecomment-1137483548
L.Control.Measure.include({
    _setCaptureMarkerIcon: function () {
        this._captureMarker.options.autoPanOnFocus = false;
        this._captureMarker.setIcon(
            L.divIcon({
                iconSize: this._map.getSize().multiplyBy(2) // Capture toute la zone pour empêcher la carte de bouger
            })
        );
    },
});

// Ajout des mesures controls
L.control.measure(mesuresOptions).addTo(map);
// Ajoute de l'échelle
L.control.scale({ imperial: false }).addTo(map);
// Ajout des boutons de zoom
L.control.zoom({ position: 'topleft' }).addTo(map); 

// Ajout et gestion des Fonds de carte
const osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});
const satellite = L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});
const cartodb = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' , {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

const baseMaps = {
  "cartodb": cartodb,
  "OpenStreetMap": osm,
  "HOTOSM": satellite
};

// Sélectionner CartoDB comme fond de carte par défaut
cartodb.addTo(map);

// Ajout du select
const fondsSelect = document.getElementById("Fonds");

// Gérer le changement dans le select
fondsSelect.addEventListener('change', (event) => {
  const selectedLayerName = event.target.value; // Le nom de la couche sélectionnée

  // On enlève toutes les couches existantes de la carte
  Object.entries(baseMaps).forEach(([key, layer]) => {
    if (key !== selectedLayerName) {
      map.removeLayer(layer);
    }
  });

  // On ajoute la couche sélectionnée à la carte et on la met en arrière-plan
  baseMaps[selectedLayerName].addTo(map); 
  baseMaps[selectedLayerName].bringToBack();
});

// Personnaliser les differents div par défaut
document.querySelector('.leaflet-control-zoom').style.top = "150px"; // Ajuste la position de zoom panel
document.querySelector('.leaflet-control-measure').style.top = "120px"; // Ajuste la position de mesure
map.attributionControl.setPosition('bottomleft'); // Attribution leaflet

// La structure des fichiers stockés dans public , qui vont être chargés
export const data = {
    '2012': {
        'bati': '/2012/bat_2012.geojson',
        'vegetation': '/2012/forest_2012.geojson'
    },
    '2015': {
        'bati': '/2015/bat_2015.geojson',
        'vegetation': '/2015/forest_2015.geojson'
    },
    '2018': {
        'bati': '/2018/bat_2018.geojson',
        'vegetation': '/2018/forest_2018.geojson'
    },
    '2022': {
        'bati': '/2022/bat_2022.geojson',
        'vegetation': '/2022/forest_2022.geojson'
    },
    'vegetation': {
        'perdue': {
            '2012-2015': '/evol_vegetation/vegetation_lost_2012_2015.geojson',
            '2015-2018': '/evol_vegetation/vegetation_lost_2015_2018.geojson',
            '2018-2022': '/evol_vegetation/vegetation_lost_2018_2022.geojson',
            '2012-2018': '/evol_vegetation/vegetation_lost_2012_2018.geojson',
            '2015-2022': '/evol_vegetation/vegetation_lost_2015_2022.geojson'
        },
        'gagnee': {
            '2012-2015': '/evol_vegetation/vegetation_gained_2012_2015.geojson',
            '2015-2018': '/evol_vegetation/vegetation_gained_2015_2018.geojson',
            '2018-2022': '/evol_vegetation/vegetation_gained_2018_2022.geojson',
            '2012-2018': '/evol_vegetation/vegetation_gained_2012_2018.geojson',
            '2015-2022': '/evol_vegetation/vegetation_gained_2015_2022.geojson'
        }
    }
};

// fonction pour charger une TileLayer à partir d'un url et le nom de la couche
export function addWmsLayer(wmsUrl, layerName ,currentmap) {
    const layer = L.tileLayer.wms(wmsUrl, {
        layers: layerName,
        format: 'image/png',
        transparent: true,
        crs: L.CRS.EPSG4326
    }).addTo(currentmap);
    return layer;
}

// fonction pour ajouter les 2 couches au début
export function addSideBySide(layer1, layer2) {
    const sideBySide = L.control.sideBySide(layer1, layer2).addTo(map);
    // sideBySide.setPosition(0.);
    // console.log(sideBySide.getPosition())
    return sideBySide;
}

export function refreshMap(map) {
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
}
// les 2 années initiales au chargement
let leftYear = 2012;
let rightYear = 2022;

// ajouter les 2 couches à la carte 
let leftLayer = addWmsLayer(wmsLyon, 'ortho_2012',map);
let rightLayer = addWmsLayer(wmsLyon, 'ortho_2022',map);

// Rendu par défaut , une fois les utilsatuers ouvre l'app
let sideBySideLayer = addSideBySide([leftLayer], [rightLayer]);
let magnifyingGlass;

// Initialiser la scrpit pour gérer la navigation, dans tools/navigation.js et les gestions des evenements pour la carte unique (oneMap) dans tools/oneMap.js
document.addEventListener("DOMContentLoaded", function () {
    // TODO: a activer après la fin de la phase de test

    // Afficher la popup d'information après 3 secondes
    setTimeout(() => {
        const infoPopup = document.getElementById('info_popup');
        if (infoPopup) {
          infoPopup.classList.remove('hidden');
        }
      }, 1000); // 1000 millisecondes = 3 secondes
    
      const closePopupButton = document.getElementById('close_popup');
      if (closePopupButton) {
        closePopupButton.addEventListener('click', () => {
          const infoPopup = document.getElementById('info_popup');
          if (infoPopup) {
            infoPopup.classList.add('hidden');
          }
        });
      }

    InitNavigation(sideBySideLayer,map,leftLayer,rightLayer);
    initOneMap(map);
    InitGraph(leftYear,rightYear); // initialiser la fonction pour gérer les grephiques ( dans ./tools/graph.js)
    initLoop(); // initialiser la fonction pour gérer les modes de comparaison ( dans ./tools/loop.js)
});

// Basculer entre la carte unique et les cartes de comparaison (sideByside)
document.getElementById('toggleSlider').addEventListener('change', function() {
    sideBySideLayer=switchToOneMap(!this.checked,sideBySideLayer,magnifyingGlass,map,leftLayer,rightLayer,layerList);
  });

// scrpits pour gérer l'affichages des différentes couches rasters
const buttonsLeft = document.querySelectorAll('#bandeauAnnee_left .btn');// bandeau de bouttons à gauche
const buttonsRight = document.querySelectorAll('#bandeauAnnee_right .btn'); // bandeau de bouttons à droite
const list_buttons=document.querySelectorAll('#navbarbutton-container .btn');

// fonction pour charger un geojson 
export async function loadGeoJson(url, type,side, currentMap) {
    const fillColor = type === 'bati' 
    ? (side === 'right' ? '#D0435A' : '#7b7bf6') 
    : (side === 'left' ? '#32CD32' : '#006400');


    const response = await fetch(url);
    const geojsonData = await response.json();

    // le plugin sideByside ne supporte pas le GeojSON , donc il faut le convertir en TileLayer le plugin VectorGrid
    const vectorTileLayer = L.vectorGrid.slicer(geojsonData, {
        vectorTileLayerStyles: {
            sliced: { color: fillColor, fill: true, weight: 1.2, fillOpacity: 0.5  }
        },
        minZoom: 12,
        maxZoom: 17,
        maxNativeZoom: 16
    }).addTo(currentMap);

    return vectorTileLayer;
}

// fonction pour ajouter une couche à gauche ou à droite , type prend ( image, bati, vegetation,...)
export async function addSideLayers(type, year, side, wmsUrl, layerName) {
    let newLayer;
    let layerNameTodisplay;
    if (type === 'image') {
        if (!layerName) {// si le nom de la couche n'est pas specifié, ca veut dire que c'est l'ortho donc on ajoute juste 'ortho_' devant
            layerName = 'ortho_' + year;
            layerNameTodisplay=layerName + ' '+ year; // ceci permet d'afficher le nom exact de la couche dans le cas de oneMap
        }else{ // si c'est  des données externes
            layerNameTodisplay=layerName;
        }
        newLayer = addWmsLayer(wmsUrl, layerName,map);
    } else {// si c'est le geojson ( bati, vegetation )
        if(!layerName){// si le layerName n'esicte pas , dans le cas de bati et vegetation 
            layerNameTodisplay=type + ' ' + year; 
        }
        const url = data[year][type];

        // TODO:  JE VAIS ENCORE MODIFIER CETTE PARTIE POUR OPTMISIER UN PEU
        if(allLoadedLayerList[layerNameTodisplay]){ // verifier si la couche a été déjà chargée auparavant , on le re-utilise uniquement
            newLayer=await loadGeoJson(url, type,side, map);
            console.log('efa')
            map.addLayer(newLayer);

        }else { // si non on soit le créer et charger
            newLayer = await loadGeoJson(url, type,side, map);
            allLoadedLayerList[layerNameTodisplay]=newLayer; // stocker toute couche dans un dict qui des utilisation ulterieurs
            console.log('mbola')
        }

    }

    if (side === 'left') {
        map.removeLayer(leftLayer);// supprimer l'ancienne couche à la gauche

        if(map2.hasLayer(leftLayer)){// suppression de la couche de la carte 2 si le mode synchrone est activé
            map2.removeLayer(leftLayer);
        }

        if(currentMode==='side-by-side'){
            sideBySideLayer.setLeftLayers(newLayer);
        }else if(currentMode==='loupe'){
            sideBySideLayer.setLeftLayers(newLayer);
        }else if(currentMode==='synchrone'){
            activateSynchroMode(map,map2,sideBySideLayer,magnifyingGlass,newLayer,rightLayer);
        }
        leftLayer = newLayer;

    } else if (side === 'right') {
        map.removeLayer(rightLayer);
        if(map2.hasLayer(rightLayer)){ // suppression de la couche de la carte 2 si le mode synchrone est activé
            map2.removeLayer(rightLayer); 
        }  

        if(currentMode==='side-by-side'){
            sideBySideLayer.setRightLayers(newLayer);
        }else if(currentMode==='loupe'){
            magnifyingGlass=activateLoupeMode(map,sideBySideLayer,magnifyingGlass,leftLayer,newLayer);
        }else if(currentMode==='synchrone'){
            activateSynchroMode(map,map2,sideBySideLayer,magnifyingGlass,leftLayer,newLayer);
        }

        rightLayer = newLayer;

    }else if (side==='center'){
        layerList[layerNameTodisplay]=newLayer; // stokcer la couche dans un dictionnaire pour le oneMap
    }

    updateGraph(leftYear,rightYear); // mettre à jour le graphique
    return newLayer;

}

// gérer les changement entre les differentes années
buttonsLeft.forEach(button => {
    button.addEventListener('click', () => {
        leftYear = button.textContent;
        
        const type = document.getElementById('type_left').value; // soit image, bati ou vegetation
        addSideLayers(type, leftYear, 'left', wmsLyon, null);

        buttonsLeft.forEach(btn => {
            btn.classList.remove('active')
        });// gérer les couleurs des bouttons après le click

        buttonsRight.forEach(btn => { // Contraintes desactiver les bouttons d'une année avant à droite , 
            if (parseInt(btn.textContent) < parseInt(leftYear)){
                btn.classList.add('disabled');
            }else{
                btn.classList.remove('disabled');
            }

        });

        button.classList.add('active');
    });
});


buttonsRight.forEach(button => {
    button.addEventListener('click', () => {
        rightYear = button.textContent;
        const type = document.getElementById('type_right').value;
        addSideLayers(type, rightYear, 'right', wmsLyon, null);

        buttonsRight.forEach(btn => btn.classList.remove('active'));

        buttonsLeft.forEach(btn => { // Contraintes desactiver les bouttons d'une année après à gauche , 
            if (parseInt(btn.textContent) > parseInt(rightYear)){
                btn.classList.add('disabled');
            }else{
                btn.classList.remove('disabled');
            }

        });

        button.classList.add('active');

    });
});



// --------------------------------------------------------------------------------------
// gérer les changement au niveau du type de couche à afficher pour une année ( image satellite ou bati ou vegetation)
const selectType = [document.getElementById('type_left'), document.getElementById('type_right')];

selectType.forEach(select => {
    select.addEventListener('change', function () {
        const type = select.value;
        const side = select.id.split('_')[1];
        const year = side === 'left' ? leftYear : rightYear;
        const navbarButtons = side === 'left' ? buttonsLeft : buttonsRight;

        if (['image', 'bati', 'vegetation'].includes(type)) {// Nos données initiales
            navbarButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.classList.remove('disabled');
                if (btn.textContent == year) {
                    btn.classList.add('active');
                }
            });
            addSideLayers(type, year, side, wmsLyon, null);

        } else {// Les données importées depuis DataLyon
            addSideLayers('image', null, side, wmsLyon2, type);
            navbarButtons.forEach(btn => { btn.classList.remove('active'); btn.classList.add('disabled'); });// desactiver l'option de choisir l'année , car c'est une donnée sans année
        }
    })
})

// -------------------------------------------------------------------------------------------------------
// Ajouter des couches depuis dataLyon
const wmsUrl = wmsLyon2 + '?SERVICE=WMS&VERSION=1.3.0&request=GetCapabilities';

async function fetchWMSCapabilities() {
    try {
        // Effectuer la requête avec fetch
        const response = await fetch(wmsUrl);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération de WMS');
        }

        const xmlText = await response.text();

        // Parser le XML et extraire les couches
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
        const layers = xmlDoc.getElementsByTagName('Layer'); // Trouver toutes les balises <Layer>

        // Remplir le <select> avec les noms des couches
        const select = document.getElementById('dataLyon');
        for (let i = 0; i < layers.length; i++) {
            const name = layers[i].getElementsByTagName('Name')[0].textContent;
            const title = layers[i].getElementsByTagName('Title')[0].textContent;
            const option = document.createElement('option');
            option.value = name;
            option.textContent = title;
            select.appendChild(option);// ajouter chaque couche au menu deroulant
        }
    } catch (error) {
        console.error(error);
    }
}

fetchWMSCapabilities();

// bouuton pour ajouter une couche depuis DataLyon à gauche ou à droite
const addButtons = [document.getElementById('addLayer-left'), document.getElementById('addLayer-right')];

addButtons.forEach(button => {
    button.addEventListener('click', () => {
        const selectLayer = document.getElementById('dataLyon');
        const layerName = selectLayer.options[selectLayer.selectedIndex].value;
        const layerTitle = selectLayer.options[selectLayer.selectedIndex].text;
        const side = button.id.split('-')[1];

        addSideLayers('image', null, side, wmsLyon2, layerName); // null : c'est le year , car il y a pas d 'année

        const navbarButtons = side === 'left' ? buttonsLeft : buttonsRight;
        navbarButtons.forEach(btn => { btn.classList.remove('active'); btn.classList.add('disabled'); });// // desactiver l'option de choisir l'année , car c'est une donnée sans année

        const selectLegend = document.getElementById('type_' + side);// ajouter la couche dans la legende 
        selectLegend.innerHTML += `<option selected value="${layerName}">${layerTitle}</option>`;


    })

})



// ------------------------------------------------------------------------------------------------------------------
// fonction pour gérer chaque thématique
function handleButtonClick(type, leftIndex, rightIndex) {

    let leftYearElement = document.querySelector('#bandeauAnnee_left .btn.active');
    leftYear = leftYearElement && leftYearElement.textContent ? leftYearElement.textContent.trim() : '2012';
    
    let rightYearElement = document.querySelector('#bandeauAnnee_right .btn.active');
    rightYear = rightYearElement && rightYearElement.textContent ? rightYearElement.textContent.trim() : '2022';
    

    addSideLayers(type, leftYear, 'left', wmsLyon, null);
    addSideLayers(type, rightYear, 'right', wmsLyon, null);

    const selectLeft = document.getElementById('type_left');
    const selectRight = document.getElementById('type_right');
    selectLeft[leftIndex].selected = true;
    selectRight[rightIndex].selected = true;

    const buttons = document.querySelectorAll('.sidebar-btn');
    buttons.forEach(btn =>
        btn.classList.remove('active')
    );

}

document.getElementById('btn-batiment').addEventListener('click', () => {
    list_buttons.forEach(button => {
        button.classList.remove('disabled');
        // if( button.textContent==leftYear){
        //     button.classList.add('active');
        // }
    })
    handleButtonClick('bati', 1, 1);
    document.getElementById('btn-batiment').classList.add('active');
    updateGraph(leftYear, rightYear);
});

document.getElementById('btn-arbre').addEventListener('click', () => {
    list_buttons.forEach(button => {
        button.classList.remove('disabled');
        // if( button.textContent==leftYear){
        //     button.classList.add('active');
        // }
    })
    handleButtonClick('vegetation', 2, 2);
    document.getElementById('btn-arbre').classList.add('active');
    updateGraph(leftYear, rightYear);
});

// ------------------------------------------------------------------------------------
// Ajout des événements pour la mise à jour instantanée
// document.getElementById('type_left').addEventListener('change', updateGraph(leftYear,rightYear));
// document.getElementById('type_right').addEventListener('change', updateGraph(leftYear,rightYear));


// ------------------------------------------------------------------------------------



// ------------------------------------------------------------------------------------
const sidepanelContent = document.getElementById('sidepanelContent');
// Événement du bouton pour activer le mode side-by-side
document.getElementById('btn-side-by-side').addEventListener('click', () => {
    if (currentMode === 'side-by-side') {
        console.log('side-by-side');
        return;
    }else{
        disableSynchro(map,map2,leftLayer,rightLayer);
        refreshMap(map);
        sideBySideLayer=activateSideBySideMode(map,sideBySideLayer,magnifyingGlass,leftLayer,rightLayer); 
        currentMode = 'side-by-side'; 
    }
    sidepanelContent.classList.remove('active');
    
    setTimeout(() => {
        sidepanelContent.style.display = 'none';
    }, 300); // Temps égal à la transition CSS

});

// Événement du bouton pour activer le mode loupe
document.getElementById('btn-loupe').addEventListener('click', () => {
    if (currentMode === 'loupe') {
        console.log('loupe');   
        return;
    }else{
        disableSynchro(map,map2,leftLayer,rightLayer);
        refreshMap(map);
        magnifyingGlass= activateLoupeMode(map,sideBySideLayer,magnifyingGlass,leftLayer,rightLayer);
        currentMode = 'loupe';

    }
    sidepanelContent.classList.remove('active');
    
    setTimeout(() => {
        sidepanelContent.style.display = 'none';
    }, 300); // Temps égal à la transition CSS
});

// Événement du bouton pour activer le mode synchrone
document.getElementById('btn-synchro').addEventListener('click', () => {
    if (currentMode === 'synchrone') {
        console.log('synchrone');   
        return;
    }else{
        activateSynchroMode(map,map2,sideBySideLayer,magnifyingGlass,leftLayer,rightLayer);
        currentMode = 'synchrone';
    }
    sidepanelContent.classList.remove('active');
    
    setTimeout(() => {
        sidepanelContent.style.display = 'none';
    }, 300); // Temps égal à la transition CSS
});

