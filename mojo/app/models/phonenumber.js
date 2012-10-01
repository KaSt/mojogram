function PhoneNumber() {
}

PhoneNumber.ccCodes = [93, 355, 213, 1, 376, 244, 1, 1, 54, 374, 297, 247, 61, 672, 43, 994, 1, 973, 880, 1, 375, 32, 501, 229, 1, 975, 591, 387, 267, 55, 1, 673, 359, 226, 257, 855, 237, 1, 238, 1, 236, 
235, 56, 86, 57, 269, 242, 682, 506, 385, 53, 357, 420, 225, 850, 670, 243, 45, 246, 253, 1, 1, 593, 20, 503, 240, 291, 372, 251, 500, 298, 679, 358, 33, 262, 594, 689, 241, 220, 995, 49, 233, 350, 30, 
299, 1, 590, 1, 502, 224, 245, 592, 509, 504, 852, 36, 354, 91, 62, 979, 98, 964, 353, 972, 39, 1, 81, 962, 7, 254, 686, 82, 965, 996, 856, 371, 961, 266, 231, 218, 423, 370, 352, 853, 261, 265, 60, 960, 
223, 356, 692, 596, 222, 230, 269, 52, 691, 373, 377, 976, 382, 1, 212, 258, 95, 264, 674, 977, 31, 599, 687, 64, 505, 227, 234, 683, 1, 47, 968, 92, 680, 507, 675, 595, 51, 63, 48, 351, 1, 974, 40, 7, 
250, 290, 1, 1, 508, 1, 685, 378, 239, 966, 221, 381, 248, 232, 65, 421, 386, 677, 252, 27, 34, 94, 249, 597, 268, 46, 41, 963, 886, 992, 255, 66, 389, 228, 690, 676, 1, 290, 216, 90, 993, 1, 688, 256, 
380, 971, 44, 1, 1, 598, 998, 678, 379, 39, 58, 84, 681, 967, 260, 263];


PhoneNumber.parseCc = function(number) {
    for (var i = 0; i < PhoneNumber.ccCodes.length; i++) {
        var ccString = '+' + String(PhoneNumber.ccCodes[i]);
        if ((number.length >= ccString.length) && (ccString == number.substr(0, ccString.length)))
            return PhoneNumber.ccCodes[i];
    }
    return null; 
}

PhoneNumber.isInternational = function(number) {
    return (number.indexOf('+') == 0);
}

PhoneNumber.removeCc = function(cc, number) {
    if (PhoneNumber.isInternational(number)) {
        var ccString = '+' + String(cc);
        var pn = number.substr(ccString.length);
        return pn;
    }
    return number;        
}
    
PhoneNumber.normalizeMobile = function(number) {
    var phoneNumber = number;   
    phoneNumber = phoneNumber.replace(/[^\d+]+/g, "");
    if (PhoneNumber.isInternational(phoneNumber)) {
        phoneNumber = phoneNumber.replace(/^\+0*/g, "");
        phoneNumber = "+" + phoneNumber;    
    } else {
        phoneNumber = phoneNumber.replace(/^0+/g, "");    
    }
    return phoneNumber;
}
