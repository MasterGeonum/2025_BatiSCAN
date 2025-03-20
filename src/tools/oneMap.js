
// CE FICHIER GERE TOUS CE QUI EST RELATION AVEC LE CARTE UNIQUE COMME CHARGEMENT ET GESTION DES COUHES 

import L from 'leaflet';
import 'leaflet-side-by-side';
import { addSideLayers } from '../index';
const wmsLyon = 'https://data.grandlyon.com/geoserver/grandlyon/wms';// url pour charger les otho(2012,..2022)
const wmsLyon2 = 'https://data.grandlyon.com/geoserver/metropole-de-lyon/wms'; // url pour les autres données Lyon

// cette fonction initOneMap est execitée un fois la page est chargée
export async function initOneMap(map){
    let layerName;

    // charger une couche (othoophoto , bati ou vegetation avec une année particulière)
    document.getElementById('addLayer-center').addEventListener('click', async function(){
        const seletcType=document.getElementById('type_layer_center');
        const typeLayer=seletcType.options[seletcType.selectedIndex].value;
        layerName = seletcType.options[seletcType.selectedIndex].textContent; 
        const selectYear=document.getElementById('oneMap_year');
        const year=selectYear.options[selectYear.selectedIndex].value;

        const title=layerName + ' ' + year; // le nom de la couche à afficher dans la légende

        const layer= await addSideLayers(typeLayer,year,'center',wmsLyon,null); // ajouter la couche sur la carte

        addLayerToList(title,layer,map); // ajouter le nom la couche dans la légende
    })

    // Charger une couche externe depuis dataLyon
    document.getElementById('addLayerCenterLayersFromLyon').addEventListener('click', async function(){
        const seletcType=document.getElementById('dataLyon');
        const typeLayer=seletcType.options[seletcType.selectedIndex].value;
        layerName = seletcType.options[seletcType.selectedIndex].textContent;

        const layer= await addSideLayers('image', null, 'center',wmsLyon2,typeLayer); // year= null car il y a pas d année , on utilise le 2eme url

        addLayerToList(layerName,layer,map);

    })
}

// fonction pour ajouter un nom de couche dans la legende 
export function addLayerToList(layerName,layer,map) {
    const layerList = document.getElementById('listLayer'); // C'est un <ul>
    const listItem = document.createElement('li');
    
    // Créer un input de type checkbox
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = layerName;
    input.name = layerName;
    input.value = layerName;
    input.checked = true;
    
    // Créer un label pour le nom de la couche
    const label = document.createElement('label');
    label.htmlFor = layerName;
    label.appendChild(document.createTextNode(layerName));
    
    // Ajouter l'input et le label à l'élément <li>
    listItem.appendChild(input);
    listItem.appendChild(label);
    
    // Ajouter l'élément <li> à la liste
    layerList.appendChild(listItem);

    // Gérer l'affichage ou nom de la couche quand on coche le checkbox
    input.addEventListener('change',()=>{
        if (input.checked) {
            map.addLayer(layer);
        } else {
            map.removeLayer(layer);
        }
    })

}