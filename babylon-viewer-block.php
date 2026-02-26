<?php
/**
 * Plugin Name:       Babylon.js Viewer Block
 * Description:       Embed interactive 3D models on your WordPress site using the Babylon.js Viewer web component.
 * Version:           0.1.0
 * Requires at least: 6.6
 * Requires PHP:      7.4
 * Author:            BabylonPress
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       babylon-viewer-block
 *
 * @package BabylonViewerBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers the block using the metadata loaded from the `block.json` file.
 */
if ( ! function_exists( 'babylon_viewer_block_block_init' ) ) {
	function babylon_viewer_block_block_init() {
		register_block_type( __DIR__ . '/build/' );
	}
}
add_action( 'init', 'babylon_viewer_block_block_init' );

/**
 * Register a custom REST endpoint for uploading GLB/GLTF files.
 *
 * This bypasses WordPress's standard media upload pipeline which has
 * deep MIME type validation that rejects binary GLB files.
 */
if ( ! function_exists( 'babylon_viewer_block_register_upload_endpoint' ) ) {
	function babylon_viewer_block_register_upload_endpoint() {
		register_rest_route( 'babylon-viewer-block/v1', '/upload', array(
			'methods'             => 'POST',
			'callback'            => 'babylon_viewer_block_handle_upload',
			'permission_callback' => function () {
				return current_user_can( 'upload_files' );
			},
		) );
	}
}
add_action( 'rest_api_init', 'babylon_viewer_block_register_upload_endpoint' );

/**
 * Handle the custom GLB/GLTF file upload.
 */
if ( ! function_exists( 'babylon_viewer_block_handle_upload' ) ) {
	function babylon_viewer_block_handle_upload( $request ) {
		$files = $request->get_file_params();

		if ( empty( $files['file'] ) ) {
			return new WP_Error( 'no_file', __( 'No file was uploaded.', 'babylon-viewer-block' ), array( 'status' => 400 ) );
		}

		$file = $files['file'];
		$filename = sanitize_file_name( $file['name'] );
		$ext = strtolower( pathinfo( $filename, PATHINFO_EXTENSION ) );

		if ( ! in_array( $ext, array( 'glb', 'gltf' ), true ) ) {
			return new WP_Error( 'invalid_type', __( 'Only GLB and GLTF files are allowed.', 'babylon-viewer-block' ), array( 'status' => 400 ) );
		}

		if ( $file['error'] !== UPLOAD_ERR_OK ) {
			return new WP_Error( 'upload_error', __( 'File upload failed.', 'babylon-viewer-block' ), array( 'status' => 500 ) );
		}

		// Get the WordPress upload directory.
		$upload_dir = wp_upload_dir();

		if ( ! empty( $upload_dir['error'] ) ) {
			return new WP_Error( 'upload_dir_error', $upload_dir['error'], array( 'status' => 500 ) );
		}

		// Generate a unique filename to avoid collisions.
		$unique_filename = wp_unique_filename( $upload_dir['path'], $filename );
		$destination = $upload_dir['path'] . '/' . $unique_filename;

		// Move the uploaded file.
		if ( ! move_uploaded_file( $file['tmp_name'], $destination ) ) {
			return new WP_Error( 'move_failed', __( 'Could not move uploaded file.', 'babylon-viewer-block' ), array( 'status' => 500 ) );
		}

		// Set correct file permissions.
		$stat = stat( dirname( $destination ) );
		$perms = $stat['mode'] & 0000666;
		chmod( $destination, $perms );

		// Determine MIME type.
		$mime_type = ( 'glb' === $ext ) ? 'model/gltf-binary' : 'model/gltf+json';

		// Create an attachment in the Media Library.
		$attachment = array(
			'post_mime_type' => $mime_type,
			'post_title'     => preg_replace( '/\.[^.]+$/', '', $unique_filename ),
			'post_content'   => '',
			'post_status'    => 'inherit',
			'guid'           => $upload_dir['url'] . '/' . $unique_filename,
		);

		$attach_id = wp_insert_attachment( $attachment, $destination );

		if ( is_wp_error( $attach_id ) ) {
			wp_delete_file( $destination );
			return $attach_id;
		}

		// Generate attachment metadata.
		require_once ABSPATH . 'wp-admin/includes/image.php';
		$attach_data = wp_generate_attachment_metadata( $attach_id, $destination );
		wp_update_attachment_metadata( $attach_id, $attach_data );

		$url = $upload_dir['url'] . '/' . $unique_filename;

		return rest_ensure_response( array(
			'id'       => $attach_id,
			'url'      => $url,
			'filename' => $unique_filename,
			'mime'     => $mime_type,
		) );
	}
}

