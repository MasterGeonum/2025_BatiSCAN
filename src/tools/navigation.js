
// CE FICHIER GERE TOUS CE QUI EST NAVIGATION , CHANGEMENT DE DIV EN FONCTION SELON UN BOUTTON CLICKE

import L from 'leaflet';
import 'leaflet-side-by-side';
import {addLayerToList} from './oneMap';
import { initMethodologyMap } from './methodology'; 

let mode='sideByside'; // initialiser le mode en sideByside
let mapInit=false;

// cette fonction InitNavigation est execitée un fois la page est chargée
export function InitNavigation () {
    // -----------------------------------------------------------------------------------------
    // Gestion des bandeau à droite, ( pour permettre de basculer d'une section à une autre, graph, couche , aide,...)
    const sidepanelContent = document.getElementById('sidepanelContent');
    const buttons = document.querySelectorAll('.sidebar-btn');
    const contentSections = document.querySelectorAll('.contentItem');

    let currentSection = null;

    // Masquer toutes les sections au départ
    contentSections.forEach(section => section.style.display = 'none');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const sectionId = button.id.split('-')[1]; 
            const targetSection = document.getElementById(sectionId);
            if (!targetSection) return;
    
            if (currentSection === sectionId && sidepanelContent.classList.contains('active')) {
                // Masque la section avec une transition
                targetSection.style.display = 'none';
                sidepanelContent.classList.remove('active');
    
                setTimeout(() => {
                    sidepanelContent.style.display = 'none';
                }, 300); // Temps égal à la transition CSS
    
                currentSection = null;
                button.classList.remove('active');
            } else {
                // Masque toutes les autres sections
                contentSections.forEach(section => section.style.display = 'none');

                if(sectionId==='graph'){
                    const typeLeft = document.getElementById('type_left').value;
                    const typeRight = document.getElementById('type_right').value;
                    // updateGraph()
                }
                
                console.log(sectionId);
    
                // Affiche la nouvelle section et active le panneau latéral
                targetSection.style.display = 'block';
                sidepanelContent.style.display = 'block';
    
                setTimeout(() => {
                    sidepanelContent.classList.add('active');
                }, 10); // Petit délai pour déclencher la transition
    
                currentSection = sectionId;
                buttons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            }
        });
    });
    


    // --------------------------------------------------------------------------------------------
    // gestion des onglets en haut pour basculer entre BatiSCAN , Methodologie , Informations et Aides
    const buttons2 = document.querySelectorAll('#navbar-left .navbar-button'); 
    const contentSections2 = document.querySelectorAll('.rowContentItem');

    let currentSection2 = null;

    buttons2.forEach(button => {
        button.addEventListener('click', () => {
            const sectionId = button.id.split('-')[1]; // Extrait le nom de la section
            // Vérifie si l'élément existe
            const targetSection = document.getElementById(sectionId);
            if (!targetSection) return;

            if (currentSection2 === sectionId) {         
            } else {
                if(sectionId==='content_content'){ // si c'est la carte principale ( le BatiSCAN)
                    if(mode==='sideByside'){
                        document.getElementById('navbarbutton-container').style.display='block'; // afficher les differentes bouttons sur les années ( 2012,2015,...)
                        document.querySelector('.leaflet-control-zoom').style.top = "150px"; // Ajuste la position de zoom panel
                        document.querySelector('.leaflet-control-measure').style.top = "120px"; // Ajuste la position de mesure
                        
                    }
                    
                    // sidepanel.style.top='22.3vh';
                    // sidepanelContent.style.top='22.3vh';
                }else{
                    document.getElementById('navbarbutton-container').style.display='none'; // si non on les supprime
                    if (sectionId==="methodologie_content" && mapInit===false){
                        initMethodologyMap(); // fonction pour initialiser la carte de méthodologie
                        mapInit=true;
                    }
                }

                // Masque toutes les autres sections
                contentSections2.forEach(section => section.style.display = 'none');

                // Affiche la section correspondante
                targetSection.style.display = 'block';
                currentSection2 = sectionId;
            }

            // gerer les couleurs des bouttons en fonction de click
            buttons2.forEach(btn =>
                btn.classList.remove('active')
            );
            button.classList.add('active');
            
        });
    });
};


