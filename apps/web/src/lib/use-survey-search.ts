import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';
import type { SurveySearch } from './search';

const surveyRoute = getRouteApi('/s/$surveyId');

export function useSurveyId(): string {
  return surveyRoute.useParams().surveyId;
}

export function useSurveySearch(): SurveySearch {
  return surveyRoute.useSearch();
}

/**
 * Returns a function that merges `patch` into the current search params, staying on the same
 * screen. Keys set to `undefined` are removed from the URL.
 */
export function usePatchSearch(): (patch: Partial<SurveySearch>) => void {
  const navigate = useNavigate();
  return useCallback(
    (patch) => {
      void navigate({
        to: '.',
        search: ((previous: SurveySearch) => ({ ...previous, ...patch })) as never,
      });
    },
    [navigate],
  );
}
