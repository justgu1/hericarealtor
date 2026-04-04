<?php

namespace App\Enums;

enum ListingTypesEnum: int
{
    case single_family = 0;
    case condos = 1;
    case commercial = 2;
    case land = 3;
    case rentals = 4;
    case business_op = 5;
    case income = 6;
    case townhouse = 7;
    case com_land = 8;
    case com_lease = 9;
    case villa = 10;
    case multi_family = 11;
    case boat_dock = 12;
    case mobile_home = 13;
    case manufactured = 14;

    public static function toArray(): array
    {
        return array_map(fn($case) => ['value' => $case->value, 'label' => ucfirst(str_replace('_', ' ', $case->name))], self::cases());
    }
}
