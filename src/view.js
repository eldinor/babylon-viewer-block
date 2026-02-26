
/**
 * Frontend view script for the Babylon.js Viewer Block.
 *
 * The actual Babylon.js Viewer web component is loaded via an importmap
 * and module script injected into the page head by the PHP plugin file.
 * This script ensures any dynamic setup or fallback behavior is handled.
 */

( function () {
	'use strict';

	const BLOCK_SELECTOR = '.wp-block-babylon-viewer-block';

	function initViewerBlocks() {
		const blocks = document.querySelectorAll( BLOCK_SELECTOR );

		blocks.forEach( function ( block ) {
			const viewer = block.querySelector( 'babylon-viewer' );
			if ( ! viewer ) {
				return;
			}

			const loadingEl = block.querySelector(
				'.babylon-viewer-block__loading'
			);

			if ( loadingEl ) {
				let isReady = false;

				viewer.addEventListener(
					'viewerready',
					function () {
						isReady = true;
						loadingEl.style.display = 'none';
					},
					{ once: true }
				);

				// Show a visible diagnostic instead of leaving an empty block.
				setTimeout( function () {
					if ( isReady ) {
						return;
					}
					loadingEl.textContent =
						'3D model failed to load. Check model URL and CORS settings.';
					loadingEl.classList.add( 'is-error' );
				}, 15000 );

				viewer.addEventListener( 'error', function () {
					if ( isReady ) {
						return;
					}
					loadingEl.textContent =
						'3D model failed to load. Check model URL and CORS settings.';
					loadingEl.classList.add( 'is-error' );
				} );
			}
		} );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initViewerBlocks );
	} else {
		initViewerBlocks();
	}
} )();
	
