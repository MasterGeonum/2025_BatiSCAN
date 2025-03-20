import L from 'leaflet';
import 'leaflet-side-by-side';

let currentMode = 'side-by-side'; // Variable pour suivre le mode d'affichage actuel
let magnifyingGlass; // variable pour la loupe

export function initLoop () {
    // Fonction pour gérer la loupe
    L.MagnifyingGlass = L.Layer.extend({
        options: {
            radius: 150, // Réduire le rayon à 150 mètres
            zoomOffset: 0, // Ajuster le zoom pour qu'il soit proportionnel à la carte principale
            layers: []
        },

        initialize: function (options) {
            L.setOptions(this, options);
            this._fixedZoom = null;
        },

        getRadius: function () {
            return this.options.radius;
        },

        setRadius: function (radius) {
            this.options.radius = radius;
            this._update();
        },

        getZoomOffset: function () {
            return this.options.zoomOffset;
        },

        setZoomOffset: function (zoomOffset) {
            this.options.zoomOffset = zoomOffset;
            this._update();
        },

        getFixedZoom: function () {
            return this._fixedZoom;
        },

        setFixedZoom: function (fixedZoom) {
            this._fixedZoom = fixedZoom;
            this._update();
        },

        // Fonctions pour gérer les couches
        setLayers: function (layers) {
            this.options.layers = layers;
            if (this._magnifyingMap) {
                this._magnifyingMap.eachLayer(layer => {
                    if (layer && layer._map) {
                        this._magnifyingMap.removeLayer(layer);
                    }
                });
                layers.forEach(layer => {
                    if (layer) {
                        this._magnifyingMap.addLayer(layer);
                    }
                });
            }
        },

        _getLensCenter: function () {
            return this._lensLatLng;
        },

        _setLensCenter: function (latlng) {
            this._lensLatLng = latlng;
            this._update();
        },

        onAdd: function (map) {
            this._map = map;
            this._lensLatLng = map.getCenter();

            // Créer un conteneur distinct pour la loupe
            const lensContainer = L.DomUtil.create('div', 'leaflet-magnifying-glass-container');
            lensContainer.style.width = this.options.radius * 2 + 'px';
            lensContainer.style.height = this.options.radius * 2 + 'px';
            map.getPanes().overlayPane.appendChild(lensContainer);


            this._magnifyingMap = L.map(lensContainer, {
                zoomControl: false,
                attributionControl: false,
                dragging: false,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                boxZoom: false,
                keyboard: false,
                zoomAnimation: false,
                fadeAnimation: false,
                markerZoomAnimation: false,
                inertia: false,
                layers: this.options.layers
            }).setView(this._lensLatLng, map.getZoom() + this.getZoomOffset());

            this._map.on('mousemove', this._onMouseMove, this);
            this._map.on('zoomend', this._update, this);
            this._map.on('moveend', this._update, this);

            this._update();
        },

        onRemove: function (map) {
            map.off('mousemove', this._onMouseMove, this);
            map.off('zoomend', this._update, this);
            map.off('moveend', this._update, this);
            this._magnifyingMap.remove();
        },

        _onMouseMove: function (e) {
            this._setLensCenter(e.latlng);

            // Positionner le conteneur de la loupe par rapport au curseur
            const lensContainer = this._magnifyingMap.getContainer();
            const point = this._map.latLngToContainerPoint(e.latlng);
            lensContainer.style.left = point.x + 'px';
            lensContainer.style.top = point.y + 'px';
        },

        _update: function () {
            if (!this._map) {
                return;
            }

            var lensCenter = this._getLensCenter();
            var zoom = this._fixedZoom !== null ? this._fixedZoom : this._map.getZoom() + this.getZoomOffset();

            if (this._magnifyingMap) {
                this._magnifyingMap.setView(lensCenter, zoom);
            }
        }
    });

    // Fonction pour créer une loupe
    L.magnifyingGlass = function (options) {
        return new L.MagnifyingGlass(options);
    };

}


// Fonction pour mettre à jour la loupe
export function updateLoupe(map,rightLayer,magnifyingGlass) {
    if (magnifyingGlass) {
        map.removeLayer(magnifyingGlass);
        magnifyingGlass = null;
        const lensContainer = document.querySelector('.leaflet-magnifying-glass-container');
        if (lensContainer) {
            lensContainer.remove();
        }
        

        magnifyingGlass = L.magnifyingGlass({
            layers: [rightLayer],
            radius: 150, 
            zoomOffset: 0 
        }).addTo(map);
    }
}


// Fonction pour activer le mode loupe
export function activateLoupeMode(map,sideBySideLayer,magnifyingGlass,leftLayer,rightLayer) {
    currentMode = 'loupe'; // Mettre à jour le mode d'affichage actuel
    // Désactiver le mode side-by-side
    if (sideBySideLayer) {
        sideBySideLayer.remove();
        // map.removeControl(sideBySideLayer);
    }
    if (rightLayer) {
        map.removeLayer(rightLayer);
    }

    // Ajouter la couche de gauche à la carte
    if (!map.hasLayer(leftLayer)) {
        map.addLayer(leftLayer);
    }

    // Activer la loupe
    if (magnifyingGlass) {
        map.removeLayer(magnifyingGlass);
        const lensContainer = document.querySelector('.leaflet-magnifying-glass-container');
        if (lensContainer) {
            lensContainer.remove();
        }
    }

    magnifyingGlass = L.magnifyingGlass({
        layers: [rightLayer],
        radius: 150, // Ajuster le rayon à 150 mètres
        zoomOffset: 0 // Ajuster le zoom pour qu'il soit proportionnel à la carte principale
    }).addTo(map);

    return magnifyingGlass;
}

// Fonction pour activer le mode side-by-side
export function activateSideBySideMode(map,sideBySideLayer,magnifyingGlass,leftLayer,rightLayer) {
  currentMode = 'side-by-side'; // Mettre à jour le mode d'affichage actuel
  // Désactiver la loupe
  if (magnifyingGlass) {
      map.removeLayer(magnifyingGlass);
      magnifyingGlass = null;
      const lensContainer = document.querySelector('.leaflet-magnifying-glass-container');
      if (lensContainer) {
          lensContainer.remove();
      }
  }

  map.off('mousemove'); // Désactiver le zoom autour du curseur

  if (!map.hasLayer(leftLayer)) {
      map.addLayer(leftLayer);
  }
  if (!map.hasLayer(rightLayer)) {
      map.addLayer(rightLayer);
  }
  if (sideBySideLayer) {
      map.removeControl(sideBySideLayer);
  }
  sideBySideLayer = L.control.sideBySide(leftLayer, rightLayer).addTo(map);
  

  // Ensure the right layer is properly set
  if (rightLayer) {
      sideBySideLayer.setRightLayers(rightLayer);
  }

  return sideBySideLayer;
}


