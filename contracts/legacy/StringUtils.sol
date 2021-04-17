pragma solidity ^0.4.24;


/**
 * @title StringUtils Library
 * @dev Utility library of inline functions on strings. 
 * These functions are very expensive and are only intended for web3 calls
 * @author PixelCons
 */
library StringUtils {

	/**
	 * @dev Replaces the given key with the given value in the given string
	 * @param _str String to find and replace in
	 * @param _key Value to search for
	 * @param _value Value to replace key with
	 * @return The replaced string
	 */
	function replace(string _str, string _key, string _value) internal pure returns(string)
	{
		bytes memory bStr = bytes(_str);
		bytes memory bKey = bytes(_key);
		bytes memory bValue = bytes(_value);

		uint index = indexOf(bStr, bKey);
		if (index < bStr.length) {
			bytes memory rStr = new bytes((bStr.length + bValue.length) - bKey.length);

			uint i;
			for (i = 0; i < index; i++) rStr[i] = bStr[i];
			for (i = 0; i < bValue.length; i++) rStr[index + i] = bValue[i];
			for (i = 0; i < bStr.length - (index + bKey.length); i++) rStr[index + bValue.length + i] = bStr[index + bKey.length + i];

			return string(rStr);
		}
		return string(bStr);
	}

	/**
	 * @dev Converts a given number into a string with hex representation
	 * @param _num Number to convert
	 * @param _byteSize Size of the number in bytes
	 * @return The hex representation as string
	 */
	function toHexString(uint256 _num, uint _byteSize) internal pure returns(string)
	{
		bytes memory s = new bytes(_byteSize * 2 + 2);
		s[0] = 0x30;
		s[1] = 0x78;
		for (uint i = 0; i < _byteSize; i++) {
			byte b = byte(uint8(_num / (2 ** (8 * (_byteSize - 1 - i)))));
			byte hi = byte(uint8(b) / 16);
			byte lo = byte(uint8(b) - 16 * uint8(hi));
			s[2 + 2 * i] = char(hi);
			s[3 + 2 * i] = char(lo);
		}
		return string(s);
	}

	/**
	 * @dev Gets the ascii hex character for the given value (0-15)
	 * @param _b Byte to get ascii code for
	 * @return The ascii hex character
	 */
	function char(byte _b) internal pure returns(byte c)
	{
		if (_b < 10) return byte(uint8(_b) + 0x30);
		else return byte(uint8(_b) + 0x57);
	}

	/**
	 * @dev Gets the index of the key string in the given string
	 * @param _str String to search in
	 * @param _key Value to search for
	 * @return The index of the key in the string (string length if not found)
	 */
	function indexOf(bytes _str, bytes _key) internal pure returns(uint)
	{
		for (uint i = 0; i < _str.length - (_key.length - 1); i++) {
			bool matchFound = true;
			for (uint j = 0; j < _key.length; j++) {
				if (_str[i + j] != _key[j]) {
					matchFound = false;
					break;
				}
			}
			if (matchFound) {
				return i;
			}
		}
		return _str.length;
	}
}
