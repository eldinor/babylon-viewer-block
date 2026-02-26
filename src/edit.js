import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	RangeControl,
	ToggleControl,
	SelectControl,
	Placeholder,
	Button,
	Notice,
	ColorPicker,
} from '@wordpress/components';
import { useState, useRef, useEffect, useMemo, Fragment } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import './editor.scss';

function GlbUploadButton( { onUpload } ) {
	const fileInputRef = useRef( null );
	const [ isUploading, setIsUploading ] = useState( false );
	const [ error, setError ] = useState( '' );

	const handleFileSelect = async ( event ) => {
		const file = event.target.files[ 0 ];
		if ( ! file ) {
			return;
		}

		const ext = file.name.split( '.' ).pop().toLowerCase();
		if ( ext !== 'glb' && ext !== 'gltf' ) {
			setError( __( 'Please select a GLB or GLTF file.', 'babylon-viewer-block' ) );
			return;
		}

		setIsUploading( true );
		setError( '' );

		const formData = new FormData();
		formData.append( 'file', file );

		try {
			const result = await apiFetch( {
				path: '/babylon-viewer-block/v1/upload',
				method: 'POST',
				body: formData,
			} );

			if ( result && result.url ) {
				onUpload( result.url );
			} else {
				setError( __( 'Upload succeeded but no URL was returned.', 'babylon-viewer-block' ) );
			}
		} catch ( err ) {
			setError(
				err.message ||
				__( 'Upload failed. Please try again.', 'babylon-viewer-block' )
			);
		} finally {
			setIsUploading( false );
			if ( fileInputRef.current ) {
				fileInputRef.current.value = '';
			}
		}
	};

	return (
		<div>
			<input
				ref={ fileInputRef }
				type="file"
				accept=".glb,.gltf"
				style={ { display: 'none' } }
				onChange={ handleFileSelect }
			/>
			<Button
				variant="secondary"
				isBusy={ isUploading }
				disabled={ isUploading }
				onClick={ () => fileInputRef.current && fileInputRef.current.click() }
			>
				{ isUploading
					? __( 'Uploading...', 'babylon-viewer-block' )
					: __( 'Upload GLB', 'babylon-viewer-block' ) }
			</Button>
			{ error && (
				<Notice status="error" isDismissible={ false } style={ { marginTop: '8px' } }>
					{ error }
				</Notice>
			) }
		</div>
	);
}

