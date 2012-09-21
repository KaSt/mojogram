/*
 * ByteArray.h
 *
 *  Created on: 26/06/2012
 *      Author: Antonio
 */



#ifndef BYTEARRAY_H_
#define BYTEARRAY_H_

#include <vector>
#include <string>

class ByteArrayOutputStream {
protected:
	std::vector<unsigned char>* buf;
	size_t count;

public:
	ByteArrayOutputStream(int size = 32);
	void reset();
	std::vector<unsigned char>* toByteArray();
	std::vector<unsigned char>* getBuffer();
	size_t getCount();
	void write(int i);
	void write(unsigned char* c, size_t length);
	void write(const std::string& s);
	void print();

	virtual ~ByteArrayOutputStream();
};

class ByteArrayInputStream {
protected:
	std::vector<unsigned char>* buf;
	size_t pos;
	size_t mark;
	size_t count;

public:
	ByteArrayInputStream(std::vector<unsigned char>* buf,  size_t off, size_t length );
	ByteArrayInputStream(std::vector<unsigned char>* buf);
	int read();
	int read(std::vector<unsigned char>& b, size_t off, size_t length);
	void print();

	virtual ~ByteArrayInputStream();
};

#endif /* BYTEARRAY_H_ */
