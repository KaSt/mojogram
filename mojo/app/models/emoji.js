/***************************************************************************
 **
 ** Copyright (c) 2012, Tarek Galal <tarek@wazapp.im>
 **
 ** This file is part of Wazapp, an IM application for Meego Harmattan
 ** platform that allows communication with Whatsapp users.
 **
 ** Wazapp is free software: you can redistribute it and/or modify it under
 ** the terms of the GNU General Public License as published by the
 ** Free Software Foundation, either version 2 of the License, or
 ** (at your option) any later version.
 **
 ** Wazapp is distributed in the hope that it will be useful,
 ** but WITHOUT ANY WARRANTY; without even the implied warranty of
 ** MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 ** See the GNU General Public License for more details.
 **
 ** You should have received a copy of the GNU General Public License
 ** along with Wazapp. If not, see http://www.gnu.org/licenses/.
 **
 ****************************************************************************/

/* emojify by brkn and knobtviker */
/* softbank emoji by knobtviker */
/* IOS 6 support by brkn */
/* emoji and emoji_replacer function should be unified/merged */

var prevCode = 0

function decimalToHex(d, padding) {
    var hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
    while (hex.length < padding) {
        hex = "0" + hex;
    }
    //console.log("CODE HEX= "+hex)
    return hex;
}

function ord(string) {
    var str = string + ''
    var code = str.charCodeAt(0);

    //console.log("PROCESSING: " + code + " - PrevCode: " + prevCode)
    if ((code != 0xD83C) && (code != 0xD83D) && (prevCode == 0)) {
        //console.log("OLD EMOJI CODE: "+code)
        prevCode = 0
        return code;
    }

    if (prevCode == 0) {
        //console.log("SAVING PREV CODE: "+code)
        prevCode = code;
        return 0;
    }

    if (prevCode > 0) {
        var hi = prevCode;
        var lo = code;
        if (0xD800 <= hi && hi <= 0xDBFF) {
            prevCode = 0
            //console.log("NEW CODE= "+((hi - 0xD800) * 0x400) + (lo - 0xDC00) + 0x10000)
            return ((hi - 0xD800) * 0x400) + (lo - 0xDC00) + 0x10000;
        }
    }

}

function emojify(stringInput, size) {
    if (!size)
        size = 24;

    prevCode = 0
    var replacedText;
    var regx = /([\ue001-\ue537])/g
    replacedText = stringInput.replace(regx, function(s, eChar) {
        return '<img height="' + size + '" width="' + size + '" src="images/emoji/' + eChar.charCodeAt(0).toString(16).toUpperCase() + '.png" />';
    });

    regx = this.getRegxSingles();
    replacedText = replacedText.replace(regx, function(s, eChar) {
        return '<img height="' + size + '" width="' + size + '" src="images/emoji/' + eChar.charCodeAt(0).toString(16).toUpperCase() + '.png" />';
    });

    // var replaceRegex = /([\u0080-\uFFFF])/g;
    regx = /(\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF])/g;
    return replacedText.replace(regx, function(str, p1) {
        var hi = p1.charCodeAt(0);
        var lo = p1.charCodeAt(1);

        if (0xD800 <= hi && hi <= 0xDBFF) {
            //console.log("NEW CODE= "+((hi - 0xD800) * 0x400) + (lo - 0xDC00) + 0x10000)
            var p = ((hi - 0xD800) * 0x400) + (lo - 0xDC00) + 0x10000;
            var res = decimalToHex(p).toString().toUpperCase();
            var apple = null;
            if (( apple = unicode_to_apple(res)) != null) {
                return '<img height="' + size + '" width="' + size + '" src="images/emoji/' + apple + '.png" />';
            } else {
                // return res.replace(/^([\da-f]+)$/i, '<img height="' + size + '" width="' + size + '" src="images/emoji/$1.png" />');
                return '<img height="' + size + '" width="' + size + '" src="images/emoji/' + res + '.png" />';
            }
        }
        return '';

        // var p = ord(p1.toString(16))
        // if (p > 0) {
        // var res = decimalToHex(p).toString().toUpperCase()
        // if (p > 8252)
        // return res.replace(/^([\da-f]+)$/i, '<img height="' + size + '" width="' + size + '" src="images/emoji/$1.png" />');
        // else
        // return p1;
        // } else {
        // return '';
        // }
    });
}

function emoji_replacer(str, p1) {
    var p = ord(p1.toString(16))
    if (p > 0) {
        var res = decimalToHex(p).toString().toUpperCase()
        if (p > 8252)
            return res.replace(/^([\da-f]+)$/i, '<img src="/opt/waxmppplugin/bin/wazapp/UI/common/images/emoji/20/$1.png" />');
        else
            return p1
    } else {
        return ''
    }
}

function emojify2(stringInput) {//for textArea
    prevCode = 0
    var replacedText;
    var regx = /([\ue001-\ue537])/g
    replacedText = stringInput.replace(regx, function(s, eChar) {
        return '<img src="/opt/waxmppplugin/bin/wazapp/UI/common/images/emoji/24/' + eChar.charCodeAt(0).toString(16).toUpperCase() + '.png">';
    });

    var replaceRegex = /([\u0080-\uFFFF])/g;
    return replacedText.replace(replaceRegex, emoji_replacer2);
}

function emoji_replacer2(str, p1) {
    var p = ord(p1.toString(16))
    if (p > 0) {
        var res = decimalToHex(p).toString().toUpperCase()
        if (p > 8252)
            return res.replace(/^([\da-f]+)$/i, '<img src="/opt/waxmppplugin/bin/wazapp/UI/common/images/emoji/24/$1.png">');
        else
            return p1
    } else {
        return ''
    }
}

function emojifyBig(stringInput) {
    prevCode = 0
    var replacedText;
    var regx = /([\ue001-\ue537])/g
    replacedText = stringInput.replace(regx, function(s, eChar) {
        return '<img src="/opt/waxmppplugin/bin/wazapp/UI/common/images/emoji/32/' + eChar.charCodeAt(0).toString(16).toUpperCase() + '.png" />';
    });

    var replaceRegex = /([\u0080-\uFFFF])/g;
    return replacedText.replace(replaceRegex, emoji_replacer3);
}

function emoji_replacer3(str, p1) {
    var p = ord(p1.toString(16))
    if (p > 0) {
        var res = decimalToHex(p).toString().toUpperCase()
        if (p > 8252)
            return res.replace(/^([\da-f]+)$/i, '<img src="/opt/waxmppplugin/bin/wazapp/UI/common/images/emoji/32/$1.png" />');
        else
            return p1
    } else {
        return ''
    }
}

