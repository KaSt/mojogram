/*
 * ProtocolTreeNode.h
 *
 *  Created on: 26/06/2012
 *      Author: Antonio
 */

#ifndef PROTOCOLTREENODE_H_
#define PROTOCOLTREENODE_H_

#include <string>
#include <vector>
#include <map>

using namespace std;

class ProtocolTreeNode {
public:
	string* data;
	string tag;
	map<string, string> *attributes;
	vector<ProtocolTreeNode*> *children;

	ProtocolTreeNode(const string& tag, map<string, string> *attributes, ProtocolTreeNode* child);
	ProtocolTreeNode(const string& tag, map<string, string> *attributes, string* data = NULL, vector<ProtocolTreeNode*> *children = NULL);
	string toString();
	ProtocolTreeNode* getChild(const string& id);
	ProtocolTreeNode* getChild(size_t id);
	string* getAttributeValue(const string& attribute);

	vector<ProtocolTreeNode*>* getAllChildren();
	vector<ProtocolTreeNode*>* getAllChildren(const string& tag);

	static bool tagEquals(ProtocolTreeNode *node, const string& tag);
	static void require(ProtocolTreeNode *node, const string& tag);

	virtual ~ProtocolTreeNode();
};

#endif /* PROTOCOLTREENODE_H_ */
