/*
 * JpegImageResizer.h
 *
 *  Created on: 02/10/2012
 *      Author: Antonio
 */

#ifndef JPEGIMAGERESIZER_H_
#define JPEGIMAGERESIZER_H_

#define IMAGE_QUALITY 75

#include <string>
#include <SDL.h>
extern "C" {
  #include <jpeglib.h>
}

class JpegImageResizer {
private:
	static void jpegerrmgr_exit(j_common_ptr cinfo);
	SDL_Surface* resizeSurface(SDL_Surface* surface, double zoom);
public:
	JpegImageResizer();
	virtual ~JpegImageResizer();

	int resizeImage(const std::string& source, const std::string& dest, int resolution);
};

#endif /* JPEGIMAGERESIZER_H_ */