function getUnicodeCharacter(cp) {
    if (cp >= 0 && cp <= 0xD7FF || cp >= 0xE000 && cp <= 0xFFFF) {
        return [String.fromCharCode(cp), 0];
    } else if (cp >= 0x10000 && cp <= 0x10FFFF) {
        cp -= 0x10000;
        var first = ((0xffc00 & cp) >> 10) + 0xD800
        var second = (0x3ff & cp) + 0xDC00;
        //console.log("RESULT= "+ String.fromCharCode(first) + String.fromCharCode(second))
        return [String.fromCharCode(first) + String.fromCharCode(second), 1];
    }
}

function getCode(inputText) {
    var replacedText;
    var positions = 0;
    var regx = /<img src="\/opt\/waxmppplugin\/bin\/wazapp\/UI\/common\/images\/emoji\/24\/(\w{4,6}).png" \/>/g
    replacedText = inputText.replace(regx, function(s, eChar) {
        var result = getUnicodeCharacter('0x' + eChar);
        var n = result[0]
        positions = positions + result[1]
        return n;
    });
    regx = /<img src="..\/images\/emoji\/24\/(\w{4,6}).png" \/>/g
    replacedText = replacedText.replace(regx, function(s, eChar) {
        var result = getUnicodeCharacter('0x' + eChar);
        var n = result[0]
        positions = positions + result[1]
        return n;
    });
    //console.log("JS: REPLACED TEXT: " + replacedText + " - Chars:" + positions)
    return [replacedText, positions]

}

function getDateText(mydate) {
    var today = new Date();
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    var check = Qt.formatDate(today, "dd-MM-yyyy");
    var check2 = Qt.formatDate(yesterday, "dd-MM-yyyy");
    var str = mydate.slice(0, 10)

    if (str == check)
        return qsTr("Today") + " | " + mydate.slice(11)
    else if (str == check2)
        return qsTr("Yesterday") + " | " + mydate.slice(11)
    else
        return mydate.replace(" ", " | ");
}

/* linkify by @knobtviker */
function linkify(inputText) {
    var replacedText, replacePattern1, replacePattern2, replacePattern3;

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText
}

function getRegxSingles() {
    var result = '([';
    for (var i = 0; i < emoji_code_singles.length; i++) {
        result += '\\u' + emoji_code_singles[i];
    }

    result += "])";
    return new RegExp(result, "g");
}

