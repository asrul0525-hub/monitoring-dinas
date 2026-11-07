<?php

namespace App\Enums;

enum ContentSource: string
{
    case Sitemap = 'sitemap';
    case Rss = 'rss';
    case Dom = 'dom';
}
