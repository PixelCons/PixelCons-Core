// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.38;

import {Text} from "./Text.sol";

/// @notice Preserve the America/New_York calendar dates in the archived metadata.
/// @dev US daylight-saving rules for 1970–2106, the range of the collection's uint32 timestamps.
library Calendar {
    bytes internal constant MONTHS = "JanFebMarAprMayJunJulAugSepOctNovDec";

    function format(uint32 timestamp) internal pure returns (string memory) {
        (uint256 year,,, uint256 jan1) = _date(uint256(timestamp) / 1 days);
        uint256 startMonth = year >= 2007 ? 3 : 4;
        uint256 endMonth = year >= 2007 ? 11 : 10;
        uint256 startDay = year >= 2007
            ? _sunday(year, jan1, startMonth, 2)
            : year >= 1987 ? _sunday(year, jan1, startMonth, 1) : _sunday(year, jan1, startMonth, 0);
        if (year == 1974) {
            startMonth = 1;
            startDay = 6;
        }
        if (year == 1975) {
            startMonth = 2;
            startDay = 23;
        }
        uint256 endDay = _sunday(year, jan1, endMonth, year >= 2007 ? 1 : 0);
        uint256 start = (jan1 + _beforeMonth(year, startMonth) + startDay - 1) * 1 days + 7 hours;
        uint256 end = (jan1 + _beforeMonth(year, endMonth) + endDay - 1) * 1 days + 6 hours;
        uint256 offset = timestamp >= start && timestamp < end ? 4 hours : 5 hours;
        if (timestamp < offset) return "31 Dec 1969";
        uint256 month;
        uint256 day;
        (year, month, day,) = _date((uint256(timestamp) - offset) / 1 days);
        uint256 m = (month - 1) * 3;
        return string(
            abi.encodePacked(
                day < 10 ? "0" : "",
                Text.decimal(day),
                " ",
                MONTHS[m],
                MONTHS[m + 1],
                MONTHS[m + 2],
                " ",
                Text.decimal(year)
            )
        );
    }

    function _date(uint256 daysSinceEpoch)
        private
        pure
        returns (uint256 year, uint256 month, uint256 day, uint256 jan1)
    {
        year = 1970;
        uint256 remaining = daysSinceEpoch;
        while (remaining >= (_leap(year) ? 366 : 365)) {
            remaining -= _leap(year) ? 366 : 365;
            ++year;
        }
        jan1 = daysSinceEpoch - remaining;
        month = 1;
        while (remaining >= _monthDays(year, month)) {
            remaining -= _monthDays(year, month);
            ++month;
        }
        day = remaining + 1;
    }

    function _sunday(uint256 year, uint256 jan1, uint256 month, uint256 occurrence) private pure returns (uint256) {
        uint256 first = jan1 + _beforeMonth(year, month);
        if (occurrence == 0) {
            uint256 last = _monthDays(year, month);
            return last - ((first + last - 1 + 4) % 7);
        }
        return 1 + (7 - ((first + 4) % 7)) % 7 + (occurrence - 1) * 7;
    }

    function _beforeMonth(uint256 year, uint256 month) private pure returns (uint256 days_) {
        for (uint256 m = 1; m < month; ++m) {
            days_ += _monthDays(year, m);
        }
    }

    function _monthDays(uint256 year, uint256 month) private pure returns (uint256) {
        if (month == 2) return _leap(year) ? 29 : 28;
        return month == 4 || month == 6 || month == 9 || month == 11 ? 30 : 31;
    }

    function _leap(uint256 year) private pure returns (bool) {
        return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
    }
}