var emoji_code = ['E415', 'E057', '1F600', 'E056', 'E414', 'E405', 'E106', 'E418', 'E417', '1F617', '1F619', 'E105', 'E409', '1F61B', 'E40D', 'E404', 'E403', 'E40A', 'E40E', 'E058', 'E406', 'E413', 'E412', 'E411', 'E408', 'E401', 'E40F', '1F605', 'E108', '1F629', '1F62B', 'E40B', 'E107', 'E059', 'E416', '1F624', 'E407', '1F606', '1F60B', 'E40C', '1F60E', '1F634', '1F635', 'E410', '1F61F', '1F626', '1F627', '1F608', 'E11A', '1F62E', '1F62C', '1F610', '1F615', '1F62F', '1F636', '1F607', 'E402', '1F611', 'E516', 'E517', 'E152', 'E51B', 'E51E', 'E51A', 'E001', 'E002', 'E004', 'E005', 'E518', 'E519', 'E515', 'E04E', 'E51C', '1F63A', '1F638', '1F63B', '1F63D', '1F63C', '1F640', '1F63F', '1F639', '1F63E', '1F479', '1F47A', '1F648', '1F649', '1F64A', 'E11C', 'E10C', 'E05A', 'E11D', 'E32E', 'E335', '1F4AB', '1F4A5', 'E334', 'E331', '1F4A7', 'E13C', 'E330', 'E41B', 'E419', 'E41A', '1F445', 'E41C', 'E00E', 'E421', 'E420', 'E00D', 'E010', 'E011', 'E41E', 'E012', 'E422', 'E22E', 'E22F', 'E231', 'E230', 'E427', 'E41D', 'E00F', 'E41F', 'E14C', 'E201', 'E115', 'E51F', 'E428', '1F46A', '1F46C', '1F46D', 'E111', 'E425', 'E429', 'E424', 'E423', 'E253', '1F64B', 'E31E', 'E31F', 'E31D', '1F470', '1F64E', '1F64D', 'E426', 'E503', 'E10E', 'E318', 'E007', '1F45E', 'E31A', 'E13E', 'E31B', 'E006', 'E302', '1F45A', 'E319', '1F3BD', '1F456', 'E321', 'E322', 'E11E', 'E323', '1F45D', '1F45B', '1F453', 'E314', 'E43C', 'E31C', 'E32C', 'E32A', 'E32D', 'E32B', 'E022', 'E023', 'E328', 'E327', '1F495', '1F496', '1F49E', 'E329', '1F48C', 'E003', 'E034', 'E035', '1F464', '1F465', '1F4AC', 'E536', '1F4AD', 'E052', 'E52A', 'E04F', 'E053', 'E524', 'E52C', 'E531', 'E050', 'E527', 'E051', 'E10B', '1F43D', 'E52B', 'E52F', 'E109', 'E528', 'E01A', 'E529', 'E526', '1F43C', 'E055', 'E521', 'E523', '1F425', '1F423', 'E52E', 'E52D', '1F422', 'E525', '1F41D', '1F41C', '1F41E', '1F40C', 'E10A', 'E441', 'E522', 'E019', 'E520', 'E054', '1F40B', '1F404', '1F40F', '1F400', '1F403', '1F405', '1F407', '1F409', 'E134', '1F410', '1F413', '1F415', '1F416', '1F401', '1F402', '1F432', '1F421', '1F40A', 'E530', '1F42A', '1F406', '1F408', '1F429', '1F43E', 'E306', 'E030', 'E304', 'E110', 'E032', 'E305', 'E303', 'E118', 'E447', 'E119', '1F33F', 'E444', '1F344', 'E308', 'E307', '1F332', '1F333', '1F330', '1F331', '1F33C', '1F310', '1F31E', '1F31D', '1F31A', '1F311', '1F312', '1F313', '1F314', '1F315', '1F316', '1F317', '1F318', '1F31C', '1F31B', 'E04C', '1F30D', '1F30E', '1F30F', '1F30B', '1F30C', '1F320', 'E32F', 'E04A', '26C5', 'E049', 'E13D', 'E04B', '2744', 'E048', 'E443', '1F301', 'E44C', 'E43E', 'E436', 'E437', 'E438', 'E43A', 'E439', 'E43B', 'E117', 'E440', 'E442', 'E446', 'E445', 'E11B', 'E448', 'E033', 'E112', '1F38B', 'E312', '1F38A', 'E310', 'E143', '1F52E', 'E03D', 'E008', '1F4F9', 'E129', 'E126', 'E127', 'E316', '1F4BE', 'E00C', 'E00A', 'E009', '1F4DE', '1F4DF', 'E00B', 'E14B', 'E12A', 'E128', 'E141', '1F509', '1F508', '1F507', 'E325', '1F515', 'E142', 'E317', '23F3', '231B', '23F0', '231A', 'E145', 'E144', '1F50F', '1F510', 'E03F', '1F50E', 'E10F', '1F526', '1F506', '1F505', '1F50C', '1F50B', 'E114', '1F6C1', 'E13F', '1F6BF', 'E140', '1F527', '1F529', 'E116', '1F6AA', 'E30E', 'E311', 'E113', '1F52A', 'E30F', 'E13B', 'E12F', '1F4B4', '1F4B5', '1F4B7', '1F4B6', '1F4B3', '1F4B8', 'E104', '1F4E7', '1F4E5', '1F4E4', '2709', 'E103', '1F4E8', '1F4EF', 'E101', '1F4EA', '1F4EC', '1F4ED', 'E102', '1F4E6', 'E301', '1F4C4', '1F4C3', '1F4D1', '1F4CA', '1F4C8', '1F4C9', '1F4DC', '1F4CB', '1F4C5', '1F4C6', '1F4C7', '1F4C1', '1F4C2', 'E313', '1F4CC', '1F4CE', '2712', '270F', '1F4CF', '1F4D0', '1F4D5', '1F4D7', '1F4D8', '1F4D9', '1F4D3', '1F4D4', '1F4D2', '1F4DA', 'E148', '1F516', '1F4DB', '1F52C', '1F52D', '1F4F0', 'E502', 'E324', 'E03C', 'E30A', '1F3BC', 'E03E', 'E326', '1F3B9', '1F3BB', 'E042', 'E040', 'E041', 'E12B', '1F3AE', '1F0CF', '1F3B4', 'E12D', '1F3B2', 'E130', 'E42B', 'E42A', 'E018', 'E016', 'E015', 'E42C', '1F3C9', '1F3B3', 'E014', '1F6B5', '1F6B4', 'E132', '1F3C7', 'E131', 'E013', '1F3C2', 'E42D', 'E017', '1F3A3', 'E045', 'E338', 'E30B', '1F37C', 'E047', 'E30C', 'E044', '1F379', '1F377', 'E043', '1F355', 'E120', 'E33B', '1F357', '1F356', 'E33F', 'E341', '1F364', 'E34C', 'E344', '1F365', 'E342', 'E33D', 'E33E', 'E340', 'E34D', 'E343', 'E33C', 'E147', 'E339', '1F369', '1F36E', 'E33A', '1F368', 'E43F', 'E34B', 'E046', '1F36A', '1F36B', '1F36C', '1F36D', '1F36F', 'E345', '1F34F', 'E346', '1F34B', '1F352', '1F347', 'E348', 'E347', '1F351', '1F348', '1F34C', '1F350', '1F34D', '1F360', 'E34A', 'E349', '1F33D', 'E036', '1F3E1', 'E157', 'E038', 'E153', 'E155', 'E14D', 'E156', 'E501', 'E158', 'E43D', 'E037', 'E504', '1F3E4', 'E44A', 'E146', 'E505', 'E506', 'E122', 'E508', 'E509', '1F5FE', 'E03B', 'E04D', 'E449', 'E44B', 'E51D', '1F309', '1F3A0', 'E124', 'E121', 'E433', 'E202', 'E01C', 'E135', '1F6A3', '2693', 'E10D', 'E01D', 'E11F', '1F681', '1F682', '1F68A', 'E039', '1F69E', '1F686', 'E435', 'E01F', '1F688', 'E434', '1F69D', 'E01E', '1F68B', '1F68E', 'E159', '1F68D', 'E42E', '1F698', 'E01B', 'E15A', '1F696', '1F69B', 'E42F', '1F6A8', 'E432', '1F694', 'E430', 'E431', '1F690', 'E136', '1F6A1', '1F69F', '1F6A0', '1F69C', 'E320', 'E150', 'E125', '1F6A6', 'E14E', 'E252', 'E137', 'E209', 'E03A', '1F3EE', 'E133', 'E123', '1F5FF', '1F3AA', '1F3AD', '1F4CD', '1F6A9', 'E50B', 'E514', 'E50E', 'E513', 'E50C', 'E50D', 'E511', 'E50F', 'E512', 'E510', 'E50A', 'E21C', 'E21D', 'E21E', 'E21F', 'E220', 'E221', 'E222', 'E223', 'E224', 'E225', '1F51F', '1F522', 'E210', '1F523', 'E232', 'E233', 'E235', 'E234', '1F520', '1F521', '1F524', 'E236', 'E237', 'E238', 'E239', '2194', '2195', '1F504', 'E23B', 'E23A', '1F53C', '1F53D', '21A9', '21AA', '2139', 'E23D', 'E23C', '23EB', '23EC', '2935', '2934', 'E24D', '1F500', '1F501', '1F502', 'E212', 'E213', 'E214', '1F193', '1F196', 'E20B', 'E507', 'E203', 'E22C', 'E22B', 'E22A', '1F234', '1F232', 'E226', 'E227', 'E22D', 'E215', 'E216', 'E151', 'E138', 'E139', 'E13A', 'E309', '1F6B0', '1F6AE', 'E14F', 'E20A', 'E208', 'E217', 'E218', 'E228', '24C2', '1F6C2', '1F6C4', '1F6C5', '1F6C3', '1F251', 'E315', 'E30D', '1F191', '1F198', 'E229', '1F6AB', 'E207', '1F4F5', '1F6AF', '1F6B1', '1F6B3', '1F6B7', '1F6B8', '26D4', 'E206', '2747', '274E', '2705', 'E205', 'E204', 'E12E', 'E250', 'E251', 'E532', 'E533', 'E534', 'E535', '1F4A0', 'E211', '267B', 'E23F', 'E240', 'E241', 'E242', 'E243', 'E244', 'E245', 'E246', 'E247', 'E248', 'E249', 'E24A', 'E24B', 'E23E', 'E154', 'E14A', '1F4B2', 'E149', 'E24E', 'E24F', 'E537', 'E12C', '3030', 'E24C', '1F51A', '1F519', '1F51B', '1F51C', 'E333', 'E332', 'E021', 'E020', 'E337', 'E336', '1F503', 'E02F', '1F567', 'E024', '1F55C', 'E025', '1F55D', 'E026', '1F55E', 'E027', '1F55F', 'E028', '1F560', 'E029', 'E02A', 'E02B', 'E02C', 'E02D', 'E02E', '1F561', '1F562', '1F563', '1F564', '1F565', '1F566', '2716', '2795', '2796', '2797', 'E20E', 'E20C', 'E20F', 'E20D', '1F4AE', '1F4AF', '2714', '2611', '1F518', '1F517', '27B0', 'E031', 'E21A', 'E21B', '2B1B', '2B1C', '25FE', '25FD', '25AA', '25AB', '1F53A', '25FB', '25FC', '26AB', '26AA', 'E219', '1F535', '1F53B', '1F536', '1F537', '1F538', '1F539', '2049', '203C'];
var emoji_code_singles = ['203C', '21AA', '23F3', '25FD', '26AB', '2712', '2795', '2B1B', '2049', '231A', '24C2', '25FE', '26C5', '2714', '2796', '2B1C', '2139', '231B', '25AA', '2611', '26D4', '2716', '2797', '2194', '23EB', '25AB', '267B', '2705', '2744', '27B0', '2195', '23EC', '25FB', '2693', '2709', '2747', '2934', '21A9', '23F0', '25FC', '26AA', '270F', '274E', '2935', '3030'];

