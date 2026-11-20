import { lazy } from 'react';

export const DistributionTable = lazy(() => import('./chart-tables').then((module) => ({ default: module.DistributionTable })));
export const TimelineTable = lazy(() => import('./chart-tables').then((module) => ({ default: module.TimelineTable })));
export const SegmentTable = lazy(() => import('./chart-tables').then((module) => ({ default: module.SegmentTable })));
export const ThemeTable = lazy(() => import('./chart-tables').then((module) => ({ default: module.ThemeTable })));