// fonction pour basculer entre le carte unique ou les cartes SideBySide
export function switchToOneMap(value,sideBySideLayer,magnifyingGlass,map,leftLayer,rightLayer,layerList){ // value prend soit true ou false
    // Les differents div concernés
    const twoMaps = document.getElementById('twoMaps');
    const oneMap = document.getElementById('oneMap');
    const addCenterLayer = document.getElementById('addLayerCenterLayersFromLyon');
    const addSideLayers = document.getElementById('addSideLayersFromLyon');
    const buttonYears=document.getElementById('navbarbutton-container');
    const sidepanel = document.getElementById('sidepanel');
    const sidepanelContent=document.getElementById('sidepanelContent');
    const layerListDiv = document.getElementById('listLayer');
    const checkboxes = layerListDiv.querySelectorAll('input[type="checkbox"]');

    if (value) { // carte unique souhaitée
      mode='oneMap';
      twoMaps.style.display = 'none';
      oneMap.style.display = 'block';
      addSideLayers.style.display = 'none';
      addCenterLayer.style.display = 'flex';
      buttonYears.style.display='none';
      sidepanel.style.top='10vh';
      sidepanelContent.style.top='10vh';

      document.querySelector('.leaflet-control-zoom').style.top = "50px"; // Ajuste la position de zoom panel
      document.querySelector('.leaflet-control-measure').style.top = "5px"; // Ajuste la position de mesure

      sideBySideLayer.remove();// supprimer le sideByside controle (barre verticale) de la carte 
      
      if (magnifyingGlass) {
        map.removeLayer(magnifyingGlass);
        magnifyingGlass = null;
        const lensContainer = document.querySelector('.leaflet-magnifying-glass-container');
        if (lensContainer) {
            lensContainer.remove();
        }
      }
      
      map.removeLayer(leftLayer); // supprimer aussi les couches precedents
      map.removeLayer(rightLayer);

    



      Object.entries(layerList).forEach(([key, value]) => {// le layerList est un dictionnaire qui stocke toutes les couches qui ont été déjà chargées sur la carte unique
        map.addLayer(value); 
      });
  
      checkboxes.forEach(checkbox => {
          checkbox.checked = true; // convertir tous les checkbOx en true
      });
      document.getElementById('navbarbutton-container').classList.add('hidden');


    } else { // Si carte sidebyside souhaitée
      mode='sideByside';
      twoMaps.style.display = 'block';
      oneMap.style.display = 'none';
      addSideLayers.style.display = 'flex';
      addCenterLayer.style.display = 'none';
      buttonYears.style.display='block';
      sidepanel.style.top='22.3vh';
      sidepanelContent.style.top='22.3vh';
      
      document.getElementById('navbarbutton-container').classList.remove('hidden');


      

      document.querySelector('.leaflet-control-zoom').style.top = "150px"; // Ajuste la position de zoom panel
      document.querySelector('.leaflet-control-measure').style.top = "120px"; // Ajuste la position de mesure

      Object.entries(layerList).forEach(([key, value]) => {// le layerList est un dictionnaire qui stocke toutes les couches qui ont été déjà chargées sur la carte unique
        map.removeLayer(value);
      });

      // supprimer le magnifyingGlass si il existe, pour avoir toujours le slider par defaut
      if (magnifyingGlass) {
        map.removeLayer(magnifyingGlass);
        magnifyingGlass = null;
        const lensContainer = document.querySelector('.leaflet-magnifying-glass-container');
        if (lensContainer) {
            lensContainer.remove();
        }
      }


      sideBySideLayer = L.control.sideBySide(leftLayer,rightLayer).addTo(map); // Rajouter le sideByseide controle ( barre vecrticale) sur la carte avec les 2 dernières couches  left et right
    }

    return sideBySideLayer; 
}