/**
 * Allow GLB and GLTF file uploads in the WordPress Media Library.
 */
if ( ! function_exists( 'babylon_viewer_block_allow_glb_upload' ) ) {
	function babylon_viewer_block_allow_glb_upload( $mimes ) {
		$mimes['glb']  = 'application/octet-stream';
		$mimes['gltf'] = 'model/gltf+json';
		return $mimes;
	}
}
add_filter( 'upload_mimes', 'babylon_viewer_block_allow_glb_upload' );

/**
 * Force correct file type for GLB/GLTF during wp_check_filetype_and_ext.
 */
if ( ! function_exists( 'babylon_viewer_block_check_filetype' ) ) {
	function babylon_viewer_block_check_filetype( $data, $file, $filename, $mimes ) {
		$ext = strtolower( pathinfo( $filename, PATHINFO_EXTENSION ) );

		if ( 'glb' === $ext ) {
			$data['ext']             = 'glb';
			$data['type']            = 'application/octet-stream';
			$data['proper_filename'] = false;
		} elseif ( 'gltf' === $ext ) {
			$data['ext']             = 'gltf';
			$data['type']            = 'model/gltf+json';
			$data['proper_filename'] = false;
		}

		return $data;
	}
}
add_filter( 'wp_check_filetype_and_ext', 'babylon_viewer_block_check_filetype', 99, 4 );

/**
 * Detect whether current frontend request contains the Babylon block.
 */
if ( ! function_exists( 'babylon_viewer_block_request_has_block' ) ) {
	function babylon_viewer_block_request_has_block() {
		if ( is_admin() ) {
			return false;
		}

		if ( is_singular() ) {
			$post = get_post( get_queried_object_id() );
			return $post && has_block( 'babylon/viewer-block', $post );
		}

		global $wp_query;
		if ( empty( $wp_query ) || empty( $wp_query->posts ) ) {
			return false;
		}

		foreach ( $wp_query->posts as $post ) {
			if ( has_block( 'babylon/viewer-block', $post ) ) {
				return true;
			}
		}

		return false;
	}
}

/**
 * Register Babylon importmap output early enough for frontend rendering.
 */
if ( ! function_exists( 'babylon_viewer_block_register_frontend_assets' ) ) {
	function babylon_viewer_block_register_frontend_assets() {
		if ( babylon_viewer_block_request_has_block() ) {
			add_action( 'wp_head', 'babylon_viewer_block_print_importmap', 1 );
		}
	}
}
add_action( 'template_redirect', 'babylon_viewer_block_register_frontend_assets' );

/**
 * Print the importmap and module script for Babylon.js Viewer in the head.
 */
if ( ! function_exists( 'babylon_viewer_block_print_importmap' ) ) {
	function babylon_viewer_block_print_importmap() {
		?>
		<script type="importmap">
		{
			"imports": {
				"@babylonjs/viewer": "https://cdn.jsdelivr.net/npm/@babylonjs/viewer@latest/dist/babylon-viewer.esm.min.js"
			}
		}
		</script>
		<script type="module">
			import "@babylonjs/viewer";
		</script>
		<?php
	}
}