function newlinefy(inputText) {
    var replacedText, replacePattern1;

    replacePattern1 = /\n/g;
    replacedText = inputText.replace(replacePattern1, '<br/>');

    return replacedText
}

function convertUtf16CodesToString(utf16_codes) {
    var unescaped = '';
    for (var i = 0; i < utf16_codes.length; ++i) {
        unescaped += String.fromCharCode(utf16_codes[i]);
    }
    return unescaped;
}

function convertUnicodeCodePointsToUtf16Codes(unicode_codes) {
    var utf16_codes = [];
    for (var i = 0; i < unicode_codes.length; ++i) {
        var unicode_code = unicode_codes[i];
        if (unicode_code < (1 << 16)) {
            utf16_codes.push(unicode_code);
        } else {
            var first = Math.floor(((unicode_code - (1 << 16)) / (1 << 10))) + 0xD800;
            var second = (unicode_code % (1 << 10)) + 0xDC00;
            utf16_codes.push(first);
            utf16_codes.push(second);
        }
    }
    return utf16_codes;
}

function convertUnicodeCodePointsToString(unicode_codes) {
    var utf16_codes = convertUnicodeCodePointsToUtf16Codes(unicode_codes);
    return convertUtf16CodesToString(utf16_codes);
}

function unicode_to_apple(unicode) {
    for (var i = 0; i < emoji_unicode_to_apple.length; i++) {
        if (emoji_unicode_to_apple[i].unicode == unicode)
            return emoji_unicode_to_apple[i].apple;
    }

    return null;
}

