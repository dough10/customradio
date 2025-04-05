import { createStationElement } from './createStationElement';

/**
 * Populates a container with station elements
 * 
 * @param {HTMLElement} container - The container to populate.
 * @param {Array} stationList - The list of stations to add.
 * @param {Class} player - The AudioPlayer.js instance.
 * @param {Boolean} [selected=false] - Optional. If true, the station element will be marked as selected.
 */
export default function populateContainer(container, stationList, player, selected = false) {
  const localFragment = document.createDocumentFragment();
  stationList.forEach(element => {
    const stationElement = createStationElement(element, player);
    if (element.selected) stationElement.toggleAttribute('selected');
    localFragment.append(stationElement);
  });
  container.append(localFragment);
}