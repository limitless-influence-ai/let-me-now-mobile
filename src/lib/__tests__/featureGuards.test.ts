/* eslint-env jest */
import { isAlertTypeVisible, liveTabAction } from '../featureGuards';
import { FEATURES } from '@/constants/config';
import type { AlertType } from '@/types/alert.types';

describe('isAlertTypeVisible', () => {
  it('hides CACTUS when the cactus feature is off', () => {
    expect(isAlertTypeVisible('CACTUS', false)).toBe(false);
  });

  it('shows CACTUS when the cactus feature is on', () => {
    expect(isAlertTypeVisible('CACTUS', true)).toBe(true);
  });

  it.each<AlertType>(['AGRESSION', 'AGRESSION_HOMOPHOBE', 'PICKPOCKET'])(
    'always shows non-cactus type %s regardless of the cactus flag',
    (type) => {
      expect(isAlertTypeVisible(type, false)).toBe(true);
      expect(isAlertTypeVisible(type, true)).toBe(true);
    },
  );

  it('filters CACTUS out of a mixed list with the current FEATURES flag', () => {
    const types: AlertType[] = ['AGRESSION', 'CACTUS', 'PICKPOCKET'];
    const visible = types.filter((t) => isAlertTypeVisible(t, FEATURES.CACTUS_ENABLED));
    expect(visible).toEqual(['AGRESSION', 'PICKPOCKET']);
  });
});

describe('liveTabAction', () => {
  it('returns "coming-soon" when the live feature is off', () => {
    expect(liveTabAction(false)).toBe('coming-soon');
  });

  it('returns "navigate" when the live feature is on', () => {
    expect(liveTabAction(true)).toBe('navigate');
  });
});

describe('FEATURES defaults (MVP)', () => {
  it('ships with Cactus, Live and Lost Luggage hidden', () => {
    expect(FEATURES.CACTUS_ENABLED).toBe(false);
    expect(FEATURES.LIVE_ENABLED).toBe(false);
    expect(FEATURES.LOST_LUGGAGE_ENABLED).toBe(false);
  });
});
