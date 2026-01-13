import './style.css'
import { initMap, destroyMap, getCurrentLocationId } from './map'
import { initDetailOverlay, getDetailOverlay } from './detailOverlay'

// Learn more click handler - always gets fresh overlay instance
function handleLearnMoreClick() {
  const locationId = getCurrentLocationId()
  const locationPanel = document.getElementById('location-panel')
  const detailOverlay = getDetailOverlay()

  if (locationId && locationPanel && detailOverlay) {
    detailOverlay.open(locationId, locationPanel)
  }
}

// Initialize application
function init() {
  initMap()
  initDetailOverlay()

  // Wire up Learn More button
  const learnMoreBtn = document.getElementById('learn-more-btn')
  if (learnMoreBtn) {
    learnMoreBtn.removeEventListener('click', handleLearnMoreClick)
    learnMoreBtn.addEventListener('click', handleLearnMoreClick)
  }
}

document.addEventListener('DOMContentLoaded', init)

// HMR support
if (import.meta.hot) {
  import.meta.hot.accept('./detailOverlay', () => {
    // Re-initialize detail overlay on HMR
    initDetailOverlay()
  })
}

// Handle cleanup on page unload
window.addEventListener('beforeunload', () => {
  destroyMap()
})

// Handle visibility change to pause/resume animation
document.addEventListener('visibilitychange', () => {
  // The map module handles internal state, this is for future extension
  if (document.hidden) {
    console.log('Tab hidden - animation paused internally')
  } else {
    console.log('Tab visible - animation resumed')
  }
})