var emoji_unicode_to_apple = [{
    unicode : "1F466",
    apple : "E001"
}, {
    unicode : "1F467",
    apple : "E002"
}, {
    unicode : "1F48B",
    apple : "E003"
}, {
    unicode : "1F468",
    apple : "E004"
}, {
    unicode : "1F469",
    apple : "E005"
}, {
    unicode : "1F455",
    apple : "E006"
}, {
    unicode : "1F45A",
    apple : "E006"
}, {
    unicode : "1F45F",
    apple : "E007"
}, {
    unicode : "1F4F7",
    apple : "E008"
}, {
    unicode : "260E",
    apple : "E009"
}, {
    unicode : "1F4F1",
    apple : "E00A"
}, {
    unicode : "1F4E0",
    apple : "E00B"
}, {
    unicode : "1F4BB",
    apple : "E00C"
}, {
    unicode : "1F44A",
    apple : "E00D"
}, {
    unicode : "1F44D",
    apple : "E00E"
}, {
    unicode : "261D",
    apple : "E00F"
}, {
    unicode : "270A",
    apple : "E010"
}, {
    unicode : "270C",
    apple : "E011"
}, {
    unicode : "270B",
    apple : "E012"
}, {
    unicode : "1F3BF",
    apple : "E013"
}, {
    unicode : "26F3",
    apple : "E014"
}, {
    unicode : "1F3BE",
    apple : "E015"
}, {
    unicode : "26BE",
    apple : "E016"
}, {
    unicode : "1F3C4",
    apple : "E017"
}, {
    unicode : "26BD",
    apple : "E018"
}, {
    unicode : "1F41F",
    apple : "E019"
}, {
    unicode : "1F434",
    apple : "E01A"
}, {
    unicode : "1F697",
    apple : "E01B"
}, {
    unicode : "26F5",
    apple : "E01C"
}, {
    unicode : "2708",
    apple : "E01D"
}, {
    unicode : "1F683",
    apple : "E01E"
}, {
    unicode : "1F685",
    apple : "E01F"
}, {
    unicode : "2753",
    apple : "E020"
}, {
    unicode : "2757",
    apple : "E021"
}, {
    unicode : "2764",
    apple : "E022"
}, {
    unicode : "1F494",
    apple : "E023"
}, {
    unicode : "1F550",
    apple : "E024"
}, {
    unicode : "1F551",
    apple : "E025"
}, {
    unicode : "1F552",
    apple : "E026"
}, {
    unicode : "1F553",
    apple : "E027"
}, {
    unicode : "1F554",
    apple : "E028"
}, {
    unicode : "1F555",
    apple : "E029"
}, {
    unicode : "1F556",
    apple : "E02A"
}, {
    unicode : "1F557",
    apple : "E02B"
}, {
    unicode : "1F558",
    apple : "E02C"
}, {
    unicode : "1F559",
    apple : "E02D"
}, {
    unicode : "1F55A",
    apple : "E02E"
}, {
    unicode : "1F55B",
    apple : "E02F"
}, {
    unicode : "1F338",
    apple : "E030"
}, {
    unicode : "1F531",
    apple : "E031"
}, {
    unicode : "1F339",
    apple : "E032"
}, {
    unicode : "1F384",
    apple : "E033"
}, {
    unicode : "1F48D",
    apple : "E034"
}, {
    unicode : "1F48E",
    apple : "E035"
}, {
    unicode : "1F3E0",
    apple : "E036"
}, {
    unicode : "26EA",
    apple : "E037"
}, {
    unicode : "1F3E2",
    apple : "E038"
}, {
    unicode : "1F689",
    apple : "E039"
}, {
    unicode : "26FD",
    apple : "E03A"
}, {
    unicode : "1F5FB",
    apple : "E03B"
}, {
    unicode : "1F3A4",
    apple : "E03C"
}, {
    unicode : "1F3A5",
    apple : "E03D"
}, {
    unicode : "1F3B5",
    apple : "E03E"
}, {
    unicode : "1F511",
    apple : "E03F"
}, {
    unicode : "1F3B7",
    apple : "E040"
}, {
    unicode : "1F3B8",
    apple : "E041"
}, {
    unicode : "1F3BA",
    apple : "E042"
}, {
    unicode : "1F374",
    apple : "E043"
}, {
    unicode : "1F378",
    apple : "E044"
}, {
    unicode : "2615",
    apple : "E045"
}, {
    unicode : "1F370",
    apple : "E046"
}, {
    unicode : "1F37A",
    apple : "E047"
}, {
    unicode : "26C4",
    apple : "E048"
}, {
    unicode : "2601",
    apple : "E049"
}, {
    unicode : "2600",
    apple : "E04A"
}, {
    unicode : "2614",
    apple : "E04B"
}, {
    unicode : "1F319",
    apple : "E04C"
}, {
    unicode : "1F304",
    apple : "E04D"
}, {
    unicode : "1F47C",
    apple : "E04E"
}, {
    unicode : "1F431",
    apple : "E04F"
}, {
    unicode : "1F42F",
    apple : "E050"
}, {
    unicode : "1F43B",
    apple : "E051"
}, {
    unicode : "1F436",
    apple : "E052"
}, {
    unicode : "1F42D",
    apple : "E053"
}, {
    unicode : "1F433",
    apple : "E054"
}, {
    unicode : "1F427",
    apple : "E055"
}, {
    unicode : "1F60A",
    apple : "E056"
}, {
    unicode : "1F603",
    apple : "E057"
}, {
    unicode : "1F61E",
    apple : "E058"
}, {
    unicode : "1F620",
    apple : "E059"
}, {
    unicode : "1F4A9",
    apple : "E05A"
}, {
    unicode : "1F4EB",
    apple : "E101"
}, {
    unicode : "1F4EE",
    apple : "E102"
}, {
    unicode : "1F4E9",
    apple : "E103"
}, {
    unicode : "1F4F2",
    apple : "E104"
}, {
    unicode : "1F61C",
    apple : "E105"
}, {
    unicode : "1F60D",
    apple : "E106"
}, {
    unicode : "1F631",
    apple : "E107"
}, {
    unicode : "1F613",
    apple : "E108"
}, {
    unicode : "1F435",
    apple : "E109"
}, {
    unicode : "1F419",
    apple : "E10A"
}, {
    unicode : "1F437",
    apple : "E10B"
}, {
    unicode : "1F47D",
    apple : "E10C"
}, {
    unicode : "1F680",
    apple : "E10D"
}, {
    unicode : "1F451",
    apple : "E10E"
}, {
    unicode : "1F4A1",
    apple : "E10F"
}, {
    unicode : "1F340",
    apple : "E110"
}, {
    unicode : "1F48F",
    apple : "E111"
}, {
    unicode : "1F381",
    apple : "E112"
}, {
    unicode : "1F52B",
    apple : "E113"
}, {
    unicode : "1F50D",
    apple : "E114"
}, {
    unicode : "1F3C3",
    apple : "E115"
}, {
    unicode : "1F528",
    apple : "E116"
}, {
    unicode : "1F386",
    apple : "E117"
}, {
    unicode : "1F341",
    apple : "E118"
}, {
    unicode : "1F342",
    apple : "E119"
}, {
    unicode : "1F47F",
    apple : "E11A"
}, {
    unicode : "1F47B",
    apple : "E11B"
}, {
    unicode : "1F480",
    apple : "E11C"
}, {
    unicode : "1F525",
    apple : "E11D"
}, {
    unicode : "1F4BC",
    apple : "E11E"
}, {
    unicode : "1F4BA",
    apple : "E11F"
}, {
    unicode : "1F354",
    apple : "E120"
}, {
    unicode : "26F2",
    apple : "E121"
}, {
    unicode : "26FA",
    apple : "E122"
}, {
    unicode : "2668",
    apple : "E123"
}, {
    unicode : "1F3A1",
    apple : "E124"
}, {
    unicode : "1F3AB",
    apple : "E125"
}, {
    unicode : "1F4BF",
    apple : "E126"
}, {
    unicode : "1F4C0",
    apple : "E127"
}, {
    unicode : "1F4FB",
    apple : "E128"
}, {
    unicode : "1F4FC",
    apple : "E129"
}, {
    unicode : "1F4FA",
    apple : "E12A"
}, {
    unicode : "1F47E",
    apple : "E12B"
}, {
    unicode : "303D",
    apple : "E12C"
}, {
    unicode : "1F004",
    apple : "E12D"
}, {
    unicode : "1F19A",
    apple : "E12E"
}, {
    unicode : "1F4B0",
    apple : "E12F"
}, {
    unicode : "1F3AF",
    apple : "E130"
}, {
    unicode : "1F3C6",
    apple : "E131"
}, {
    unicode : "1F3C1",
    apple : "E132"
}, {
    unicode : "1F3B0",
    apple : "E133"
}, {
    unicode : "1F40E",
    apple : "E134"
}, {
    unicode : "1F6A4",
    apple : "E135"
}, {
    unicode : "1F6B2",
    apple : "E136"
}, {
    unicode : "1F6A7",
    apple : "E137"
}, {
    unicode : "1F6B9",
    apple : "E138"
}, {
    unicode : "1F6BA",
    apple : "E139"
}, {
    unicode : "1F6BC",
    apple : "E13A"
}, {
    unicode : "1F489",
    apple : "E13B"
}, {
    unicode : "1F4A4",
    apple : "E13C"
}, {
    unicode : "26A1",
    apple : "E13D"
}, {
    unicode : "1F460",
    apple : "E13E"
}, {
    unicode : "1F6C0",
    apple : "E13F"
}, {
    unicode : "1F6BD",
    apple : "E140"
}, {
    unicode : "1F50A",
    apple : "E141"
}, {
    unicode : "1F4E2",
    apple : "E142"
}, {
    unicode : "1F38C",
    apple : "E143"
}, {
    unicode : "1F512",
    apple : "E144"
}, {
    unicode : "1F513",
    apple : "E145"
}, {
    unicode : "1F306",
    apple : "E146"
}, {
    unicode : "1F373",
    apple : "E147"
}, {
    unicode : "1F4D3",
    apple : "E148"
}, {
    unicode : "1F4B1",
    apple : "E149"
}, {
    unicode : "1F4B9",
    apple : "E14A"
}, {
    unicode : "1F4E1",
    apple : "E14B"
}, {
    unicode : "1F4AA",
    apple : "E14C"
}, {
    unicode : "1F3E6",
    apple : "E14D"
}, {
    unicode : "1F6A5",
    apple : "E14E"
}, {
    unicode : "1F17F",
    apple : "E14F"
}, {
    unicode : "1F68F",
    apple : "E150"
}, {
    unicode : "1F6BB",
    apple : "E151"
}, {
    unicode : "1F46E",
    apple : "E152"
}, {
    unicode : "1F3E3",
    apple : "E153"
}, {
    unicode : "1F3E7",
    apple : "E154"
}, {
    unicode : "1F3E5",
    apple : "E155"
}, {
    unicode : "1F3EA",
    apple : "E156"
}, {
    unicode : "1F3EB",
    apple : "E157"
}, {
    unicode : "1F3E8",
    apple : "E158"
}, {
    unicode : "1F68C",
    apple : "E159"
}, {
    unicode : "1F695",
    apple : "E15A"
}, {
    unicode : "1F6B6",
    apple : "E201"
}, {
    unicode : "1F6A2",
    apple : "E202"
}, {
    unicode : "1F201",
    apple : "E203"
}, {
    unicode : "1F49F",
    apple : "E204"
}, {
    unicode : "2734",
    apple : "E205"
}, {
    unicode : "2733",
    apple : "E206"
}, {
    unicode : "1F51E",
    apple : "E207"
}, {
    unicode : "1F6AD",
    apple : "E208"
}, {
    unicode : "1F530",
    apple : "E209"
}, {
    unicode : "267F",
    apple : "E20A"
}, {
    unicode : "1F4F6",
    apple : "E20B"
}, {
    unicode : "2665",
    apple : "E20C"
}, {
    unicode : "2666",
    apple : "E20D"
}, {
    unicode : "2660",
    apple : "E20E"
}, {
    unicode : "2663",
    apple : "E20F"
}, {
    unicode : "27BF",
    apple : "E211"
}, {
    unicode : "1F195",
    apple : "E212"
}, {
    unicode : "1F199",
    apple : "E213"
}, {
    unicode : "1F192",
    apple : "E214"
}, {
    unicode : "1F236",
    apple : "E215"
}, {
    unicode : "1F21A",
    apple : "E216"
}, {
    unicode : "1F237",
    apple : "E217"
}, {
    unicode : "1F238",
    apple : "E218"
}, {
    unicode : "1F534",
    apple : "E219"
}, {
    unicode : "1F532",
    apple : "E21A"
}, {
    unicode : "1F533",
    apple : "E21B"
}, {
    unicode : "1F250",
    apple : "E226"
}, {
    unicode : "1F239",
    apple : "E227"
}, {
    unicode : "1F202",
    apple : "E228"
}, {
    unicode : "1F194",
    apple : "E229"
}, {
    unicode : "1F235",
    apple : "E22A"
}, {
    unicode : "1F233",
    apple : "E22B"
}, {
    unicode : "1F22F",
    apple : "E22C"
}, {
    unicode : "1F23A",
    apple : "E22D"
}, {
    unicode : "1F446",
    apple : "E22E"
}, {
    unicode : "1F447",
    apple : "E22F"
}, {
    unicode : "1F448",
    apple : "E230"
}, {
    unicode : "1F449",
    apple : "E231"
}, {
    unicode : "2B06",
    apple : "E232"
}, {
    unicode : "2B07",
    apple : "E233"
}, {
    unicode : "27A1",
    apple : "E234"
}, {
    unicode : "2B05",
    apple : "E235"
}, {
    unicode : "2197",
    apple : "E236"
}, {
    unicode : "2196",
    apple : "E237"
}, {
    unicode : "2198",
    apple : "E238"
}, {
    unicode : "2199",
    apple : "E239"
}, {
    unicode : "25B6",
    apple : "E23A"
}, {
    unicode : "25C0",
    apple : "E23B"
}, {
    unicode : "23E9",
    apple : "E23C"
}, {
    unicode : "23EA",
    apple : "E23D"
}, {
    unicode : "2648",
    apple : "E23F"
}, {
    unicode : "2649",
    apple : "E240"
}, {
    unicode : "264A",
    apple : "E241"
}, {
    unicode : "264B",
    apple : "E242"
}, {
    unicode : "264C",
    apple : "E243"
}, {
    unicode : "264D",
    apple : "E244"
}, {
    unicode : "264E",
    apple : "E245"
}, {
    unicode : "264F",
    apple : "E246"
}, {
    unicode : "2650",
    apple : "E247"
}, {
    unicode : "2651",
    apple : "E248"
}, {
    unicode : "2652",
    apple : "E249"
}, {
    unicode : "2653",
    apple : "E24A"
}, {
    unicode : "26CE",
    apple : "E24B"
}, {
    unicode : "1F51D",
    apple : "E24C"
}, {
    unicode : "1F197",
    apple : "E24D"
}, {
    unicode : "00A9",
    apple : "E24E"
}, {
    unicode : "00AE",
    apple : "E24F"
}, {
    unicode : "1F4F3",
    apple : "E250"
}, {
    unicode : "1F4F4",
    apple : "E251"
}, {
    unicode : "26A0",
    apple : "E252"
}, {
    unicode : "1F481",
    apple : "E253"
}, {
    unicode : "1F4DD",
    apple : "E301"
}, {
    unicode : "1F454",
    apple : "E302"
}, {
    unicode : "1F33A",
    apple : "E303"
}, {
    unicode : "1F337",
    apple : "E304"
}, {
    unicode : "1F33B",
    apple : "E305"
}, {
    unicode : "1F490",
    apple : "E306"
}, {
    unicode : "1F334",
    apple : "E307"
}, {
    unicode : "1F335",
    apple : "E308"
}, {
    unicode : "1F6BE",
    apple : "E309"
}, {
    unicode : "1F3A7",
    apple : "E30A"
}, {
    unicode : "1F376",
    apple : "E30B"
}, {
    unicode : "1F37B",
    apple : "E30C"
}, {
    unicode : "3297",
    apple : "E30D"
}, {
    unicode : "1F6AC",
    apple : "E30E"
}, {
    unicode : "1F48A",
    apple : "E30F"
}, {
    unicode : "1F388",
    apple : "E310"
}, {
    unicode : "1F4A3",
    apple : "E311"
}, {
    unicode : "1F389",
    apple : "E312"
}, {
    unicode : "2702",
    apple : "E313"
}, {
    unicode : "1F380",
    apple : "E314"
}, {
    unicode : "3299",
    apple : "E315"
}, {
    unicode : "1F4BD",
    apple : "E316"
}, {
    unicode : "1F4E3",
    apple : "E317"
}, {
    unicode : "1F452",
    apple : "E318"
}, {
    unicode : "1F457",
    apple : "E319"
}, {
    unicode : "1F461",
    apple : "E31A"
}, {
    unicode : "1F462",
    apple : "E31B"
}, {
    unicode : "1F484",
    apple : "E31C"
}, {
    unicode : "1F485",
    apple : "E31D"
}, {
    unicode : "1F486",
    apple : "E31E"
}, {
    unicode : "1F487",
    apple : "E31F"
}, {
    unicode : "1F488",
    apple : "E320"
}, {
    unicode : "1F458",
    apple : "E321"
}, {
    unicode : "1F459",
    apple : "E322"
}, {
    unicode : "1F45C",
    apple : "E323"
}, {
    unicode : "1F3AC",
    apple : "E324"
}, {
    unicode : "1F514",
    apple : "E325"
}, {
    unicode : "1F3B6",
    apple : "E326"
}, {
    unicode : "1F493",
    apple : "E327"
}, {
    unicode : "1F497",
    apple : "E328"
}, {
    unicode : "1F498",
    apple : "E329"
}, {
    unicode : "1F499",
    apple : "E32A"
}, {
    unicode : "1F49A",
    apple : "E32B"
}, {
    unicode : "1F49B",
    apple : "E32C"
}, {
    unicode : "1F49C",
    apple : "E32D"
}, {
    unicode : "2728",
    apple : "E32E"
}, {
    unicode : "2747",
    apple : "E32E"
}, {
    unicode : "2B50",
    apple : "E32F"
}, {
    unicode : "1F4A8",
    apple : "E330"
}, {
    unicode : "1F4A6",
    apple : "E331"
}, {
    unicode : "2B55",
    apple : "E332"
}, {
    unicode : "274C",
    apple : "E333"
}, {
    unicode : "1F4A2",
    apple : "E334"
}, {
    unicode : "1F31F",
    apple : "E335"
}, {
    unicode : "2754",
    apple : "E336"
}, {
    unicode : "2755",
    apple : "E337"
}, {
    unicode : "1F375",
    apple : "E338"
}, {
    unicode : "1F35E",
    apple : "E339"
}, {
    unicode : "1F366",
    apple : "E33A"
}, {
    unicode : "1F35F",
    apple : "E33B"
}, {
    unicode : "1F361",
    apple : "E33C"
}, {
    unicode : "1F358",
    apple : "E33D"
}, {
    unicode : "1F35A",
    apple : "E33E"
}, {
    unicode : "1F35D",
    apple : "E33F"
}, {
    unicode : "1F35C",
    apple : "E340"
}, {
    unicode : "1F35B",
    apple : "E341"
}, {
    unicode : "1F359",
    apple : "E342"
}, {
    unicode : "1F362",
    apple : "E343"
}, {
    unicode : "1F363",
    apple : "E344"
}, {
    unicode : "1F34E",
    apple : "E345"
}, {
    unicode : "1F34A",
    apple : "E346"
}, {
    unicode : "1F353",
    apple : "E347"
}, {
    unicode : "1F349",
    apple : "E348"
}, {
    unicode : "1F345",
    apple : "E349"
}, {
    unicode : "1F346",
    apple : "E34A"
}, {
    unicode : "1F382",
    apple : "E34B"
}, {
    unicode : "1F371",
    apple : "E34C"
}, {
    unicode : "1F372",
    apple : "E34D"
}, {
    unicode : "1F625",
    apple : "E401"
}, {
    unicode : "1F60F",
    apple : "E402"
}, {
    unicode : "1F614",
    apple : "E403"
}, {
    unicode : "1F601",
    apple : "E404"
}, {
    unicode : "1F609",
    apple : "E405"
}, {
    unicode : "1F623",
    apple : "E406"
}, {
    unicode : "1F616",
    apple : "E407"
}, {
    unicode : "1F62A",
    apple : "E408"
}, {
    unicode : "1F61D",
    apple : "E409"
}, {
    unicode : "1F60C",
    apple : "E40A"
}, {
    unicode : "1F628",
    apple : "E40B"
}, {
    unicode : "1F637",
    apple : "E40C"
}, {
    unicode : "1F633",
    apple : "E40D"
}, {
    unicode : "1F612",
    apple : "E40E"
}, {
    unicode : "1F630",
    apple : "E40F"
}, {
    unicode : "1F632",
    apple : "E410"
}, {
    unicode : "1F62D",
    apple : "E411"
}, {
    unicode : "1F602",
    apple : "E412"
}, {
    unicode : "1F622",
    apple : "E413"
}, {
    unicode : "263A",
    apple : "E414"
}, {
    unicode : "1F604",
    apple : "E415"
}, {
    unicode : "1F621",
    apple : "E416"
}, {
    unicode : "1F61A",
    apple : "E417"
}, {
    unicode : "1F618",
    apple : "E418"
}, {
    unicode : "1F440",
    apple : "E419"
}, {
    unicode : "1F443",
    apple : "E41A"
}, {
    unicode : "1F442",
    apple : "E41B"
}, {
    unicode : "1F444",
    apple : "E41C"
}, {
    unicode : "1F64F",
    apple : "E41D"
}, {
    unicode : "1F44B",
    apple : "E41E"
}, {
    unicode : "1F44F",
    apple : "E41F"
}, {
    unicode : "1F44C",
    apple : "E420"
}, {
    unicode : "1F44E",
    apple : "E421"
}, {
    unicode : "1F450",
    apple : "E422"
}, {
    unicode : "1F645",
    apple : "E423"
}, {
    unicode : "1F646",
    apple : "E424"
}, {
    unicode : "1F491",
    apple : "E425"
}, {
    unicode : "1F647",
    apple : "E426"
}, {
    unicode : "1F64C",
    apple : "E427"
}, {
    unicode : "1F46B",
    apple : "E428"
}, {
    unicode : "1F46F",
    apple : "E429"
}, {
    unicode : "1F3C0",
    apple : "E42A"
}, {
    unicode : "1F3C8",
    apple : "E42B"
}, {
    unicode : "1F3B1",
    apple : "E42C"
}, {
    unicode : "1F3CA",
    apple : "E42D"
}, {
    unicode : "1F699",
    apple : "E42E"
}, {
    unicode : "1F69A",
    apple : "E42F"
}, {
    unicode : "1F692",
    apple : "E430"
}, {
    unicode : "1F691",
    apple : "E431"
}, {
    unicode : "1F693",
    apple : "E432"
}, {
    unicode : "1F3A2",
    apple : "E433"
}, {
    unicode : "1F687",
    apple : "E434"
}, {
    unicode : "1F684",
    apple : "E435"
}, {
    unicode : "1F38D",
    apple : "E436"
}, {
    unicode : "1F49D",
    apple : "E437"
}, {
    unicode : "1F38E",
    apple : "E438"
}, {
    unicode : "1F393",
    apple : "E439"
}, {
    unicode : "1F392",
    apple : "E43A"
}, {
    unicode : "1F38F",
    apple : "E43B"
}, {
    unicode : "1F302",
    apple : "E43C"
}, {
    unicode : "1F492",
    apple : "E43D"
}, {
    unicode : "1F30A",
    apple : "E43E"
}, {
    unicode : "1F367",
    apple : "E43F"
}, {
    unicode : "1F387",
    apple : "E440"
}, {
    unicode : "1F41A",
    apple : "E441"
}, {
    unicode : "1F390",
    apple : "E442"
}, {
    unicode : "1F300",
    apple : "E443"
}, {
    unicode : "1F33E",
    apple : "E444"
}, {
    unicode : "1F383",
    apple : "E445"
}, {
    unicode : "1F391",
    apple : "E446"
}, {
    unicode : "1F343",
    apple : "E447"
}, {
    unicode : "1F385",
    apple : "E448"
}, {
    unicode : "1F305",
    apple : "E449"
}, {
    unicode : "1F307",
    apple : "E44A"
}, {
    unicode : "1F303",
    apple : "E44B"
}, {
    unicode : "1F308",
    apple : "E44C"
}, {
    unicode : "1F3E9",
    apple : "E501"
}, {
    unicode : "1F3A8",
    apple : "E502"
}, {
    unicode : "1F3A9",
    apple : "E503"
}, {
    unicode : "1F3EC",
    apple : "E504"
}, {
    unicode : "1F3EF",
    apple : "E505"
}, {
    unicode : "1F3F0",
    apple : "E506"
}, {
    unicode : "1F3A6",
    apple : "E507"
}, {
    unicode : "1F3ED",
    apple : "E508"
}, {
    unicode : "1F5FC",
    apple : "E509"
}, {
    unicode : "1F1EF",
    apple : "E50B"
}, {
    unicode : "1F1F5",
    apple : "E50B"
}, {
    unicode : "1F1FA",
    apple : "E50C"
}, {
    unicode : "1F1F8",
    apple : "E50C"
}, {
    unicode : "1F1EB",
    apple : "E50D"
}, {
    unicode : "1F1F7",
    apple : "E50D"
}, {
    unicode : "1F1E9",
    apple : "E50E"
}, {
    unicode : "1F1EA",
    apple : "E50E"
}, {
    unicode : "1F1EE",
    apple : "E50F"
}, {
    unicode : "1F1F9",
    apple : "E50F"
}, {
    unicode : "1F1EC",
    apple : "E510"
}, {
    unicode : "1F1E7",
    apple : "E510"
}, {
    unicode : "1F1EA",
    apple : "E511"
}, {
    unicode : "1F1F8",
    apple : "E511"
}, {
    unicode : "1F1F7",
    apple : "E512"
}, {
    unicode : "1F1FA",
    apple : "E512"
}, {
    unicode : "1F1E8",
    apple : "E513"
}, {
    unicode : "1F1F3",
    apple : "E513"
}, {
    unicode : "1F1F0",
    apple : "E514"
}, {
    unicode : "1F1F7",
    apple : "E514"
}, {
    unicode : "1F471",
    apple : "E515"
}, {
    unicode : "1F472",
    apple : "E516"
}, {
    unicode : "1F473",
    apple : "E517"
}, {
    unicode : "1F474",
    apple : "E518"
}, {
    unicode : "1F475",
    apple : "E519"
}, {
    unicode : "1F476",
    apple : "E51A"
}, {
    unicode : "1F477",
    apple : "E51B"
}, {
    unicode : "1F478",
    apple : "E51C"
}, {
    unicode : "1F5FD",
    apple : "E51D"
}, {
    unicode : "1F482",
    apple : "E51E"
}, {
    unicode : "1F483",
    apple : "E51F"
}, {
    unicode : "1F42C",
    apple : "E520"
}, {
    unicode : "1F426",
    apple : "E521"
}, {
    unicode : "1F420",
    apple : "E522"
}, {
    unicode : "1F424",
    apple : "E523"
}, {
    unicode : "1F439",
    apple : "E524"
}, {
    unicode : "1F41B",
    apple : "E525"
}, {
    unicode : "1F418",
    apple : "E526"
}, {
    unicode : "1F428",
    apple : "E527"
}, {
    unicode : "1F412",
    apple : "E528"
}, {
    unicode : "1F411",
    apple : "E529"
}, {
    unicode : "1F43A",
    apple : "E52A"
}, {
    unicode : "1F42E",
    apple : "E52B"
}, {
    unicode : "1F430",
    apple : "E52C"
}, {
    unicode : "1F40D",
    apple : "E52D"
}, {
    unicode : "1F414",
    apple : "E52E"
}, {
    unicode : "1F417",
    apple : "E52F"
}, {
    unicode : "1F42B",
    apple : "E530"
}, {
    unicode : "1F438",
    apple : "E531"
}, {
    unicode : "1F170",
    apple : "E532"
}, {
    unicode : "1F171",
    apple : "E533"
}, {
    unicode : "1F18E",
    apple : "E534"
}, {
    unicode : "1F17E",
    apple : "E535"
}, {
    unicode : "1F463",
    apple : "E536"
}, {
    unicode : "2122",
    apple : "E537"
}];
