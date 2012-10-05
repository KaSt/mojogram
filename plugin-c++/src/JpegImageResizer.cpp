/*
 * JpegImageResizer.cpp
 *
 *  Created on: 02/10/2012
 *      Author: Antonio
 */

#include "JpegImageResizer.h"
#include <SDL.h>
#include <SDL_image.h>
#include "utilities.h"
#include "SDL_rotozoom.h"


JpegImageResizer::JpegImageResizer() {

}

JpegImageResizer::~JpegImageResizer() {

}

void JpegImageResizer::jpegerrmgr_exit(j_common_ptr cinfo)
{
	char buffer[200];
	cinfo->err->format_message(cinfo, buffer);
	_LOGDATA("error jpeg %s", buffer);
}

SDL_Surface* JpegImageResizer::resizeSurface(SDL_Surface* surface, double zoom) {
	double angle = 0.0;

	SDL_Surface* zoomSurface = rotozoomSurface(surface, angle, zoom, SMOOTHING_ON);

	return zoomSurface;
}

int JpegImageResizer::resizeImage(const std::string& source, const std::string& dest, int resolution) {
	double zoom = 1.0;

	SDL_Surface* surfaceSource = IMG_Load(source.c_str());
	if (surfaceSource == NULL)
		return -1;

	_LOGDATA("image w %d, h %d, bits per pixel %d", surfaceSource->w, surfaceSource->h, surfaceSource->format->BitsPerPixel);

	int maxDest = resolution;
	int maxSource = surfaceSource->w;
	if (surfaceSource->h > surfaceSource->w)
		maxSource = surfaceSource->h;

	if (maxDest < maxSource) {
		zoom = ((double) maxDest) / ((double) maxSource);
		_LOGDATA("zoom = %f", zoom);
	} else {
		return -1;
	}

	SDL_Surface* s = this->resizeSurface(surfaceSource, zoom);
	SDL_FreeSurface(surfaceSource);

	SDL_Surface* surface = SDL_CreateRGBSurface(SDL_SWSURFACE, s->w, s->h, 24,
	#if SDL_BYTEORDER == SDL_LIL_ENDIAN
		0x000000ff, 0x0000ff00, 0x00ff0000, 0xff000000
	#else
		0xff000000,  0x00ff0000, 0x0000ff00, 0x000000ff
	#endif
	);
	SDL_BlitSurface(s, NULL, surface, NULL);
	SDL_FreeSurface(s);

	_LOGDATA("image w %d, h %d, pitch %d", surface->w, surface->h, surface->pitch);

	if (surface == NULL)
		return -1;

	FILE* fp = fopen(dest.c_str(),"wb");
	if (fp == NULL)
		return -1;

	SDL_LockSurface(surface);
	int img_width = surface->w;
	int img_height = surface->h;
	Uint16 img_pitch = surface->pitch;
	struct jpeg_error_mgr jerr;
	struct jpeg_compress_struct cinfo;

	cinfo.err = jpeg_std_error(&jerr);
	cinfo.err->error_exit = jpegerrmgr_exit;

	jpeg_create_compress(&cinfo);
	cinfo.image_width       = img_width;
	cinfo.image_height      = img_height;
	cinfo.input_components  = 3;
	cinfo.in_color_space    = JCS_RGB;
	jpeg_set_defaults(&cinfo);

	/* Specify data destination for compression */
	jpeg_stdio_dest(&cinfo, fp);
	jpeg_set_quality(&cinfo, IMAGE_QUALITY, FALSE);
	/* Start compressor */
	jpeg_start_compress(&cinfo, TRUE);
	/* Process data */
	JSAMPROW ptr;
	ptr = (JSAMPROW) surface->pixels;

	while(cinfo.next_scanline < cinfo.image_height) {
		// _LOGDATA("%d de %d", cinfo.next_scanline, cinfo.image_height);
		jpeg_write_scanlines(&cinfo, &ptr, 1);
		ptr += img_pitch;
	}
	/* finish compression and release memory */
	jpeg_finish_compress(&cinfo);
	jpeg_destroy_compress(&cinfo);
	fclose(fp);
	SDL_UnlockSurface(surface);
	SDL_FreeSurface(surface);

	return 0;
}

