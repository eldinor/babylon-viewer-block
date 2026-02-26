
=== Babylon.js Viewer Block ===

Contributors:      WordPress Telex
Tags:              block, 3d, babylon, viewer, model
Tested up to:      6.8
Stable tag:        0.1.0
License:           GPLv2 or later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

Embed interactive 3D models on your WordPress site using the Babylon.js Viewer web component.

== Description ==

The Babylon.js Viewer Block lets you embed stunning, interactive 3D models directly into your WordPress posts and pages. Powered by the official Babylon.js Viewer web component, this block supports GLB and GLTF model formats and provides a rich, GPU-accelerated 3D experience for your visitors.

**Features:**

* Embed 3D models from any URL (GLB/GLTF formats)
* Customizable viewer height
* Optional auto-rotate camera animation
* Environment intensity control for realistic lighting
* Clean, responsive design that works on all devices
* Zero-configuration вЂ” just paste a model URL and publish

The block loads the Babylon.js Viewer library from the official ESM CDN, ensuring your visitors always get the latest stable viewer experience without any heavy local dependencies.

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/babylon-viewer-block` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress.
3. In the block editor, search for "Babylon.js Viewer" and add it to your post or page.
4. Paste the URL to a GLB or GLTF 3D model file in the block's settings panel.

== Frequently Asked Questions ==

= What 3D file formats are supported? =

The Babylon.js Viewer supports GLB and GLTF formats. GLB is recommended as it packages textures and geometry into a single file.

= Where can I find 3D models to use? =

You can find free 3D models on sites like [Sketchfab](https://sketchfab.com), [Poly Pizza](https://poly.pizza), or the [Khronos glTF Sample Models](https://github.com/KhronosGroup/glTF-Sample-Models).

= Does this block slow down my site? =

The Babylon.js Viewer library is loaded only on pages that contain the block, and it is loaded asynchronously from a CDN so it does not affect initial page load performance.

== Screenshots ==

1. The block in the WordPress editor with inspector controls.
2. A 3D model rendered on the frontend with interactive camera controls.

== Changelog ==

= 0.1.0 =
* Initial release