export default function Edit( { attributes, setAttributes } ) {
	const {
		modelUrl,
		height,
		autoRotate,
		autoRotateSpeed,
		cameraRadius,
		cameraFieldOfView,
		environmentIntensity,
		toneMapping,
		contrast,
		exposure,
		playAnimation,
		animationSpeed,
		showGroundShadow,
		clearColor,
		skyboxBlur,
	} = attributes;

	const blockProps = useBlockProps( {
		style: { minHeight: height + 'px' },
	} );

	const iframeRef = useRef( null );

	const onFileUploaded = ( url ) => {
		setAttributes( { modelUrl: url } );
	};

	const previewSrcDoc = useMemo(
		() =>
			'<!DOCTYPE html><html><head><meta charset="utf-8">' +
			'<style>html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: transparent; }' +
			' babylon-viewer { width: 100%; height: 100%; display: block; border: 0; outline: none; box-shadow: none; }' +
			' canvas { outline: none; }</style>' +
			'<script type="importmap">{"imports":{"@babylonjs/viewer":"https://cdn.jsdelivr.net/npm/@babylonjs/viewer@latest/dist/babylon-viewer.esm.min.js"}}<\/script>' +
			'<script type="module">import "@babylonjs/viewer";<\/script>' +
			'<script>window.addEventListener("message", function(event){' +
			'var data = event.data || {};' +
			'if(data.type !== "BABYLON_VIEWER_BLOCK_CONFIG" || !data.payload){ return; }' +
			'var cfg = data.payload;' +
			'var viewer = document.getElementById("babylon-viewer-block");' +
			'if(!viewer){ return; }' +
			'function setNumAttr(name, value, defaultValue){ if(value !== defaultValue && value !== undefined && value !== null){ viewer.setAttribute(name, String(value)); } else { viewer.removeAttribute(name); } }' +
			'function setBoolAttr(name, enabled){ if(enabled){ viewer.setAttribute(name, ""); } else { viewer.removeAttribute(name); } }' +
			'viewer.setAttribute("source", cfg.modelUrl || "");' +
			'viewer.setAttribute("environment-intensity", String(cfg.environmentIntensity));' +
			'setBoolAttr("camera-auto-orbit", !!cfg.autoRotate);' +
			'setNumAttr("camera-auto-orbit-speed", cfg.autoRotateSpeed, 1);' +
			'setNumAttr("camera-radius", cfg.cameraRadius, 0);' +
			'setNumAttr("camera-field-of-view", cfg.cameraFieldOfView, 0);' +
			'setNumAttr("contrast", cfg.contrast, 1);' +
			'setNumAttr("exposure", cfg.exposure, 1);' +
			'setNumAttr("animation-speed", cfg.animationSpeed, 1);' +
			'setNumAttr("skybox-blur", cfg.skyboxBlur, 0.3);' +
			'if(cfg.toneMapping && cfg.toneMapping !== "neutral"){ viewer.setAttribute("tone-mapping", cfg.toneMapping); } else { viewer.removeAttribute("tone-mapping"); }' +
			'if(cfg.playAnimation === false){ viewer.setAttribute("animation-auto-play", "false"); } else { viewer.removeAttribute("animation-auto-play"); }' +
			'if(cfg.showGroundShadow){ viewer.setAttribute("ground-shadow", "true"); } else { viewer.removeAttribute("ground-shadow"); }' +
			'if(cfg.clearColor){ viewer.setAttribute("clear-color", cfg.clearColor); } else { viewer.removeAttribute("clear-color"); }' +
			'document.body.style.backgroundColor = "transparent";' +
			'document.documentElement.style.backgroundColor = "transparent";' +
			'});<\/script>' +
			'</head><body>' +
			'<babylon-viewer id="babylon-viewer-block" style="width:100%;height:100%;border:0;outline:none;box-shadow:none;display:block;"></babylon-viewer>' +
			'</body></html>',
		[]
	);

	const previewConfig = useMemo(
		() => ( {
			modelUrl,
			environmentIntensity,
			autoRotate,
			autoRotateSpeed,
			cameraRadius,
			cameraFieldOfView,
			toneMapping,
			contrast,
			exposure,
			playAnimation,
			animationSpeed,
			showGroundShadow,
			clearColor,
			skyboxBlur,
		} ),
		[
			modelUrl,
			environmentIntensity,
			autoRotate,
			autoRotateSpeed,
			cameraRadius,
			cameraFieldOfView,
			toneMapping,
			contrast,
			exposure,
			playAnimation,
			animationSpeed,
			showGroundShadow,
			clearColor,
			skyboxBlur,
		]
	);

	const sendPreviewConfig = () => {
		if ( iframeRef.current && iframeRef.current.contentWindow ) {
			iframeRef.current.contentWindow.postMessage(
				{
					type: 'BABYLON_VIEWER_BLOCK_CONFIG',
					payload: previewConfig,
				},
				'*'
			);
		}
	};

	useEffect( () => {
		if ( modelUrl ) {
			sendPreviewConfig();
		}
	}, [ previewConfig, modelUrl ] );

	return (
		<Fragment>
			<InspectorControls>
				<PanelBody
					title={ __( 'Model Settings', 'babylon-viewer-block' ) }
					initialOpen={ true }
				>
					<TextControl
						label={ __( '3D Model URL', 'babylon-viewer-block' ) }
						help={ __( 'Enter the URL to a GLB or GLTF 3D model file.', 'babylon-viewer-block' ) }
						value={ modelUrl }
						onChange={ ( value ) => setAttributes( { modelUrl: value } ) }
						placeholder="https://example.com/model.glb"
					/>
					<div style={ { marginBottom: '16px' } }>
						<GlbUploadButton onUpload={ ( url ) => setAttributes( { modelUrl: url } ) } />
					</div>
					<RangeControl
						label={ __( 'Viewer Height (px)', 'babylon-viewer-block' ) }
						value={ height }
						onChange={ ( value ) => setAttributes( { height: value } ) }
						min={ 200 }
						max={ 1000 }
						step={ 10 }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Camera Settings', 'babylon-viewer-block' ) }
					initialOpen={ false }
				>
					<ToggleControl
						label={ __( 'Auto-rotate Camera', 'babylon-viewer-block' ) }
						checked={ autoRotate }
						onChange={ ( value ) => setAttributes( { autoRotate: value } ) }
					/>
					{ autoRotate && (
						<RangeControl
							label={ __( 'Auto-rotate Speed', 'babylon-viewer-block' ) }
							value={ autoRotateSpeed }
							onChange={ ( value ) => setAttributes( { autoRotateSpeed: value } ) }
							min={ 0.1 }
							max={ 10 }
							step={ 0.1 }
						/>
					) }
					<RangeControl
						label={ __( 'Camera Radius', 'babylon-viewer-block' ) }
						help={ __( 'Set to 0 for automatic distance.', 'babylon-viewer-block' ) }
						value={ cameraRadius }
						onChange={ ( value ) => setAttributes( { cameraRadius: value } ) }
						min={ 0 }
						max={ 50 }
						step={ 0.5 }
					/>
					<RangeControl
						label={ __( 'Field of View (degrees)', 'babylon-viewer-block' ) }
						help={ __( 'Set to 0 for default.', 'babylon-viewer-block' ) }
						value={ cameraFieldOfView }
						onChange={ ( value ) => setAttributes( { cameraFieldOfView: value } ) }
						min={ 0 }
						max={ 120 }
						step={ 1 }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Lighting & Environment', 'babylon-viewer-block' ) }
					initialOpen={ false }
				>
					<RangeControl
						label={ __( 'Environment Intensity', 'babylon-viewer-block' ) }
						value={ environmentIntensity }
						onChange={ ( value ) => setAttributes( { environmentIntensity: value } ) }
						min={ 0 }
						max={ 3 }
						step={ 0.1 }
					/>
					<SelectControl
						label={ __( 'Tone Mapping', 'babylon-viewer-block' ) }
						value={ toneMapping }
						options={ [
							{ label: __( 'Neutral', 'babylon-viewer-block' ), value: 'neutral' },
							{ label: __( 'ACES', 'babylon-viewer-block' ), value: 'aces' },
							{ label: __( 'None', 'babylon-viewer-block' ), value: 'none' },
						] }
						onChange={ ( value ) => setAttributes( { toneMapping: value } ) }
					/>
					<RangeControl
						label={ __( 'Contrast', 'babylon-viewer-block' ) }
						value={ contrast }
						onChange={ ( value ) => setAttributes( { contrast: value } ) }
						min={ 0 }
						max={ 3 }
						step={ 0.1 }
					/>
					<RangeControl
						label={ __( 'Exposure', 'babylon-viewer-block' ) }
						value={ exposure }
						onChange={ ( value ) => setAttributes( { exposure: value } ) }
						min={ 0 }
						max={ 5 }
						step={ 0.1 }
					/>
					<RangeControl
						label={ __( 'Skybox Blur', 'babylon-viewer-block' ) }
						value={ skyboxBlur }
						onChange={ ( value ) => setAttributes( { skyboxBlur: value } ) }
						min={ 0 }
						max={ 1 }
						step={ 0.05 }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Animation', 'babylon-viewer-block' ) }
					initialOpen={ false }
				>
					<ToggleControl
						label={ __( 'Auto-play Animation', 'babylon-viewer-block' ) }
						help={ __( 'Automatically play model animations on load.', 'babylon-viewer-block' ) }
						checked={ playAnimation }
						onChange={ ( value ) => setAttributes( { playAnimation: value } ) }
					/>
					<RangeControl
						label={ __( 'Animation Speed', 'babylon-viewer-block' ) }
						value={ animationSpeed }
						onChange={ ( value ) => setAttributes( { animationSpeed: value } ) }
						min={ 0.1 }
						max={ 5 }
						step={ 0.1 }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Appearance', 'babylon-viewer-block' ) }
					initialOpen={ false }
				>
					<ToggleControl
						label={ __( 'Ground Shadow', 'babylon-viewer-block' ) }
						help={ __( 'Display a shadow beneath the model.', 'babylon-viewer-block' ) }
						checked={ showGroundShadow }
						onChange={ ( value ) => setAttributes( { showGroundShadow: value } ) }
					/>
					<div style={ { marginBottom: '16px' } }>
						<p style={ { marginBottom: '8px', fontWeight: 500 } }>
							{ __( 'Background Color', 'babylon-viewer-block' ) }
						</p>
						<p style={ { marginBottom: '8px', color: '#757575', fontSize: '12px' } }>
							{ __( 'Leave empty for default dark background.', 'babylon-viewer-block' ) }
						</p>
						<ColorPicker
							color={ clearColor || '#1a1a2e' }
							onChange={ ( value ) => setAttributes( { clearColor: value } ) }
							enableAlpha
						/>
						{ clearColor && (
							<Button
								variant="link"
								isDestructive
								onClick={ () => setAttributes( { clearColor: '' } ) }
								style={ { marginTop: '8px' } }
							>
								{ __( 'Reset to Default', 'babylon-viewer-block' ) }
							</Button>
						) }
					</div>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ ! modelUrl ? (
					<Placeholder
						icon="format-video"
						label={ __( 'Babylon.js 3D Viewer', 'babylon-viewer-block' ) }
						instructions={ __( 'Upload a GLB file or enter a URL to a 3D model to display an interactive 3D viewer.', 'babylon-viewer-block' ) }
					>
						<div style={ { display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '400px' } }>
							<TextControl
								label={ __( '3D Model URL', 'babylon-viewer-block' ) }
								value={ modelUrl }
								onChange={ ( value ) => setAttributes( { modelUrl: value } ) }
								placeholder="https://example.com/model.glb"
								__nextHasNoMarginBottom
							/>
							<GlbUploadButton onUpload={ onFileUploaded } />
						</div>
					</Placeholder>
				) : (
					<iframe
						ref={ iframeRef }
						srcDoc={ previewSrcDoc }
						onLoad={ sendPreviewConfig }
						style={ {
							width: '100%',
							height: height + 'px',
							border: 'none',
							borderRadius: '0',
							display: 'block',
							pointerEvents: 'none',
						} }
						title={ __( '3D Model Preview', 'babylon-viewer-block' ) }
						sandbox="allow-scripts allow-same-origin"
					/>
				) }
			</div>
		</Fragment>
	);
}
