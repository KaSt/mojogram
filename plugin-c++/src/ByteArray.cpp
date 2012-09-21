/*
 * ByteArray.cpp
 *
 *  Created on: 26/06/2012
 *      Author: Antonio
 */

#include "ByteArray.h"
#include "WAException.h"
#include <iostream>
#include <algorithm>

ByteArrayOutputStream::ByteArrayOutputStream(int size) {
	this->buf = new std::vector<unsigned char>(size);
	this->count = 0;
}

void ByteArrayOutputStream::reset() {
	this->count = 0;
}

size_t ByteArrayOutputStream::getCount() {
	return this->count;
}

std::vector<unsigned char>* ByteArrayOutputStream::toByteArray() {
	std::vector<unsigned char>* array = new std::vector<unsigned char>(this->count);
	for (size_t i = 0; i < this->count; i++)
		(*array)[i] = (*this->buf)[i];
	return array;
}

std::vector<unsigned char>* ByteArrayOutputStream::getBuffer() {
	return this->buf;
}

void ByteArrayOutputStream::write(int i) {
	size_t newcount = count + 1;
	if (newcount > this->buf->size())
		buf->resize((size_t) std::max(this->buf->size() << 1, newcount));
	(*this->buf)[count] = (unsigned char) i;
	this->count = newcount;
}

void ByteArrayOutputStream::write(unsigned char* b, size_t len) {
	if (len == 0)
		return;

	for (size_t i = 0; i < len; i++)
		write(b[i]);
}

void ByteArrayOutputStream::write(const std::string& s) {
	for (size_t i = 0; i < s.size(); i++)
		write((unsigned char) s[i]);
}


ByteArrayOutputStream::~ByteArrayOutputStream() {
	delete this->buf;
}


ByteArrayInputStream::ByteArrayInputStream(std::vector<unsigned char>* buf,  size_t off, size_t length ) {
	this->buf = buf;
	this->pos = off;
	this->count = std::min(off + length, buf->size());
}

ByteArrayInputStream::ByteArrayInputStream(std::vector<unsigned char>* buf)  {
	this->buf = buf;
	this->pos = 0;
	this->count = buf->size();
}

int ByteArrayInputStream::read() {
	return (pos < count) ? ((*this->buf)[pos++]) : -1;
}

int ByteArrayInputStream::read(std::vector<unsigned char>& b, size_t  off, size_t len) {
	if (len > (b.size() - off)) {
		throw new WAException("Index out of bounds");
	} else if (len == 0) {
		return 0;
	}

	int c = read();
	if (c == -1) {
		return -1;
	}
	b[off] = (unsigned char) c;

	size_t i = 1;
	try {
		for (; i < len ; i++) {
			c = read();
			if (c == -1) {
				break;
			}
			b[off + i] = (unsigned char) c;
		}
	} catch (std::exception& ee) {
	}
	return i;
}

ByteArrayInputStream::~ByteArrayInputStream() {
}

void ByteArrayInputStream::print() {
	std::cout << "[";
	for (size_t i = 0; i < this->count; i++) {
		std::cout << (*this->buf)[i] << " ";
	}
	std::cout << std::endl;
	for (size_t i = 0; i < this->count; i++) {
		std::cout << (int) ((signed char) (*this->buf)[i]) << " ";
	}
	std::cout << "]" << std::endl;
}

void ByteArrayOutputStream::print() {
	std::cout << "[";
	for (size_t i = 0; i < this->count; i++) {
		std::cout << (*this->buf)[i] << " ";
	}
	std::cout << std::endl;
	for (size_t i = 0; i < this->count; i++) {
		std::cout << (int) ((signed char) (*this->buf)[i]) << " ";
	}
	std::cout << "]" << std::endl;
}






