<?php
/**
 * Render callback for the Babylon.js Viewer Block.
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Block default content.
 * @var WP_Block $block      Block instance.
 */

$model_url             = isset( $attributes['modelUrl'] ) ? esc_url( $attributes['modelUrl'] ) : '';
$height                = isset( $attributes['height'] ) ? absint( $attributes['height'] ) : 400;
$auto_rotate           = ! empty( $attributes['autoRotate'] );
$auto_rotate_speed     = isset( $attributes['autoRotateSpeed'] ) ? floatval( $attributes['autoRotateSpeed'] ) : 1;
$camera_radius         = isset( $attributes['cameraRadius'] ) ? floatval( $attributes['cameraRadius'] ) : 0;
$camera_fov            = isset( $attributes['cameraFieldOfView'] ) ? floatval( $attributes['cameraFieldOfView'] ) : 0;
$environment_intensity = isset( $attributes['environmentIntensity'] ) ? floatval( $attributes['environmentIntensity'] ) : 1;
$tone_mapping          = isset( $attributes['toneMapping'] ) ? sanitize_text_field( $attributes['toneMapping'] ) : 'neutral';
$contrast              = isset( $attributes['contrast'] ) ? floatval( $attributes['contrast'] ) : 1;
$exposure              = isset( $attributes['exposure'] ) ? floatval( $attributes['exposure'] ) : 1;
$play_animation        = isset( $attributes['playAnimation'] ) ? (bool) $attributes['playAnimation'] : true;
$animation_speed       = isset( $attributes['animationSpeed'] ) ? floatval( $attributes['animationSpeed'] ) : 1;
$show_ground_shadow    = ! empty( $attributes['showGroundShadow'] );
$clear_color           = isset( $attributes['clearColor'] ) ? sanitize_text_field( $attributes['clearColor'] ) : '';
$skybox_blur           = isset( $attributes['skyboxBlur'] ) ? floatval( $attributes['skyboxBlur'] ) : 0.3;

if ( empty( $model_url ) ) {
	return;
}

$viewer_attrs = sprintf( 'source="%s"', $model_url );
$viewer_attrs .= sprintf( ' environment-intensity="%s"', esc_attr( $environment_intensity ) );

if ( $auto_rotate ) {
	$viewer_attrs .= ' camera-auto-orbit';
	if ( 1.0 !== $auto_rotate_speed ) {
		$viewer_attrs .= sprintf( ' camera-auto-orbit-speed="%s"', esc_attr( $auto_rotate_speed ) );
	}
}

if ( $camera_radius > 0 ) {
	$viewer_attrs .= sprintf( ' camera-radius="%s"', esc_attr( $camera_radius ) );
}

if ( $camera_fov > 0 ) {
	$viewer_attrs .= sprintf( ' camera-field-of-view="%s"', esc_attr( $camera_fov ) );
}

if ( 'neutral' !== $tone_mapping ) {
	$viewer_attrs .= sprintf( ' tone-mapping="%s"', esc_attr( $tone_mapping ) );
}

if ( 1.0 !== $contrast ) {
	$viewer_attrs .= sprintf( ' contrast="%s"', esc_attr( $contrast ) );
}

if ( 1.0 !== $exposure ) {
	$viewer_attrs .= sprintf( ' exposure="%s"', esc_attr( $exposure ) );
}

if ( ! $play_animation ) {
	$viewer_attrs .= ' animation-auto-play="false"';
}

if ( 1.0 !== $animation_speed ) {
	$viewer_attrs .= sprintf( ' animation-speed="%s"', esc_attr( $animation_speed ) );
}

if ( $show_ground_shadow ) {
	$viewer_attrs .= ' ground-shadow="true"';
}

if ( 0.3 !== $skybox_blur ) {
	$viewer_attrs .= sprintf( ' skybox-blur="%s"', esc_attr( $skybox_blur ) );
}

$block_style = sprintf( 'min-height:%dpx;', $height );
if ( ! empty( $clear_color ) ) {
	$block_style .= sprintf( 'background-color:%s;', esc_attr( $clear_color ) );
}

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'style' => $block_style,
	)
);
?>
<div <?php echo $wrapper_attributes; ?>>
	<div class="babylon-viewer-block__loading"><?php esc_html_e( 'Loading 3D model...', 'babylon-viewer-block' ); ?></div>
	<babylon-viewer <?php echo $viewer_attrs; ?> style="width:100%;height:<?php echo esc_attr( $height ); ?>px;"></babylon-viewer>
</div>
